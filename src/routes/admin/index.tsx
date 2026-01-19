// 🎛️ Admin Dashboard - Mission control for the soap empire
// "Me fail English? That's unpossible!" - Ralph on dashboard analytics
//
// ╭────────────────────────────────────────────────────────────╮
// │  🚀 Now with REAL database data!                           │
// │  No more sample data - this dashboard tells the truth.     │
// ╰────────────────────────────────────────────────────────────╯

import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { useEffect } from 'react';
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
import { requireAdmin } from '../../lib/auth-guards';
import { getDb, products, orders, users } from '../../db';
import { eq, lt, and, gte, desc, count, sum, sql } from 'drizzle-orm';

// ═══════════════════════════════════════════════════════════
// SERVER FUNCTIONS - Real data from the database!
// ═══════════════════════════════════════════════════════════

const getDashboardStats = createServerFn({ method: 'GET' }).handler(async () => {
  const db = getDb();
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  try {
    // Get low stock products (stock < threshold)
    const lowStockProducts = await db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        stock: products.stockQuantity,
        threshold: products.lowStockThreshold,
      })
      .from(products)
      .where(
        sql`${products.stockQuantity} < ${products.lowStockThreshold}`
      );

    // Get pending orders count
    const pendingOrdersResult = await db
      .select({ count: count() })
      .from(orders)
      .where(eq(orders.status, 'pending'));

    // Get today's orders
    const todayOrdersResult = await db
      .select({
        count: count(),
        total: sum(orders.totalAmount),
      })
      .from(orders)
      .where(gte(orders.createdAt, startOfToday));

    // Get monthly revenue
    const monthlyRevenueResult = await db
      .select({ total: sum(orders.totalAmount) })
      .from(orders)
      .where(gte(orders.createdAt, startOfMonth));

    // Get total customers
    const totalCustomersResult = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.role, 'customer'));

    // Get recent orders
    const recentOrders = await db.query.orders.findMany({
      limit: 5,
      orderBy: desc(orders.createdAt),
      with: {
        user: true,
      },
    });

    return {
      success: true,
      stats: {
        todaySales: Number(todayOrdersResult[0]?.total || 0),
        todayOrders: Number(todayOrdersResult[0]?.count || 0),
        pendingOrders: Number(pendingOrdersResult[0]?.count || 0),
        lowStockItems: lowStockProducts.length,
        totalCustomers: Number(totalCustomersResult[0]?.count || 0),
        monthlyRevenue: Number(monthlyRevenueResult[0]?.total || 0),
      },
      lowStockProducts: lowStockProducts.map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        stock: p.stock ?? 0,
        threshold: p.threshold ?? 10,
      })),
      recentOrders: recentOrders.map(o => ({
        id: o.orderNumber,
        customer: o.user?.firstName
          ? `${o.user.firstName} ${o.user.lastName?.charAt(0) || ''}.`
          : o.email.split('@')[0],
        total: o.totalAmount,
        status: o.status,
        date: formatRelativeTime(o.createdAt),
      })),
    };
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return {
      success: false,
      stats: {
        todaySales: 0,
        todayOrders: 0,
        pendingOrders: 0,
        lowStockItems: 0,
        totalCustomers: 0,
        monthlyRevenue: 0,
      },
      lowStockProducts: [],
      recentOrders: [],
    };
  }
});

// Helper for relative time formatting
function formatRelativeTime(date: Date | null | undefined): string {
  if (!date) return 'Unknown';
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return '1 day ago';
  return `${diffDays} days ago`;
}

// ═══════════════════════════════════════════════════════════
// ROUTE DEFINITION
// ═══════════════════════════════════════════════════════════

export const Route = createFileRoute('/admin/')({
  head: () => ({
    meta: [
      { title: "Dashboard | Admin | Karen's Beautiful Soap" },
      { name: 'description', content: 'Admin dashboard for managing your soap store.' },
    ],
  }),
  loader: async () => {
    const [authResult, dashboardData] = await Promise.all([
      requireAdmin(),
      getDashboardStats(),
    ]);
    return { authResult, ...dashboardData };
  },
  component: AdminDashboard,
});

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════

function AdminDashboard() {
  const navigate = useNavigate();
  const { authResult, stats, lowStockProducts, recentOrders } = Route.useLoaderData();

  // Handle auth redirects
  useEffect(() => {
    if (!authResult.authenticated || !authResult.isAdmin) {
      navigate({ to: authResult.redirect || '/login' });
    }
  }, [authResult, navigate]);

  // Don't render if not authenticated/admin
  if (!authResult.authenticated || !authResult.isAdmin) {
    return (
      <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#2D5A4A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

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
              <Link to="/admin/reviews" className="text-gray-600 hover:text-[#2D5A4A]">Reviews</Link>
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
            value={`$${stats.todaySales.toFixed(2)}`}
            icon={DollarSign}
            color="green"
          />
          <StatCard
            label="Today's Orders"
            value={stats.todayOrders.toString()}
            icon={ShoppingCart}
            color="blue"
          />
          <StatCard
            label="Pending Orders"
            value={stats.pendingOrders.toString()}
            icon={Clock}
            color="amber"
          />
          <StatCard
            label="Total Customers"
            value={stats.totalCustomers.toString()}
            icon={Users}
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
              {recentOrders.length > 0 ? recentOrders.map((order) => (
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
              )) : (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No orders yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Low Stock Alert */}
            {lowStockProducts.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  <h3 className="font-semibold text-amber-900">Low Stock Alert</h3>
                </div>
                <div className="space-y-3">
                  {lowStockProducts.map((product) => (
                    <Link
                      key={product.id}
                      to="/admin/products/$productId"
                      params={{ productId: product.id }}
                      className="flex items-center justify-between hover:bg-amber-100/50 -mx-2 px-2 py-1 rounded transition-colors"
                    >
                      <span className="text-sm text-amber-900">{product.name}</span>
                      <span className="text-sm font-medium text-amber-700">
                        {product.stock} left
                      </span>
                    </Link>
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
              <p className="text-3xl font-bold">${stats.monthlyRevenue.toLocaleString()}</p>
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
