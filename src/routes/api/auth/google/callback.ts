// 🔐 Google OAuth Callback Handler
// This handles the redirect from Google after user consents
//
// ╭────────────────────────────────────────────────────────────╮
// │  🏫 MULTI-TENANT SUPPORT                                    │
// │  The state parameter contains school ID if using school-   │
// │  specific OAuth credentials. Parsed automatically.         │
// ╰────────────────────────────────────────────────────────────╯

import { eventHandler, getQuery, sendRedirect, setCookie } from 'vinxi/http';
import {
  handleGoogleCallback,
  parseOAuthState,
} from '../../../../lib/google-oauth';
import { createSessionCookie } from '../../../../lib/auth';

export default eventHandler(async (event) => {
  // Get origin for redirect URI
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const host = event.node.req.headers.host || 'localhost:3000';
  const origin = `${protocol}://${host}`;
  const redirectUri = `${origin}/api/auth/google/callback`;

  const query = getQuery(event);
  const code = query.code as string | undefined;
  const error = query.error as string | undefined;
  const state = query.state as string | undefined;

  // Handle errors from Google
  if (error) {
    console.error('Google OAuth error:', error);
    return sendRedirect(event, `/login?error=${error}`);
  }

  if (!code) {
    return sendRedirect(event, '/login?error=no_code');
  }

  // Process the OAuth callback (handles school-specific creds via state)
  const result = await handleGoogleCallback(code, redirectUri, state);

  if (!result.success || !result.sessionId) {
    const errorMsg = encodeURIComponent(result.error || 'Authentication failed');
    return sendRedirect(event, `/login?error=${errorMsg}`);
  }

  // Set session cookie
  const cookie = createSessionCookie(result.sessionId);
  const [cookieName, ...cookieParts] = cookie.split('=');
  const cookieValue = cookieParts.join('=').split(';')[0];

  setCookie(event, cookieName, cookieValue, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });

  // Parse state to get the original return URL
  const stateData = state ? parseOAuthState(state) : {};
  const originalState = stateData.originalState;

  // Determine redirect destination
  // For new users, send to portal; for returning users, use state or role-based redirect
  let redirectTo = '/portal';
  if (originalState) {
    redirectTo = originalState;
  } else if (result.user?.role === 'superadmin') {
    redirectTo = '/super-admin';
  } else if (result.user?.role === 'admin') {
    redirectTo = '/admin';
  }

  return sendRedirect(event, redirectTo);
});
