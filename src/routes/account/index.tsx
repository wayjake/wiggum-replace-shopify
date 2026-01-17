// 🏠 Account Dashboard - Your soap sanctuary
// "Sleep! That's where I'm a Viking!" - Ralph on account management

import { createFileRoute, Link } from '@tanstack/react-router';
import { Package, CreditCard, MapPin, User, Heart, Bell, ChevronRight, ShoppingBag } from 'lucide-react';
import { formatPrice } from '../../utils';

export const Route = createFileRoute('/account/')({
  head: () => ({
    meta: [
      { title: "My Account | Karen's Beautiful Soap" },
      { name: 'description', content: 'Manage your account, orders, and preferences.' },
    ],
  }),
  component: AccountDashboard,
});

// ═══════════════════════════════════════════════════════════
// SAMPLE DATA (will be replaced with authenticated user data)
// ═══════════════════════════════════════════════════════════

const USER = {
  name: 'Sarah Mitchell',
  email: 'sarah@example.com',
  memberSince: 'June 2023',
};

const RECENT_ORDERS = [
  { id: 'KS-20240115-001', date: 'Jan 15, 2024', status: 'shipped', total: 40.00 },
  { id: 'KS-20240108-042', date: 'Jan 8, 2024', status: 'delivered', total: 28.00 },
];

const QUICK_LINKS = [
  { label: 'Order History', href: '/account/orders', icon: Package, description: 'View and track your orders' },
  { label: 'Payment Methods', href: '/account/payment', icon: CreditCard, description: 'Manage cards and billing' },
  { label: 'Addresses', href: '/account/addresses', icon: MapPin, description: 'Shipping and billing addresses' },
  { label: 'Wishlist', href: '/account/wishlist', icon: Heart, description: 'Your saved favorites' },
  { label: 'Profile Settings', href: '/account/settings', icon: User, description: 'Update your information' },
  { label: 'Notifications', href: '/account/notifications', icon: Bell, description: 'Email and alert preferences' },
];

function AccountDashboard() {
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

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="bg-[#2D5A4A] rounded-2xl p-8 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2 font-display">Welcome back, {USER.name.split(' ')[0]}!</h1>
              <p className="text-white/70">Member since {USER.memberSince}</p>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <Link
                to="/shop"
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-5 py-3 rounded-lg transition-colors"
              >
                <ShoppingBag className="w-5 h-5" />
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Links */}
            <div className="bg-white rounded-xl border border-[#F5EBE0] overflow-hidden">
              <div className="p-6 border-b border-[#F5EBE0]">
                <h2 className="text-xl font-semibold text-[#1A1A1A] font-display">Manage Account</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[#F5EBE0]">
                {QUICK_LINKS.slice(0, 2).map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="flex items-center gap-4 p-6 hover:bg-[#FDFCFB] transition-colors"
                  >
                    <div className="w-12 h-12 bg-[#F5EBE0] rounded-lg flex items-center justify-center">
                      <link.icon className="w-6 h-6 text-[#2D5A4A]" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-[#1A1A1A]">{link.label}</p>
                      <p className="text-sm text-gray-500">{link.description}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </Link>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[#F5EBE0] border-t border-[#F5EBE0]">
                {QUICK_LINKS.slice(2, 4).map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="flex items-center gap-4 p-6 hover:bg-[#FDFCFB] transition-colors"
                  >
                    <div className="w-12 h-12 bg-[#F5EBE0] rounded-lg flex items-center justify-center">
                      <link.icon className="w-6 h-6 text-[#2D5A4A]" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-[#1A1A1A]">{link.label}</p>
                      <p className="text-sm text-gray-500">{link.description}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </Link>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[#F5EBE0] border-t border-[#F5EBE0]">
                {QUICK_LINKS.slice(4).map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="flex items-center gap-4 p-6 hover:bg-[#FDFCFB] transition-colors"
                  >
                    <div className="w-12 h-12 bg-[#F5EBE0] rounded-lg flex items-center justify-center">
                      <link.icon className="w-6 h-6 text-[#2D5A4A]" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-[#1A1A1A]">{link.label}</p>
                      <p className="text-sm text-gray-500">{link.description}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Orders */}
            <div className="bg-white rounded-xl border border-[#F5EBE0] p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[#1A1A1A] font-display">Recent Orders</h3>
                <Link to="/account/orders" className="text-sm text-[#2D5A4A] hover:underline">
                  View all
                </Link>
              </div>
              <div className="space-y-4">
                {RECENT_ORDERS.map((order) => (
                  <Link
                    key={order.id}
                    to="/account/orders/$orderId"
                    params={{ orderId: order.id }}
                    className="block p-4 rounded-lg bg-[#FDFCFB] hover:bg-[#F5EBE0] transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-[#1A1A1A] text-sm">{order.id}</span>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{order.date}</span>
                      <span className="font-medium text-[#1A1A1A]">{formatPrice(order.total)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Account Info */}
            <div className="bg-white rounded-xl border border-[#F5EBE0] p-6">
              <h3 className="font-semibold text-[#1A1A1A] mb-4 font-display">Account Details</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-500">Name</p>
                  <p className="text-[#1A1A1A] font-medium">{USER.name}</p>
                </div>
                <div>
                  <p className="text-gray-500">Email</p>
                  <p className="text-[#1A1A1A] font-medium">{USER.email}</p>
                </div>
              </div>
              <Link
                to="/account/settings"
                className="mt-4 block text-center text-sm text-[#2D5A4A] hover:underline"
              >
                Edit profile →
              </Link>
            </div>

            {/* Need Help? */}
            <div className="bg-[#F5EBE0] rounded-xl p-6">
              <h3 className="font-semibold text-[#1A1A1A] mb-2 font-display">Need Help?</h3>
              <p className="text-sm text-gray-600 mb-4">
                Our soap experts are here to help with any questions.
              </p>
              <Link
                to="/contact"
                className="block w-full text-center bg-[#2D5A4A] text-white py-2 rounded-lg hover:bg-[#1A1A1A] transition-colors text-sm font-medium"
              >
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function OrderStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    processing: 'bg-amber-100 text-amber-700',
    shipped: 'bg-purple-100 text-purple-700',
    delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  return (
    <span className={`text-xs px-2 py-1 rounded-full capitalize ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
  );
}
