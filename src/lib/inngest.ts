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
      productNames: string[]; // For review request
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
// EXPORT ALL FUNCTIONS FOR REGISTRATION
// ═══════════════════════════════════════════════════════════

export const inngestFunctions = [
  orderCompletedWorkflow,
  welcomeDripCampaign,
  orderShippedWorkflow,
  orderDeliveredWorkflow,
  lowStockAlert,
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
