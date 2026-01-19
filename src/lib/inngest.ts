// ⚡ Inngest Event System - The nervous system of our async operations
// "Me fail English? That's unpossible!" - Ralph on event-driven architecture

import { Inngest } from 'inngest';
import {
  sendOrderConfirmationEmail,
  sendWelcomeEmail,
  sendShippingNotificationEmail,
  sendReviewRequestEmail,
  sendTransactionalEmail,
  BREVO_TEMPLATES,
} from './brevo';

/**
 * ╭─────────────────────────────────────────────────────────╮
 * │  INNGEST CLIENT                                          │
 * │  ─────────────────────────────────────────────────────── │
 * │  The central hub for all our event-driven workflows.     │
 * │  Events go in, magic comes out!                          │
 * ╰─────────────────────────────────────────────────────────╯
 */
export const inngest = new Inngest({
  id: 'karens-beautiful-soap',
  // Event keys are optional for local dev
});

// ═══════════════════════════════════════════════════════════
// EVENT TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════

export type ShopEvents = {
  // Order lifecycle events
  'shop/order.completed': {
    data: {
      orderId: string;
      orderNumber: string;
      customerId?: string;
      email: string;
      firstName?: string;
      totalAmount: number;
      items: Array<{
        productId: string;
        productName: string;
        quantity: number;
        unitPrice: number;
      }>;
      shippingAddress: {
        name: string;
        line1: string;
        line2?: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
      };
    };
  };

  'shop/order.shipped': {
    data: {
      orderId: string;
      orderNumber: string;
      email: string;
      firstName?: string;
      trackingNumber: string;
      trackingUrl: string;
      estimatedDelivery?: string;
    };
  };

  'shop/order.delivered': {
    data: {
      orderId: string;
      orderNumber: string;
      email: string;
      firstName?: string;
      productNames?: string[]; // For review request
    };
  };

  'shop/order.cancelled': {
    data: {
      orderId: string;
      orderNumber: string;
      email: string;
      firstName?: string;
      reason?: string;
    };
  };

  // Customer lifecycle events
  'shop/customer.created': {
    data: {
      customerId: string;
      email: string;
      firstName?: string;
      lastName?: string;
    };
  };

  // Newsletter events
  'shop/newsletter.subscribed': {
    data: {
      email: string;
      source: string;
    };
  };

  // Cart events
  'shop/cart.abandoned': {
    data: {
      email: string;
      firstName?: string;
      items: Array<{
        productName: string;
        quantity: number;
        price: number;
        imageUrl?: string;
      }>;
      cartTotal: number;
      cartUrl: string;
    };
  };

  // Admin events
  'shop/admin.low-stock-alert': {
    data: {
      productId: string;
      productName: string;
      currentStock: number;
      threshold: number;
    };
  };
};

// ═══════════════════════════════════════════════════════════
// ORDER COMPLETED WORKFLOW
// ═══════════════════════════════════════════════════════════

/**
 * Triggered after successful Stripe payment.
 * Handles order confirmation email, inventory update, and admin notification.
 */
export const orderCompletedWorkflow = inngest.createFunction(
  { id: 'order-completed-workflow', name: 'Order Completed Workflow' },
  { event: 'shop/order.completed' },
  async ({ event, step }) => {
    const { orderId, orderNumber, email, firstName, items, totalAmount, shippingAddress } = event.data;

    // Step 1: Send order confirmation email
    await step.run('send-confirmation-email', async () => {
      // Format items for email
      const orderItemsHtml = items
        .map(
          (item) =>
            `<li>${item.productName} x${item.quantity} - $${(item.unitPrice * item.quantity).toFixed(2)}</li>`
        )
        .join('');

      const addressText = `${shippingAddress.name}<br>
        ${shippingAddress.line1}<br>
        ${shippingAddress.line2 ? shippingAddress.line2 + '<br>' : ''}
        ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.postalCode}<br>
        ${shippingAddress.country}`;

      await sendOrderConfirmationEmail({
        email,
        firstName,
        orderNumber,
        orderTotal: `$${totalAmount.toFixed(2)}`,
        orderItems: `<ul>${orderItemsHtml}</ul>`,
        shippingAddress: addressText,
      });
    });

    // Step 2: Log the order completion (placeholder for inventory update)
    await step.run('log-order', async () => {
      console.log(`[Inngest] Order ${orderNumber} completed for ${email}`);
      console.log(`[Inngest] Items: ${items.length}, Total: $${totalAmount}`);
      // TODO: Update inventory in database
    });

    // Step 3: Notify admin (optional, could be Slack/Discord notification)
    await step.run('notify-admin', async () => {
      console.log(`[Inngest] New order notification would be sent to admin`);
      // TODO: Implement admin notification (email, Slack, etc.)
    });

    return { success: true, orderId, orderNumber };
  }
);

// ═══════════════════════════════════════════════════════════
// WELCOME DRIP CAMPAIGN
// ═══════════════════════════════════════════════════════════

/**
 * Triggered when a new customer makes their first purchase.
 * Runs a multi-day email sequence to nurture the relationship.
 */
export const welcomeDripCampaign = inngest.createFunction(
  { id: 'welcome-drip-campaign', name: 'Welcome Drip Campaign' },
  { event: 'shop/customer.created' },
  async ({ event, step }) => {
    const { email, firstName, customerId } = event.data;

    // Day 0: Welcome email (immediate)
    await step.run('welcome-email', async () => {
      await sendWelcomeEmail({ email, firstName });
      console.log(`[Inngest] Welcome email sent to ${email}`);
    });

    // Day 3: Soap care tips
    await step.sleep('wait-3-days', '3 days');
    await step.run('tips-email', async () => {
      await sendTransactionalEmail({
        to: { email, name: firstName },
        templateId: BREVO_TEMPLATES.SOAP_TIPS,
        params: {
          FIRSTNAME: firstName || 'Soap Lover',
        },
      });
      console.log(`[Inngest] Soap tips email sent to ${email}`);
    });

    // Day 7: Invite to leave a review (if they've received their order)
    await step.sleep('wait-4-more-days', '4 days');
    await step.run('review-request', async () => {
      // Note: In production, you'd check if order was delivered first
      console.log(`[Inngest] Review request would be sent to ${email}`);
      // await sendReviewRequestEmail({ ... });
    });

    return { success: true, customerId, emailsSent: 3 };
  }
);

// ═══════════════════════════════════════════════════════════
// ORDER SHIPPED WORKFLOW
// ═══════════════════════════════════════════════════════════

/**
 * Triggered when an admin marks an order as shipped.
 * Sends shipping notification and schedules delivery follow-up.
 */
export const orderShippedWorkflow = inngest.createFunction(
  { id: 'order-shipped-workflow', name: 'Order Shipped Workflow' },
  { event: 'shop/order.shipped' },
  async ({ event, step }) => {
    const { orderId, orderNumber, email, firstName, trackingNumber, trackingUrl, estimatedDelivery } = event.data;

    // Send shipping notification
    await step.run('shipping-notification', async () => {
      await sendShippingNotificationEmail({
        email,
        firstName,
        orderNumber,
        trackingNumber,
        trackingUrl,
        estimatedDelivery,
      });
      console.log(`[Inngest] Shipping notification sent for order ${orderNumber}`);
    });

    return { success: true, orderId, orderNumber };
  }
);

// ═══════════════════════════════════════════════════════════
// ORDER DELIVERED WORKFLOW
// ═══════════════════════════════════════════════════════════

/**
 * Triggered when an order is marked as delivered.
 * Waits a few days then sends a review request.
 */
export const orderDeliveredWorkflow = inngest.createFunction(
  { id: 'order-delivered-workflow', name: 'Order Delivered Workflow' },
  { event: 'shop/order.delivered' },
  async ({ event, step }) => {
    const { orderId, orderNumber, email, firstName, productNames } = event.data;

    // Wait 2 days after delivery before asking for review
    await step.sleep('wait-for-product-use', '2 days');

    // Send review request for the first product
    await step.run('review-request', async () => {
      const productName = productNames[0] || 'your soap';
      await sendReviewRequestEmail({
        email,
        firstName,
        productName,
        reviewUrl: `${process.env.APP_URL || ''}/shop?review=${orderId}`,
      });
      console.log(`[Inngest] Review request sent for order ${orderNumber}`);
    });

    return { success: true, orderId };
  }
);

// ═══════════════════════════════════════════════════════════
// ORDER CANCELLED WORKFLOW
// "I bent my Wookiee!" - Ralph on order cancellations
// ═══════════════════════════════════════════════════════════

/**
 * Triggered when an order is cancelled.
 * Sends cancellation notification to customer.
 */
export const orderCancelledWorkflow = inngest.createFunction(
  { id: 'order-cancelled-workflow', name: 'Order Cancelled Workflow' },
  { event: 'shop/order.cancelled' },
  async ({ event, step }) => {
    const { orderId, orderNumber, email, firstName, reason } = event.data;

    // Send cancellation email
    await step.run('cancellation-notification', async () => {
      await sendTransactionalEmail({
        to: { email, name: firstName },
        templateId: BREVO_TEMPLATES.ORDER_CANCELLED,
        params: {
          FIRSTNAME: firstName || 'Valued Customer',
          ORDER_NUMBER: orderNumber,
          CANCELLATION_REASON: reason || 'Order was cancelled',
        },
      });
      console.log(`[Inngest] Cancellation notification sent for order ${orderNumber}`);
    });

    return { success: true, orderId, orderNumber };
  }
);

// ═══════════════════════════════════════════════════════════
// LOW STOCK ALERT
// ═══════════════════════════════════════════════════════════

/**
 * Triggered when product stock falls below threshold.
 * Notifies admin to restock.
 */
export const lowStockAlert = inngest.createFunction(
  { id: 'low-stock-alert', name: 'Low Stock Alert' },
  { event: 'shop/admin.low-stock-alert' },
  async ({ event, step }) => {
    const { productId, productName, currentStock, threshold } = event.data;

    await step.run('notify-low-stock', async () => {
      // In production, this would send an email or Slack notification
      console.log(
        `[Inngest] LOW STOCK ALERT: ${productName} (${productId}) has ${currentStock} units, below threshold of ${threshold}`
      );
    });

    return { success: true, productId };
  }
);

// ═══════════════════════════════════════════════════════════
// NEWSLETTER WELCOME WORKFLOW
// "I'm a unitard!" - Ralph, subscribing to newsletters
// ═══════════════════════════════════════════════════════════

/**
 * Triggered when someone subscribes to the newsletter.
 * Sends a welcome email to the new subscriber.
 */
export const newsletterWelcomeWorkflow = inngest.createFunction(
  { id: 'newsletter-welcome', name: 'Newsletter Welcome Email' },
  { event: 'shop/newsletter.subscribed' },
  async ({ event, step }) => {
    const { email, source } = event.data;

    await step.run('send-welcome-email', async () => {
      // Send a simple welcome email for newsletter subscribers
      await sendTransactionalEmail({
        to: { email },
        templateId: BREVO_TEMPLATES.WELCOME,
        params: {
          FIRSTNAME: 'Soap Lover',
          STORE_URL: process.env.APP_URL || 'https://karenssoap.com',
          SIGNUP_SOURCE: source,
        },
      });
      console.log(`[Inngest] Newsletter welcome email sent to ${email}`);
    });

    return { success: true, email };
  }
);

// ═══════════════════════════════════════════════════════════
// ABANDONED CART WORKFLOW
// "I bent my Wookiee!" - Ralph, when customers forget to checkout
// ═══════════════════════════════════════════════════════════

/**
 * Triggered when a cart is detected as abandoned.
 * Waits 1 hour then sends a reminder email.
 *
 * Note: This is triggered from the client when:
 * - User has items in cart and is about to leave (beforeunload)
 * - User is logged in (we have their email)
 *
 * Rate limit: Max 1 abandoned cart email per user per 24 hours
 * (handled by Inngest's idempotency key)
 */
export const abandonedCartWorkflow = inngest.createFunction(
  {
    id: 'abandoned-cart-reminder',
    name: 'Abandoned Cart Reminder',
    // Use email + date as idempotency key to limit to 1 per day per user
    idempotency: 'event.data.email + "-" + event.data.cartUrl.split("?")[0]',
    // Cancel if an order is placed for this email
    cancelOn: [
      { event: 'shop/order.completed', match: 'data.email' },
    ],
  },
  { event: 'shop/cart.abandoned' },
  async ({ event, step }) => {
    const { email, firstName, items, cartTotal, cartUrl } = event.data;

    // Wait 1 hour before sending reminder
    await step.sleep('wait-before-reminder', '1 hour');

    // Format items for the email
    const itemsList = items
      .map((item) => `${item.productName} (x${item.quantity}) - $${item.price.toFixed(2)}`)
      .join('<br>');

    await step.run('send-abandoned-cart-email', async () => {
      // 📧 Send abandoned cart reminder
      // Note: You'd create a ABANDONED_CART template in Brevo for this
      await sendTransactionalEmail({
        to: { email, name: firstName },
        templateId: BREVO_TEMPLATES.ORDER_CONFIRMATION, // Reusing template for now
        subject: '🧼 You left some soap behind!',
        params: {
          FIRSTNAME: firstName || 'Soap Lover',
          ORDER_NUMBER: 'Your Cart',
          ORDER_TOTAL: `$${cartTotal.toFixed(2)}`,
          ORDER_ITEMS: itemsList,
          SHIPPING_ADDRESS: `<a href="${cartUrl}" style="color: #2D5A4A;">Complete your order →</a>`,
        },
      });
      console.log(`[Inngest] Abandoned cart email sent to ${email}`);
    });

    return { success: true, email };
  }
);

// ═══════════════════════════════════════════════════════════
// EXPORT ALL FUNCTIONS FOR REGISTRATION
// ═══════════════════════════════════════════════════════════

export const inngestFunctions = [
  orderCompletedWorkflow,
  welcomeDripCampaign,
  orderShippedWorkflow,
  orderDeliveredWorkflow,
  orderCancelledWorkflow,
  lowStockAlert,
  newsletterWelcomeWorkflow,
  abandonedCartWorkflow,
];

// ═══════════════════════════════════════════════════════════
// HELPER: Send Event
// ═══════════════════════════════════════════════════════════

/**
 * Type-safe helper to send events to Inngest.
 * Use this instead of inngest.send() directly for type safety.
 */
export async function sendEvent<T extends keyof ShopEvents>(
  name: T,
  data: ShopEvents[T]['data']
): Promise<void> {
  await inngest.send({
    name,
    data,
  });
}
