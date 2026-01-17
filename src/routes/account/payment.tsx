// 💳 Payment Methods - Your soap funding sources
// "Go banana!" - Ralph on credit card management

import { createFileRoute, Link } from '@tanstack/react-router';
import { CreditCard, Plus, ChevronRight, Trash2, Star, Check } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../utils';

export const Route = createFileRoute('/account/payment')({
  head: () => ({
    meta: [
      { title: "Payment Methods | My Account | Karen's Beautiful Soap" },
      { name: 'description', content: 'Manage your saved payment methods.' },
    ],
  }),
  component: PaymentMethods,
});

// ═══════════════════════════════════════════════════════════
// SAMPLE DATA
// ═══════════════════════════════════════════════════════════

const PAYMENT_METHODS = [
  {
    id: '1',
    type: 'card',
    brand: 'Visa',
    last4: '4242',
    expMonth: 12,
    expYear: 2025,
    isDefault: true,
  },
  {
    id: '2',
    type: 'card',
    brand: 'Mastercard',
    last4: '5555',
    expMonth: 8,
    expYear: 2026,
    isDefault: false,
  },
];

function PaymentMethods() {
  const [methods, setMethods] = useState(PAYMENT_METHODS);
  const [showAddCard, setShowAddCard] = useState(false);

  const setDefaultMethod = (id: string) => {
    setMethods(methods.map(m => ({ ...m, isDefault: m.id === id })));
  };

  const deleteMethod = (id: string) => {
    setMethods(methods.filter(m => m.id !== id));
  };

  const getCardIcon = (brand: string) => {
    // In a real app, you'd use actual card brand icons
    return <CreditCard className="w-8 h-8" />;
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

      <main className="max-w-2xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link to="/account" className="hover:text-[#2D5A4A]">My Account</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-[#1A1A1A]">Payment Methods</span>
        </nav>

        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A1A] font-display">Payment Methods</h1>
            <p className="text-gray-600">Manage your saved cards and billing info</p>
          </div>
          <button
            onClick={() => setShowAddCard(true)}
            className="flex items-center gap-2 bg-[#2D5A4A] text-white px-4 py-2 rounded-lg hover:bg-[#1A1A1A] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Card
          </button>
        </div>

        {/* Payment Methods List */}
        <div className="space-y-4">
          {methods.map((method) => (
            <div
              key={method.id}
              className={cn(
                'bg-white rounded-xl border-2 p-6 transition-all',
                method.isDefault ? 'border-[#2D5A4A]' : 'border-[#F5EBE0]'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-10 bg-gradient-to-br from-gray-700 to-gray-900 rounded-lg flex items-center justify-center text-white">
                    {getCardIcon(method.brand)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-[#1A1A1A]">
                        {method.brand} •••• {method.last4}
                      </p>
                      {method.isDefault && (
                        <span className="flex items-center gap-1 text-xs bg-[#2D5A4A] text-white px-2 py-0.5 rounded-full">
                          <Star className="w-3 h-3" />
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      Expires {method.expMonth.toString().padStart(2, '0')}/{method.expYear}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!method.isDefault && (
                    <button
                      onClick={() => setDefaultMethod(method.id)}
                      className="text-sm text-[#2D5A4A] hover:underline"
                    >
                      Set as default
                    </button>
                  )}
                  <button
                    onClick={() => deleteMethod(method.id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {methods.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl border border-[#F5EBE0]">
            <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2 font-display">No payment methods</h3>
            <p className="text-gray-500 mb-6">Add a card to speed up checkout</p>
            <button
              onClick={() => setShowAddCard(true)}
              className="inline-flex items-center gap-2 bg-[#2D5A4A] text-white px-6 py-3 rounded-lg hover:bg-[#1A1A1A] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Your First Card
            </button>
          </div>
        )}

        {/* Add Card Modal */}
        {showAddCard && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-6">
              <h2 className="text-xl font-bold text-[#1A1A1A] mb-6 font-display">Add Payment Method</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Card Number</label>
                  <input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    className="w-full px-4 py-3 rounded-lg border border-[#F5EBE0] focus:outline-none focus:border-[#2D5A4A]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Expiry</label>
                    <input
                      type="text"
                      placeholder="MM / YY"
                      className="w-full px-4 py-3 rounded-lg border border-[#F5EBE0] focus:outline-none focus:border-[#2D5A4A]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">CVC</label>
                    <input
                      type="text"
                      placeholder="123"
                      className="w-full px-4 py-3 rounded-lg border border-[#F5EBE0] focus:outline-none focus:border-[#2D5A4A]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name on Card</label>
                  <input
                    type="text"
                    placeholder="Sarah Mitchell"
                    className="w-full px-4 py-3 rounded-lg border border-[#F5EBE0] focus:outline-none focus:border-[#2D5A4A]"
                  />
                </div>
                <label className="flex items-center gap-3">
                  <input type="checkbox" className="rounded border-gray-300 text-[#2D5A4A]" />
                  <span className="text-sm text-gray-600">Set as default payment method</span>
                </label>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddCard(false)}
                  className="flex-1 py-3 rounded-lg border border-[#F5EBE0] text-gray-600 hover:bg-[#F5EBE0] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowAddCard(false)}
                  className="flex-1 py-3 rounded-lg bg-[#2D5A4A] text-white hover:bg-[#1A1A1A] transition-colors"
                >
                  Add Card
                </button>
              </div>
              <p className="text-xs text-gray-500 text-center mt-4">
                Your payment info is securely processed by Stripe
              </p>
            </div>
          </div>
        )}

        {/* Security Note */}
        <div className="mt-8 p-4 bg-[#F5EBE0] rounded-lg">
          <div className="flex items-start gap-3">
            <Check className="w-5 h-5 text-[#2D5A4A] mt-0.5" />
            <div>
              <p className="font-medium text-[#1A1A1A]">Your payment information is secure</p>
              <p className="text-sm text-gray-600">
                We use Stripe to securely process and store your payment details. We never see or store your full card number.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
