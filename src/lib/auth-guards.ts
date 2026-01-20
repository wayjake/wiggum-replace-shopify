// 🛡️ Authentication Guards - Protecting the Enrollsy kingdom
// "Hi, Super Nintendo Chalmers!" - Ralph, greeting authorized users
//
// These server functions provide authentication and authorization checks
// for protected routes like /admin, /super-admin, and /portal.
//
// ╭────────────────────────────────────────────────────────────╮
// │  ROLE HIERARCHY                                            │
// │  ─────────────────────────────────────────────────────────  │
// │  superadmin → Platform-level admin (can access everything) │
// │  admin      → School staff (admissions, business office)   │
// │  customer   → Family/parent (portal access only)           │
// ╰────────────────────────────────────────────────────────────╯

import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
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
 * │  Ensures user is logged in AND has admin or superadmin   │
 * │  role. School staff and platform admins can access.      │
 * │  Redirects to login if not auth, /portal if customer.    │
 * ╰─────────────────────────────────────────────────────────╯
 */
export const requireAdmin = createServerFn({ method: 'GET' }).handler(async () => {
  const session = await getSession();

  if (!session) {
    return { authenticated: false, isAdmin: false, redirect: '/login' };
  }

  // Both admin and superadmin can access school admin
  if (session.user.role !== 'admin' && session.user.role !== 'superadmin') {
    return { authenticated: true, isAdmin: false, redirect: '/portal' };
  }

  return {
    authenticated: true,
    isAdmin: true,
    user: session.user,
  };
});

/**
 * ╭─────────────────────────────────────────────────────────╮
 * │  REQUIRE SUPERADMIN                                      │
 * │  ─────────────────────────────────────────────────────── │
 * │  Ensures user is logged in AND has superadmin role.      │
 * │  Only platform administrators can access.                │
 * ╰─────────────────────────────────────────────────────────╯
 */
export const requireSuperAdmin = createServerFn({ method: 'GET' }).handler(async () => {
  const session = await getSession();

  if (!session) {
    return { authenticated: false, isSuperAdmin: false, redirect: '/login' };
  }

  if (session.user.role !== 'superadmin') {
    // Redirect based on role
    if (session.user.role === 'admin') {
      return { authenticated: true, isSuperAdmin: false, redirect: '/admin' };
    }
    return { authenticated: true, isSuperAdmin: false, redirect: '/portal' };
  }

  return {
    authenticated: true,
    isSuperAdmin: true,
    user: session.user,
  };
});

/**
 * ╭─────────────────────────────────────────────────────────╮
 * │  REQUIRE CUSTOMER (Family/Parent)                        │
 * │  ─────────────────────────────────────────────────────── │
 * │  Ensures user is logged in. Admins and superadmins are   │
 * │  redirected to their respective dashboards.              │
 * ╰─────────────────────────────────────────────────────────╯
 */
export const requireCustomer = createServerFn({ method: 'GET' }).handler(async () => {
  const session = await getSession();

  if (!session) {
    return { authenticated: false, redirect: '/login' };
  }

  // Redirect admins to their dashboards
  if (session.user.role === 'superadmin') {
    return { authenticated: true, redirect: '/super-admin' };
  }
  if (session.user.role === 'admin') {
    return { authenticated: true, redirect: '/admin' };
  }

  return {
    authenticated: true,
    user: session.user,
  };
});

/**
 * Helper types for use in route loaders
 */
export type AuthResult = Awaited<ReturnType<typeof requireAuth>>;
export type AdminAuthResult = Awaited<ReturnType<typeof requireAdmin>>;
export type SuperAdminAuthResult = Awaited<ReturnType<typeof requireSuperAdmin>>;
export type CustomerAuthResult = Awaited<ReturnType<typeof requireCustomer>>;
