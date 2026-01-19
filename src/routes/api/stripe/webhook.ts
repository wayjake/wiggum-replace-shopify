// 📡 Stripe Webhook Handler - Listening for payment events
// "I bent my wookiee!" - Ralph, processing webhooks
//
// ╭────────────────────────────────────────────────────────────╮
// │  🔔 PRODUCTION WEBHOOK HANDLER                              │
// │  • Verifies signatures for security                         │
// │  • Handles payment lifecycle events                         │
// │  • Triggers Inngest workflows for emails                    │
// │  • Idempotent - safe to receive duplicate events           │
// ╰────────────────────────────────────────────────────────────╯
//
// CRITICAL: Always verify webhook signatures before processing!
// Set STRIPE_WEBHOOK_SECRET in production environment.

import { eventHandler, readRawBody, getHeader, createError } from 'vinxi/http';
import Stripe from 'stripe';
import { verifyWebhookSignature, getStripe, getCheckoutSession } from '../../../lib/stripe';
import { getDb, orders, orderEvents, orderItems, products, users } from '../../../db';
import { eq, sql } from 'drizzle-orm';
import { sendEvent } from '../../../lib/inngest';
import { redeemGiftCard } from '../../../lib/giftcards';
import { recordDiscountUsage } from '../../../lib/discounts';

/**
 * ╭─────────────────────────────────────────────────────────╮
 * │  WEBHOOK EVENT HANDLER                                   │
 * │  ─────────────────────────────────────────────────────── │
 * │  Stripe sends us events when things happen:              │
 * │  - checkout.session.completed → Payment successful!      │
 * │  - payment_intent.succeeded → Alternative payment hook   │
 * │  - charge.refunded → Someone wants their money back      │
 * ╰─────────────────────────────────────────────────────────╯
 */

export default eventHandler(async (event) => {
  // Only allow POST requests
  if (event.method !== 'POST') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method Not Allowed',
    });
  }

  const signature = getHeader(event, 'stripe-signature');

  if (!signature) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing Stripe signature',
    });
  }

  let stripeEvent: Stripe.Event;

  try {
    const body = await readRawBody(event);

    if (!body) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing request body',
      });
    }

    stripeEvent = verifyWebhookSignature(body, signature);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid signature',
    });
  }

  // 🎭 Handle the event based on its type
  try {
    switch (stripeEvent.type) {
      case 'checkout.session.completed':
        await handleCheckoutComplete(stripeEvent.data.object as Stripe.Checkout.Session);
        break;

      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(stripeEvent.data.object as Stripe.PaymentIntent);
        break;

      case 'charge.refunded':
        await handleRefund(stripeEvent.data.object as Stripe.Charge);
        break;

      default:
        console.log(`Unhandled event type: ${stripeEvent.type}`);
    }

    return { received: true };
  } catch (error) {
    console.error('Error handling webhook:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Webhook handler failed',
    });
  }
});

// ═══════════════════════════════════════════════════════════
// EVENT HANDLERS
// ═══════════════════════════════════════════════════════════

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  console.log('Processing checkout.session.completed:', session.id);

  const db = getDb();

  // Check if order already exists (idempotency check)
  const existingOrder = await db.query.orders.findFirst({
    where: (orders, { eq }) => eq(orders.stripeSessionId, session.id),
    with: {
      items: {
        with: {
          product: true,
        },
      },
      customer: true,
    },
  });

  if (existingOrder) {
    // Update order status if needed
    if (existingOrder.status === 'pending' && session.payment_status === 'paid') {
      await db
        .update(orders)
        .set({
          status: 'paid',
          updatedAt: new Date(),
        })
        .where(eq(orders.id, existingOrder.id));

      await db.insert(orderEvents).values({
        orderId: existingOrder.id,
        type: 'payment_received',
        description: 'Payment confirmed via webhook',
        metadata: { sessionId: session.id },
        createdBy: 'system',
      });

      // 🎉 Trigger order completed workflow if not already triggered
      await triggerOrderCompletedEvent(existingOrder, session);
    }
    return;
  }

  // 📦 Create the order if it doesn't exist yet
  // This handles cases where the webhook arrives before the success page loads
  try {
    const fullSession = await getCheckoutSession(session.id);
    const createdOrder = await createOrderFromSession(fullSession);

    if (createdOrder) {
      // 🎉 Trigger order completed workflow
      await triggerOrderCompletedEvent(createdOrder, fullSession);
    }
  } catch (error) {
    console.error('Failed to create order from webhook:', error);
    // Don't throw - let the success page handle it as fallback
  }
}

/**
 * 🎉 Trigger the Inngest order.completed event
 */
async function triggerOrderCompletedEvent(
  order: any,
  session: Stripe.Checkout.Session
) {
  try {
    const shippingDetails = session.shipping_details || session.customer_details;
    const address = shippingDetails?.address;

    // Format items for the event
    const items = (order.items || []).map((item: any) => ({
      productId: item.productId,
      productName: item.product?.name || item.name || 'Product',
      quantity: item.quantity,
      unitPrice: item.price,
    }));

    await sendEvent('shop/order.completed', {
      orderId: order.id,
      orderNumber: order.orderNumber || `ORD-${order.id}`,
      customerId: order.customerId,
      email: order.customer?.email || session.customer_email || session.customer_details?.email || '',
      firstName: order.customer?.firstName || session.customer_details?.name?.split(' ')[0],
      totalAmount: order.total || (session.amount_total ? session.amount_total / 100 : 0),
      items,
      shippingAddress: {
        name: shippingDetails?.name || '',
        line1: address?.line1 || '',
        line2: address?.line2 || undefined,
        city: address?.city || '',
        state: address?.state || '',
        postalCode: address?.postal_code || '',
        country: address?.country || 'US',
      },
    });

    console.log(`[Webhook] Triggered shop/order.completed for order ${order.orderNumber || order.id}`);
  } catch (error) {
    console.error('Failed to trigger order.completed event:', error);
    // Don't throw - order was still processed successfully
  }
}

/**
 * 📦 Create an order from a Stripe checkout session
 */
async function createOrderFromSession(session: Stripe.Checkout.Session) {
  const db = getDb();

  // Check again for idempotency
  const existingOrder = await db.query.orders.findFirst({
    where: (orders, { eq }) => eq(orders.stripeSessionId, session.id),
  });

  if (existingOrder) {
    return existingOrder;
  }

  // Get line items from session
  const lineItems = session.line_items?.data || [];

  if (lineItems.length === 0) {
    console.warn('No line items in session:', session.id);
    return null;
  }

  // Find or create customer
  let customerId: string | null = null;
  const customerEmail = session.customer_email || session.customer_details?.email;

  if (customerEmail) {
    const existingCustomer = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, customerEmail),
    });
    customerId = existingCustomer?.id || null;
  }

  // Generate order number
  const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;

  // Calculate totals
  const subtotal = (session.amount_subtotal || 0) / 100;
  const shipping = (session.shipping_cost?.amount_total || 0) / 100;
  const total = (session.amount_total || 0) / 100;

  // Get shipping address
  const shippingDetails = session.shipping_details || session.customer_details;
  const address = shippingDetails?.address;

  // Create the order
  const [newOrder] = await db.insert(orders).values({
    orderNumber,
    customerId,
    status: session.payment_status === 'paid' ? 'paid' : 'pending',
    subtotal,
    shipping,
    total,
    shippingName: shippingDetails?.name || '',
    shippingLine1: address?.line1 || '',
    shippingLine2: address?.line2 || null,
    shippingCity: address?.city || '',
    shippingState: address?.state || '',
    shippingPostalCode: address?.postal_code || '',
    shippingCountry: address?.country || 'US',
    stripeSessionId: session.id,
    stripePaymentIntentId: typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id || null,
  }).returning();

  // Create order items
  for (const item of lineItems) {
    const productId = item.price?.product_data?.metadata?.productId ||
      item.price?.metadata?.productId;

    await db.insert(orderItems).values({
      orderId: newOrder.id,
      productId: productId || null,
      name: item.description || 'Product',
      price: (item.price?.unit_amount || 0) / 100,
      quantity: item.quantity || 1,
    });

    // Update product stock if we have a productId
    if (productId) {
      await db
        .update(products)
        .set({
          stock: sql`${products.stock} - ${item.quantity || 1}`,
          updatedAt: new Date(),
        })
        .where(eq(products.id, productId));
    }
  }

  // Create order event
  await db.insert(orderEvents).values({
    orderId: newOrder.id,
    type: 'order_created',
    description: 'Order created from Stripe webhook',
    metadata: { sessionId: session.id, source: 'webhook' },
    createdBy: 'system',
  });

  // 🎁 Handle gift card redemption if present in metadata
  const metadata = session.metadata || {};
  if (metadata.giftCardId && metadata.giftCardAmount) {
    const giftCardAmount = parseFloat(metadata.giftCardAmount);
    if (giftCardAmount > 0) {
      try {
        const redemptionResult = await redeemGiftCard(
          metadata.giftCardId,
          giftCardAmount,
          newOrder.id,
          customerId
        );

        if (redemptionResult.success) {
          await db.insert(orderEvents).values({
            orderId: newOrder.id,
            type: 'gift_card_redeemed',
            description: `Gift card ${metadata.giftCardCode || metadata.giftCardId} redeemed for $${redemptionResult.amountRedeemed.toFixed(2)}`,
            metadata: {
              giftCardId: metadata.giftCardId,
              giftCardCode: metadata.giftCardCode,
              amountRedeemed: redemptionResult.amountRedeemed,
              newBalance: redemptionResult.newBalance,
            },
            createdBy: 'system',
          });
          console.log(`[Webhook] Redeemed gift card ${metadata.giftCardCode} for $${redemptionResult.amountRedeemed}`);
        }
      } catch (err) {
        console.error('[Webhook] Failed to redeem gift card:', err);
        // Don't fail the order - just log the error
      }
    }
  }

  // 🏷️ Handle discount code usage recording if present in metadata
  if (metadata.discountCode) {
    try {
      await recordDiscountUsage(
        metadata.discountCode,
        newOrder.id,
        customerId || undefined,
        customerEmail || undefined
      );
      console.log(`[Webhook] Recorded discount code usage: ${metadata.discountCode}`);
    } catch (err) {
      console.error('[Webhook] Failed to record discount usage:', err);
      // Don't fail the order - just log the error
    }
  }

  console.log(`[Webhook] Created order ${orderNumber} from session ${session.id}`);

  // Fetch the complete order with relations
  return db.query.orders.findFirst({
    where: (orders, { eq }) => eq(orders.id, newOrder.id),
    with: {
      items: {
        with: {
          product: true,
        },
      },
      customer: true,
    },
  });
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('Processing payment_intent.succeeded:', paymentIntent.id);

  const db = getDb();

  // Find order by payment intent
  const existingOrder = await db.query.orders.findFirst({
    where: (orders, { eq }) => eq(orders.stripePaymentIntentId, paymentIntent.id),
  });

  if (existingOrder && existingOrder.status === 'pending') {
    await db
      .update(orders)
      .set({
        status: 'paid',
        updatedAt: new Date(),
      })
      .where(eq(orders.id, existingOrder.id));

    await db.insert(orderEvents).values({
      orderId: existingOrder.id,
      type: 'payment_received',
      description: 'Payment confirmed via payment_intent.succeeded',
      createdBy: 'system',
    });
  }
}

async function handleRefund(charge: Stripe.Charge) {
  console.log('Processing charge.refunded:', charge.id);

  const db = getDb();
  const paymentIntentId = typeof charge.payment_intent === 'string'
    ? charge.payment_intent
    : charge.payment_intent?.id;

  if (!paymentIntentId) return;

  const existingOrder = await db.query.orders.findFirst({
    where: (orders, { eq }) => eq(orders.stripePaymentIntentId, paymentIntentId),
  });

  if (existingOrder) {
    // Check if fully refunded
    const isFullRefund = charge.amount_refunded === charge.amount;

    await db
      .update(orders)
      .set({
        status: isFullRefund ? 'refunded' : existingOrder.status,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, existingOrder.id));

    await db.insert(orderEvents).values({
      orderId: existingOrder.id,
      type: 'refunded',
      description: isFullRefund
        ? 'Full refund processed'
        : `Partial refund of $${(charge.amount_refunded / 100).toFixed(2)} processed`,
      metadata: {
        chargeId: charge.id,
        amountRefunded: charge.amount_refunded,
      },
      createdBy: 'system',
    });
  }
}
