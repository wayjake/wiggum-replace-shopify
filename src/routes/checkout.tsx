// 💳 Checkout Page - The final step in the soap journey
// "I'm a Unitard!" - Ralph, excited about completing checkout

import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { ArrowLeft, CreditCard, Lock, Truck, ShoppingBag } from 'lucide-react';
import { cn, formatPrice } from '../utils';

export const Route = createFileRoute('/checkout')({
  head: () => ({
    meta: [
      { title: "Checkout | Karen's Beautiful Soap" },
      {
        name: 'description',
        content: 'Complete your order securely with Stripe. Free shipping on orders over $35.',
      },
    ],
  }),
  component: CheckoutPage,
});

// ═══════════════════════════════════════════════════════════
// SAMPLE CART DATA (in real app, this comes from cart state)
// ═══════════════════════════════════════════════════════════

const CART_ITEMS = [
  {
    id: '1',
    name: 'Lavender Dreams',
    price: 12.00,
    quantity: 2,
    image: 'https://images.unsplash.com/photo-1600857062241-98e5dba7f214?w=100&h=100&fit=crop',
  },
  {
    id: '3',
    name: 'Rose Petal Luxury',
    price: 16.00,
    quantity: 1,
    image: 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=100&h=100&fit=crop',
  },
];

function CheckoutPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const subtotal = CART_ITEMS.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingThreshold = 35;
  const shipping = subtotal >= shippingThreshold ? 0 : 5.99;
  const total = subtotal + shipping;

  const handleCheckout = async () => {
    if (!email) {
      alert('Please enter your email address');
      return;
    }

    setIsLoading(true);

    // In a real app, this would:
    // 1. Call your API to create a Stripe Checkout Session
    // 2. Redirect to Stripe's hosted checkout page
    // 3. After payment, Stripe redirects back to your success page

    // Simulating API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // For demo, just show an alert
    alert('In production, this would redirect to Stripe Checkout!');
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB]">
      {/* Header */}
      <header className="bg-white border-b border-[#F5EBE0]">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#2D5A4A] rounded-full flex items-center justify-center">
                <span className="text-xl">🧼</span>
              </div>
              <span className="text-lg font-bold text-[#1A1A1A] font-display">Karen's Beautiful Soap</span>
            </Link>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Lock className="w-4 h-4" />
              <span>Secure Checkout</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Back Link */}
        <Link
          to="/cart"
          className="inline-flex items-center gap-2 text-[#2D5A4A] font-medium hover:gap-3 transition-all mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Cart
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Checkout Form */}
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A1A] mb-6 font-display">
              Checkout
            </h1>

            {/* Email */}
            <div className="bg-white rounded-xl border border-[#F5EBE0] p-6 mb-6">
              <h2 className="text-lg font-semibold text-[#1A1A1A] mb-4">
                Contact Information
              </h2>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-lg border border-[#F5EBE0] focus:outline-none focus:border-[#2D5A4A] focus:ring-2 focus:ring-[#2D5A4A]/10"
                />
                <p className="text-xs text-gray-500 mt-2">
                  We'll send your order confirmation here.
                </p>
              </div>
            </div>

            {/* Payment Info */}
            <div className="bg-white rounded-xl border border-[#F5EBE0] p-6">
              <h2 className="text-lg font-semibold text-[#1A1A1A] mb-4">
                Payment & Shipping
              </h2>
              <p className="text-gray-600 mb-6">
                You'll be redirected to Stripe's secure checkout page to enter your payment details and shipping address.
              </p>

              <button
                onClick={handleCheckout}
                disabled={isLoading}
                className={cn(
                  'w-full flex items-center justify-center gap-3 py-4 rounded-lg font-medium transition-all',
                  isLoading
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-[#2D5A4A] text-white hover:bg-[#1A1A1A]'
                )}
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    Pay {formatPrice(total)} with Stripe
                  </>
                )}
              </button>

              {/* Trust Badges */}
              <div className="flex items-center justify-center gap-6 mt-6 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  <span>SSL Encrypted</span>
                </div>
                <div className="flex items-center gap-1">
                  <CreditCard className="w-3 h-3" />
                  <span>Secure Payment</span>
                </div>
              </div>
            </div>

            {/* Guest Checkout Note */}
            <div className="mt-6 text-center text-sm text-gray-500">
              <p>
                Already have an account?{' '}
                <Link to="/login" className="text-[#2D5A4A] font-medium hover:underline">
                  Sign in
                </Link>
                {' '}to save your info for future orders.
              </p>
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <div className="bg-white rounded-xl border border-[#F5EBE0] p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-[#1A1A1A] mb-4 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#2D5A4A]" />
                Order Summary
              </h2>

              {/* Items */}
              <div className="space-y-4 mb-6">
                {CART_ITEMS.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="relative">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <span className="absolute -top-2 -right-2 w-5 h-5 bg-[#2D5A4A] text-white text-xs rounded-full flex items-center justify-center">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-[#1A1A1A]">{item.name}</p>
                      <p className="text-sm text-gray-500">
                        {formatPrice(item.price)} each
                      </p>
                    </div>
                    <p className="font-medium text-[#1A1A1A]">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t border-[#F5EBE0] pt-4 space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span className="flex items-center gap-2">
                    <Truck className="w-4 h-4" />
                    Shipping
                  </span>
                  <span className={shipping === 0 ? 'text-green-600 font-medium' : ''}>
                    {shipping === 0 ? 'FREE' : formatPrice(shipping)}
                  </span>
                </div>
                <div className="border-t border-[#F5EBE0] pt-3">
                  <div className="flex justify-between text-lg font-semibold text-[#1A1A1A]">
                    <span>Total</span>
                    <span className="text-[#2D5A4A]">{formatPrice(total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
