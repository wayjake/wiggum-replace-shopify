// 📝 Register Page - Join the EnrollSage family portal
// For parents who want to track their family's enrollment status
//
// ╭────────────────────────────────────────────────────────────╮
// │  🛡️ RATE LIMITED!                                          │
// │  3 attempts per hour, 24 hour block after exceeding.       │
// │  Prevents mass account creation by bad actors.             │
// ╰────────────────────────────────────────────────────────────╯

import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Check } from 'lucide-react';
import { cn } from '../utils';
import { createUser, createSession, createSessionCookie, getUserByEmail } from '../lib/auth';
import { getRequest, setResponseHeader } from '@tanstack/react-start/server';
import {
  checkRateLimit,
  resetRateLimit,
  getClientIP,
  registerRateLimit,
} from '../lib/rate-limit';
import { validateCsrfForRequest } from '../lib/csrf.server';
import { useCsrf } from '../lib/csrf-react';

// ═══════════════════════════════════════════════════════════
// SERVER FUNCTIONS - Creating new family accounts
// ═══════════════════════════════════════════════════════════

const registerUser = createServerFn({ method: 'POST' })
  .handler(async (input: { data: {
    firstName: string;
    lastName?: string;
    email: string;
    password: string;
    marketingConsent: boolean;
    csrfToken?: string;
  } }) => {
    const { firstName, lastName, email, password, csrfToken } = input.data;

    // 🛡️ CSRF validation - protect against cross-site request forgery
    const request = getRequest();
    const csrfResult = validateCsrfForRequest(request, csrfToken);
    if (!csrfResult.valid) {
      return { success: false, error: csrfResult.error || 'Invalid security token' };
    }

    // 🛡️ Rate limiting - prevent mass account creation
    const clientIP = request ? getClientIP(request) : 'unknown';
    const rateLimitKey = `register:${clientIP}`;

    const rateLimitResult = checkRateLimit(rateLimitKey, registerRateLimit);
    if (!rateLimitResult.success) {
      const hours = Math.ceil(rateLimitResult.resetIn / 3600);
      return {
        success: false,
        error: rateLimitResult.blocked
          ? `Too many registration attempts. Please try again in ${hours} hours.`
          : `Too many attempts. Please wait before trying again.`,
        rateLimited: true,
        retryAfter: rateLimitResult.resetIn,
      };
    }

    try {
      // Check if user already exists
      const existingUser = await getUserByEmail(email);
      if (existingUser) {
        return { success: false, error: 'An account with this email already exists' };
      }

      // Create the user
      const userId = await createUser({
        email,
        password,
        firstName,
        lastName,
        role: 'customer',
      });

      // 🎉 Success! Reset rate limit for this IP
      resetRateLimit(rateLimitKey);

      // Create session
      const sessionId = await createSession(userId);
      const cookie = createSessionCookie(sessionId);

      // 🍪 Set the session cookie via response header (required for HttpOnly cookies)
      try {
        setResponseHeader('Set-Cookie', cookie);
      } catch (e) {
        console.warn('Could not set session cookie via header:', e);
      }

      return {
        success: true,
        userId,
        cookie, // Also return for client-side fallback
      };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'An error occurred during registration' };
    }
  });

// ═══════════════════════════════════════════════════════════
// ROUTE DEFINITION
// ═══════════════════════════════════════════════════════════

export const Route = createFileRoute('/register')({
  head: () => ({
    meta: [
      { title: 'Create Account | EnrollSage' },
      {
        name: 'description',
        content: 'Create a family account to manage your children\'s school applications and enrollment.',
      },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const { token: csrfToken } = useCsrf();
  // 🌿 Keep password state only for real-time validation UI
  const [passwordValue, setPasswordValue] = useState('');
  const [confirmPasswordValue, setConfirmPasswordValue] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const passwordRequirements = [
    { label: 'At least 8 characters', met: passwordValue.length >= 8 },
    { label: 'Contains a number', met: /\d/.test(passwordValue) },
    { label: 'Contains uppercase letter', met: /[A-Z]/.test(passwordValue) },
  ];

  const isPasswordValid = passwordRequirements.every((req) => req.met);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    // Read values directly from form to capture browser autofill
    const form = e.currentTarget;
    const firstName = (form.elements.namedItem('firstName') as HTMLInputElement).value;
    const lastName = (form.elements.namedItem('lastName') as HTMLInputElement).value;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;
    const confirmPassword = (form.elements.namedItem('confirmPassword') as HTMLInputElement).value;
    const marketingConsent = (form.elements.namedItem('marketingConsent') as HTMLInputElement).checked;

    if (!firstName || !email || !password) {
      setError('Please fill in all required fields');
      return;
    }

    // Re-validate password from form value in case autofill bypassed state
    const passValid = password.length >= 8 && /\d/.test(password) && /[A-Z]/.test(password);
    if (!passValid) {
      setError('Password does not meet requirements');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Get token from context, with cookie fallback
    let tokenToUse = csrfToken;
    if (!tokenToUse && typeof document !== 'undefined') {
      const cookies = document.cookie.split(';').map(c => c.trim());
      const csrfCookie = cookies.find(c => c.startsWith('csrf-token='));
      if (csrfCookie) {
        tokenToUse = csrfCookie.substring('csrf-token='.length);
      }
    }

    setIsLoading(true);

    try {
      const result = await registerUser({ data: {
        firstName,
        lastName: lastName || undefined,
        email,
        password,
        marketingConsent,
        csrfToken: tokenToUse || undefined,
      } });

      if (!result.success) {
        setError(result.error || 'Registration failed');
        setIsLoading(false);
        return;
      }

      // Set the cookie
      if (result.cookie) {
        document.cookie = result.cookie;
      }

      // 🎉 Welcome! Redirect to family portal
      navigate({ to: '/portal' });
    } catch (err) {
      console.error('Registration error:', err);
      setError('An unexpected error occurred');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9F6] flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#5B7F6D] text-white p-12 flex-col justify-between">
        <div>
          <Link to="/" className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-2xl">🌿</span>
            </div>
            <span className="text-2xl font-bold font-display">EnrollSage</span>
          </Link>
        </div>

        <div className="max-w-md">
          <h2 className="text-4xl font-bold mb-6 font-display">
            Family Portal
          </h2>
          <p className="text-white/80 text-lg leading-relaxed mb-8">
            Create an account to manage your family's enrollment:
          </p>
          <ul className="space-y-4">
            {[
              'Track application status in real-time',
              'Submit and manage enrollment documents',
              'View and pay tuition bills online',
              'Communicate with school admissions',
            ].map((benefit, index) => (
              <li key={index} className="flex items-center gap-3">
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4" />
                </div>
                <span className="text-white/90">{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="text-white/60 text-sm">
          &copy; {new Date().getFullYear()} EnrollSage. School enrollment made simple.
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 text-center">
            <Link to="/" className="inline-flex items-center gap-3">
              <div className="w-10 h-10 bg-[#5B7F6D] rounded-full flex items-center justify-center">
                <span className="text-xl">🌿</span>
              </div>
              <span className="text-xl font-bold text-[#2D4F3E] font-display">EnrollSage</span>
            </Link>
          </div>

          <h1 className="text-3xl font-bold text-[#2D4F3E] mb-2 font-display">
            Create Account
          </h1>
          <p className="text-gray-600 mb-8">
            Join to manage your family's enrollment
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    placeholder="Jane"
                    autoComplete="given-name"
                    className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-[#5B7F6D] focus:ring-2 focus:ring-[#5B7F6D]/10"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  placeholder="Smith"
                  autoComplete="family-name"
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-[#5B7F6D] focus:ring-2 focus:ring-[#5B7F6D]/10"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-[#5B7F6D] focus:ring-2 focus:ring-[#5B7F6D]/10"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={passwordValue}
                  onChange={(e) => setPasswordValue(e.target.value)}
                  placeholder="Create a strong password"
                  autoComplete="new-password"
                  className="w-full pl-12 pr-12 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-[#5B7F6D] focus:ring-2 focus:ring-[#5B7F6D]/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {/* Password Requirements */}
              {passwordValue && (
                <div className="mt-2 space-y-1">
                  {passwordRequirements.map((req, index) => (
                    <div
                      key={index}
                      className={cn(
                        'flex items-center gap-2 text-xs',
                        req.met ? 'text-green-600' : 'text-gray-400'
                      )}
                    >
                      <Check className={cn('w-3 h-3', !req.met && 'opacity-0')} />
                      <span>{req.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={confirmPasswordValue}
                  onChange={(e) => setConfirmPasswordValue(e.target.value)}
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  className={cn(
                    'w-full pl-12 pr-4 py-3 rounded-lg border focus:outline-none focus:ring-2',
                    confirmPasswordValue && passwordValue !== confirmPasswordValue
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                      : 'border-gray-200 focus:border-[#5B7F6D] focus:ring-[#5B7F6D]/10'
                  )}
                />
              </div>
            </div>

            {/* Marketing Consent */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="marketingConsent"
                name="marketingConsent"
                className="mt-1 w-4 h-4 rounded border-gray-300 text-[#5B7F6D] focus:ring-[#5B7F6D]"
              />
              <label htmlFor="marketingConsent" className="text-sm text-gray-600">
                I'd like to receive enrollment tips and school updates via email. You can unsubscribe anytime.
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-4 rounded-lg font-medium transition-all',
                isLoading
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-[#5B7F6D] text-white hover:bg-[#2D4F3E]'
              )}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Terms */}
            <p className="text-xs text-gray-500 text-center">
              By creating an account, you agree to our{' '}
              <Link to="/terms" className="text-[#5B7F6D] hover:underline">Terms of Service</Link>
              {' '}and{' '}
              <Link to="/privacy" className="text-[#5B7F6D] hover:underline">Privacy Policy</Link>.
            </p>
          </form>

          {/* Login Link */}
          <p className="mt-8 text-center text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-[#5B7F6D] font-medium hover:underline">
              Sign in
            </Link>
          </p>

          {/* Back to Home */}
          <div className="mt-8 pt-8 border-t border-gray-200 text-center">
            <Link
              to="/"
              className="text-gray-500 hover:text-[#5B7F6D] transition-colors"
            >
              Back to homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
