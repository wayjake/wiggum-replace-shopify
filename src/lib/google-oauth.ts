// 🔐 Google OAuth - Sign in with the big G
// "I'm learnding!" - Ralph, signing in with Google
//
// ╭────────────────────────────────────────────────────────────╮
// │  GOOGLE OAUTH FLOW                                          │
// │  1. User clicks "Sign in with Google"                       │
// │  2. Redirect to Google's consent screen                     │
// │  3. Google redirects back with auth code                    │
// │  4. Exchange code for tokens                                │
// │  5. Get user info and create/link account                   │
// │                                                              │
// │  🏫 MULTI-TENANT SUPPORT                                     │
// │  Schools can configure their own Google OAuth credentials   │
// │  in their settings. Falls back to platform-level config.    │
// ╰────────────────────────────────────────────────────────────╯

import { getDb, users, oauthAccounts, schools } from '../db';
import { eq, and } from 'drizzle-orm';
import { createSession, type SessionUser } from './auth';

// ═══════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

/**
 * OAuth credentials - can come from platform env or school-specific config
 */
type OAuthCredentials = {
  clientId: string;
  clientSecret: string;
  schoolId?: string;
};

/**
 * Check if Google OAuth is configured at platform level
 */
export function isGoogleOAuthConfigured(): boolean {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

/**
 * Check if Google OAuth is configured for a specific school
 */
export async function isSchoolGoogleOAuthConfigured(schoolId: string): Promise<boolean> {
  const db = getDb();
  const school = await db.query.schools.findFirst({
    where: eq(schools.id, schoolId),
    columns: {
      googleClientId: true,
      googleClientSecret: true,
    },
  });
  return !!(school?.googleClientId && school?.googleClientSecret);
}

/**
 * Get Google OAuth credentials - school-specific if available, otherwise platform
 */
export async function getGoogleCredentials(schoolId?: string): Promise<OAuthCredentials | null> {
  // If schoolId provided, try school-specific credentials first
  if (schoolId) {
    const db = getDb();
    const school = await db.query.schools.findFirst({
      where: eq(schools.id, schoolId),
      columns: {
        id: true,
        googleClientId: true,
        googleClientSecret: true,
      },
    });

    if (school?.googleClientId && school?.googleClientSecret) {
      return {
        clientId: school.googleClientId,
        clientSecret: school.googleClientSecret,
        schoolId: school.id,
      };
    }
  }

  // Fall back to platform-level credentials
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    return {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    };
  }

  return null;
}

/**
 * Get Google OAuth client ID (safe to expose to client)
 */
export function getGoogleClientId(): string | null {
  return process.env.GOOGLE_CLIENT_ID || null;
}

/**
 * Get Google OAuth client ID for a school (safe to expose to client)
 */
export async function getSchoolGoogleClientId(schoolId: string): Promise<string | null> {
  const credentials = await getGoogleCredentials(schoolId);
  return credentials?.clientId || null;
}

// ═══════════════════════════════════════════════════════════
// OAUTH URL GENERATION
// ═══════════════════════════════════════════════════════════

/**
 * Generate the Google OAuth authorization URL (platform-level)
 */
export function getGoogleAuthUrl(redirectUri: string, state?: string): string {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error('GOOGLE_CLIENT_ID is not configured');
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent',
    ...(state && { state }),
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

/**
 * Generate the Google OAuth authorization URL for a specific school
 * Falls back to platform credentials if school doesn't have OAuth configured
 */
export async function getSchoolGoogleAuthUrl(
  redirectUri: string,
  schoolId: string,
  state?: string
): Promise<string> {
  const credentials = await getGoogleCredentials(schoolId);

  if (!credentials) {
    throw new Error('Google OAuth is not configured for this school');
  }

  // Encode school ID in state for the callback to know which credentials to use
  const stateData = {
    schoolId: credentials.schoolId, // Will be undefined if using platform creds
    originalState: state,
  };

  const params = new URLSearchParams({
    client_id: credentials.clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent',
    state: Buffer.from(JSON.stringify(stateData)).toString('base64'),
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

/**
 * Parse the state parameter from OAuth callback
 */
export function parseOAuthState(state: string): { schoolId?: string; originalState?: string } {
  try {
    const decoded = Buffer.from(state, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch {
    // Legacy state format - just a plain string
    return { originalState: state };
  }
}

// ═══════════════════════════════════════════════════════════
// TOKEN EXCHANGE
// ═══════════════════════════════════════════════════════════

type GoogleTokens = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  id_token?: string;
};

/**
 * Exchange authorization code for tokens (platform-level)
 */
export async function exchangeCodeForTokens(
  code: string,
  redirectUri: string
): Promise<GoogleTokens> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth is not configured');
  }

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Google token exchange failed:', error);
    throw new Error('Failed to exchange code for tokens');
  }

  return response.json();
}

/**
 * Exchange authorization code for tokens with school-specific credentials
 */
export async function exchangeCodeForTokensWithSchool(
  code: string,
  redirectUri: string,
  schoolId?: string
): Promise<GoogleTokens> {
  const credentials = await getGoogleCredentials(schoolId);

  if (!credentials) {
    throw new Error('Google OAuth is not configured');
  }

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Google token exchange failed:', error);
    throw new Error('Failed to exchange code for tokens');
  }

  return response.json();
}

// ═══════════════════════════════════════════════════════════
// USER INFO
// ═══════════════════════════════════════════════════════════

type GoogleUserInfo = {
  id: string;
  email: string;
  verified_email: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
};

/**
 * Get user info from Google using access token
 */
export async function getGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get user info from Google');
  }

  return response.json();
}

// ═══════════════════════════════════════════════════════════
// ACCOUNT LINKING
// ═══════════════════════════════════════════════════════════

type GoogleAuthResult = {
  success: boolean;
  sessionId?: string;
  user?: SessionUser;
  error?: string;
  isNewUser?: boolean;
};

/**
 * Handle Google OAuth callback - creates or links account
 * Supports school-specific OAuth credentials via the state parameter
 */
export async function handleGoogleCallback(
  code: string,
  redirectUri: string,
  state?: string
): Promise<GoogleAuthResult> {
  try {
    // Parse state to get school ID if present
    const stateData = state ? parseOAuthState(state) : {};
    const schoolId = stateData.schoolId;

    // 1. Exchange code for tokens (using school credentials if available)
    const tokens = await exchangeCodeForTokensWithSchool(code, redirectUri, schoolId);

    // 2. Get user info from Google
    const googleUser = await getGoogleUserInfo(tokens.access_token);

    if (!googleUser.email || !googleUser.verified_email) {
      return { success: false, error: 'Google account email not verified' };
    }

    const db = getDb();

    // 3. Check if this Google account is already linked
    const existingOAuth = await db.query.oauthAccounts.findFirst({
      where: and(
        eq(oauthAccounts.provider, 'google'),
        eq(oauthAccounts.providerAccountId, googleUser.id)
      ),
      with: {
        user: true,
      },
    });

    let userId: string;
    let isNewUser = false;

    if (existingOAuth) {
      // User already has this Google account linked
      userId = existingOAuth.userId;

      // Update tokens
      await db
        .update(oauthAccounts)
        .set({
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token || existingOAuth.refreshToken,
          expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
          updatedAt: new Date(),
        })
        .where(eq(oauthAccounts.id, existingOAuth.id));
    } else {
      // Check if a user with this email already exists
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, googleUser.email.toLowerCase()),
      });

      if (existingUser) {
        // Link Google account to existing user
        userId = existingUser.id;

        await db.insert(oauthAccounts).values({
          userId,
          provider: 'google',
          providerAccountId: googleUser.id,
          email: googleUser.email,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        });
      } else {
        // Create new user
        isNewUser = true;
        const [newUser] = await db
          .insert(users)
          .values({
            email: googleUser.email.toLowerCase(),
            firstName: googleUser.given_name || googleUser.name?.split(' ')[0],
            lastName: googleUser.family_name || googleUser.name?.split(' ').slice(1).join(' '),
            emailVerified: true, // Google has verified the email
            role: 'customer',
          })
          .returning({ id: users.id });

        userId = newUser.id;

        // Link Google account
        await db.insert(oauthAccounts).values({
          userId,
          provider: 'google',
          providerAccountId: googleUser.id,
          email: googleUser.email,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        });
      }
    }

    // 4. Create session
    const sessionId = await createSession(userId);

    // 5. Get user data for response
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
      },
    });

    return {
      success: true,
      sessionId,
      user: user as SessionUser,
      isNewUser,
    };
  } catch (error) {
    console.error('Google OAuth error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'OAuth authentication failed',
    };
  }
}

/**
 * Check if a user has Google OAuth linked
 */
export async function hasGoogleLinked(userId: string): Promise<boolean> {
  const db = getDb();
  const oauth = await db.query.oauthAccounts.findFirst({
    where: and(
      eq(oauthAccounts.userId, userId),
      eq(oauthAccounts.provider, 'google')
    ),
  });
  return !!oauth;
}

/**
 * Unlink Google account from user
 */
export async function unlinkGoogle(userId: string): Promise<void> {
  const db = getDb();
  await db
    .delete(oauthAccounts)
    .where(
      and(
        eq(oauthAccounts.userId, userId),
        eq(oauthAccounts.provider, 'google')
      )
    );
}
