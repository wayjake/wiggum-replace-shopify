// 👥 Admin Customers - The soap enthusiast registry
// "I'm learnding!" - Ralph on customer segmentation

import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { Search, Mail, ShoppingBag, Calendar, MoreHorizontal, Star, TrendingUp } from 'lucide-react';
import { cn, formatPrice } from '../../../utils';

export const Route = createFileRoute('/admin/customers/')({
  head: () => ({
    meta: [
      { title: "Customers | Admin | Karen's Beautiful Soap" },
      { name: 'description', content: 'View and manage your customer base.' },
    ],
  }),
  component: AdminCustomers,
});

// ═══════════════════════════════════════════════════════════
// SAMPLE DATA
// ═══════════════════════════════════════════════════════════

const CUSTOMERS = [
  {
    id: '1',
    name: 'Sarah Mitchell',
    email: 'sarah@example.com',
    totalOrders: 8,
    totalSpent: 324.00,
    lastOrder: '2024-01-15T14:30:00Z',
    joinDate: '2023-06-12',
    status: 'active',
    tags: ['VIP', 'Newsletter'],
  },
  {
    id: '2',
    name: 'Michael Thompson',
    email: 'michael@example.com',
    totalOrders: 3,
    totalSpent: 96.00,
    lastOrder: '2024-01-15T10:15:00Z',
    joinDate: '2023-11-20',
    status: 'active',
    tags: ['Newsletter'],
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    email: 'emily@example.com',
    totalOrders: 12,
    totalSpent: 486.00,
    lastOrder: '2024-01-14T16:45:00Z',
    joinDate: '2023-03-08',
    status: 'active',
    tags: ['VIP', 'Wholesale'],
  },
  {
    id: '4',
    name: 'John Davis',
    email: 'john@example.com',
    totalOrders: 1,
    totalSpent: 16.00,
    lastOrder: '2024-01-14T09:20:00Z',
    joinDate: '2024-01-14',
    status: 'new',
    tags: [],
  },
  {
    id: '5',
    name: 'Lisa Chen',
    email: 'lisa@example.com',
    totalOrders: 5,
    totalSpent: 178.00,
    lastOrder: '2023-12-20T11:00:00Z',
    joinDate: '2023-08-15',
    status: 'inactive',
    tags: ['Newsletter'],
  },
];

const CUSTOMER_STATS = {
  total: 142,
  newThisMonth: 18,
  activeRate: 67,
  avgLifetimeValue: 156.00,
};

function AdminCustomers() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'new' | 'inactive'>('all');

  const filteredCustomers = CUSTOMERS.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
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
              <Link to="/admin/orders" className="text-gray-600 hover:text-[#2D5A4A]">Orders</Link>
              <Link to="/admin/customers" className="text-[#2D5A4A] font-medium">Customers</Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-[#1A1A1A] font-display">Customers</h2>
          <p className="text-gray-600">Your community of soap lovers</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-[#F5EBE0] p-5">
            <div className="text-sm text-gray-500 mb-1">Total Customers</div>
            <div className="text-2xl font-bold text-[#1A1A1A]">{CUSTOMER_STATS.total}</div>
          </div>
          <div className="bg-white rounded-xl border border-[#F5EBE0] p-5">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <TrendingUp className="w-4 h-4 text-green-500" />
              New This Month
            </div>
            <div className="text-2xl font-bold text-[#1A1A1A]">{CUSTOMER_STATS.newThisMonth}</div>
          </div>
          <div className="bg-white rounded-xl border border-[#F5EBE0] p-5">
            <div className="text-sm text-gray-500 mb-1">Active Rate</div>
            <div className="text-2xl font-bold text-[#1A1A1A]">{CUSTOMER_STATS.activeRate}%</div>
          </div>
          <div className="bg-white rounded-xl border border-[#F5EBE0] p-5">
            <div className="text-sm text-gray-500 mb-1">Avg. Lifetime Value</div>
            <div className="text-2xl font-bold text-[#1A1A1A]">{formatPrice(CUSTOMER_STATS.avgLifetimeValue)}</div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-[#F5EBE0] focus:outline-none focus:border-[#2D5A4A]"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'active', 'new', 'inactive'] as const).map((status) => (
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

        {/* Customers Table */}
        <div className="bg-white rounded-xl border border-[#F5EBE0] overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#F5EBE0]/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Customer</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Orders</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Total Spent</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Last Order</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Joined</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Tags</th>
                <th className="w-16 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="border-t border-[#F5EBE0] hover:bg-[#FDFCFB]">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#2D5A4A] flex items-center justify-center text-white font-medium">
                        {customer.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-medium text-[#1A1A1A]">{customer.name}</p>
                        <p className="text-sm text-gray-500">{customer.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{customer.totalOrders}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 font-medium">{formatPrice(customer.totalSpent)}</td>
                  <td className="px-4 py-4 text-sm text-gray-500">{formatDate(customer.lastOrder)}</td>
                  <td className="px-4 py-4 text-sm text-gray-500">{formatDate(customer.joinDate)}</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-1">
                      {customer.tags.map((tag) => (
                        <span
                          key={tag}
                          className={cn(
                            'text-xs px-2 py-0.5 rounded-full',
                            tag === 'VIP' ? 'bg-amber-100 text-amber-700' :
                            tag === 'Wholesale' ? 'bg-purple-100 text-purple-700' :
                            'bg-[#F5EBE0] text-gray-600'
                          )}
                        >
                          {tag === 'VIP' && <Star className="w-3 h-3 inline mr-1" />}
                          {tag}
                        </span>
                      ))}
                      {customer.status === 'new' && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                          New
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredCustomers.length === 0 && (
            <div className="text-center py-12">
              <Mail className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No customers found</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
