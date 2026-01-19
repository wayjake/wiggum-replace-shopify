// 🔐 Google OAuth Callback Handler
// This handles the redirect from Google after user consents

import { eventHandler, getQuery, sendRedirect, setCookie } from 'vinxi/http';
import {
  isGoogleOAuthConfigured,
  handleGoogleCallback,
} from '../../../../lib/google-oauth';
import { createSessionCookie } from '../../../../lib/auth';

export default eventHandler(async (event) => {
  // Get origin for redirect URI
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const host = event.node.req.headers.host || 'localhost:3000';
  const origin = `${protocol}://${host}`;
  const redirectUri = `${origin}/api/auth/google/callback`;

  // Check if Google OAuth is configured
  if (!isGoogleOAuthConfigured()) {
    return sendRedirect(event, '/login?error=google_not_configured');
  }

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

  // Process the OAuth callback
  const result = await handleGoogleCallback(code, redirectUri);

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

  // Redirect based on state or default
  const redirectTo = state || (result.isNewUser ? '/account' : '/');
  return sendRedirect(event, redirectTo);
});
