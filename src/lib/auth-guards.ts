// 🛡️ Authentication Guards - Protecting the soap kingdom
// "Hi, Super Nintendo Chalmers!" - Ralph, greeting authorized users
//
// These server functions provide authentication and authorization checks
// for protected routes like /admin and /account.

import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { redirect } from '@tanstack/react-router';
import { parseSessionCookie, validateSession } from './auth';

/**
 * ╭─────────────────────────────────────────────────────────╮
 * │  SESSION CHECK                                           │
 * │  ─────────────────────────────────────────────────────── │
 * │  Validates the current session and returns user info.    │
 * │  Returns null if not authenticated.                      │
 * ╰─────────────────────────────────────────────────────────╯
 */
export const getSession = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const request = getRequest();
    const cookieHeader = request?.headers.get('cookie') || '';
    const sessionId = parseSessionCookie(cookieHeader);

    if (!sessionId) {
      return null;
    }

    const session = await validateSession(sessionId);
    return session;
  } catch (error) {
    console.error('Session check error:', error);
    return null;
  }
});

/**
 * ╭─────────────────────────────────────────────────────────╮
 * │  REQUIRE AUTH                                            │
 * │  ─────────────────────────────────────────────────────── │
 * │  Ensures user is logged in, redirects to login if not.   │
 * ╰─────────────────────────────────────────────────────────╯
 */
export const requireAuth = createServerFn({ method: 'GET' }).handler(async () => {
  const session = await getSession();

  if (!session) {
    // Return info that will trigger client-side redirect
    return { authenticated: false, redirect: '/login' };
  }

  return {
    authenticated: true,
    user: session.user,
  };
});

/**
 * ╭─────────────────────────────────────────────────────────╮
 * │  REQUIRE ADMIN                                           │
 * │  ─────────────────────────────────────────────────────── │
 * │  Ensures user is logged in AND has admin role.           │
 * │  Redirects to login if not auth, /account if not admin.  │
 * ╰─────────────────────────────────────────────────────────╯
 */
export const requireAdmin = createServerFn({ method: 'GET' }).handler(async () => {
  const session = await getSession();

  if (!session) {
    return { authenticated: false, isAdmin: false, redirect: '/login' };
  }

  if (session.user.role !== 'admin') {
    return { authenticated: true, isAdmin: false, redirect: '/account' };
  }

  return {
    authenticated: true,
    isAdmin: true,
    user: session.user,
  };
});

/**
 * Helper types for use in route loaders
 */
export type AuthResult = Awaited<ReturnType<typeof requireAuth>>;
export type AdminAuthResult = Awaited<ReturnType<typeof requireAdmin>>;
