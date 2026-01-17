// 🛡️ Authentication System - The bouncer at the door of our soap club
// "I'm Idaho!" - Ralph, every user identifying themselves

import { createId } from '@paralleldrive/cuid2';
import bcrypt from 'bcryptjs';
import { eq, and, gt } from 'drizzle-orm';
import { getDb, users, sessions } from '../db';

/**
 * ╭─────────────────────────────────────────────────────────╮
 * │  SESSION CONFIGURATION                                   │
 * │  ─────────────────────────────────────────────────────── │
 * │  Sessions expire after 30 days of inactivity.            │
 * │  Refresh on each request to keep active users logged in. │
 * ╰─────────────────────────────────────────────────────────╯
 */
const SESSION_EXPIRY_DAYS = 30;
const SESSION_COOKIE_NAME = 'soap_session';

// ═══════════════════════════════════════════════════════════
// PASSWORD UTILITIES
// ═══════════════════════════════════════════════════════════

/**
 * Hashes a password using bcrypt.
 * Salt rounds of 12 is a good balance of security and speed.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/**
 * Verifies a password against a hash.
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ═══════════════════════════════════════════════════════════
// SESSION MANAGEMENT
// ═══════════════════════════════════════════════════════════

export type SessionUser = {
  id: string;
  email: string;
  role: 'admin' | 'customer';
  firstName: string | null;
  lastName: string | null;
};

export type Session = {
  id: string;
  userId: string;
  expiresAt: Date;
  user: SessionUser;
};

/**
 * Creates a new session for a user.
 * Returns the session ID to store in a cookie.
 */
export async function createSession(userId: string): Promise<string> {
  const db = getDb();
  const sessionId = createId();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRY_DAYS);

  await db.insert(sessions).values({
    id: sessionId,
    userId,
    expiresAt,
  });

  return sessionId;
}

/**
 * Validates a session ID and returns the session with user data.
 * Returns null if the session is invalid or expired.
 */
export async function validateSession(
  sessionId: string
): Promise<Session | null> {
  const db = getDb();

  const result = await db
    .select({
      session: sessions,
      user: {
        id: users.id,
        email: users.email,
        role: users.role,
        firstName: users.firstName,
        lastName: users.lastName,
      },
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(
      and(
        eq(sessions.id, sessionId),
        gt(sessions.expiresAt, new Date())
      )
    )
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  const { session, user } = result[0];

  return {
    id: session.id,
    userId: session.userId,
    expiresAt: session.expiresAt!,
    user: user as SessionUser,
  };
}

/**
 * Extends a session's expiry time.
 * Call this on each authenticated request to keep sessions alive.
 */
export async function refreshSession(sessionId: string): Promise<void> {
  const db = getDb();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRY_DAYS);

  await db
    .update(sessions)
    .set({ expiresAt })
    .where(eq(sessions.id, sessionId));
}

/**
 * Invalidates a session (logout).
 */
export async function invalidateSession(sessionId: string): Promise<void> {
  const db = getDb();
  await db.delete(sessions).where(eq(sessions.id, sessionId));
}

/**
 * Invalidates all sessions for a user (logout everywhere).
 */
export async function invalidateAllUserSessions(userId: string): Promise<void> {
  const db = getDb();
  await db.delete(sessions).where(eq(sessions.userId, userId));
}

/**
 * Cleans up expired sessions.
 * Run this periodically (e.g., daily cron job).
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const db = getDb();
  const result = await db
    .delete(sessions)
    .where(gt(new Date(), sessions.expiresAt));
  return result.rowsAffected;
}

// ═══════════════════════════════════════════════════════════
// USER MANAGEMENT
// ═══════════════════════════════════════════════════════════

export type CreateUserInput = {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: 'admin' | 'customer';
};

/**
 * Creates a new user account.
 * Returns the user ID on success, throws on error.
 */
export async function createUser(input: CreateUserInput): Promise<string> {
  const db = getDb();
  const passwordHash = await hashPassword(input.password);

  const result = await db
    .insert(users)
    .values({
      email: input.email.toLowerCase(),
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      role: input.role || 'customer',
    })
    .returning({ id: users.id });

  return result[0].id;
}

/**
 * Authenticates a user with email and password.
 * Returns user data on success, null on failure.
 */
export async function authenticateUser(
  email: string,
  password: string
): Promise<SessionUser | null> {
  const db = getDb();

  const result = await db
    .select({
      id: users.id,
      email: users.email,
      passwordHash: users.passwordHash,
      role: users.role,
      firstName: users.firstName,
      lastName: users.lastName,
    })
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  const user = result[0];

  if (!user.passwordHash) {
    // User exists but doesn't have a password (OAuth only)
    return null;
  }

  const validPassword = await verifyPassword(password, user.passwordHash);
  if (!validPassword) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    role: user.role as 'admin' | 'customer',
    firstName: user.firstName,
    lastName: user.lastName,
  };
}

/**
 * Gets a user by email.
 */
export async function getUserByEmail(
  email: string
): Promise<SessionUser | null> {
  const db = getDb();

  const result = await db
    .select({
      id: users.id,
      email: users.email,
      role: users.role,
      firstName: users.firstName,
      lastName: users.lastName,
    })
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  return result[0] as SessionUser;
}

/**
 * Gets a user by ID.
 */
export async function getUserById(userId: string): Promise<SessionUser | null> {
  const db = getDb();

  const result = await db
    .select({
      id: users.id,
      email: users.email,
      role: users.role,
      firstName: users.firstName,
      lastName: users.lastName,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  return result[0] as SessionUser;
}

/**
 * Updates a user's password.
 */
export async function updateUserPassword(
  userId: string,
  newPassword: string
): Promise<void> {
  const db = getDb();
  const passwordHash = await hashPassword(newPassword);

  await db
    .update(users)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(users.id, userId));
}

/**
 * Updates a user's profile.
 */
export async function updateUserProfile(
  userId: string,
  data: {
    firstName?: string;
    lastName?: string;
    email?: string;
  }
): Promise<void> {
  const db = getDb();

  await db
    .update(users)
    .set({
      ...data,
      email: data.email?.toLowerCase(),
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
}

// ═══════════════════════════════════════════════════════════
// COOKIE HELPERS
// ═══════════════════════════════════════════════════════════

/**
 * Creates the session cookie value.
 */
export function createSessionCookie(sessionId: string): string {
  const maxAge = SESSION_EXPIRY_DAYS * 24 * 60 * 60; // in seconds
  return `${SESSION_COOKIE_NAME}=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;
}

/**
 * Creates a cookie that clears the session (for logout).
 */
export function createLogoutCookie(): string {
  return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

/**
 * Parses the session ID from a cookie header.
 */
export function parseSessionCookie(cookieHeader: string): string | null {
  const cookies = cookieHeader.split(';').map((c) => c.trim());
  const sessionCookie = cookies.find((c) =>
    c.startsWith(`${SESSION_COOKIE_NAME}=`)
  );

  if (!sessionCookie) {
    return null;
  }

  return sessionCookie.split('=')[1] || null;
}

// ═══════════════════════════════════════════════════════════
// ROUTE PROTECTION HELPERS
// ═══════════════════════════════════════════════════════════

/**
 * Error thrown when authentication is required but user is not logged in.
 */
export class AuthenticationError extends Error {
  constructor(message = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

/**
 * Error thrown when user doesn't have required permissions.
 */
export class AuthorizationError extends Error {
  constructor(message = 'Insufficient permissions') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

/**
 * Requires a valid session. Throws if not authenticated.
 */
export async function requireAuth(sessionId: string | null): Promise<Session> {
  if (!sessionId) {
    throw new AuthenticationError();
  }

  const session = await validateSession(sessionId);
  if (!session) {
    throw new AuthenticationError('Invalid or expired session');
  }

  return session;
}

/**
 * Requires admin role. Throws if not admin.
 */
export async function requireAdmin(sessionId: string | null): Promise<Session> {
  const session = await requireAuth(sessionId);

  if (session.user.role !== 'admin') {
    throw new AuthorizationError('Admin access required');
  }

  return session;
}
