// 📋 Admin Order Detail - The soap detective's case file
// "I found a moon rock in my nose!" - Ralph on order investigation
//
// ╭──────────────────────────────────────────────────────────────╮
// │  This page is the command center for order fulfillment!      │
// │  Status transitions: paid → processing → shipped → delivered │
// │  Each transition triggers Inngest events for email workflows │
// ╰──────────────────────────────────────────────────────────────╯

import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { useState, useEffect } from 'react';
import {
  Package, Truck, CheckCircle, Clock, XCircle, ArrowLeft,
  MapPin, CreditCard, User, Mail, Phone, Printer, RotateCcw, Send
} from 'lucide-react';
import { cn, formatPrice } from '../../../utils';
import { requireAdmin } from '../../../lib/auth-guards';
import { getDb, orders, orderItems, orderEvents, users } from '../../../db';
import { eq } from 'drizzle-orm';
import { sendEvent } from '../../../lib/inngest';

// ═══════════════════════════════════════════════════════════
// SERVER FUNCTIONS - The fulfillment powerhouse 🚚
// "My cat's breath smells like cat food!" - Ralph on server functions
// ═══════════════════════════════════════════════════════════

const getOrderDetails = createServerFn({ method: 'GET' })
  .handler(async (orderId: string) => {
    try {
      const db = getDb();

      // 🔍 Find the order - like finding a golden ticket in a soap wrapper
      const order = await db.query.orders.findFirst({
        where: (orders, { eq }) => eq(orders.id, orderId),
      });

      if (!order) {
        return { success: false, error: 'Order not found' };
      }

      // 📦 Get the items in this order
      const items = await db.query.orderItems.findMany({
        where: (orderItems, { eq }) => eq(orderItems.orderId, orderId),
      });

      // 📜 Get the order timeline
      const events = await db.query.orderEvents.findMany({
        where: (orderEvents, { eq }) => eq(orderEvents.orderId, orderId),
        orderBy: (orderEvents, { asc }) => [asc(orderEvents.createdAt)],
      });

      // 👤 Get customer info if we have a userId
      let customer = null;
      if (order.userId) {
        customer = await db.query.users.findFirst({
          where: (users, { eq }) => eq(users.id, order.userId!),
        });
      }

      return {
        success: true,
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          email: order.email,
          status: order.status,
          subtotal: order.subtotal,
          shippingAmount: order.shippingAmount,
          totalAmount: order.totalAmount,
          shippingAddress: order.shippingAddress,
          trackingNumber: order.trackingNumber,
          trackingUrl: order.trackingUrl,
          createdAt: order.createdAt?.toISOString(),
          updatedAt: order.updatedAt?.toISOString(),
        },
        items: items.map((item) => ({
          id: item.id,
          name: item.productName,
          sku: item.productSlug,
          quantity: item.quantity,
          price: item.unitPrice,
          image: `https://images.unsplash.com/photo-1600857062241-98e5dba7f214?w=80&h=80&fit=crop`,
        })),
        customer: customer
          ? {
              id: customer.id,
              name: `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Customer',
              email: customer.email,
              phone: '',
            }
          : {
              id: '',
              name: order.shippingAddress?.name || 'Guest',
              email: order.email,
              phone: '',
            },
        timeline: events.map((event) => ({
          status: event.type,
          date: event.createdAt?.toISOString() || new Date().toISOString(),
          description: event.description,
        })),
      };
    } catch (error) {
      console.error('Error fetching order:', error);
      return { success: false, error: 'Failed to fetch order details' };
    }
  });

const updateOrderStatus = createServerFn({ method: 'POST' })
  .handler(async (data: { orderId: string; status: string; trackingNumber?: string; trackingUrl?: string }) => {
    try {
      const db = getDb();

      // 🔄 Update the order status
      const updateData: Record<string, unknown> = {
        status: data.status,
        updatedAt: new Date(),
      };

      // 📬 Add tracking info if shipping
      // Auto-generate tracking URL if we have a tracking number but no URL
      let trackingUrl = data.trackingUrl;
      if (data.trackingNumber && !trackingUrl) {
        // Default to USPS tracking URL (common for small businesses)
        trackingUrl = `https://tools.usps.com/go/TrackConfirmAction?tLabels=${data.trackingNumber}`;
      }

      if (data.trackingNumber) {
        updateData.trackingNumber = data.trackingNumber;
      }
      if (trackingUrl) {
        updateData.trackingUrl = trackingUrl;
      }
      if (data.status === 'shipped') {
        updateData.shippedAt = new Date();
      }

      await db
        .update(orders)
        .set(updateData)
        .where(eq(orders.id, data.orderId));

      // 📝 Record this momentous occasion in the timeline
      const eventDescriptions: Record<string, string> = {
        processing: 'Order is being prepared',
        shipped: data.trackingNumber
          ? `Order shipped with tracking: ${data.trackingNumber}`
          : 'Order has been shipped',
        delivered: 'Order delivered to customer',
        cancelled: 'Order was cancelled',
      };

      await db.insert(orderEvents).values({
        orderId: data.orderId,
        type: data.status === 'shipped' ? 'shipped' : `status_${data.status}`,
        description: eventDescriptions[data.status] || `Status changed to ${data.status}`,
        metadata: data.trackingNumber ? { trackingNumber: data.trackingNumber } : undefined,
        createdBy: 'admin',
      });

      // 🎉 Fire Inngest events for email workflows!
      // "I'm learnding!" - Ralph, triggering async workflows
      const order = await db.query.orders.findFirst({
        where: (orders, { eq }) => eq(orders.id, data.orderId),
      });

      if (order) {
        if (data.status === 'shipped') {
          await sendEvent('shop/order.shipped', {
            orderId: order.id,
            orderNumber: order.orderNumber,
            email: order.email,
            trackingNumber: data.trackingNumber || '',
            trackingUrl: trackingUrl || '',
          });
        } else if (data.status === 'delivered') {
          await sendEvent('shop/order.delivered', {
            orderId: order.id,
            orderNumber: order.orderNumber,
            email: order.email,
          });
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating order status:', error);
      return { success: false, error: 'Failed to update order status' };
    }
  });

const cancelOrder = createServerFn({ method: 'POST' })
  .handler(async (data: { orderId: string; reason?: string }) => {
    try {
      const db = getDb();

      await db
        .update(orders)
        .set({
          status: 'cancelled',
          updatedAt: new Date(),
        })
        .where(eq(orders.id, data.orderId));

      await db.insert(orderEvents).values({
        orderId: data.orderId,
        type: 'cancelled',
        description: data.reason || 'Order cancelled by admin',
        createdBy: 'admin',
      });

      // 📧 Trigger cancellation email
      const order = await db.query.orders.findFirst({
        where: (orders, { eq }) => eq(orders.id, data.orderId),
      });

      if (order) {
        await sendEvent('shop/order.cancelled', {
          orderId: order.id,
          orderNumber: order.orderNumber,
          email: order.email,
          reason: data.reason || 'Order cancelled',
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Error cancelling order:', error);
      return { success: false, error: 'Failed to cancel order' };
    }
  });

// 📧 Resend order confirmation email
// "My cat's breath smells like cat food!" - Ralph on email automation
const resendOrderConfirmation = createServerFn({ method: 'POST' })
  .handler(async (orderId: string) => {
    try {
      const db = getDb();

      const order = await db.query.orders.findFirst({
        where: (orders, { eq }) => eq(orders.id, orderId),
      });

      if (!order) {
        return { success: false, error: 'Order not found' };
      }

      // Get order items
      const items = await db.query.orderItems.findMany({
        where: (orderItems, { eq }) => eq(orderItems.orderId, orderId),
      });

      // Get customer name
      let firstName: string | undefined;
      if (order.userId) {
        const user = await db.query.users.findFirst({
          where: (users, { eq }) => eq(users.id, order.userId!),
        });
        firstName = user?.firstName || undefined;
      }

      // 📬 Trigger the order completed workflow (which sends the confirmation email)
      await sendEvent('shop/order.completed', {
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerId: order.userId || undefined,
        email: order.email,
        firstName,
        totalAmount: order.totalAmount,
        items: items.map((item) => ({
          productId: item.productId || '',
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        shippingAddress: order.shippingAddress || {
          name: 'Customer',
          line1: '',
          city: '',
          state: '',
          postalCode: '',
          country: 'US',
        },
      });

      // Record this in the timeline
      await db.insert(orderEvents).values({
        orderId,
        type: 'email_resent',
        description: 'Order confirmation email resent',
        createdBy: 'admin',
      });

      return { success: true };
    } catch (error) {
      console.error('Error resending confirmation:', error);
      return { success: false, error: 'Failed to resend confirmation email' };
    }
  });

export const Route = createFileRoute('/admin/orders/$orderId')({
  head: () => ({
    meta: [
      { title: "Order Details | Admin | Karen's Beautiful Soap" },
      { name: 'description', content: 'View and manage order details.' },
    ],
  }),
  loader: async ({ params }) => {
    const [authResult, orderResult] = await Promise.all([
      requireAdmin(),
      getOrderDetails(params.orderId),
    ]);
    return { authResult, orderResult };
  },
  component: AdminOrderDetail,
});

// ═══════════════════════════════════════════════════════════
// SAMPLE DATA
// ═══════════════════════════════════════════════════════════

const ORDER = {
  id: 'KS-20240115-001',
  date: '2024-01-15T14:30:00Z',
  status: 'paid',
  customer: {
    id: '1',
    name: 'Sarah Mitchell',
    email: 'sarah@example.com',
    phone: '(503) 555-0123',
    totalOrders: 8,
  },
  items: [
    {
      id: '1',
      name: 'Lavender Dreams',
      sku: 'LD-001',
      quantity: 2,
      price: 12.00,
      image: 'https://images.unsplash.com/photo-1600857062241-98e5dba7f214?w=80&h=80&fit=crop',
    },
    {
      id: '2',
      name: 'Honey Oat Comfort',
      sku: 'HOC-001',
      quantity: 1,
      price: 14.00,
      image: 'https://images.unsplash.com/photo-1607006344380-b6775a0824a7?w=80&h=80&fit=crop',
    },
  ],
  subtotal: 38.00,
  shipping: 0,
  tax: 2.00,
  total: 40.00,
  shippingAddress: {
    name: 'Sarah Mitchell',
    street: '123 Main Street',
    city: 'Portland',
    state: 'OR',
    zip: '97201',
  },
  billingAddress: {
    name: 'Sarah Mitchell',
    street: '123 Main Street',
    city: 'Portland',
    state: 'OR',
    zip: '97201',
  },
  paymentMethod: {
    type: 'card',
    brand: 'Visa',
    last4: '4242',
  },
  notes: '',
  timeline: [
    { status: 'created', date: '2024-01-15T14:30:00Z', description: 'Order placed by customer' },
    { status: 'paid', date: '2024-01-15T14:30:05Z', description: 'Payment confirmed via Stripe' },
  ],
};

const STATUS_FLOW = ['paid', 'processing', 'shipped', 'delivered'];

function AdminOrderDetail() {
  const navigate = useNavigate();
  const { authResult, orderResult } = Route.useLoaderData();
  const { orderId } = Route.useParams();

  // Use real data or fallback to sample
  const orderData = orderResult.success ? orderResult : { order: ORDER, items: ORDER.items, customer: ORDER.customer, timeline: ORDER.timeline };
  const order = orderData.order;
  const items = orderData.items || ORDER.items;
  const customer = orderData.customer || ORDER.customer;
  const timeline = orderData.timeline || ORDER.timeline;

  const [currentStatus, setCurrentStatus] = useState(order?.status || ORDER.status);
  const [trackingNumber, setTrackingNumber] = useState(order?.trackingNumber || '');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isResending, setIsResending] = useState(false);

  // Auth guard redirect
  useEffect(() => {
    if (!authResult.authenticated || !authResult.isAdmin) {
      navigate({ to: authResult.redirect || '/login' });
    }
  }, [authResult, navigate]);

  if (!authResult.authenticated || !authResult.isAdmin) {
    return (
      <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#2D5A4A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getNextStatus = () => {
    const currentIndex = STATUS_FLOW.indexOf(currentStatus);
    if (currentIndex < STATUS_FLOW.length - 1) {
      return STATUS_FLOW[currentIndex + 1];
    }
    return null;
  };

  // 🚀 The moment of truth - advancing the order through its lifecycle!
  // "Me fail English? That's unpossible!" - Ralph on status transitions
  const advanceStatus = async () => {
    const next = getNextStatus();
    if (!next) return;

    setIsUpdating(true);
    try {
      const result = await updateOrderStatus({
        orderId,
        status: next,
        trackingNumber: next === 'shipped' ? trackingNumber : undefined,
      });

      if (result.success) {
        setCurrentStatus(next);
        // Reload the page to show updated timeline
        window.location.reload();
      } else {
        alert('Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update order status');
    }
    setIsUpdating(false);
  };

  // 🛑 Cancel order handler
  const handleCancelOrder = async () => {
    setIsUpdating(true);
    try {
      const result = await cancelOrder({ orderId });
      if (result.success) {
        setCurrentStatus('cancelled');
        setShowCancelModal(false);
        window.location.reload();
      } else {
        alert('Failed to cancel order');
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert('Failed to cancel order');
    }
    setIsUpdating(false);
  };

  // 📧 Resend confirmation email handler
  const handleResendConfirmation = async () => {
    setIsResending(true);
    try {
      const result = await resendOrderConfirmation(orderId);
      if (result.success) {
        alert('Confirmation email sent successfully!');
        window.location.reload();
      } else {
        alert('Failed to resend confirmation: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error resending confirmation:', error);
      alert('Failed to resend confirmation email');
    }
    setIsResending(false);
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB]">
      {/* Admin Header */}
      <header className="bg-white border-b border-[#F5EBE0]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link to="/" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#2D5A4A] rounded-full flex items-center justify-center">
                  <span className="text-xl">🧼</span>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-[#1A1A1A] font-display">Admin Dashboard</h1>
                  <p className="text-xs text-gray-500">Karen's Beautiful Soap</p>
                </div>
              </Link>
            </div>
            <nav className="flex items-center gap-6">
              <Link to="/admin" className="text-gray-600 hover:text-[#2D5A4A]">Dashboard</Link>
              <Link to="/admin/products" className="text-gray-600 hover:text-[#2D5A4A]">Products</Link>
              <Link to="/admin/orders" className="text-[#2D5A4A] font-medium">Orders</Link>
              <Link to="/admin/customers" className="text-gray-600 hover:text-[#2D5A4A]">Customers</Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Back Link */}
        <Link
          to="/admin/orders"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-[#2D5A4A] mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Orders
        </Link>

        {/* Order Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-[#1A1A1A] font-display">Order {order?.orderNumber || ORDER.id}</h2>
              <OrderStatusBadge status={currentStatus} />
            </div>
            <p className="text-gray-600">Placed on {formatDate(order?.createdAt || ORDER.date)}</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 border border-[#F5EBE0] rounded-lg text-gray-600 hover:bg-[#F5EBE0] transition-colors">
              <Printer className="w-4 h-4" />
              Print
            </button>
            {currentStatus !== 'cancelled' && currentStatus !== 'delivered' && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="flex items-center gap-2 px-4 py-2 border border-red-200 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
              >
                <XCircle className="w-4 h-4" />
                Cancel Order
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Status Actions */}
            {currentStatus !== 'cancelled' && currentStatus !== 'delivered' && (
              <div className="bg-white rounded-xl border border-[#F5EBE0] p-6">
                <h3 className="font-semibold text-[#1A1A1A] mb-4 font-display">Update Order Status</h3>

                {/* Status Progress */}
                <div className="flex items-center justify-between mb-6">
                  {STATUS_FLOW.map((status, idx) => (
                    <div key={status} className="flex items-center">
                      <div className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                        STATUS_FLOW.indexOf(currentStatus) >= idx
                          ? 'bg-[#2D5A4A] text-white'
                          : 'bg-[#F5EBE0] text-gray-400'
                      )}>
                        {idx + 1}
                      </div>
                      {idx < STATUS_FLOW.length - 1 && (
                        <div className={cn(
                          'w-20 h-1 mx-2',
                          STATUS_FLOW.indexOf(currentStatus) > idx
                            ? 'bg-[#2D5A4A]'
                            : 'bg-[#F5EBE0]'
                        )} />
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-500 mb-6 px-1">
                  <span>Paid</span>
                  <span>Processing</span>
                  <span>Shipped</span>
                  <span>Delivered</span>
                </div>

                {/* Shipping Form */}
                {currentStatus === 'processing' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tracking Number</label>
                    <input
                      type="text"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="Enter tracking number"
                      className="w-full px-4 py-3 rounded-lg border border-[#F5EBE0] focus:outline-none focus:border-[#2D5A4A]"
                    />
                  </div>
                )}

                {getNextStatus() && (
                  <button
                    onClick={advanceStatus}
                    disabled={isUpdating || (currentStatus === 'processing' && !trackingNumber)}
                    className={cn(
                      "w-full flex items-center justify-center gap-2 bg-[#2D5A4A] text-white py-3 rounded-lg transition-colors",
                      isUpdating || (currentStatus === 'processing' && !trackingNumber)
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-[#1A1A1A]"
                    )}
                  >
                    {isUpdating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Updating...
                      </>
                    ) : currentStatus === 'paid' ? (
                      <>
                        <Package className="w-4 h-4" />
                        Start Processing
                      </>
                    ) : currentStatus === 'processing' ? (
                      <>
                        <Truck className="w-4 h-4" />
                        Mark as Shipped
                      </>
                    ) : currentStatus === 'shipped' ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Mark as Delivered
                      </>
                    ) : null}
                  </button>
                )}
              </div>
            )}

            {/* Order Items */}
            <div className="bg-white rounded-xl border border-[#F5EBE0] overflow-hidden">
              <div className="p-4 border-b border-[#F5EBE0]">
                <h3 className="font-semibold text-[#1A1A1A] font-display">Order Items</h3>
              </div>
              <div className="divide-y divide-[#F5EBE0]">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-4">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-[#1A1A1A]">{item.name}</p>
                      <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatPrice(item.price)} × {item.quantity}</p>
                      <p className="text-sm text-gray-500">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 bg-[#FDFCFB] border-t border-[#F5EBE0]">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Subtotal</span>
                    <span>{formatPrice(order?.subtotal || ORDER.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Shipping</span>
                    <span>{(order?.shippingAmount || ORDER.shipping) === 0 ? 'Free' : formatPrice(order?.shippingAmount || ORDER.shipping)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-[#F5EBE0] font-semibold text-base">
                    <span>Total</span>
                    <span>{formatPrice(order?.totalAmount || ORDER.total)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Timeline */}
            <div className="bg-white rounded-xl border border-[#F5EBE0] overflow-hidden">
              <div className="p-4 border-b border-[#F5EBE0]">
                <h3 className="font-semibold text-[#1A1A1A] font-display">Order Timeline</h3>
              </div>
              <div className="p-4">
                {timeline.map((event, idx) => (
                  <div key={idx} className="flex gap-4 pb-4 last:pb-0">
                    <div className="relative">
                      <div className="w-3 h-3 rounded-full bg-[#2D5A4A]" />
                      {idx < timeline.length - 1 && (
                        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-0.5 h-full bg-[#F5EBE0]" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="font-medium text-[#1A1A1A]">{event.description}</p>
                      <p className="text-sm text-gray-500">{formatDate(event.date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Customer Info */}
            <div className="bg-white rounded-xl border border-[#F5EBE0] p-6">
              <h3 className="font-semibold text-[#1A1A1A] mb-4 font-display">Customer</h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-[#2D5A4A] flex items-center justify-center text-white font-medium">
                  {customer.name.split(' ').map((n: string) => n[0]).join('').toUpperCase() || '?'}
                </div>
                <div>
                  <p className="font-medium text-[#1A1A1A]">{customer.name}</p>
                  <p className="text-sm text-gray-500">Customer</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-4 h-4" />
                  {customer.email || order?.email || 'No email'}
                </div>
                {customer.phone && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-4 h-4" />
                    {customer.phone}
                  </div>
                )}
              </div>
              <button className="mt-4 w-full flex items-center justify-center gap-2 py-2 border border-[#F5EBE0] rounded-lg text-gray-600 hover:bg-[#F5EBE0] transition-colors text-sm">
                <Send className="w-4 h-4" />
                Send Email
              </button>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-xl border border-[#F5EBE0] p-6">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4 text-gray-400" />
                <h3 className="font-semibold text-[#1A1A1A] font-display">Shipping Address</h3>
              </div>
              <div className="text-sm text-gray-600">
                {order?.shippingAddress ? (
                  <>
                    <p className="font-medium text-[#1A1A1A]">{order.shippingAddress.name}</p>
                    <p>{order.shippingAddress.line1}</p>
                    {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
                    <p>
                      {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-medium text-[#1A1A1A]">{ORDER.shippingAddress.name}</p>
                    <p>{ORDER.shippingAddress.street}</p>
                    <p>
                      {ORDER.shippingAddress.city}, {ORDER.shippingAddress.state} {ORDER.shippingAddress.zip}
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Billing Address */}
            <div className="bg-white rounded-xl border border-[#F5EBE0] p-6">
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="w-4 h-4 text-gray-400" />
                <h3 className="font-semibold text-[#1A1A1A] font-display">Billing</h3>
              </div>
              <div className="text-sm text-gray-600">
                <p className="font-medium text-[#1A1A1A]">{ORDER.billingAddress.name}</p>
                <p>{ORDER.billingAddress.street}</p>
                <p>
                  {ORDER.billingAddress.city}, {ORDER.billingAddress.state} {ORDER.billingAddress.zip}
                </p>
                <p className="mt-3">
                  {ORDER.paymentMethod.brand} •••• {ORDER.paymentMethod.last4}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-[#F5EBE0] rounded-xl p-6">
              <h3 className="font-semibold text-[#1A1A1A] mb-3 font-display">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full flex items-center justify-center gap-2 bg-white py-2 rounded-lg text-gray-600 hover:bg-[#2D5A4A] hover:text-white transition-colors text-sm">
                  <RotateCcw className="w-4 h-4" />
                  Issue Refund
                </button>
                <button
                  onClick={handleResendConfirmation}
                  disabled={isResending}
                  className="w-full flex items-center justify-center gap-2 bg-white py-2 rounded-lg text-gray-600 hover:bg-[#2D5A4A] hover:text-white transition-colors text-sm disabled:opacity-50"
                >
                  {isResending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Resend Confirmation
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-[#1A1A1A] mb-4 font-display">Cancel Order?</h2>
            <p className="text-gray-600 mb-6">
              This will cancel the order and notify the customer. If payment has been received, a refund will be initiated.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={isUpdating}
                className="flex-1 py-3 rounded-lg border border-[#F5EBE0] text-gray-600 hover:bg-[#F5EBE0] transition-colors disabled:opacity-50"
              >
                Keep Order
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={isUpdating}
                className="flex-1 py-3 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isUpdating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  'Cancel Order'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OrderStatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; icon: typeof Clock }> = {
    processing: { bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock },
    paid: { bg: 'bg-blue-100', text: 'text-blue-700', icon: CheckCircle },
    shipped: { bg: 'bg-purple-100', text: 'text-purple-700', icon: Truck },
    delivered: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
    cancelled: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle },
  };

  const { bg, text, icon: Icon } = config[status] || { bg: 'bg-gray-100', text: 'text-gray-700', icon: Clock };

  return (
    <span className={`inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full capitalize ${bg} ${text}`}>
      <Icon className="w-4 h-4" />
      {status}
    </span>
  );
}
