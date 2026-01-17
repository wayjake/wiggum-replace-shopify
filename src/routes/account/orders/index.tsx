// 📦 Order History - Your soap shopping chronicles
// "The doctor said I wouldn't have so many nose bleeds if I kept my finger outta there." - Ralph on order tracking

import { createFileRoute, Link } from '@tanstack/react-router';
import { Package, Truck, CheckCircle, Clock, Search, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { cn, formatPrice } from '../../../utils';

export const Route = createFileRoute('/account/orders/')({
  head: () => ({
    meta: [
      { title: "Order History | My Account | Karen's Beautiful Soap" },
      { name: 'description', content: 'View and track all your orders.' },
    ],
  }),
  component: AccountOrders,
});

// ═══════════════════════════════════════════════════════════
// SAMPLE DATA
// ═══════════════════════════════════════════════════════════

const ORDERS = [
  {
    id: 'KS-20240115-001',
    date: '2024-01-15T14:30:00Z',
    status: 'shipped',
    total: 40.00,
    items: [
      { name: 'Lavender Dreams', quantity: 2, price: 12.00 },
      { name: 'Honey Oat Comfort', quantity: 1, price: 14.00 },
    ],
    tracking: '1Z999AA10123456784',
  },
  {
    id: 'KS-20240108-042',
    date: '2024-01-08T10:15:00Z',
    status: 'delivered',
    total: 28.00,
    items: [
      { name: 'Rose Petal Luxury', quantity: 1, price: 16.00 },
      { name: 'Citrus Burst', quantity: 1, price: 11.00 },
    ],
    deliveredDate: '2024-01-12',
  },
  {
    id: 'KS-20231220-089',
    date: '2023-12-20T16:45:00Z',
    status: 'delivered',
    total: 52.00,
    items: [
      { name: 'Lavender Dreams', quantity: 1, price: 12.00 },
      { name: 'Coconut Milk Bliss', quantity: 2, price: 13.00 },
      { name: 'Rose Petal Luxury', quantity: 1, price: 16.00 },
    ],
    deliveredDate: '2023-12-24',
  },
  {
    id: 'KS-20231115-034',
    date: '2023-11-15T09:20:00Z',
    status: 'delivered',
    total: 38.00,
    items: [
      { name: 'Honey Oat Comfort', quantity: 2, price: 14.00 },
      { name: 'Citrus Burst', quantity: 1, price: 11.00 },
    ],
    deliveredDate: '2023-11-19',
  },
];

function AccountOrders() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOrders = ORDERS.filter((order) =>
    order.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
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
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link to="/account" className="hover:text-[#2D5A4A]">My Account</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-[#1A1A1A]">Order History</span>
        </nav>

        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A1A] font-display">Order History</h1>
            <p className="text-gray-600">{ORDERS.length} orders placed</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-lg border border-[#F5EBE0] focus:outline-none focus:border-[#2D5A4A] text-sm"
            />
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-xl border border-[#F5EBE0] overflow-hidden"
            >
              {/* Order Header */}
              <div className="flex items-center justify-between p-4 bg-[#FDFCFB] border-b border-[#F5EBE0]">
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-xs text-gray-500">Order Number</p>
                    <p className="font-medium text-[#1A1A1A]">{order.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Order Date</p>
                    <p className="font-medium text-[#1A1A1A]">{formatDate(order.date)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total</p>
                    <p className="font-medium text-[#1A1A1A]">{formatPrice(order.total)}</p>
                  </div>
                </div>
                <OrderStatusBadge status={order.status} />
              </div>

              {/* Order Items */}
              <div className="p-4">
                <div className="space-y-3">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-[#F5EBE0] rounded-lg flex items-center justify-center">
                          <Package className="w-6 h-6 text-[#2D5A4A]" />
                        </div>
                        <div>
                          <p className="font-medium text-[#1A1A1A]">{item.name}</p>
                          <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <p className="font-medium">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>

                {/* Order Actions */}
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#F5EBE0]">
                  <div className="text-sm text-gray-500">
                    {order.status === 'shipped' && order.tracking && (
                      <span className="flex items-center gap-2">
                        <Truck className="w-4 h-4" />
                        Tracking: {order.tracking}
                      </span>
                    )}
                    {order.status === 'delivered' && order.deliveredDate && (
                      <span className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Delivered on {formatDate(order.deliveredDate)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {order.status === 'shipped' && (
                      <a
                        href={`https://tools.usps.com/go/TrackConfirmAction?tLabels=${order.tracking}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-[#2D5A4A] hover:underline"
                      >
                        Track Package
                      </a>
                    )}
                    <Link
                      to="/account/orders/$orderId"
                      params={{ orderId: order.id }}
                      className="text-sm bg-[#2D5A4A] text-white px-4 py-2 rounded-lg hover:bg-[#1A1A1A] transition-colors"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl border border-[#F5EBE0]">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2 font-display">No orders found</h3>
            <p className="text-gray-500 mb-6">
              {searchQuery ? 'Try a different search term' : "You haven't placed any orders yet"}
            </p>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 bg-[#2D5A4A] text-white px-6 py-3 rounded-lg hover:bg-[#1A1A1A] transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        )}
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
