// 🏫 Root Layout - The foundation of a modern school platform
// "From first inquiry to tuition paid—without spreadsheets, PDFs, or duct tape."

import { HeadContent, Scripts, createRootRoute, Outlet, Link, ErrorComponent, redirect } from '@tanstack/react-router';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';
import { TanStackDevtools } from '@tanstack/react-devtools';
import { createServerFn } from '@tanstack/react-start';
import { getRequest, setResponseHeader } from '@tanstack/react-start/server';
import { CsrfProvider } from '../lib/csrf-react';
import { Home, RefreshCw, AlertTriangle } from 'lucide-react';
import { isEnvConfigured } from '../lib/env';
import { generateCsrfToken, createCsrfCookie, parseCsrfCookie, validateCsrfToken } from '../lib/csrf.server';

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
    if (existingToken && validateCsrfToken(existingToken)) {
      // 🔒 Only reuse the token if it's still valid (signature checks out)
      return { token: existingToken, cookie: null };
    }

    // Generate a new token (either no existing token or it's invalid)
    const token = generateCsrfToken();
    const cookie = createCsrfCookie(token);

    // 🍪 Try to set the cookie via response header
    // Also return the cookie for client-side fallback
    try {
      setResponseHeader('Set-Cookie', cookie);
    } catch (e) {
      // Response headers might already be sent in some cases
      console.warn('Could not set CSRF cookie via header:', e);
    }

    return { token, cookie };
  });

export const Route = createRootRoute({
  notFoundComponent: NotFoundPage,
  errorComponent: ErrorPage,
  loader: async () => {
    // 🛡️ Get or generate CSRF token for the session
    // The cookie is set via response header, with client-side fallback
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

    // 🔧 TEMPORARILY DISABLED - env check causes "serverFn is not a function" on client navigation
    // TODO: Fix this properly - the env check should only run server-side
    // Check env configuration - do this outside try/catch so redirect propagates
    // let envResult: { configured: boolean } | null = null;
    // try {
    //   envResult = await checkEnvConfiguration();
    // } catch (error) {
    //   // If env check fails, log and continue (don't block the app)
    //   console.warn('Env check failed:', error);
    //   return;
    // }

    // // 🚨 Redirect to install page if env vars are missing
    // if (envResult && !envResult.configured) {
    //   throw redirect({ to: '/install' });
    // }
  },
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Enrollsy | Modern School Enrollment & Payments' },
      {
        name: 'description',
        content: 'The modern front door for private schools. From first inquiry to tuition paid—admissions, enrollment, and billing in one clean system.',
      },
      // Open Graph
      { property: 'og:type', content: 'website' },
      { property: 'og:title', content: 'Enrollsy | Modern School Enrollment' },
      { property: 'og:description', content: 'From first inquiry to tuition paid—without spreadsheets, PDFs, or duct tape.' },
      // Theme color for browsers - Academic Navy
      { name: 'theme-color', content: '#1F2A44' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', href: '/favicon.ico' },
      // Google Fonts - Libre Baskerville (academic) + Inter (modern UI)
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Libre+Baskerville:wght@400;700&display=swap',
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
      <body className="bg-[#F7F5F2] text-[#1E1E1E] font-sans antialiased">
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

  // 🍪 Set the CSRF cookie client-side as fallback
  // The cookie should also be set server-side via setResponseHeader
  // This double approach ensures the cookie is always available
  if (typeof document !== 'undefined' && csrfCookie) {
    document.cookie = csrfCookie;
  }

  return (
    <CsrfProvider initialToken={csrfToken}>
      <Outlet />
    </CsrfProvider>
  );
}

// ═══════════════════════════════════════════════════════════
// 404 PAGE - Page not found
// Professional, calm, institutional
// ═══════════════════════════════════════════════════════════

function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#F7F5F2] flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        {/* Simple, professional illustration */}
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto bg-white rounded-lg shadow-sm border border-gray-200 flex items-center justify-center">
            <span className="text-4xl">🎓</span>
          </div>
        </div>

        {/* Error number with style */}
        <div className="mb-4">
          <span className="text-7xl font-bold text-[#1F2A44]/10 font-display">
            404
          </span>
        </div>

        <h1 className="text-2xl font-bold text-[#1E1E1E] mb-4 font-display">
          Page Not Found
        </h1>

        <p className="text-[#5F6368] mb-8">
          The page you're looking for doesn't exist or has been moved.
          Let's get you back on track.
        </p>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 bg-[#2F5D50] text-white px-6 py-3 rounded-md hover:bg-[#234840] transition-colors font-medium"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>
          <Link
            to="/contact"
            className="inline-flex items-center justify-center gap-2 border border-[#1F2A44] text-[#1F2A44] px-6 py-3 rounded-md hover:bg-[#1F2A44] hover:text-white transition-colors font-medium"
          >
            Contact Support
          </Link>
        </div>

        {/* Helpful links */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-[#5F6368] mb-4">Looking for something specific?</p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link to="/about" className="text-[#2F5D50] hover:underline">
              About Us
            </Link>
            <span className="text-gray-300">•</span>
            <Link to="/contact" className="text-[#2F5D50] hover:underline">
              Contact
            </Link>
            <span className="text-gray-300">•</span>
            <Link to="/login" className="text-[#2F5D50] hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ERROR PAGE - Something went wrong
// Professional error handling, not cutesy
// ═══════════════════════════════════════════════════════════

function ErrorPage({ error, reset }: { error: Error; reset?: () => void }) {
  const isDev = import.meta.env.DEV;

  return (
    <div className="min-h-screen bg-[#F7F5F2] flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        {/* Error illustration - muted, not alarming */}
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto bg-white rounded-lg shadow-sm border border-gray-200 flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-[#9C2F2F]" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-[#1E1E1E] mb-4 font-display">
          Something Went Wrong
        </h1>

        <p className="text-[#5F6368] mb-6">
          We encountered an unexpected error. Our team has been notified
          and is working to resolve the issue.
        </p>

        {/* Show error details in development */}
        {isDev && error && (
          <div className="mb-6 p-4 bg-red-50 border border-[#9C2F2F]/20 rounded-md text-left">
            <p className="text-sm font-mono text-[#9C2F2F] break-words">
              {error.message}
            </p>
            {error.stack && (
              <pre className="mt-2 text-xs font-mono text-[#9C2F2F]/70 overflow-auto max-h-32">
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
              className="inline-flex items-center justify-center gap-2 bg-[#2F5D50] text-white px-6 py-3 rounded-md hover:bg-[#234840] transition-colors font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          )}
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 border border-[#1F2A44] text-[#1F2A44] px-6 py-3 rounded-md hover:bg-[#1F2A44] hover:text-white transition-colors font-medium"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>
        </div>

        {/* Contact support */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-[#5F6368] mb-2">Need assistance?</p>
          <Link to="/contact" className="text-[#2F5D50] hover:underline text-sm">
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}
