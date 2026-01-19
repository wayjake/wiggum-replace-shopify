// 🌳 Root Layout - The foundation of our soap empire
// "Hi, Super Nintendo Chalmers!" - Ralph greeting every page render

import { HeadContent, Scripts, createRootRoute, Outlet, Link, ErrorComponent, redirect } from '@tanstack/react-router';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';
import { TanStackDevtools } from '@tanstack/react-devtools';
import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { CartProvider } from '../lib/cart';
import { CsrfProvider } from '../lib/csrf-react';
import { Home, ShoppingBag, RefreshCw, AlertTriangle } from 'lucide-react';
import { isEnvConfigured } from '../lib/env';
import { generateCsrfToken, createCsrfCookie, parseCsrfCookie } from '../lib/csrf.server';

import appCss from '../styles.css?url';

// ═══════════════════════════════════════════════════════════
// ENV CHECK - Redirect to /install if not configured
// "I sleep in a drawer!" - Ralph, when env vars are missing
// ═══════════════════════════════════════════════════════════

const checkEnvConfiguration = createServerFn({ method: 'GET' })
  .handler(async () => {
    return { configured: isEnvConfigured() };
  });

// ═══════════════════════════════════════════════════════════
// CSRF TOKEN - Generate or reuse existing token
// "I'm a unitard!" - Ralph, on secure tokens
// ═══════════════════════════════════════════════════════════

const getCsrfToken = createServerFn({ method: 'GET' })
  .handler(async () => {
    const request = getRequest();
    const cookieHeader = request?.headers.get('cookie') || '';

    // Check if we already have a valid CSRF token in cookies
    const existingToken = parseCsrfCookie(cookieHeader);
    if (existingToken) {
      return { token: existingToken, cookie: null };
    }

    // Generate a new token
    const token = generateCsrfToken();
    const cookie = createCsrfCookie(token);

    return { token, cookie };
  });

export const Route = createRootRoute({
  notFoundComponent: NotFoundPage,
  errorComponent: ErrorPage,
  loader: async () => {
    // 🛡️ Get or generate CSRF token for the session
    const csrfResult = await getCsrfToken();
    return { csrfToken: csrfResult.token, csrfCookie: csrfResult.cookie };
  },
  beforeLoad: async ({ location }) => {
    // Skip the check for the install page itself to avoid infinite redirect
    if (location.pathname === '/install' || location.pathname.startsWith('/install')) {
      return;
    }

    // Also skip for API routes
    if (location.pathname.startsWith('/api')) {
      return;
    }

    // Check env configuration - do this outside try/catch so redirect propagates
    let envResult: { configured: boolean } | null = null;
    try {
      envResult = await checkEnvConfiguration();
    } catch (error) {
      // If env check fails, log and continue (don't block the app)
      console.warn('Env check failed:', error);
      return;
    }

    // 🚨 Redirect to install page if env vars are missing
    if (envResult && !envResult.configured) {
      throw redirect({ to: '/install' });
    }
  },
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: "Karen's Beautiful Soap | Handcrafted Luxury" },
      {
        name: 'description',
        content: 'Discover artisanal handcrafted soaps made with natural ingredients. Lavender, honey oat, rose petal, and more luxurious varieties for gentle, nourishing skincare.',
      },
      // Open Graph
      { property: 'og:type', content: 'website' },
      { property: 'og:title', content: "Karen's Beautiful Soap" },
      { property: 'og:description', content: 'Handcrafted luxury soaps made with natural ingredients' },
      // Theme color for browsers
      { name: 'theme-color', content: '#2D5A4A' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', href: '/favicon.ico' },
      // Google Fonts - Playfair Display for headings, Karla for body
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Karla:wght@400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap',
      },
    ],
  }),

  shellComponent: RootDocument,
  component: RootLayout,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="bg-[#FDFCFB] text-[#1A1A1A] font-sans antialiased">
        {children}
        <TanStackDevtools
          config={{ position: 'bottom-right' }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  );
}

function RootLayout() {
  const { csrfToken, csrfCookie } = Route.useLoaderData();

  // 🍪 Set the CSRF cookie if we generated a new token
  // This runs client-side on initial render
  if (typeof document !== 'undefined' && csrfCookie) {
    document.cookie = csrfCookie;
  }

  return (
    <CsrfProvider initialToken={csrfToken}>
      <CartProvider>
        <Outlet />
      </CartProvider>
    </CsrfProvider>
  );
}

// ═══════════════════════════════════════════════════════════
// 404 PAGE - When soap seekers lose their way
// "I'm Idaho!" - Ralph, when asked where he is
// ═══════════════════════════════════════════════════════════

function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        {/* Sad soap illustration */}
        <div className="mb-8">
          <div className="w-32 h-32 mx-auto relative">
            {/* Soap bubble that popped */}
            <div className="absolute inset-0 rounded-full border-4 border-dashed border-[#D4A574]/50 animate-pulse" />
            <div className="absolute inset-4 bg-[#F5EBE0] rounded-full flex items-center justify-center">
              <span className="text-6xl">🧼</span>
            </div>
            {/* Floating question mark */}
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#2D5A4A] rounded-full flex items-center justify-center text-white font-bold">
              ?
            </div>
          </div>
        </div>

        {/* Error number with style */}
        <div className="mb-4">
          <span className="text-8xl font-bold text-[#2D5A4A]/20 font-display">
            404
          </span>
        </div>

        <h1 className="text-2xl font-bold text-[#1A1A1A] mb-4 font-display">
          Page Not Found
        </h1>

        <p className="text-gray-600 mb-8">
          Looks like this page slipped away like a bar of soap!
          Don't worry, we'll help you find your way back.
        </p>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 bg-[#2D5A4A] text-white px-6 py-3 rounded-lg hover:bg-[#1A1A1A] transition-colors font-medium"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>
          <Link
            to="/shop"
            className="inline-flex items-center justify-center gap-2 border-2 border-[#D4A574] text-[#1A1A1A] px-6 py-3 rounded-lg hover:bg-[#D4A574] hover:text-white transition-colors font-medium"
          >
            <ShoppingBag className="w-4 h-4" />
            Browse Shop
          </Link>
        </div>

        {/* Helpful links */}
        <div className="mt-12 pt-8 border-t border-[#F5EBE0]">
          <p className="text-sm text-gray-500 mb-4">Looking for something specific?</p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link to="/about" className="text-[#2D5A4A] hover:underline">
              Our Story
            </Link>
            <span className="text-gray-300">•</span>
            <Link to="/contact" className="text-[#2D5A4A] hover:underline">
              Contact Us
            </Link>
            <span className="text-gray-300">•</span>
            <Link to="/account" className="text-[#2D5A4A] hover:underline">
              My Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ERROR PAGE - When things go sideways
// "The pointy kitty took it!" - Ralph, blaming errors
// ═══════════════════════════════════════════════════════════

function ErrorPage({ error, reset }: { error: Error; reset?: () => void }) {
  // Check if we're in development
  const isDev = import.meta.env.DEV;

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        {/* Error illustration */}
        <div className="mb-8">
          <div className="w-32 h-32 mx-auto relative">
            <div className="absolute inset-0 bg-red-100 rounded-full animate-pulse" />
            <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center shadow-lg">
              <AlertTriangle className="w-12 h-12 text-red-500" />
            </div>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-[#1A1A1A] mb-4 font-display">
          Oops! Something Went Wrong
        </h1>

        <p className="text-gray-600 mb-6">
          Don't worry, it's not you - it's us. Our soap-making elves are working
          on fixing this issue.
        </p>

        {/* Show error details in development */}
        {isDev && error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
            <p className="text-sm font-mono text-red-700 break-words">
              {error.message}
            </p>
            {error.stack && (
              <pre className="mt-2 text-xs font-mono text-red-600 overflow-auto max-h-32">
                {error.stack}
              </pre>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {reset && (
            <button
              onClick={reset}
              className="inline-flex items-center justify-center gap-2 bg-[#2D5A4A] text-white px-6 py-3 rounded-lg hover:bg-[#1A1A1A] transition-colors font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          )}
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 border-2 border-[#D4A574] text-[#1A1A1A] px-6 py-3 rounded-lg hover:bg-[#D4A574] hover:text-white transition-colors font-medium"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>
        </div>

        {/* Contact support */}
        <div className="mt-12 pt-8 border-t border-[#F5EBE0]">
          <p className="text-sm text-gray-500 mb-2">Need help?</p>
          <Link to="/contact" className="text-[#2D5A4A] hover:underline text-sm">
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}
