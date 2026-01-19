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
    const sessionStatus = await checkSession();
    return { isAuthenticated: sessionStatus.authenticated, user: sessionStatus.authenticated ? sessionStatus.user : null };
  },
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = Route.useLoaderData();
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
