// 📦 Order History - Your soap shopping chronicles
// "The doctor said I wouldn't have so many nose bleeds if I kept my finger outta there." - Ralph on order tracking
//
// 🎭 Now fetching REAL orders from the database!
// No more sample data - this is the real deal.

import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { Package, Truck, CheckCircle, Clock, Search, ChevronRight, XCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { formatPrice } from '../../../utils';
import { requireAuth } from '../../../lib/auth-guards';
import { getDb, orders, orderItems } from '../../../db';
import { eq, desc } from 'drizzle-orm';

// ═══════════════════════════════════════════════════════════
// SERVER FUNCTIONS
// ═══════════════════════════════════════════════════════════

const getUserOrders = createServerFn({ method: 'GET' })
  .handler(async (userId: string) => {
    const db = getDb();

    // Get all orders for this user with their items
    const userOrders = await db.query.orders.findMany({
      where: eq(orders.userId, userId),
      with: {
        items: true,
      },
      orderBy: desc(orders.createdAt),
    });

    return userOrders;
  });

// ═══════════════════════════════════════════════════════════
// ROUTE DEFINITION
// ═══════════════════════════════════════════════════════════

export const Route = createFileRoute('/account/orders/')({
  head: () => ({
    meta: [
      { title: "Order History | My Account | Karen's Beautiful Soap" },
      { name: 'description', content: 'View and track all your orders.' },
    ],
  }),
  loader: async () => {
    const authResult = await requireAuth();
    if (!authResult.authenticated || !authResult.user) {
      return { authResult, orders: [] };
    }

    const userOrders = await getUserOrders(authResult.user.id);
    return { authResult, orders: userOrders };
  },
  component: AccountOrders,
});

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════

function AccountOrders() {
  const navigate = useNavigate();
  const { authResult, orders: userOrders } = Route.useLoaderData();
  const [searchQuery, setSearchQuery] = useState('');

  // Auth guard redirect
  useEffect(() => {
    if (!authResult.authenticated) {
      navigate({ to: authResult.redirect || '/login' });
    }
  }, [authResult, navigate]);

  if (!authResult.authenticated) {
    return (
      <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#2D5A4A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const filteredOrders = userOrders.filter((order) =>
    order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return 'Unknown date';
    return new Date(date).toLocaleDateString('en-US', {
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
            <p className="text-gray-600">{userOrders.length} order{userOrders.length !== 1 ? 's' : ''} placed</p>
          </div>
          {userOrders.length > 0 && (
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
          )}
        </div>

        {/* Orders List */}
        {filteredOrders.length > 0 ? (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-xl border border-[#F5EBE0] overflow-hidden"
              >
                {/* Order Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#FDFCFB] border-b border-[#F5EBE0] gap-4">
                  <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                    <div>
                      <p className="text-xs text-gray-500">Order Number</p>
                      <p className="font-medium text-[#1A1A1A]">{order.orderNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Order Date</p>
                      <p className="font-medium text-[#1A1A1A]">{formatDate(order.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Total</p>
                      <p className="font-medium text-[#1A1A1A]">{formatPrice(order.totalAmount)}</p>
                    </div>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </div>

                {/* Order Items */}
                <div className="p-4">
                  <div className="space-y-3">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {item.productImage ? (
                            <img
                              src={item.productImage}
                              alt={item.productName}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-[#F5EBE0] rounded-lg flex items-center justify-center">
                              <Package className="w-6 h-6 text-[#2D5A4A]" />
                            </div>
                          )}
                          <div>
                            <Link
                              to="/shop/$productSlug"
                              params={{ productSlug: item.productSlug }}
                              className="font-medium text-[#1A1A1A] hover:text-[#2D5A4A]"
                            >
                              {item.productName}
                            </Link>
                            <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                          </div>
                        </div>
                        <p className="font-medium">{formatPrice(item.totalPrice)}</p>
                      </div>
                    ))}
                  </div>

                  {/* Order Actions */}
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#F5EBE0]">
                    <div className="text-sm text-gray-500">
                      {order.status === 'shipped' && order.trackingNumber && (
                        <span className="flex items-center gap-2">
                          <Truck className="w-4 h-4" />
                          Tracking: {order.trackingNumber}
                        </span>
                      )}
                      {order.status === 'delivered' && order.deliveredAt && (
                        <span className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          Delivered on {formatDate(order.deliveredAt)}
                        </span>
                      )}
                      {order.status === 'cancelled' && (
                        <span className="flex items-center gap-2 text-red-600">
                          <XCircle className="w-4 h-4" />
                          Order cancelled
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {order.status === 'shipped' && order.trackingUrl && (
                        <a
                          href={order.trackingUrl}
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
        ) : (
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

// ═══════════════════════════════════════════════════════════
// STATUS BADGE COMPONENT
// ═══════════════════════════════════════════════════════════

function OrderStatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; icon: typeof Clock }> = {
    pending: { bg: 'bg-gray-100', text: 'text-gray-700', icon: Clock },
    processing: { bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock },
    paid: { bg: 'bg-blue-100', text: 'text-blue-700', icon: CheckCircle },
    shipped: { bg: 'bg-purple-100', text: 'text-purple-700', icon: Truck },
    delivered: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
    cancelled: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle },
    refunded: { bg: 'bg-orange-100', text: 'text-orange-700', icon: XCircle },
  };

  const { bg, text, icon: Icon } = config[status] || { bg: 'bg-gray-100', text: 'text-gray-700', icon: Clock };

  return (
    <span className={`inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full capitalize ${bg} ${text}`}>
      <Icon className="w-4 h-4" />
      {status}
    </span>
  );
}
