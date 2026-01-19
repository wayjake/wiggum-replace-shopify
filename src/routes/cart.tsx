// 🛒 Shopping Cart - Where soap dreams accumulate
// "I bent my wookiee!" - Ralph when the cart breaks (it won't!)

import { createFileRoute, Link } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { useEffect, useRef } from 'react';
import { ArrowLeft, Minus, Plus, Trash2, ShoppingBag, CreditCard, Truck } from 'lucide-react';
import { cn, formatPrice } from '../utils';
import {
  useCart,
  calculateShipping,
  calculateTotal,
  SHIPPING_THRESHOLD,
  type CartItem,
} from '../lib/cart';
import { getSession } from '../lib/auth-guards';
import { sendEvent } from '../lib/inngest';

// ═══════════════════════════════════════════════════════════
// SERVER FUNCTION - Trigger abandoned cart event
// ═══════════════════════════════════════════════════════════

const triggerAbandonedCart = createServerFn({ method: 'POST' })
  .handler(async (data: {
    items: Array<{
      productName: string;
      quantity: number;
      price: number;
      imageUrl?: string;
    }>;
    cartTotal: number;
  }) => {
    // Get user session to get email
    const session = await getSession();

    if (!session?.email) {
      // No logged in user - can't send abandoned cart email
      return { sent: false, reason: 'no_email' };
    }

    try {
      await sendEvent('shop/cart.abandoned', {
        email: session.email,
        firstName: session.firstName,
        items: data.items,
        cartTotal: data.cartTotal,
        cartUrl: `${process.env.APP_URL || ''}/cart`,
      });
      return { sent: true };
    } catch (error) {
      console.error('Failed to send abandoned cart event:', error);
      return { sent: false, reason: 'inngest_error' };
    }
  });

export const Route = createFileRoute('/cart')({
  head: () => ({
    meta: [
      { title: "Shopping Cart | Karen's Beautiful Soap" },
      {
        name: 'description',
        content: "Review your cart and checkout. Free shipping on orders over $60.",
      },
    ],
  }),
  component: CartPage,
});

// ═══════════════════════════════════════════════════════════
// COMPONENT
// "My cat's breath smells like cat food!" - Ralph on cart management
// ═══════════════════════════════════════════════════════════

function CartPage() {
  const { items: cartItems, subtotal, updateQuantity, removeItem } = useCart();
  const abandonedCartSent = useRef(false);

  const shipping = calculateShipping(subtotal);
  const total = calculateTotal(subtotal);

  // 🛒 Abandoned cart detection
  // When user leaves with items in cart, trigger the abandoned cart workflow
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Don't trigger if cart is empty or we already sent an event
      if (cartItems.length === 0 || abandonedCartSent.current) return;

      // Use sendBeacon for reliability during page unload
      const items = cartItems.map((item) => ({
        productName: item.name,
        quantity: item.quantity,
        price: item.price,
        imageUrl: item.imageUrl,
      }));

      // Mark as sent to avoid duplicates
      abandonedCartSent.current = true;

      // Fire and forget - use sendBeacon for unload events
      // Note: In production, you'd want a dedicated API endpoint for this
      triggerAbandonedCart({ items, cartTotal: total }).catch(() => {
        // Reset if failed so it can try again
        abandonedCartSent.current = false;
      });
    };

    // Listen for page visibility change (tab close/switch)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && cartItems.length > 0) {
        handleBeforeUnload();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [cartItems, total]);

  return (
    <div className="min-h-screen bg-[#FDFCFB]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#F5EBE0]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <nav className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#2D5A4A] rounded-full flex items-center justify-center">
                <span className="text-xl">🧼</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-[#1A1A1A] font-display">Karen's Beautiful Soap</h1>
                <p className="text-xs text-gray-500">Handcrafted with love</p>
              </div>
            </Link>
            <Link to="/shop" className="text-[#2D5A4A] font-medium hover:underline">
              Continue Shopping
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-8 font-display">
          Your Cart
        </h1>

        {cartItems.length === 0 ? (
          <EmptyCart />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <CartItemCard
                  key={item.id}
                  item={item}
                  onUpdateQuantity={(qty) => updateQuantity(item.id, qty)}
                  onRemove={() => removeItem(item.id)}
                />
              ))}

              {/* Free Shipping Progress */}
              {subtotal < SHIPPING_THRESHOLD && (
                <div className="bg-[#F5EBE0] rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Truck className="w-5 h-5 text-[#2D5A4A]" />
                    <p className="text-sm text-[#1A1A1A]">
                      Add <span className="font-semibold">{formatPrice(SHIPPING_THRESHOLD - subtotal)}</span> more for free shipping!
                    </p>
                  </div>
                  <div className="h-2 bg-white rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#2D5A4A] transition-all duration-500"
                      style={{ width: `${Math.min(100, (subtotal / SHIPPING_THRESHOLD) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border border-[#F5EBE0] p-6 sticky top-24">
                <h2 className="text-xl font-semibold text-[#1A1A1A] mb-6 font-display">
                  Order Summary
                </h2>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal ({cartItems.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
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

                <Link
                  to="/checkout"
                  className="w-full flex items-center justify-center gap-2 bg-[#2D5A4A] text-white py-4 rounded-lg font-medium hover:bg-[#1A1A1A] transition-colors"
                >
                  <CreditCard className="w-5 h-5" />
                  Proceed to Checkout
                </Link>

                <p className="text-xs text-gray-500 text-center mt-4">
                  Secure checkout powered by Stripe
                </p>

                {/* Benefits */}
                <div className="border-t border-[#F5EBE0] mt-6 pt-6 space-y-3">
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Truck className="w-4 h-4 text-[#2D5A4A]" />
                    <span>Free shipping on orders over $60</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <ShoppingBag className="w-4 h-4 text-[#2D5A4A]" />
                    <span>100% satisfaction guarantee</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// CART ITEM CARD
// ═══════════════════════════════════════════════════════════

function CartItemCard({
  item,
  onUpdateQuantity,
  onRemove,
}: {
  item: CartItem;
  onUpdateQuantity: (qty: number) => void;
  onRemove: () => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-[#F5EBE0] p-4 flex gap-4">
      {/* Image */}
      <Link
        to="/shop/$productSlug"
        params={{ productSlug: item.slug }}
        className="flex-shrink-0"
      >
        <img
          src={item.image}
          alt={item.name}
          className="w-24 h-24 rounded-lg object-cover"
        />
      </Link>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Link
              to="/shop/$productSlug"
              params={{ productSlug: item.slug }}
              className="font-semibold text-[#1A1A1A] hover:text-[#2D5A4A] transition-colors font-display"
            >
              {item.name}
            </Link>
            <p className="text-lg font-bold text-[#2D5A4A] mt-1">
              {formatPrice(item.price)}
            </p>
          </div>
          <button
            onClick={onRemove}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            aria-label="Remove item"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center justify-between mt-4">
          {/* Quantity */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onUpdateQuantity(item.quantity - 1)}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#F5EBE0] hover:bg-[#D4A574] hover:text-white transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center font-medium">{item.quantity}</span>
            <button
              onClick={() => onUpdateQuantity(item.quantity + 1)}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#F5EBE0] hover:bg-[#D4A574] hover:text-white transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Line Total */}
          <p className="font-semibold text-[#1A1A1A]">
            {formatPrice(item.price * item.quantity)}
          </p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// EMPTY CART
// ═══════════════════════════════════════════════════════════

function EmptyCart() {
  return (
    <div className="text-center py-16">
      <div className="w-24 h-24 mx-auto mb-6 bg-[#F5EBE0] rounded-full flex items-center justify-center">
        <ShoppingBag className="w-12 h-12 text-[#D4A574]" />
      </div>
      <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4 font-display">
        Your cart is empty
      </h2>
      <p className="text-gray-600 mb-8">
        Looks like you haven't added any soaps yet. Let's fix that!
      </p>
      <Link
        to="/shop"
        className="inline-flex items-center gap-2 bg-[#2D5A4A] text-white px-8 py-4 rounded-lg hover:bg-[#1A1A1A] transition-colors font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Browse Our Soaps
      </Link>
    </div>
  );
}
