// 🛡️ CSRF Protection (Server-Side) - Keeping Enrollsy safe from cross-site attacks
// Generates and validates CSRF tokens with HMAC signatures
//
// ╭────────────────────────────────────────────────────────────╮
// │  CSRF TOKEN IMPLEMENTATION (SERVER ONLY)                   │
// │  • Generates cryptographically secure tokens                │
// │  • Validates tokens with HMAC signatures                    │
// │  • Uses Node.js crypto module (not available in browser)   │
// ╰────────────────────────────────────────────────────────────╯
//
// This file contains server-only code that uses Node.js crypto.
// For client-side code, use csrf-client.ts

import { randomBytes, createHmac } from 'crypto';

// ═══════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════

const CSRF_SECRET = process.env.SESSION_SECRET || 'csrf-fallback-secret-change-me';
const TOKEN_LENGTH = 32;
export const CSRF_COOKIE_NAME = 'csrf-token';
export const CSRF_HEADER_NAME = 'x-csrf-token';

// ═══════════════════════════════════════════════════════════
// TOKEN GENERATION (Server Only)
// ═══════════════════════════════════════════════════════════

/**
 * Generate a new CSRF token.
 * The token is a random string signed with the session secret.
 *
 * ⚠️ SERVER ONLY - Uses Node.js crypto module
 */
export function generateCsrfToken(): string {
  const random = randomBytes(TOKEN_LENGTH).toString('hex');
  const signature = createHmac('sha256', CSRF_SECRET)
    .update(random)
    .digest('hex')
    .slice(0, 16);
  return `${random}.${signature}`;
}

/**
 * Validate a CSRF token.
 * Checks that the signature matches the random part.
 *
 * ⚠️ SERVER ONLY - Uses Node.js crypto module
 */
export function validateCsrfToken(token: string): boolean {
  if (!token || typeof token !== 'string') return false;

  const [random, signature] = token.split('.');
  if (!random || !signature) return false;

  const expectedSignature = createHmac('sha256', CSRF_SECRET)
    .update(random)
    .digest('hex')
    .slice(0, 16);

  // Constant-time comparison to prevent timing attacks
  return constantTimeCompare(signature, expectedSignature);
}

/**
 * Constant-time string comparison to prevent timing attacks.
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// ═══════════════════════════════════════════════════════════
// COOKIE HELPERS
// ═══════════════════════════════════════════════════════════

/**
 * Create a CSRF token cookie string.
 */
export function createCsrfCookie(token: string): string {
  const options = [
    `${CSRF_COOKIE_NAME}=${token}`,
    'Path=/',
    'SameSite=Strict',
    'Max-Age=86400', // 24 hours
  ];

  // Only add Secure in production
  if (process.env.NODE_ENV === 'production') {
    options.push('Secure');
  }

  return options.join('; ');
}

/**
 * Parse the CSRF token from cookies.
 */
export function parseCsrfCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';').map(c => c.trim());
  const csrfCookie = cookies.find(c => c.startsWith(`${CSRF_COOKIE_NAME}=`));

  if (!csrfCookie) return null;

  return csrfCookie.substring(CSRF_COOKIE_NAME.length + 1);
}

// ═══════════════════════════════════════════════════════════
// VALIDATION HELPERS
// ═══════════════════════════════════════════════════════════

/**
 * Validate CSRF token from a request.
 * Checks both the cookie and the submitted token (header or body).
 *
 * @param cookieHeader - The Cookie header from the request
 * @param submittedToken - The token from form data or X-CSRF-Token header
 * @returns true if valid, false otherwise
 */
export function validateCsrfRequest(
  cookieHeader: string | null,
  submittedToken: string | null
): boolean {
  // Get token from cookie
  const cookieToken = parseCsrfCookie(cookieHeader);

  if (!cookieToken || !submittedToken) {
    return false;
  }

  // Both tokens must match AND be valid
  if (cookieToken !== submittedToken) {
    return false;
  }

  return validateCsrfToken(cookieToken);
}

/**
 * Get the CSRF token from request headers.
 */
export function getCsrfFromHeader(request: Request): string | null {
  return request.headers.get(CSRF_HEADER_NAME);
}

// ═══════════════════════════════════════════════════════════
// MIDDLEWARE-STYLE HELPER
// ═══════════════════════════════════════════════════════════

export type CsrfValidationResult = {
  valid: boolean;
  error?: string;
};

/**
 * Full CSRF validation for server functions.
 * Use this in your createServerFn handlers for mutation endpoints.
 *
 * @example
 * ```ts
 * const submitForm = createServerFn({ method: 'POST' })
 *   .handler(async (data: { csrfToken: string; ... }) => {
 *     const request = getRequest();
 *     const csrfResult = validateCsrfForRequest(request, data.csrfToken);
 *     if (!csrfResult.valid) {
 *       return { success: false, error: csrfResult.error };
 *     }
 *     // ... rest of handler
 *   });
 * ```
 */
export function validateCsrfForRequest(
  request: Request | null | undefined,
  submittedToken: string | null | undefined
): CsrfValidationResult {
  if (!request) {
    return { valid: false, error: 'No request context' };
  }

  const cookieHeader = request.headers.get('cookie');
  const headerToken = getCsrfFromHeader(request);

  // Accept token from either header or submitted data
  const token = headerToken || submittedToken || null;

  if (!validateCsrfRequest(cookieHeader, token)) {
    return { valid: false, error: 'Invalid or missing CSRF token' };
  }

  return { valid: true };
}
