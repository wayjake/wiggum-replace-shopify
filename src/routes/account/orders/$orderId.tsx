// 📋 Order Details - The full soap story
// "My knob tastes funny." - Ralph on order specifics

import { createFileRoute, Link } from '@tanstack/react-router';
import { Package, Truck, CheckCircle, Clock, ChevronRight, MapPin, CreditCard, ArrowLeft, RotateCcw } from 'lucide-react';
import { formatPrice } from '../../../utils';

export const Route = createFileRoute('/account/orders/$orderId')({
  head: () => ({
    meta: [
      { title: "Order Details | My Account | Karen's Beautiful Soap" },
      { name: 'description', content: 'View your order details and tracking information.' },
    ],
  }),
  component: OrderDetails,
});

// ═══════════════════════════════════════════════════════════
// SAMPLE DATA (will be replaced with database query)
// ═══════════════════════════════════════════════════════════

const ORDER = {
  id: 'KS-20240115-001',
  date: '2024-01-15T14:30:00Z',
  status: 'shipped',
  total: 40.00,
  subtotal: 38.00,
  shipping: 0,
  tax: 2.00,
  items: [
    { name: 'Lavender Dreams', quantity: 2, price: 12.00, image: 'https://images.unsplash.com/photo-1600857062241-98e5dba7f214?w=80&h=80&fit=crop' },
    { name: 'Honey Oat Comfort', quantity: 1, price: 14.00, image: 'https://images.unsplash.com/photo-1607006344380-b6775a0824a7?w=80&h=80&fit=crop' },
  ],
  tracking: '1Z999AA10123456784',
  carrier: 'USPS',
  estimatedDelivery: '2024-01-18',
  shippingAddress: {
    name: 'Sarah Mitchell',
    street: '123 Main Street',
    city: 'Portland',
    state: 'OR',
    zip: '97201',
  },
  paymentMethod: {
    type: 'card',
    last4: '4242',
    brand: 'Visa',
  },
  timeline: [
    { status: 'ordered', date: '2024-01-15T14:30:00Z', description: 'Order placed' },
    { status: 'confirmed', date: '2024-01-15T14:35:00Z', description: 'Payment confirmed' },
    { status: 'processing', date: '2024-01-15T16:00:00Z', description: 'Order is being prepared' },
    { status: 'shipped', date: '2024-01-16T09:00:00Z', description: 'Order shipped via USPS' },
  ],
};

function OrderDetails() {
  const { orderId } = Route.useParams();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB]">
      {/* Header */}
      <header className="bg-white border-b border-[#F5EBE0]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#2D5A4A] rounded-full flex items-center justify-center">
                <span className="text-xl">🧼</span>
              </div>
              <span className="text-xl font-bold text-[#1A1A1A] font-display">Karen's Beautiful Soap</span>
            </Link>
            <nav className="flex items-center gap-6">
              <Link to="/shop" className="text-gray-600 hover:text-[#2D5A4A]">Shop</Link>
              <Link to="/account" className="text-[#2D5A4A] font-medium">My Account</Link>
              <Link to="/cart" className="text-gray-600 hover:text-[#2D5A4A]">Cart</Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Back Link */}
        <Link
          to="/account/orders"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-[#2D5A4A] mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Order History
        </Link>

        {/* Order Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A1A] font-display">Order {ORDER.id}</h1>
            <p className="text-gray-600">Placed on {formatDate(ORDER.date)}</p>
          </div>
          <OrderStatusBadge status={ORDER.status} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tracking Info */}
            {ORDER.status === 'shipped' && ORDER.tracking && (
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Truck className="w-6 h-6 text-purple-600" />
                  <div>
                    <p className="font-semibold text-purple-900">Your order is on its way!</p>
                    <p className="text-sm text-purple-700">
                      Estimated delivery: {formatDate(ORDER.estimatedDelivery)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between bg-white rounded-lg p-4">
                  <div>
                    <p className="text-sm text-gray-500">{ORDER.carrier} Tracking Number</p>
                    <p className="font-mono font-medium">{ORDER.tracking}</p>
                  </div>
                  <a
                    href={`https://tools.usps.com/go/TrackConfirmAction?tLabels=${ORDER.tracking}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700 transition-colors"
                  >
                    Track Package
                  </a>
                </div>
              </div>
            )}

            {/* Order Items */}
            <div className="bg-white rounded-xl border border-[#F5EBE0] overflow-hidden">
              <div className="p-4 border-b border-[#F5EBE0]">
                <h2 className="font-semibold text-[#1A1A1A] font-display">Order Items</h2>
              </div>
              <div className="divide-y divide-[#F5EBE0]">
                {ORDER.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-4">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-[#1A1A1A]">{item.name}</p>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-medium">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Timeline */}
            <div className="bg-white rounded-xl border border-[#F5EBE0] overflow-hidden">
              <div className="p-4 border-b border-[#F5EBE0]">
                <h2 className="font-semibold text-[#1A1A1A] font-display">Order Timeline</h2>
              </div>
              <div className="p-4">
                <div className="relative">
                  {ORDER.timeline.map((event, idx) => (
                    <div key={idx} className="flex gap-4 pb-6 last:pb-0">
                      <div className="relative">
                        <div className="w-3 h-3 rounded-full bg-[#2D5A4A]" />
                        {idx < ORDER.timeline.length - 1 && (
                          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-0.5 h-full bg-[#F5EBE0]" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-[#1A1A1A]">{event.description}</p>
                        <p className="text-sm text-gray-500">
                          {formatDate(event.date)} at {formatTime(event.date)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="bg-white rounded-xl border border-[#F5EBE0] p-6">
              <h3 className="font-semibold text-[#1A1A1A] mb-4 font-display">Order Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span>{formatPrice(ORDER.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Shipping</span>
                  <span>{ORDER.shipping === 0 ? 'Free' : formatPrice(ORDER.shipping)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Tax</span>
                  <span>{formatPrice(ORDER.tax)}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-[#F5EBE0] font-semibold">
                  <span>Total</span>
                  <span>{formatPrice(ORDER.total)}</span>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-xl border border-[#F5EBE0] p-6">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4 text-gray-400" />
                <h3 className="font-semibold text-[#1A1A1A] font-display">Shipping Address</h3>
              </div>
              <div className="text-sm text-gray-600">
                <p className="font-medium text-[#1A1A1A]">{ORDER.shippingAddress.name}</p>
                <p>{ORDER.shippingAddress.street}</p>
                <p>
                  {ORDER.shippingAddress.city}, {ORDER.shippingAddress.state} {ORDER.shippingAddress.zip}
                </p>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-xl border border-[#F5EBE0] p-6">
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="w-4 h-4 text-gray-400" />
                <h3 className="font-semibold text-[#1A1A1A] font-display">Payment Method</h3>
              </div>
              <p className="text-sm text-gray-600">
                {ORDER.paymentMethod.brand} ending in {ORDER.paymentMethod.last4}
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <button className="w-full flex items-center justify-center gap-2 bg-[#F5EBE0] text-[#1A1A1A] py-3 rounded-lg hover:bg-[#D4A574] hover:text-white transition-colors">
                <RotateCcw className="w-4 h-4" />
                Reorder Items
              </button>
              <Link
                to="/contact"
                className="block w-full text-center text-sm text-[#2D5A4A] hover:underline py-2"
              >
                Need help with this order?
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function OrderStatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; icon: typeof Clock }> = {
    processing: { bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock },
    shipped: { bg: 'bg-purple-100', text: 'text-purple-700', icon: Truck },
    delivered: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
  };

  const { bg, text, icon: Icon } = config[status] || { bg: 'bg-gray-100', text: 'text-gray-700', icon: Clock };

  return (
    <span className={`inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full capitalize ${bg} ${text}`}>
      <Icon className="w-4 h-4" />
      {status}
    </span>
  );
}
