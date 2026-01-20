// 🔐 Google OAuth Initiation
// Redirects user to Google's consent screen
// "I'm learnding!" - Ralph, clicking Sign in with Google
//
// ╭────────────────────────────────────────────────────────────╮
// │  🏫 MULTI-TENANT SUPPORT                                    │
// │  Pass ?school=schoolId to use school-specific OAuth creds  │
// │  Falls back to platform credentials if school has none     │
// ╰────────────────────────────────────────────────────────────╯

import { eventHandler, getQuery, sendRedirect } from 'vinxi/http';
import {
  isGoogleOAuthConfigured,
  getGoogleAuthUrl,
  getSchoolGoogleAuthUrl,
  getGoogleCredentials,
} from '../../../../lib/google-oauth';

export default eventHandler(async (event) => {
  // Get origin for redirect URI
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const host = event.node.req.headers.host || 'localhost:3000';
  const origin = `${protocol}://${host}`;
  const redirectUri = `${origin}/api/auth/google/callback`;

  const query = getQuery(event);
  const returnTo = (query.returnTo as string) || '/';
  const schoolId = query.school as string | undefined;

  // If school ID provided, try school-specific OAuth
  if (schoolId) {
    const credentials = await getGoogleCredentials(schoolId);
    if (!credentials) {
      return sendRedirect(event, '/login?error=google_not_configured');
    }

    const authUrl = await getSchoolGoogleAuthUrl(redirectUri, schoolId, returnTo !== '/' ? returnTo : undefined);
    return sendRedirect(event, authUrl);
  }

  // Check if platform-level Google OAuth is configured
  if (!isGoogleOAuthConfigured()) {
    return sendRedirect(event, '/login?error=google_not_configured');
  }

  // Generate state for CSRF protection (encode the return URL)
  const state = returnTo !== '/' ? returnTo : undefined;

  const authUrl = getGoogleAuthUrl(redirectUri, state);
  return sendRedirect(event, authUrl);
});
