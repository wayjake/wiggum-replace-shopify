// 🧰 Utility functions - the Swiss Army knife of our soap empire
// "I bent my wookiee!" - What happens when you don't use these helpers

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines class names with Tailwind merge intelligence.
 * Like mixing soap ingredients, but for styles!
 *
 * Usage: cn("base-styles", condition && "conditional-styles", className)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a price for display with currency symbol.
 * Because "$12.00" looks better than "12"
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
}

/**
 * Truncates text with ellipsis if it exceeds maxLength.
 * Like squeezing too much soap into a small box.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Generates a random string for things like session secrets.
 * Not cryptographically secure - use crypto.randomUUID() for real secrets!
 */
export function generateId(length: number = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
