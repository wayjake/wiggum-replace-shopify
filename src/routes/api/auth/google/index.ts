// 🔐 Google OAuth Initiation
// Redirects user to Google's consent screen
// "I'm learnding!" - Ralph, clicking Sign in with Google

import { eventHandler, getQuery, sendRedirect } from 'vinxi/http';
import {
  isGoogleOAuthConfigured,
  getGoogleAuthUrl,
} from '../../../../lib/google-oauth';

export default eventHandler(async (event) => {
  // Check if Google OAuth is configured
  if (!isGoogleOAuthConfigured()) {
    return sendRedirect(event, '/login?error=google_not_configured');
  }

  // Get origin for redirect URI
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const host = event.node.req.headers.host || 'localhost:3000';
  const origin = `${protocol}://${host}`;
  const redirectUri = `${origin}/api/auth/google/callback`;

  const query = getQuery(event);
  const returnTo = (query.returnTo as string) || '/';

  // Generate state for CSRF protection (encode the return URL)
  const state = returnTo !== '/' ? returnTo : undefined;

  const authUrl = getGoogleAuthUrl(redirectUri, state);
  return sendRedirect(event, authUrl);
});
