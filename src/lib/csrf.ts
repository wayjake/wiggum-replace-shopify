// 🛡️ CSRF Protection (Client-Safe) - Browser-compatible CSRF utilities
// "I'm learnding!" - Ralph, on security tokens
//
// ╭────────────────────────────────────────────────────────────╮
// │  CSRF CLIENT UTILITIES                                      │
// │  • Read CSRF tokens from cookies (browser-safe)             │
// │  • Constants for cookie/header names                        │
// │  • For server-side generation, use csrf.server.ts           │
// ╰────────────────────────────────────────────────────────────╯
//
// This file is safe to import in both client and server code.
// For token generation & validation (server only), import from csrf.server.ts

// ═══════════════════════════════════════════════════════════
// CONSTANTS (shared between client and server)
// ═══════════════════════════════════════════════════════════

export const CSRF_COOKIE_NAME = 'csrf-token';
export const CSRF_HEADER_NAME = 'x-csrf-token';

// ═══════════════════════════════════════════════════════════
// CLIENT-SIDE HELPERS
// ═══════════════════════════════════════════════════════════

/**
 * Get CSRF token from cookies (for client-side use).
 * Call this from a client component to get the token for forms.
 *
 * This is safe to use in the browser.
 */
export function getClientCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;

  const cookies = document.cookie.split(';').map(c => c.trim());
  const csrfCookie = cookies.find(c => c.startsWith(`${CSRF_COOKIE_NAME}=`));

  if (!csrfCookie) return null;

  return csrfCookie.substring(CSRF_COOKIE_NAME.length + 1);
}

// ═══════════════════════════════════════════════════════════
// RE-EXPORTS from server module
// These are re-exported so existing imports still work,
// but will only work when imported in server context
// ═══════════════════════════════════════════════════════════

// Type export (safe for both client and server)
export type CsrfValidationResult = {
  valid: boolean;
  error?: string;
};
