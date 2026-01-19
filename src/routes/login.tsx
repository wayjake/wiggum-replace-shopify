// 🔐 Login Page - The door to your soap kingdom
// "I'm Idaho!" - Ralph, logging in successfully
//
// ╭────────────────────────────────────────────────────────────╮
// │  🛡️ RATE LIMITED!                                          │
// │  5 attempts per 15 minutes, 1 hour block after exceeding.  │
// │  Protects against brute force attacks on accounts.         │
// ╰────────────────────────────────────────────────────────────╯

import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react';
import { cn } from '../utils';
import {
  authenticateUser,
  createSession,
  createSessionCookie,
  validateSession,
  parseSessionCookie,
} from '../lib/auth';
import { getRequest } from '@tanstack/react-start/server';
import {
  checkRateLimit,
  resetRateLimit,
  getClientIP,
  loginRateLimit,
} from '../lib/rate-limit';
import { validateCsrfForRequest } from '../lib/csrf.server';
import { useCsrf } from '../lib/csrf-react';
import { isGoogleOAuthConfigured } from '../lib/google-oauth';

// ═══════════════════════════════════════════════════════════
// SERVER FUNCTIONS - The authentication gatekeepers
// "I'm Idaho!" - Ralph, successfully authenticated
// ═══════════════════════════════════════════════════════════

const loginUser = createServerFn({ method: 'POST' })
  .handler(async (data: { email: string; password: string; csrfToken?: string }) => {
    const { email, password, csrfToken } = data;

    // 🛡️ CSRF validation - protect against cross-site request forgery
    const request = getRequest();
    const csrfResult = validateCsrfForRequest(request, csrfToken);
    if (!csrfResult.valid) {
      return { success: false, error: csrfResult.error || 'Invalid security token' };
    }

    // 🛡️ Rate limiting - protect against brute force attacks
    const clientIP = request ? getClientIP(request) : 'unknown';
    const rateLimitKey = `login:${clientIP}`;

    const rateLimitResult = checkRateLimit(rateLimitKey, loginRateLimit);
    if (!rateLimitResult.success) {
      const minutes = Math.ceil(rateLimitResult.resetIn / 60);
      return {
        success: false,
        error: rateLimitResult.blocked
          ? `Too many failed attempts. Please try again in ${minutes} minutes.`
          : `Too many attempts. Please wait ${minutes} minutes before trying again.`,
        rateLimited: true,
        retryAfter: rateLimitResult.resetIn,
      };
    }

    try {
      const user = await authenticateUser(email, password);

      if (!user) {
        // Don't reset rate limit on failure - that's the point!
        return {
          success: false,
          error: 'Invalid email or password',
          remaining: rateLimitResult.remaining,
        };
      }

      // 🎉 Success! Reset rate limit for this IP
      resetRateLimit(rateLimitKey);

      // Create session
      const sessionId = await createSession(user.id);
      const cookie = createSessionCookie(sessionId);

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
        },
        cookie,
      };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'An error occurred during login' };
    }
  });

const checkSession = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const request = getRequest();
    const cookieHeader = request?.headers.get('cookie') || '';
    const sessionId = parseSessionCookie(cookieHeader);

    if (!sessionId) {
      return { authenticated: false };
    }

    const session = await validateSession(sessionId);

    if (!session) {
      return { authenticated: false };
    }

    return {
      authenticated: true,
      user: session.user,
    };
  } catch (error) {
    console.error('Session check error:', error);
    return { authenticated: false };
  }
});

// ═══════════════════════════════════════════════════════════
// ROUTE DEFINITION
// ═══════════════════════════════════════════════════════════

// Check if Google OAuth is available (server function)
const checkGoogleOAuth = createServerFn({ method: 'GET' }).handler(async () => {
  return { enabled: isGoogleOAuthConfigured() };
});

export const Route = createFileRoute('/login')({
  head: () => ({
    meta: [
      { title: "Sign In | Karen's Beautiful Soap" },
      {
        name: 'description',
        content: 'Sign in to your account to track orders, manage payment methods, and more.',
      },
    ],
  }),
  loader: async () => {
    // Check if user is already logged in
    const [sessionStatus, googleOAuth] = await Promise.all([
      checkSession(),
      checkGoogleOAuth(),
    ]);
    return {
      isAuthenticated: sessionStatus.authenticated,
      user: sessionStatus.authenticated ? sessionStatus.user : null,
      googleOAuthEnabled: googleOAuth.enabled,
    };
  },
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user, googleOAuthEnabled } = Route.useLoaderData();
  const { token: csrfToken } = useCsrf();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // If already logged in, redirect based on role
  // 🎭 Admins go to the control room, customers to their portal
  if (isAuthenticated && user) {
    if (user.role === 'admin') {
      navigate({ to: '/admin' });
    } else {
      navigate({ to: '/account' });
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);

    try {
      const result = await loginUser({ email, password, csrfToken: csrfToken || undefined });

      if (!result.success) {
        setError(result.error || 'Login failed');
        setIsLoading(false);
        return;
      }

      // Set the cookie via the response
      if (result.cookie) {
        document.cookie = result.cookie;
      }

      // Redirect based on user role
      // 🎪 The admin show vs the customer experience
      if (result.user?.role === 'admin') {
        navigate({ to: '/admin' });
      } else {
        navigate({ to: '/account' });
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#2D5A4A] text-white p-12 flex-col justify-between">
        <div>
          <Link to="/" className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-2xl">🧼</span>
            </div>
            <span className="text-2xl font-bold font-display">Karen's Beautiful Soap</span>
          </Link>
        </div>

        <div className="max-w-md">
          <h2 className="text-4xl font-bold mb-6 font-display">
            Welcome Back
          </h2>
          <p className="text-white/80 text-lg leading-relaxed">
            Sign in to track your orders, manage your payment methods, and get access to exclusive offers.
          </p>
        </div>

        <div className="text-white/60 text-sm">
          &copy; {new Date().getFullYear()} Karen's Beautiful Soap. Handcrafted with love.
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 text-center">
            <Link to="/" className="inline-flex items-center gap-3">
              <div className="w-10 h-10 bg-[#2D5A4A] rounded-full flex items-center justify-center">
                <span className="text-xl">🧼</span>
              </div>
              <span className="text-xl font-bold text-[#1A1A1A] font-display">Karen's Beautiful Soap</span>
            </Link>
          </div>

          <h1 className="text-3xl font-bold text-[#1A1A1A] mb-2 font-display">
            Sign In
          </h1>
          <p className="text-gray-600 mb-8">
            Enter your credentials to access your account
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-12 pr-4 py-3 rounded-lg border border-[#F5EBE0] focus:outline-none focus:border-[#2D5A4A] focus:ring-2 focus:ring-[#2D5A4A]/10"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-[#2D5A4A] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-3 rounded-lg border border-[#F5EBE0] focus:outline-none focus:border-[#2D5A4A] focus:ring-2 focus:ring-[#2D5A4A]/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-4 rounded-lg font-medium transition-all',
                isLoading
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-[#2D5A4A] text-white hover:bg-[#1A1A1A]'
              )}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Google Sign-in (if configured) */}
            {googleOAuthEnabled && (
              <>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#F5EBE0]" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-[#FDFCFB] text-gray-500">or continue with</span>
                  </div>
                </div>

                <a
                  href="/api/auth/google"
                  className="w-full flex items-center justify-center gap-3 py-3 rounded-lg border border-[#F5EBE0] hover:bg-[#F5EBE0]/50 transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span className="font-medium text-gray-700">Sign in with Google</span>
                </a>
              </>
            )}
          </form>

          {/* Register Link */}
          <p className="mt-8 text-center text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#2D5A4A] font-medium hover:underline">
              Create one
            </Link>
          </p>

          {/* Continue Shopping */}
          <div className="mt-8 pt-8 border-t border-[#F5EBE0] text-center">
            <Link
              to="/shop"
              className="text-gray-500 hover:text-[#2D5A4A] transition-colors"
            >
              Continue shopping as guest
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
