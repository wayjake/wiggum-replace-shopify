// 🎛️ Admin Dashboard - Mission control for the soap empire
// "Me fail English? That's unpossible!" - Ralph on dashboard analytics

import { createFileRoute, Link } from '@tanstack/react-router';
import {
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  TrendingUp,
  ArrowRight,
  AlertCircle,
  Clock,
} from 'lucide-react';

export const Route = createFileRoute('/admin/')({
  head: () => ({
    meta: [
      { title: "Dashboard | Admin | Karen's Beautiful Soap" },
      { name: 'description', content: 'Admin dashboard for managing your soap store.' },
    ],
  }),
  component: AdminDashboard,
});

// ═══════════════════════════════════════════════════════════
// SAMPLE DATA (will be replaced with database queries)
// ═══════════════════════════════════════════════════════════

const STATS = {
  todaySales: 247.00,
  todayOrders: 8,
  pendingOrders: 3,
  lowStockItems: 2,
  totalCustomers: 142,
  monthlyRevenue: 4820.00,
};

const RECENT_ORDERS = [
  { id: 'KS-20240115-001', customer: 'Sarah M.', total: 40.00, status: 'paid', date: '2 hours ago' },
  { id: 'KS-20240115-002', customer: 'Michael T.', total: 28.00, status: 'shipped', date: '5 hours ago' },
  { id: 'KS-20240114-003', customer: 'Emily R.', total: 52.00, status: 'delivered', date: '1 day ago' },
  { id: 'KS-20240114-004', customer: 'John D.', total: 16.00, status: 'processing', date: '1 day ago' },
];

const LOW_STOCK_PRODUCTS = [
  { name: 'Lavender Dreams', stock: 5, threshold: 10 },
  { name: 'Rose Petal Luxury', stock: 3, threshold: 10 },
];

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════

function AdminDashboard() {
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

            {/* Admin Nav */}
            <nav className="flex items-center gap-6">
              <Link to="/admin" className="text-[#2D5A4A] font-medium">Dashboard</Link>
              <Link to="/admin/products" className="text-gray-600 hover:text-[#2D5A4A]">Products</Link>
              <Link to="/admin/orders" className="text-gray-600 hover:text-[#2D5A4A]">Orders</Link>
              <Link to="/admin/customers" className="text-gray-600 hover:text-[#2D5A4A]">Customers</Link>
              <Link to="/" className="text-gray-500 hover:text-[#2D5A4A] text-sm">View Store →</Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-[#1A1A1A] font-display">Good morning, Karen!</h2>
          <p className="text-gray-600">Here's what's happening with your store today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            label="Today's Sales"
            value={`$${STATS.todaySales.toFixed(2)}`}
            icon={DollarSign}
            trend="+12%"
            color="green"
          />
          <StatCard
            label="Today's Orders"
            value={STATS.todayOrders.toString()}
            icon={ShoppingCart}
            trend="+3"
            color="blue"
          />
          <StatCard
            label="Pending Orders"
            value={STATS.pendingOrders.toString()}
            icon={Clock}
            color="amber"
          />
          <StatCard
            label="Total Customers"
            value={STATS.totalCustomers.toString()}
            icon={Users}
            trend="+8 this week"
            color="purple"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Orders */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-[#F5EBE0] p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-[#1A1A1A] font-display">Recent Orders</h3>
              <Link
                to="/admin/orders"
                className="text-sm text-[#2D5A4A] hover:underline flex items-center gap-1"
              >
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-4">
              {RECENT_ORDERS.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between py-3 border-b border-[#F5EBE0] last:border-0"
                >
                  <div>
                    <p className="font-medium text-[#1A1A1A]">{order.id}</p>
                    <p className="text-sm text-gray-500">{order.customer} • {order.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-[#1A1A1A]">${order.total.toFixed(2)}</p>
                    <StatusBadge status={order.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Low Stock Alert */}
            {LOW_STOCK_PRODUCTS.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  <h3 className="font-semibold text-amber-900">Low Stock Alert</h3>
                </div>
                <div className="space-y-3">
                  {LOW_STOCK_PRODUCTS.map((product) => (
                    <div key={product.name} className="flex items-center justify-between">
                      <span className="text-sm text-amber-900">{product.name}</span>
                      <span className="text-sm font-medium text-amber-700">
                        {product.stock} left
                      </span>
                    </div>
                  ))}
                </div>
                <Link
                  to="/admin/products"
                  className="mt-4 block text-center text-sm text-amber-700 hover:text-amber-900 font-medium"
                >
                  Manage Inventory →
                </Link>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-[#F5EBE0] p-6">
              <h3 className="font-semibold text-[#1A1A1A] mb-4 font-display">Quick Actions</h3>
              <div className="space-y-2">
                <Link
                  to="/admin/products/new"
                  className="block w-full py-2 px-4 bg-[#2D5A4A] text-white rounded-lg text-center hover:bg-[#1A1A1A] transition-colors"
                >
                  + Add New Product
                </Link>
                <Link
                  to="/admin/orders"
                  className="block w-full py-2 px-4 bg-[#F5EBE0] text-[#1A1A1A] rounded-lg text-center hover:bg-[#D4A574] hover:text-white transition-colors"
                >
                  Process Orders
                </Link>
              </div>
            </div>

            {/* Monthly Revenue */}
            <div className="bg-[#2D5A4A] rounded-xl p-6 text-white">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5" />
                <span className="text-sm text-white/70">This Month</span>
              </div>
              <p className="text-3xl font-bold">${STATS.monthlyRevenue.toLocaleString()}</p>
              <p className="text-sm text-white/70 mt-1">Total revenue</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// HELPER COMPONENTS
// ═══════════════════════════════════════════════════════════

function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  color,
}: {
  label: string;
  value: string;
  icon: typeof DollarSign;
  trend?: string;
  color: 'green' | 'blue' | 'amber' | 'purple';
}) {
  const colors = {
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    amber: 'bg-amber-100 text-amber-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  return (
    <div className="bg-white rounded-xl border border-[#F5EBE0] p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
            {trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-[#1A1A1A]">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    paid: 'bg-blue-100 text-blue-700',
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
