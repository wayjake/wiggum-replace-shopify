// 🛒 Cart State Management - The shopping cart's brain
// "I choo-choo-choose you!" - Ralph picking products for the cart
//
// ╭──────────────────────────────────────────────────────────────╮
// │  This module provides cart state management using React     │
// │  Context + localStorage for persistence across sessions.    │
// │  It's like a shopping cart that never forgets!              │
// ╰──────────────────────────────────────────────────────────────╯

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';

// ═══════════════════════════════════════════════════════════
// TYPES - The shape of our soap dreams
// ═══════════════════════════════════════════════════════════

export interface CartItem {
  id: string; // Unique cart item ID
  productId: string;
  name: string;
  slug: string;
  price: number;
  quantity: number;
  image: string;
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (item: Omit<CartItem, 'id' | 'quantity'>, quantity?: number) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  isInCart: (productId: string) => boolean;
  getItemQuantity: (productId: string) => number;
}

// ═══════════════════════════════════════════════════════════
// CONTEXT - The cart consciousness
// ═══════════════════════════════════════════════════════════

const CartContext = createContext<CartContextType | null>(null);

const CART_STORAGE_KEY = 'karens-soap-cart';

// ═══════════════════════════════════════════════════════════
// PROVIDER - The cart's caretaker
// "My cat's breath smells like cat food!" - Ralph on state management
// ═══════════════════════════════════════════════════════════

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // 💾 Load cart from localStorage on mount (client-side only)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      }
    } catch (error) {
      console.error('[Cart] Failed to load from localStorage:', error);
    }
    setIsHydrated(true);
  }, []);

  // 💾 Save cart to localStorage whenever items change
  useEffect(() => {
    if (!isHydrated) return;
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('[Cart] Failed to save to localStorage:', error);
    }
  }, [items, isHydrated]);

  // 🛒 Add item to cart
  const addItem = useCallback(
    (product: Omit<CartItem, 'id' | 'quantity'>, quantity = 1) => {
      setItems((currentItems) => {
        const existingItem = currentItems.find((item) => item.productId === product.productId);

        if (existingItem) {
          // Update quantity if already in cart
          return currentItems.map((item) =>
            item.productId === product.productId
              ? { ...item, quantity: Math.min(10, item.quantity + quantity) }
              : item
          );
        }

        // Add new item
        const newItem: CartItem = {
          ...product,
          id: `cart-${product.productId}-${Date.now()}`,
          quantity: Math.min(10, quantity),
        };
        return [...currentItems, newItem];
      });
    },
    []
  );

  // 🗑️ Remove item from cart
  const removeItem = useCallback((itemId: string) => {
    setItems((currentItems) => currentItems.filter((item) => item.id !== itemId));
  }, []);

  // 🔢 Update item quantity
  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity < 1) {
      removeItem(itemId);
      return;
    }

    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === itemId ? { ...item, quantity: Math.min(10, quantity) } : item
      )
    );
  }, [removeItem]);

  // 🧹 Clear the entire cart
  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  // 🔍 Check if product is in cart
  const isInCart = useCallback(
    (productId: string) => items.some((item) => item.productId === productId),
    [items]
  );

  // 🔢 Get quantity for a product
  const getItemQuantity = useCallback(
    (productId: string) => {
      const item = items.find((i) => i.productId === productId);
      return item?.quantity || 0;
    },
    [items]
  );

  // 📊 Calculate totals
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        isInCart,
        getItemQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// ═══════════════════════════════════════════════════════════
// HOOK - The shopping companion
// ═══════════════════════════════════════════════════════════

export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

// ═══════════════════════════════════════════════════════════
// HELPERS - Shipping calculations and such
// ═══════════════════════════════════════════════════════════

export const SHIPPING_THRESHOLD = 60; // Free shipping above this amount (matches karensbeautifulsoap.com)
export const STANDARD_SHIPPING = 7.00; // Flat rate shipping

export function calculateShipping(subtotal: number): number {
  return subtotal >= SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING;
}

export function calculateTotal(subtotal: number): number {
  return subtotal + calculateShipping(subtotal);
}
