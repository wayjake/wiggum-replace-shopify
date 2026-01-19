// 💳 Checkout Page - The final step in the soap journey
// "I'm a Unitard!" - Ralph, excited about completing checkout
//
// 🎭 Now featuring EMBEDDED checkout - customers never leave our site!
// Stripe's secure form lives right here, making the experience seamless.
//
// ╭────────────────────────────────────────────────────────────╮
// │  PAYMENT OPTIONS                                            │
// │  • Credit/Debit cards (via Stripe)                          │
// │  • Discount codes (percentage, fixed, free shipping)        │
// │  • Gift cards (partial or full balance)                     │
// ╰────────────────────────────────────────────────────────────╯

import { createFileRoute, Link } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Lock, Truck, ShoppingBag, Loader2, Tag, X, Check, Gift } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from '@stripe/react-stripe-js';
import { formatPrice } from '../utils';
import { createCheckoutSession, CartItem as StripeCartItem } from '../lib/stripe';
import { getRequestHost, getRequest } from '@tanstack/react-start/server';
import { useCart, calculateShipping, calculateTotal, SHIPPING_THRESHOLD } from '../lib/cart';
import { validateCsrfForRequest } from '../lib/csrf.server';
import { useCsrf } from '../lib/csrf-react';
import { validateDiscountCode, calculateDiscount } from '../lib/discounts';
import { validateGiftCard } from '../lib/giftcards';
import { cn } from '../utils';

// ═══════════════════════════════════════════════════════════
// STRIPE PROMISE - Load Stripe.js once
// 🔑 This loads the Stripe library with your publishable key
// ═══════════════════════════════════════════════════════════

// We'll initialize this lazily with the key from env
let stripePromise: Promise<ReturnType<typeof loadStripe>> | null = null;

function getStripePromise() {
  if (!stripePromise) {
    const key = import.meta.env.VITE_STRIPE_PUBLIC_KEY || '';
    if (!key) {
      console.warn('VITE_STRIPE_PUBLIC_KEY is not set');
    }
    stripePromise = loadStripe(key);
  }
  return stripePromise;
}

// ═══════════════════════════════════════════════════════════
// SERVER FUNCTIONS - Creating the embedded checkout session
// "Me fail English? That's unpossible!" - Ralph, on secure payments
// ═══════════════════════════════════════════════════════════

// Validate a discount code
const validateDiscount = createServerFn({ method: 'POST' })
  .handler(async (data: { code: string; subtotal: number; csrfToken?: string }) => {
    const { code, subtotal, csrfToken } = data;

    // CSRF validation
    const request = getRequest();
    const csrfResult = validateCsrfForRequest(request, csrfToken);
    if (!csrfResult.valid) {
      return { valid: false, error: 'Invalid security token' };
    }

    const result = await validateDiscountCode(code, subtotal);
    return result;
  });

// 🎁 Validate a gift card code
const validateGiftCardCode = createServerFn({ method: 'POST' })
  .handler(async (data: { code: string; csrfToken?: string }) => {
    const { code, csrfToken } = data;

    // CSRF validation
    const request = getRequest();
    const csrfResult = validateCsrfForRequest(request, csrfToken);
    if (!csrfResult.valid) {
      return { valid: false, error: 'Invalid security token' };
    }

    const result = await validateGiftCard(code);
    return result;
  });

const createEmbeddedCheckout = createServerFn({ method: 'POST' })
  .handler(async (data: {
    items: StripeCartItem[];
    csrfToken?: string;
    discountCode?: string;
    discountAmount?: number;
    giftCardId?: string;
    giftCardCode?: string;
    giftCardAmount?: number;
  }) => {
    const { items, csrfToken, discountCode, discountAmount, giftCardId, giftCardCode, giftCardAmount } = data;

    // 🛡️ CSRF validation
    const request = getRequest();
    const csrfResult = validateCsrfForRequest(request, csrfToken);
    if (!csrfResult.valid) {
      return { success: false, error: csrfResult.error || 'Invalid security token' };
    }

    if (!items || items.length === 0) {
      return { success: false, error: 'No items provided' };
    }

    try {
      const host = getRequestHost();
      const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
      const origin = `${protocol}://${host}`;

      // 🎭 Create an EMBEDDED checkout session
      // Gift card and discount info stored in metadata for webhook processing
      const session = await createCheckoutSession({
        items,
        returnUrl: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        metadata: {
          source: 'embedded_checkout',
          ...(discountCode && { discountCode }),
          ...(discountAmount && { discountAmount: discountAmount.toString() }),
          ...(giftCardId && { giftCardId }),
          ...(giftCardCode && { giftCardCode }),
          ...(giftCardAmount && { giftCardAmount: giftCardAmount.toString() }),
        },
        embedded: true,
      });

      return {
        success: true,
        clientSecret: session.clientSecret,
      };
    } catch (error) {
      console.error('Stripe checkout error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create checkout session',
      };
    }
  });

// ═══════════════════════════════════════════════════════════
// ROUTE DEFINITION
// ═══════════════════════════════════════════════════════════

export const Route = createFileRoute('/checkout')({
  head: () => ({
    meta: [
      { title: "Checkout | Karen's Beautiful Soap" },
      {
        name: 'description',
        content: 'Complete your order securely. Free shipping on orders over $60.',
      },
    ],
  }),
  component: CheckoutPage,
});

// ═══════════════════════════════════════════════════════════
// CHECKOUT COMPONENT
// 🛒 Now powered by Stripe's Embedded Checkout!
// ═══════════════════════════════════════════════════════════

function CheckoutPage() {
  const { items: cartItems, subtotal, clearCart } = useCart();
  const { token: csrfToken } = useCsrf();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // 🏷️ Discount code state
  const [discountInput, setDiscountInput] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string;
    type: 'percentage' | 'fixed' | 'free_shipping';
    value: number;
    description?: string | null;
    discountAmount: number;
  } | null>(null);
  const [isValidatingDiscount, setIsValidatingDiscount] = useState(false);
  const [discountError, setDiscountError] = useState('');

  // 🎁 Gift card state
  const [giftCardInput, setGiftCardInput] = useState('');
  const [appliedGiftCard, setAppliedGiftCard] = useState<{
    id: string;
    code: string;
    currentBalance: number;
    amountToUse: number;
  } | null>(null);
  const [isValidatingGiftCard, setIsValidatingGiftCard] = useState(false);
  const [giftCardError, setGiftCardError] = useState('');

  // Calculate totals with discount and gift card
  const baseShipping = calculateShipping(subtotal);
  const shipping = appliedDiscount?.type === 'free_shipping' ? 0 : baseShipping;
  const discountAmount = appliedDiscount?.discountAmount || 0;
  const discountedSubtotal = appliedDiscount?.type === 'free_shipping' ? subtotal : subtotal - discountAmount;
  const subtotalAfterDiscount = discountedSubtotal + shipping;
  // Gift card reduces the amount charged to card (but can't exceed total)
  const giftCardAmount = appliedGiftCard
    ? Math.min(appliedGiftCard.amountToUse, subtotalAfterDiscount)
    : 0;
  const total = Math.max(0, subtotalAfterDiscount - giftCardAmount);

  // 🏷️ Apply discount code
  const handleApplyDiscount = async () => {
    if (!discountInput.trim()) return;

    setIsValidatingDiscount(true);
    setDiscountError('');

    try {
      const result = await validateDiscount({
        code: discountInput.trim(),
        subtotal,
        csrfToken: csrfToken || undefined,
      });

      if (!result.valid || !result.discount) {
        setDiscountError(result.error || 'Invalid discount code');
        return;
      }

      // Calculate the actual discount amount
      const discountCalc = calculateDiscount(
        {
          type: result.discount.type,
          value: result.discount.value,
        },
        subtotal,
        baseShipping
      );

      setAppliedDiscount({
        code: result.discount.code,
        type: result.discount.type,
        value: result.discount.value,
        description: result.discount.description,
        discountAmount: discountCalc.discountAmount,
      });
      setDiscountInput('');

      // Reset checkout session to apply new pricing
      setClientSecret(null);
    } catch (err) {
      setDiscountError('Failed to validate code');
    } finally {
      setIsValidatingDiscount(false);
    }
  };

  // Remove discount
  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    setClientSecret(null); // Reset checkout to recalculate
  };

  // 🎁 Apply gift card
  const handleApplyGiftCard = async () => {
    if (!giftCardInput.trim()) return;

    setIsValidatingGiftCard(true);
    setGiftCardError('');

    try {
      const result = await validateGiftCardCode({
        code: giftCardInput.trim(),
        csrfToken: csrfToken || undefined,
      });

      if (!result.valid || !result.giftCard) {
        setGiftCardError(result.error || 'Invalid gift card');
        return;
      }

      // Calculate how much of the gift card to use (up to the remaining total)
      const remainingTotal = subtotalAfterDiscount;
      const amountToUse = Math.min(result.giftCard.currentBalance, remainingTotal);

      setAppliedGiftCard({
        id: result.giftCard.id,
        code: result.giftCard.code,
        currentBalance: result.giftCard.currentBalance,
        amountToUse,
      });
      setGiftCardInput('');

      // Reset checkout session to apply gift card
      setClientSecret(null);
    } catch (err) {
      setGiftCardError('Failed to validate gift card');
    } finally {
      setIsValidatingGiftCard(false);
    }
  };

  // Remove gift card
  const handleRemoveGiftCard = () => {
    setAppliedGiftCard(null);
    setClientSecret(null); // Reset checkout to recalculate
  };

  // 🎯 Fetch client secret when component mounts or cart changes
  const fetchClientSecret = useCallback(async () => {
    if (cartItems.length === 0) return null;

    setIsLoading(true);
    setError('');

    try {
      // Apply discount to items if we have one
      let stripeItems: StripeCartItem[] = cartItems.map((item) => ({
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
      }));

      // If we have a discount, add it as a line item with negative price
      // Note: Stripe Embedded Checkout doesn't support line item discounts directly
      // So we'll pass the discount and gift card info as metadata and handle it in webhooks
      const result = await createEmbeddedCheckout({
        items: stripeItems,
        csrfToken: csrfToken || undefined,
        discountCode: appliedDiscount?.code,
        discountAmount: appliedDiscount?.discountAmount,
        giftCardId: appliedGiftCard?.id,
        giftCardCode: appliedGiftCard?.code,
        giftCardAmount: appliedGiftCard ? giftCardAmount : undefined,
      });

      if (!result.success || !result.clientSecret) {
        setError(result.error || 'Failed to initialize checkout');
        return null;
      }

      return result.clientSecret;
    } catch (err) {
      console.error('Checkout error:', err);
      setError('An unexpected error occurred. Please try again.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [cartItems, csrfToken, appliedDiscount, appliedGiftCard, giftCardAmount]);

  // Initialize checkout session when cart items are available
  useEffect(() => {
    if (cartItems.length > 0 && !clientSecret) {
      fetchClientSecret().then(setClientSecret);
    }
  }, [cartItems, clientSecret, fetchClientSecret]);

  // 🎉 Handle checkout completion - clear cart
  const handleComplete = useCallback(() => {
    clearCart();
  }, [clearCart]);

  // Empty cart state
  if (cartItems.length === 0 && !clientSecret) {
    return (
      <div className="min-h-screen bg-[#FDFCFB]">
        <CheckoutHeader />
        <main className="max-w-4xl mx-auto px-6 py-16">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-6 bg-[#F5EBE0] rounded-full flex items-center justify-center">
              <ShoppingBag className="w-12 h-12 text-[#D4A574]" />
            </div>
            <h1 className="text-2xl font-bold text-[#1A1A1A] mb-4 font-display">
              Your cart is empty
            </h1>
            <p className="text-gray-600 mb-8">
              Add some beautiful soaps before checking out!
            </p>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 bg-[#2D5A4A] text-white px-6 py-3 rounded-lg hover:bg-[#1A1A1A] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Browse Shop
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCFB]">
      <CheckoutHeader />

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Back Link */}
        <Link
          to="/cart"
          className="inline-flex items-center gap-2 text-[#2D5A4A] font-medium hover:gap-3 transition-all mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Cart
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Embedded Checkout Form */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-[#F5EBE0] p-6 min-h-[500px]">
              <h1 className="text-2xl font-bold text-[#1A1A1A] mb-6 font-display">
                Checkout
              </h1>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
                  {error}
                  <button
                    onClick={() => fetchClientSecret().then(setClientSecret)}
                    className="ml-4 underline font-medium"
                  >
                    Try again
                  </button>
                </div>
              )}

              {/* Loading State */}
              {isLoading && (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-[#2D5A4A]" />
                  <span className="ml-3 text-gray-600">Preparing secure checkout...</span>
                </div>
              )}

              {/* 🎭 Stripe Embedded Checkout */}
              {clientSecret && !isLoading && (
                <div id="checkout">
                  <EmbeddedCheckoutProvider
                    stripe={getStripePromise()}
                    options={{
                      clientSecret,
                      onComplete: handleComplete,
                    }}
                  >
                    <EmbeddedCheckout />
                  </EmbeddedCheckoutProvider>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-[#F5EBE0] p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-[#1A1A1A] mb-4 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#2D5A4A]" />
                Order Summary
              </h2>

              {/* Items */}
              <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="relative">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-14 h-14 rounded-lg object-cover"
                      />
                      <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#2D5A4A] text-white text-xs rounded-full flex items-center justify-center">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[#1A1A1A] text-sm truncate">{item.name}</p>
                      <p className="text-xs text-gray-500">
                        {formatPrice(item.price)} each
                      </p>
                    </div>
                    <p className="font-medium text-[#1A1A1A] text-sm">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              {/* 🏷️ Discount Code Input */}
              <div className="border-t border-[#F5EBE0] pt-4 mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Code
                </label>
                {appliedDiscount ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-green-700">{appliedDiscount.code}</span>
                      <span className="text-xs text-green-600">
                        {appliedDiscount.type === 'percentage'
                          ? `${appliedDiscount.value}% off`
                          : appliedDiscount.type === 'free_shipping'
                          ? 'Free shipping'
                          : `$${appliedDiscount.value} off`}
                      </span>
                    </div>
                    <button
                      onClick={handleRemoveDiscount}
                      className="text-gray-400 hover:text-red-500"
                      title="Remove discount"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={discountInput}
                        onChange={(e) => setDiscountInput(e.target.value.toUpperCase())}
                        placeholder="Enter code"
                        className="w-full pl-9 pr-3 py-2 border border-[#F5EBE0] rounded-lg text-sm focus:outline-none focus:border-[#2D5A4A]"
                        onKeyDown={(e) => e.key === 'Enter' && handleApplyDiscount()}
                      />
                    </div>
                    <button
                      onClick={handleApplyDiscount}
                      disabled={isValidatingDiscount || !discountInput.trim()}
                      className={cn(
                        'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                        isValidatingDiscount || !discountInput.trim()
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-[#2D5A4A] text-white hover:bg-[#1A1A1A]'
                      )}
                    >
                      {isValidatingDiscount ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Apply'
                      )}
                    </button>
                  </div>
                )}
                {discountError && (
                  <p className="text-xs text-red-500 mt-1">{discountError}</p>
                )}
              </div>

              {/* 🎁 Gift Card Input */}
              <div className="border-t border-[#F5EBE0] pt-4 mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gift Card
                </label>
                {appliedGiftCard ? (
                  <div className="flex items-center justify-between bg-purple-50 border border-purple-200 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Gift className="w-4 h-4 text-purple-600" />
                      <div>
                        <span className="font-medium text-purple-700 text-sm">{appliedGiftCard.code}</span>
                        <p className="text-xs text-purple-600">
                          Using {formatPrice(giftCardAmount)} of {formatPrice(appliedGiftCard.currentBalance)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleRemoveGiftCard}
                      className="text-gray-400 hover:text-red-500"
                      title="Remove gift card"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Gift className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={giftCardInput}
                        onChange={(e) => setGiftCardInput(e.target.value.toUpperCase())}
                        placeholder="SOAP-XXXX-XXXX-XXXX"
                        className="w-full pl-9 pr-3 py-2 border border-[#F5EBE0] rounded-lg text-sm focus:outline-none focus:border-[#2D5A4A] font-mono text-xs"
                        onKeyDown={(e) => e.key === 'Enter' && handleApplyGiftCard()}
                      />
                    </div>
                    <button
                      onClick={handleApplyGiftCard}
                      disabled={isValidatingGiftCard || !giftCardInput.trim()}
                      className={cn(
                        'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                        isValidatingGiftCard || !giftCardInput.trim()
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-[#2D5A4A] text-white hover:bg-[#1A1A1A]'
                      )}
                    >
                      {isValidatingGiftCard ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Apply'
                      )}
                    </button>
                  </div>
                )}
                {giftCardError && (
                  <p className="text-xs text-red-500 mt-1">{giftCardError}</p>
                )}
              </div>

              {/* Totals */}
              <div className="border-t border-[#F5EBE0] pt-4 space-y-3">
                <div className="flex justify-between text-gray-600 text-sm">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                {appliedDiscount && appliedDiscount.type !== 'free_shipping' && (
                  <div className="flex justify-between text-green-600 text-sm">
                    <span className="flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      Discount ({appliedDiscount.code})
                    </span>
                    <span>-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600 text-sm">
                  <span className="flex items-center gap-2">
                    <Truck className="w-4 h-4" />
                    Shipping
                  </span>
                  <span className={shipping === 0 ? 'text-green-600 font-medium' : ''}>
                    {shipping === 0 ? 'FREE' : formatPrice(shipping)}
                    {appliedDiscount?.type === 'free_shipping' && (
                      <span className="ml-1 text-xs">(discount applied)</span>
                    )}
                  </span>
                </div>
                {appliedGiftCard && giftCardAmount > 0 && (
                  <div className="flex justify-between text-purple-600 text-sm">
                    <span className="flex items-center gap-2">
                      <Gift className="w-4 h-4" />
                      Gift Card
                    </span>
                    <span>-{formatPrice(giftCardAmount)}</span>
                  </div>
                )}
                <div className="border-t border-[#F5EBE0] pt-3">
                  <div className="flex justify-between text-lg font-semibold text-[#1A1A1A]">
                    <span>Total</span>
                    <span className="text-[#2D5A4A]">{formatPrice(total)}</span>
                  </div>
                  {total === 0 && appliedGiftCard && (
                    <p className="text-xs text-purple-600 mt-1 text-right font-medium">
                      ✨ Fully covered by gift card!
                    </p>
                  )}
                  {(appliedDiscount || appliedGiftCard) && total > 0 && (
                    <p className="text-xs text-green-600 mt-1 text-right">
                      You're saving {formatPrice(discountAmount + giftCardAmount + (appliedDiscount?.type === 'free_shipping' ? baseShipping : 0))}!
                    </p>
                  )}
                </div>
              </div>

              {/* Free Shipping Progress */}
              {subtotal < SHIPPING_THRESHOLD && (
                <div className="mt-4 bg-[#F5EBE0] rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-2">
                    Add <span className="font-semibold text-[#2D5A4A]">{formatPrice(SHIPPING_THRESHOLD - subtotal)}</span> more for free shipping!
                  </p>
                  <div className="h-1.5 bg-white rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#2D5A4A] transition-all duration-500"
                      style={{ width: `${Math.min(100, (subtotal / SHIPPING_THRESHOLD) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Trust Badges */}
              <div className="border-t border-[#F5EBE0] mt-6 pt-6">
                <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    <span>SSL Encrypted</span>
                  </div>
                  <span className="text-gray-300">•</span>
                  <div className="flex items-center gap-1">
                    <span>Powered by Stripe</span>
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

// ═══════════════════════════════════════════════════════════
// HEADER COMPONENT
// ═══════════════════════════════════════════════════════════

function CheckoutHeader() {
  return (
    <header className="bg-white border-b border-[#F5EBE0]">
      <div className="max-w-6xl mx-auto px-6 py-4">
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
  );
}
