// 📝 Register Page - Join the soap family!
// "My cat's breath smells like cat food." - Ralph's password hint (don't use this!)
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
import { getRequest } from '@tanstack/react-start/server';
import {
  checkRateLimit,
  resetRateLimit,
  getClientIP,
  registerRateLimit,
} from '../lib/rate-limit';
import { validateCsrfForRequest } from '../lib/csrf.server';
import { useCsrf } from '../lib/csrf-react';

// ═══════════════════════════════════════════════════════════
// SERVER FUNCTIONS - Creating new soap enthusiasts
// "I bent my wookiee!" - Ralph, creating an account
// ═══════════════════════════════════════════════════════════

const registerUser = createServerFn({ method: 'POST' })
  .handler(async (data: {
    firstName: string;
    lastName?: string;
    email: string;
    password: string;
    marketingConsent: boolean;
    csrfToken?: string;
  }) => {
    const { firstName, lastName, email, password, csrfToken } = data;

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

      return {
        success: true,
        userId,
        cookie,
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
      { title: "Create Account | Karen's Beautiful Soap" },
      {
        name: 'description',
        content: 'Create an account to track orders, save your favorite soaps, and get exclusive offers.',
      },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const { token: csrfToken } = useCsrf();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    marketingConsent: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const updateField = (field: keyof typeof formData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const passwordRequirements = [
    { label: 'At least 8 characters', met: formData.password.length >= 8 },
    { label: 'Contains a number', met: /\d/.test(formData.password) },
    { label: 'Contains uppercase letter', met: /[A-Z]/.test(formData.password) },
  ];

  const isPasswordValid = passwordRequirements.every((req) => req.met);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.firstName || !formData.email || !formData.password) {
      setError('Please fill in all required fields');
      return;
    }

    if (!isPasswordValid) {
      setError('Password does not meet requirements');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const result = await registerUser({
        firstName: formData.firstName,
        lastName: formData.lastName || undefined,
        email: formData.email,
        password: formData.password,
        marketingConsent: formData.marketingConsent,
        csrfToken: csrfToken || undefined,
      });

      if (!result.success) {
        setError(result.error || 'Registration failed');
        setIsLoading(false);
        return;
      }

      // Set the cookie
      if (result.cookie) {
        document.cookie = result.cookie;
      }

      // 🎉 Welcome to the soap family! Redirect to account page
      navigate({ to: '/account' });
    } catch (err) {
      console.error('Registration error:', err);
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
            Join Our Family
          </h2>
          <p className="text-white/80 text-lg leading-relaxed mb-8">
            Create an account to enjoy exclusive benefits:
          </p>
          <ul className="space-y-4">
            {[
              'Track your orders in real-time',
              'Save favorite products',
              'Faster checkout with saved addresses',
              'Exclusive member-only offers',
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
            Create Account
          </h1>
          <p className="text-gray-600 mb-8">
            Join our community of soap lovers
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
                    value={formData.firstName}
                    onChange={(e) => updateField('firstName', e.target.value)}
                    placeholder="Karen"
                    className="w-full pl-12 pr-4 py-3 rounded-lg border border-[#F5EBE0] focus:outline-none focus:border-[#2D5A4A] focus:ring-2 focus:ring-[#2D5A4A]/10"
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
                  value={formData.lastName}
                  onChange={(e) => updateField('lastName', e.target.value)}
                  placeholder="Smith"
                  className="w-full px-4 py-3 rounded-lg border border-[#F5EBE0] focus:outline-none focus:border-[#2D5A4A] focus:ring-2 focus:ring-[#2D5A4A]/10"
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
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-12 pr-4 py-3 rounded-lg border border-[#F5EBE0] focus:outline-none focus:border-[#2D5A4A] focus:ring-2 focus:ring-[#2D5A4A]/10"
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
                  value={formData.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  placeholder="Create a strong password"
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
              {/* Password Requirements */}
              {formData.password && (
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
                  value={formData.confirmPassword}
                  onChange={(e) => updateField('confirmPassword', e.target.value)}
                  placeholder="Confirm your password"
                  className={cn(
                    'w-full pl-12 pr-4 py-3 rounded-lg border focus:outline-none focus:ring-2',
                    formData.confirmPassword && formData.password !== formData.confirmPassword
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                      : 'border-[#F5EBE0] focus:border-[#2D5A4A] focus:ring-[#2D5A4A]/10'
                  )}
                />
              </div>
            </div>

            {/* Marketing Consent */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="marketingConsent"
                checked={formData.marketingConsent}
                onChange={(e) => updateField('marketingConsent', e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-gray-300 text-[#2D5A4A] focus:ring-[#2D5A4A]"
              />
              <label htmlFor="marketingConsent" className="text-sm text-gray-600">
                I'd like to receive soap care tips and exclusive offers via email. You can unsubscribe anytime.
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
                  : 'bg-[#2D5A4A] text-white hover:bg-[#1A1A1A]'
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
              <a href="#" className="text-[#2D5A4A] hover:underline">Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="text-[#2D5A4A] hover:underline">Privacy Policy</a>.
            </p>
          </form>

          {/* Login Link */}
          <p className="mt-8 text-center text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-[#2D5A4A] font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
