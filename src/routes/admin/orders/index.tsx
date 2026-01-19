// 📋 Admin Orders - The fulfillment command center
// "Tastes like burning!" - Ralph when orders pile up

import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { Search, Filter, Package, Truck, CheckCircle, Clock, XCircle, Eye } from 'lucide-react';
import { cn, formatPrice } from '../../../utils';
import { requireAdmin } from '../../../lib/auth-guards';

export const Route = createFileRoute('/admin/orders/')({
  head: () => ({
    meta: [
      { title: "Orders | Admin | Karen's Beautiful Soap" },
      { name: 'description', content: 'Manage customer orders and fulfillment.' },
    ],
  }),
  loader: async () => {
    return await requireAdmin();
  },
  component: AdminOrders,
});

// ═══════════════════════════════════════════════════════════
// SAMPLE DATA
// ═══════════════════════════════════════════════════════════

const ORDERS = [
  {
    id: 'KS-20240115-001',
    customer: { name: 'Sarah Mitchell', email: 'sarah@example.com' },
    items: 3,
    total: 40.00,
    status: 'paid',
    date: '2024-01-15T14:30:00Z',
    shippingAddress: '123 Main St, Portland, OR 97201',
  },
  {
    id: 'KS-20240115-002',
    customer: { name: 'Michael Thompson', email: 'michael@example.com' },
    items: 2,
    total: 28.00,
    status: 'shipped',
    date: '2024-01-15T10:15:00Z',
    shippingAddress: '456 Oak Ave, Seattle, WA 98101',
    trackingNumber: '1Z999AA10123456784',
  },
  {
    id: 'KS-20240114-003',
    customer: { name: 'Emily Rodriguez', email: 'emily@example.com' },
    items: 4,
    total: 52.00,
    status: 'delivered',
    date: '2024-01-14T16:45:00Z',
    shippingAddress: '789 Pine St, San Francisco, CA 94102',
    trackingNumber: '1Z999AA10123456785',
  },
  {
    id: 'KS-20240114-004',
    customer: { name: 'John Davis', email: 'john@example.com' },
    items: 1,
    total: 16.00,
    status: 'processing',
    date: '2024-01-14T09:20:00Z',
    shippingAddress: '321 Elm Rd, Denver, CO 80201',
  },
  {
    id: 'KS-20240113-005',
    customer: { name: 'Lisa Chen', email: 'lisa@example.com' },
    items: 2,
    total: 26.00,
    status: 'cancelled',
    date: '2024-01-13T11:00:00Z',
    shippingAddress: '654 Maple Dr, Austin, TX 78701',
  },
];

const STATUS_OPTIONS = ['all', 'processing', 'paid', 'shipped', 'delivered', 'cancelled'];

function AdminOrders() {
  const navigate = useNavigate();
  const authResult = Route.useLoaderData();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

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

  const filteredOrders = ORDERS.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-[#1A1A1A] font-display">Orders</h2>
          <p className="text-gray-600">Manage and fulfill customer orders</p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order #, customer, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-[#F5EBE0] focus:outline-none focus:border-[#2D5A4A]"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            {STATUS_OPTIONS.map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm font-medium transition-all capitalize',
                  statusFilter === status
                    ? 'bg-[#2D5A4A] text-white'
                    : 'bg-[#F5EBE0] text-gray-600 hover:bg-[#D4A574] hover:text-white'
                )}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        <div className="bg-white rounded-xl border border-[#F5EBE0] overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#F5EBE0]/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Order</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Customer</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Items</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Total</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Date</th>
                <th className="w-20 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} className="border-t border-[#F5EBE0] hover:bg-[#FDFCFB]">
                  <td className="px-4 py-4">
                    <p className="font-medium text-[#1A1A1A]">{order.id}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-medium text-[#1A1A1A]">{order.customer.name}</p>
                    <p className="text-sm text-gray-500">{order.customer.email}</p>
                  </td>
                  <td className="px-4 py-4 text-gray-600">{order.items} items</td>
                  <td className="px-4 py-4 font-medium">{formatPrice(order.total)}</td>
                  <td className="px-4 py-4">
                    <OrderStatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500">{formatDate(order.date)}</td>
                  <td className="px-4 py-4">
                    <Link
                      to="/admin/orders/$orderId"
                      params={{ orderId: order.id }}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm text-[#2D5A4A] hover:bg-[#F5EBE0] rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredOrders.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No orders found</p>
            </div>
          )}
        </div>
      </main>
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
    <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full capitalize ${bg} ${text}`}>
      <Icon className="w-3.5 h-3.5" />
      {status}
    </span>
  );
}
