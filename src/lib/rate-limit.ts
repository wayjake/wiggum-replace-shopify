// 🚦 Rate Limiting - Keeping Enrollsy safe from abuse
// Sliding window rate limiter for auth protection
//
// ╭────────────────────────────────────────────────────────────╮
// │  🛡️  SLIDING WINDOW RATE LIMITER                           │
// │  In-memory rate limiting for auth protection.              │
// │  For production, consider Redis or edge rate limiting.     │
// ╰────────────────────────────────────────────────────────────╯
//
// This implementation uses a sliding window approach:
// - Tracks attempts per IP address within a time window
// - Automatically cleans up old entries to prevent memory leaks
// - Returns remaining attempts and reset time for client feedback

// Store attempts in memory (works for single-instance deployments)
// For multi-instance, use Redis, Upstash, or similar
const attempts = new Map<string, { timestamps: number[]; blocked?: number }>();

// Clean up old entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupOldEntries(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;

  lastCleanup = now;
  const cutoff = now - windowMs * 2; // Keep entries for 2x window

  for (const [key, data] of attempts.entries()) {
    // Remove entries with no recent timestamps
    const recentTimestamps = data.timestamps.filter((t) => t > cutoff);
    if (recentTimestamps.length === 0 && (!data.blocked || data.blocked < now)) {
      attempts.delete(key);
    }
  }
}

export type RateLimitResult = {
  success: boolean;
  remaining: number;
  resetIn: number; // seconds until reset
  blocked: boolean;
};

export type RateLimitConfig = {
  windowMs: number; // Time window in milliseconds
  maxAttempts: number; // Max attempts within window
  blockDurationMs?: number; // How long to block after exceeding (optional)
};

/**
 * Check if running in E2E test mode.
 * Skip rate limiting during tests to allow comprehensive testing.
 */
function isE2ETestMode(): boolean {
  const isE2E = process.env.PLAYWRIGHT_TEST === 'true' || process.env.E2E_TEST === 'true';
  if (isE2E) {
    console.log('[RATE-LIMIT] E2E mode detected, skipping rate limit');
  }
  return isE2E;
}

/**
 * Check if a request should be rate limited.
 *
 * @param identifier - Usually the client IP address
 * @param config - Rate limit configuration
 * @returns Result object with success status and metadata
 *
 * @example
 * ```ts
 * const result = checkRateLimit(clientIP, {
 *   windowMs: 15 * 60 * 1000, // 15 minutes
 *   maxAttempts: 5, // 5 attempts
 *   blockDurationMs: 60 * 60 * 1000, // 1 hour block after exceeding
 * });
 *
 * if (!result.success) {
 *   return { error: 'Too many attempts. Try again later.' };
 * }
 * ```
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  // 🧪 Skip rate limiting during E2E tests
  if (isE2ETestMode()) {
    return {
      success: true,
      remaining: config.maxAttempts,
      resetIn: 0,
      blocked: false,
    };
  }
  const { windowMs, maxAttempts, blockDurationMs } = config;
  const now = Date.now();

  // Periodic cleanup
  cleanupOldEntries(windowMs);

  // Get or create entry for this identifier
  let entry = attempts.get(identifier);
  if (!entry) {
    entry = { timestamps: [] };
    attempts.set(identifier, entry);
  }

  // Check if currently blocked
  if (entry.blocked && entry.blocked > now) {
    const resetIn = Math.ceil((entry.blocked - now) / 1000);
    return {
      success: false,
      remaining: 0,
      resetIn,
      blocked: true,
    };
  }

  // Clear block if expired
  if (entry.blocked && entry.blocked <= now) {
    entry.blocked = undefined;
    entry.timestamps = [];
  }

  // Filter timestamps within the current window
  const windowStart = now - windowMs;
  entry.timestamps = entry.timestamps.filter((t) => t > windowStart);

  // Check if under limit
  if (entry.timestamps.length < maxAttempts) {
    // Record this attempt
    entry.timestamps.push(now);

    return {
      success: true,
      remaining: maxAttempts - entry.timestamps.length,
      resetIn: Math.ceil(windowMs / 1000),
      blocked: false,
    };
  }

  // Over limit - apply block if configured
  if (blockDurationMs) {
    entry.blocked = now + blockDurationMs;
  }

  // Calculate when the oldest timestamp expires
  const oldestTimestamp = entry.timestamps[0];
  const resetIn = Math.ceil((oldestTimestamp + windowMs - now) / 1000);

  return {
    success: false,
    remaining: 0,
    resetIn: blockDurationMs ? Math.ceil(blockDurationMs / 1000) : resetIn,
    blocked: !!blockDurationMs,
  };
}

/**
 * Reset rate limit for an identifier (e.g., after successful login)
 */
export function resetRateLimit(identifier: string): void {
  attempts.delete(identifier);
}

/**
 * Get client IP from request headers.
 * Works with common proxy setups (Cloudflare, Vercel, etc.)
 */
export function getClientIP(request: Request): string {
  // Try various headers used by different proxies
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, get the first one
    return forwardedFor.split(',')[0].trim();
  }

  // Cloudflare
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Vercel
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  // Fallback (won't work behind proxies)
  return 'unknown';
}

// ═══════════════════════════════════════════════════════════
// PRE-CONFIGURED RATE LIMITERS FOR COMMON USE CASES
// ═══════════════════════════════════════════════════════════

/**
 * Rate limiter for login attempts.
 * 5 attempts per 15 minutes, 1 hour block after exceeding.
 */
export const loginRateLimit: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxAttempts: 5,
  blockDurationMs: 60 * 60 * 1000, // 1 hour block
};

/**
 * Rate limiter for registration attempts.
 * 3 attempts per hour, 24 hour block after exceeding.
 */
export const registerRateLimit: RateLimitConfig = {
  windowMs: 60 * 60 * 1000, // 1 hour
  maxAttempts: 3,
  blockDurationMs: 24 * 60 * 60 * 1000, // 24 hour block
};

/**
 * Rate limiter for password reset requests.
 * 3 attempts per hour, no extended block.
 */
export const passwordResetRateLimit: RateLimitConfig = {
  windowMs: 60 * 60 * 1000, // 1 hour
  maxAttempts: 3,
};

/**
 * Rate limiter for API endpoints.
 * 100 requests per minute.
 */
export const apiRateLimit: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  maxAttempts: 100,
};
