// 🏷️ Admin Discount Codes - The coupon command center
// "I'm learnding!" - Ralph, creating discount codes
//
// ╭────────────────────────────────────────────────────────────╮
// │  DISCOUNT CODE MANAGEMENT                                   │
// │  • Create percentage, fixed, or free shipping discounts    │
// │  • Set usage limits and date ranges                         │
// │  • Track usage statistics                                   │
// │  • Enable/disable codes on the fly                         │
// ╰────────────────────────────────────────────────────────────╯

import { createFileRoute, Link } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { useState } from 'react';
import {
  Plus,
  Tag,
  Percent,
  DollarSign,
  Truck,
  Calendar,
  Users,
  Trash2,
  Edit2,
  Check,
  X,
  ToggleLeft,
  ToggleRight,
  Copy,
} from 'lucide-react';
import { cn, formatPrice } from '../../utils';
import { requireAdmin } from '../../lib/auth-guards';
import { getDb, discountCodes } from '../../db';
import { eq, desc } from 'drizzle-orm';

// ═══════════════════════════════════════════════════════════
// SERVER FUNCTIONS
// ═══════════════════════════════════════════════════════════

const getDiscountCodes = createServerFn({ method: 'GET' }).handler(async () => {
  const db = getDb();
  const codes = await db
    .select()
    .from(discountCodes)
    .orderBy(desc(discountCodes.createdAt));
  return codes;
});

const createDiscountCode = createServerFn({ method: 'POST' }).handler(
  async (data: {
    code: string;
    description?: string;
    type: 'percentage' | 'fixed' | 'free_shipping';
    value: number;
    minOrderAmount?: number;
    maxDiscountAmount?: number;
    maxUses?: number;
    maxUsesPerCustomer?: number;
    startsAt?: string;
    expiresAt?: string;
  }) => {
    const db = getDb();

    // Check if code already exists
    const existing = await db.query.discountCodes.findFirst({
      where: eq(discountCodes.code, data.code.toUpperCase().trim()),
    });

    if (existing) {
      return { success: false, error: 'A discount code with this name already exists' };
    }

    try {
      await db.insert(discountCodes).values({
        code: data.code.toUpperCase().trim(),
        description: data.description || null,
        type: data.type,
        value: data.value,
        minOrderAmount: data.minOrderAmount || null,
        maxDiscountAmount: data.maxDiscountAmount || null,
        maxUses: data.maxUses || null,
        maxUsesPerCustomer: data.maxUsesPerCustomer ?? 1,
        startsAt: data.startsAt ? new Date(data.startsAt) : null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        active: true,
      });

      return { success: true };
    } catch (error) {
      console.error('Failed to create discount code:', error);
      return { success: false, error: 'Failed to create discount code' };
    }
  }
);

const toggleDiscountCode = createServerFn({ method: 'POST' }).handler(
  async (data: { id: string; active: boolean }) => {
    const db = getDb();
    await db
      .update(discountCodes)
      .set({ active: data.active, updatedAt: new Date() })
      .where(eq(discountCodes.id, data.id));
    return { success: true };
  }
);

const deleteDiscountCode = createServerFn({ method: 'POST' }).handler(
  async (data: { id: string }) => {
    const db = getDb();
    await db.delete(discountCodes).where(eq(discountCodes.id, data.id));
    return { success: true };
  }
);

// ═══════════════════════════════════════════════════════════
// ROUTE DEFINITION
// ═══════════════════════════════════════════════════════════

export const Route = createFileRoute('/admin/discounts')({
  head: () => ({
    meta: [
      { title: "Discount Codes | Admin | Karen's Beautiful Soap" },
      { name: 'description', content: 'Manage discount codes and coupons.' },
    ],
  }),
  loader: async () => {
    const [authResult, codes] = await Promise.all([
      requireAdmin(),
      getDiscountCodes(),
    ]);
    return { authResult, codes };
  },
  component: DiscountCodesPage,
});

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════

function DiscountCodesPage() {
  const { codes: initialCodes } = Route.useLoaderData();
  const [codes, setCodes] = useState(initialCodes);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    type: 'percentage' as 'percentage' | 'fixed' | 'free_shipping',
    value: '',
    minOrderAmount: '',
    maxDiscountAmount: '',
    maxUses: '',
    maxUsesPerCustomer: '1',
    startsAt: '',
    expiresAt: '',
  });

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      type: 'percentage',
      value: '',
      minOrderAmount: '',
      maxDiscountAmount: '',
      maxUses: '',
      maxUsesPerCustomer: '1',
      startsAt: '',
      expiresAt: '',
    });
    setCreateError('');
  };

  const handleCreate = async () => {
    if (!formData.code.trim()) {
      setCreateError('Code is required');
      return;
    }

    if (formData.type !== 'free_shipping' && !formData.value) {
      setCreateError('Value is required');
      return;
    }

    setIsCreating(true);
    setCreateError('');

    try {
      const result = await createDiscountCode({
        code: formData.code,
        description: formData.description || undefined,
        type: formData.type,
        value: parseFloat(formData.value) || 0,
        minOrderAmount: formData.minOrderAmount ? parseFloat(formData.minOrderAmount) : undefined,
        maxDiscountAmount: formData.maxDiscountAmount ? parseFloat(formData.maxDiscountAmount) : undefined,
        maxUses: formData.maxUses ? parseInt(formData.maxUses) : undefined,
        maxUsesPerCustomer: formData.maxUsesPerCustomer ? parseInt(formData.maxUsesPerCustomer) : undefined,
        startsAt: formData.startsAt || undefined,
        expiresAt: formData.expiresAt || undefined,
      });

      if (!result.success) {
        setCreateError(result.error || 'Failed to create discount code');
        return;
      }

      // Refresh codes
      const newCodes = await getDiscountCodes();
      setCodes(newCodes);
      setShowCreateModal(false);
      resetForm();
    } catch (error) {
      setCreateError('An error occurred');
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggle = async (id: string, currentActive: boolean) => {
    await toggleDiscountCode({ id, active: !currentActive });
    setCodes(codes.map(c => c.id === id ? { ...c, active: !currentActive } : c));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this discount code?')) return;
    await deleteDiscountCode({ id });
    setCodes(codes.filter(c => c.id !== id));
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'percentage': return <Percent className="w-4 h-4" />;
      case 'fixed': return <DollarSign className="w-4 h-4" />;
      case 'free_shipping': return <Truck className="w-4 h-4" />;
      default: return <Tag className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string, value: number) => {
    switch (type) {
      case 'percentage': return `${value}% off`;
      case 'fixed': return `$${value} off`;
      case 'free_shipping': return 'Free shipping';
      default: return type;
    }
  };

  const isExpired = (expiresAt: Date | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const isNotStarted = (startsAt: Date | null) => {
    if (!startsAt) return false;
    return new Date(startsAt) > new Date();
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
              <Link to="/admin/discounts" className="text-[#2D5A4A] font-medium">Discounts</Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A1A] font-display flex items-center gap-3">
              <Tag className="w-7 h-7 text-[#2D5A4A]" />
              Discount Codes
            </h1>
            <p className="text-gray-500 mt-1">Create and manage promotional codes</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-[#2D5A4A] text-white px-4 py-2 rounded-lg hover:bg-[#1A1A1A] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Code
          </button>
        </div>

        {/* Codes Table */}
        {codes.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#F5EBE0] p-12 text-center">
            <Tag className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2">No discount codes yet</h3>
            <p className="text-gray-500 mb-6">Create your first discount code to start offering promotions</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 bg-[#2D5A4A] text-white px-4 py-2 rounded-lg hover:bg-[#1A1A1A] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Code
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-[#F5EBE0] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#F5EBE0] bg-[#F5EBE0]/30">
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Code</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Type</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Usage</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Valid Period</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Status</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {codes.map((code) => (
                  <tr key={code.id} className="border-b border-[#F5EBE0] last:border-0 hover:bg-[#F5EBE0]/10">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-[#2D5A4A]">{code.code}</span>
                        <button
                          onClick={() => copyCode(code.code)}
                          className="p-1 text-gray-400 hover:text-[#2D5A4A]"
                          title="Copy code"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {code.description && (
                        <p className="text-xs text-gray-500 mt-1">{code.description}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(code.type)}
                        <span className="text-sm">{getTypeLabel(code.type, code.value)}</span>
                      </div>
                      {code.minOrderAmount && (
                        <p className="text-xs text-gray-500 mt-1">Min: ${code.minOrderAmount}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span>{code.usedCount || 0}</span>
                        {code.maxUses && <span className="text-gray-400">/ {code.maxUses}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {code.startsAt || code.expiresAt ? (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>
                            {code.startsAt && new Date(code.startsAt).toLocaleDateString()}
                            {code.startsAt && code.expiresAt && ' - '}
                            {code.expiresAt && new Date(code.expiresAt).toLocaleDateString()}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">No limit</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {isExpired(code.expiresAt) ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                          Expired
                        </span>
                      ) : isNotStarted(code.startsAt) ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">
                          Scheduled
                        </span>
                      ) : code.active ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                          <Check className="w-3 h-3" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                          <X className="w-3 h-3" />
                          Disabled
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggle(code.id, code.active)}
                          className={cn(
                            'p-2 rounded-lg transition-colors',
                            code.active
                              ? 'text-green-600 hover:bg-green-50'
                              : 'text-gray-400 hover:bg-gray-50'
                          )}
                          title={code.active ? 'Disable' : 'Enable'}
                        >
                          {code.active ? (
                            <ToggleRight className="w-5 h-5" />
                          ) : (
                            <ToggleLeft className="w-5 h-5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(code.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[#1A1A1A] font-display">Create Discount Code</h2>
              <button
                onClick={() => { setShowCreateModal(false); resetForm(); }}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
                {createError}
              </div>
            )}

            <div className="space-y-4">
              {/* Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Code *
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="SOAP20"
                  className="w-full px-4 py-2 rounded-lg border border-[#F5EBE0] focus:outline-none focus:border-[#2D5A4A] font-mono"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Summer sale promotion"
                  className="w-full px-4 py-2 rounded-lg border border-[#F5EBE0] focus:outline-none focus:border-[#2D5A4A]"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount Type *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'percentage', label: 'Percentage', icon: Percent },
                    { value: 'fixed', label: 'Fixed Amount', icon: DollarSign },
                    { value: 'free_shipping', label: 'Free Shipping', icon: Truck },
                  ].map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFormData({ ...formData, type: value as any })}
                      className={cn(
                        'flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-colors',
                        formData.type === value
                          ? 'border-[#2D5A4A] bg-[#2D5A4A]/5'
                          : 'border-[#F5EBE0] hover:border-[#D4A574]'
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-xs">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Value */}
              {formData.type !== 'free_shipping' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {formData.type === 'percentage' ? 'Percentage Off *' : 'Amount Off ($) *'}
                  </label>
                  <input
                    type="number"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    placeholder={formData.type === 'percentage' ? '20' : '5.00'}
                    min="0"
                    max={formData.type === 'percentage' ? '100' : undefined}
                    step={formData.type === 'percentage' ? '1' : '0.01'}
                    className="w-full px-4 py-2 rounded-lg border border-[#F5EBE0] focus:outline-none focus:border-[#2D5A4A]"
                  />
                </div>
              )}

              {/* Min Order Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Order Amount ($)
                </label>
                <input
                  type="number"
                  value={formData.minOrderAmount}
                  onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                  placeholder="Optional"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 rounded-lg border border-[#F5EBE0] focus:outline-none focus:border-[#2D5A4A]"
                />
              </div>

              {/* Max Discount (for percentage) */}
              {formData.type === 'percentage' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Maximum Discount Amount ($)
                  </label>
                  <input
                    type="number"
                    value={formData.maxDiscountAmount}
                    onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                    placeholder="Optional cap"
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 rounded-lg border border-[#F5EBE0] focus:outline-none focus:border-[#2D5A4A]"
                  />
                </div>
              )}

              {/* Usage Limits */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Uses
                  </label>
                  <input
                    type="number"
                    value={formData.maxUses}
                    onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                    placeholder="Unlimited"
                    min="1"
                    className="w-full px-4 py-2 rounded-lg border border-[#F5EBE0] focus:outline-none focus:border-[#2D5A4A]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Uses Per Customer
                  </label>
                  <input
                    type="number"
                    value={formData.maxUsesPerCustomer}
                    onChange={(e) => setFormData({ ...formData, maxUsesPerCustomer: e.target.value })}
                    placeholder="1"
                    min="1"
                    className="w-full px-4 py-2 rounded-lg border border-[#F5EBE0] focus:outline-none focus:border-[#2D5A4A]"
                  />
                </div>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startsAt}
                    onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-[#F5EBE0] focus:outline-none focus:border-[#2D5A4A]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-[#F5EBE0] focus:outline-none focus:border-[#2D5A4A]"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-[#F5EBE0]">
              <button
                onClick={() => { setShowCreateModal(false); resetForm(); }}
                className="px-4 py-2 border border-[#F5EBE0] rounded-lg text-gray-600 hover:bg-[#F5EBE0] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={isCreating}
                className="flex items-center gap-2 px-4 py-2 bg-[#2D5A4A] text-white rounded-lg hover:bg-[#1A1A1A] transition-colors disabled:opacity-50"
              >
                {isCreating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Create Code
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
