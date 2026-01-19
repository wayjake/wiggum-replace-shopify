// 🎉 Checkout Success Page - The celebration of a successful soap purchase
// "I'm a star!" - Ralph, completing his soap order

import { createFileRoute, Link } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { CheckCircle, Package, Mail, ArrowRight, Home } from 'lucide-react';
import { getCheckoutSession } from '../../lib/stripe';
import { getDb, orders, orderItems, orderEvents } from '../../db';
import { generateId } from '../../utils';
import { sendEvent } from '../../lib/inngest';

// ═══════════════════════════════════════════════════════════
// SERVER FUNCTIONS - Processing the successful payment
// "Yay, I'm helping!" - Ralph, creating the order
// ═══════════════════════════════════════════════════════════

const processSuccessfulPayment = createServerFn({ method: 'GET' })
  .handler(async (sessionId: string) => {

    if (!sessionId) {
      return { success: false, error: 'No session ID provided' };
    }

    try {
      const session = await getCheckoutSession(sessionId);

      if (session.payment_status !== 'paid') {
        return { success: false, error: 'Payment not completed' };
      }

      // Check if order already exists for this session
      const db = getDb();
      const existingOrder = await db.query.orders.findFirst({
        where: (orders, { eq }) => eq(orders.stripeSessionId, sessionId),
      });

      if (existingOrder) {
        // Order already processed - return its info
        return {
          success: true,
          order: {
            id: existingOrder.id,
            orderNumber: existingOrder.orderNumber,
            email: existingOrder.email,
            total: existingOrder.totalAmount,
          },
        };
      }

      // Create the order
      // 📦 Time to package up this soap dream!
      const orderNumber = `KS-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      const lineItems = session.line_items?.data || [];
      const subtotal = lineItems.reduce(
        (sum, item) => sum + (item.amount_total || 0) / 100,
        0
      );

      const shippingDetails = session.shipping_details;
      const customerEmail = session.customer_email || session.customer_details?.email || '';

      const [newOrder] = await db.insert(orders).values({
        orderNumber,
        email: customerEmail,
        status: 'paid',
        stripeSessionId: sessionId,
        stripePaymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id,
        subtotal,
        shippingAmount: 0, // Included in line items for Stripe
        totalAmount: session.amount_total ? session.amount_total / 100 : subtotal,
        shippingAddress: shippingDetails?.address ? {
          name: shippingDetails.name || '',
          line1: shippingDetails.address.line1 || '',
          line2: shippingDetails.address.line2 || undefined,
          city: shippingDetails.address.city || '',
          state: shippingDetails.address.state || '',
          postalCode: shippingDetails.address.postal_code || '',
          country: shippingDetails.address.country || 'US',
        } : undefined,
      }).returning();

      // Create order items
      for (const lineItem of lineItems) {
        const productId = lineItem.price?.product as string || '';
        await db.insert(orderItems).values({
          orderId: newOrder.id,
          productId,
          productName: lineItem.description || 'Product',
          productSlug: lineItem.description?.toLowerCase().replace(/\s+/g, '-') || 'product',
          quantity: lineItem.quantity || 1,
          unitPrice: (lineItem.price?.unit_amount || 0) / 100,
          totalPrice: (lineItem.amount_total || 0) / 100,
        });
      }

      // Create order event
      await db.insert(orderEvents).values({
        orderId: newOrder.id,
        type: 'payment_received',
        description: 'Payment received via Stripe',
        metadata: { sessionId },
        createdBy: 'system',
      });

      // 🎉 Fire the order.completed event to trigger email workflows!
      // "I'm a star!" - Ralph, as the event flies off to Inngest
      try {
        const orderItemsData = lineItems.map((item) => ({
          productId: item.price?.product as string || '',
          productName: item.description || 'Product',
          quantity: item.quantity || 1,
          unitPrice: (item.price?.unit_amount || 0) / 100,
        }));

        await sendEvent('shop/order.completed', {
          orderId: newOrder.id,
          orderNumber,
          email: customerEmail,
          firstName: shippingDetails?.name?.split(' ')[0] || undefined,
          totalAmount: session.amount_total ? session.amount_total / 100 : subtotal,
          items: orderItemsData,
          shippingAddress: shippingDetails?.address ? {
            name: shippingDetails.name || '',
            line1: shippingDetails.address.line1 || '',
            line2: shippingDetails.address.line2 || undefined,
            city: shippingDetails.address.city || '',
            state: shippingDetails.address.state || '',
            postalCode: shippingDetails.address.postal_code || '',
            country: shippingDetails.address.country || 'US',
          } : {
            name: '',
            line1: '',
            city: '',
            state: '',
            postalCode: '',
            country: 'US',
          },
        });
      } catch (inngestError) {
        console.error('Failed to send Inngest event:', inngestError);
        // Don't fail the order if Inngest is unavailable
      }

      return {
        success: true,
        order: {
          id: newOrder.id,
          orderNumber: newOrder.orderNumber,
          email: customerEmail,
          total: session.amount_total ? session.amount_total / 100 : subtotal,
        },
      };
    } catch (error) {
      console.error('Error processing payment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process order',
      };
    }
  });

// ═══════════════════════════════════════════════════════════
// ROUTE DEFINITION
// ═══════════════════════════════════════════════════════════

export const Route = createFileRoute('/checkout/success')({
  head: () => ({
    meta: [
      { title: "Order Confirmed! | Karen's Beautiful Soap" },
      {
        name: 'description',
        content: 'Your order has been confirmed. Thank you for choosing Karen\'s Beautiful Soap!',
      },
    ],
  }),
  validateSearch: (search: Record<string, unknown>) => {
    return {
      session_id: (search.session_id as string) || '',
    };
  },
  loaderDeps: ({ search }) => ({ sessionId: search.session_id }),
  loader: async ({ deps }) => {
    if (!deps.sessionId) {
      return { success: false, error: 'No session ID' };
    }
    return await processSuccessfulPayment(deps.sessionId);
  },
  component: SuccessPage,
});

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════

function SuccessPage() {
  const result = Route.useLoaderData();

  if (!result.success) {
    return (
      <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-4xl">😟</span>
          </div>
          <h1 className="text-2xl font-bold text-[#1A1A1A] mb-4 font-display">
            Oops! Something went wrong
          </h1>
          <p className="text-gray-600 mb-8">
            {result.error || 'We couldn\'t process your order. Please contact support.'}
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-[#2D5A4A] text-white px-6 py-3 rounded-lg hover:bg-[#1A1A1A] transition-colors"
          >
            <Home className="w-4 h-4" />
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  const { order } = result;

  return (
    <div className="min-h-screen bg-[#FDFCFB]">
      {/* Header */}
      <header className="bg-white border-b border-[#F5EBE0]">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#2D5A4A] rounded-full flex items-center justify-center">
              <span className="text-xl">🧼</span>
            </div>
            <span className="text-lg font-bold text-[#1A1A1A] font-display">Karen's Beautiful Soap</span>
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-16">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-[#1A1A1A] mb-2 font-display">
            Thank You!
          </h1>
          <p className="text-xl text-[#2D5A4A] font-semibold">
            Your order has been confirmed
          </p>
        </div>

        {/* Order Details Card */}
        <div className="bg-white rounded-2xl border border-[#F5EBE0] p-8 mb-8">
          <div className="flex items-center justify-between pb-6 mb-6 border-b border-[#F5EBE0]">
            <div>
              <p className="text-sm text-gray-500">Order Number</p>
              <p className="text-xl font-bold text-[#1A1A1A] font-display">
                {order?.orderNumber || 'Processing...'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-xl font-bold text-[#2D5A4A]">
                ${order?.total?.toFixed(2) || '0.00'}
              </p>
            </div>
          </div>

          {/* What's Next */}
          <h2 className="text-lg font-semibold text-[#1A1A1A] mb-4">What happens next?</h2>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-[#F5EBE0] rounded-full flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-[#2D5A4A]" />
              </div>
              <div>
                <p className="font-medium text-[#1A1A1A]">Confirmation Email</p>
                <p className="text-sm text-gray-600">
                  We've sent a confirmation to <strong>{order?.email}</strong>
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-[#F5EBE0] rounded-full flex items-center justify-center flex-shrink-0">
                <Package className="w-5 h-5 text-[#2D5A4A]" />
              </div>
              <div>
                <p className="font-medium text-[#1A1A1A]">Shipping Update</p>
                <p className="text-sm text-gray-600">
                  You'll receive an email when your soaps are on their way!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/account/orders"
            className="inline-flex items-center justify-center gap-2 bg-[#2D5A4A] text-white px-6 py-3 rounded-lg hover:bg-[#1A1A1A] transition-colors"
          >
            Track Your Order
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/shop"
            className="inline-flex items-center justify-center gap-2 border-2 border-[#D4A574] text-[#1A1A1A] px-6 py-3 rounded-lg hover:bg-[#D4A574] hover:text-white transition-colors"
          >
            Continue Shopping
          </Link>
        </div>

        {/* Ralph Quote */}
        <div className="mt-12 text-center">
          <p className="text-gray-400 text-sm italic">
            "I'm a star!" - Your soaps, on their way to you 🧼✨
          </p>
        </div>
      </main>
    </div>
  );
}
