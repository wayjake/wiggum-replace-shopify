// ⚙️ Platform Settings - The control panel for EnrollSage
// "With great configuration comes great responsibility"
//
// ╭────────────────────────────────────────────────────────────╮
// │  PLATFORM CONFIGURATION                                     │
// │  Global settings that affect the entire EnrollSage platform.│
// │  Stripe Connect, email settings, and system configuration. │
// ╰────────────────────────────────────────────────────────────╯

import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { useState } from 'react';
import {
  Settings,
  CreditCard,
  Mail,
  Shield,
  Globe,
  Database,
  Bell,
  Key,
  LogOut,
  Save,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { validateSession, parseSessionCookie, createLogoutCookie } from '../../lib/auth';
import { cn } from '../../utils';

// ═══════════════════════════════════════════════════════════
// SERVER FUNCTIONS
// ═══════════════════════════════════════════════════════════

const getSessionUser = createServerFn({ method: 'GET' }).handler(async () => {
  const request = getRequest();
  const cookieHeader = request?.headers.get('cookie') || '';
  const sessionId = parseSessionCookie(cookieHeader);

  if (!sessionId) {
    return { authenticated: false, user: null };
  }

  const session = await validateSession(sessionId);
  if (!session) {
    return { authenticated: false, user: null };
  }

  return {
    authenticated: true,
    user: session.user,
  };
});

const getSystemStatus = createServerFn({ method: 'GET' }).handler(async () => {
  // Check environment variables to determine what's configured
  const stripeConfigured = !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PUBLIC_KEY);
  const brevoConfigured = !!process.env.BREVO_API_KEY;
  const databaseConfigured = !!process.env.TURSO_DATABASE_URL;
  const googleOAuthConfigured = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  const inngestConfigured = !!(process.env.INNGEST_SIGNING_KEY || process.env.INNGEST_EVENT_KEY);

  return {
    integrations: {
      stripe: { configured: stripeConfigured, status: stripeConfigured ? 'active' : 'not_configured' },
      brevo: { configured: brevoConfigured, status: brevoConfigured ? 'active' : 'not_configured' },
      database: { configured: databaseConfigured, status: databaseConfigured ? 'active' : 'not_configured' },
      googleOAuth: { configured: googleOAuthConfigured, status: googleOAuthConfigured ? 'active' : 'not_configured' },
      inngest: { configured: inngestConfigured, status: inngestConfigured ? 'active' : 'not_configured' },
    },
    platform: {
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    },
  };
});

const logoutUser = createServerFn({ method: 'POST' }).handler(async () => {
  return { cookie: createLogoutCookie() };
});

// ═══════════════════════════════════════════════════════════
// ROUTE DEFINITION
// ═══════════════════════════════════════════════════════════

export const Route = createFileRoute('/super-admin/settings')({
  head: () => ({
    meta: [
      { title: 'Platform Settings | EnrollSage Super Admin' },
      { name: 'description', content: 'Configure EnrollSage platform settings and integrations.' },
    ],
  }),
  loader: async () => {
    const [session, systemStatus] = await Promise.all([
      getSessionUser(),
      getSystemStatus(),
    ]);
    return { ...session, ...systemStatus };
  },
  component: PlatformSettingsPage,
});

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════

function PlatformSettingsPage() {
  const navigate = useNavigate();
  const { authenticated, user, integrations, platform } = Route.useLoaderData();
  const [activeTab, setActiveTab] = useState('integrations');

  // Auth check
  if (!authenticated || !user || user.role !== 'superadmin') {
    navigate({ to: '/login' });
    return null;
  }

  const handleLogout = async () => {
    const result = await logoutUser();
    if (result.cookie) document.cookie = result.cookie;
    navigate({ to: '/login' });
  };

  const tabs = [
    { id: 'integrations', label: 'Integrations', icon: Globe },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'system', label: 'System', icon: Database },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9F6]">
      {/* Top Navigation */}
      <nav className="bg-[#2D4F3E] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#5B7F6D] rounded-lg flex items-center justify-center">
                  <span className="text-lg">🌿</span>
                </div>
                <span className="font-bold text-lg font-display">EnrollSage</span>
              </Link>
              <span className="text-xs bg-white/10 px-2 py-1 rounded">Super Admin</span>
            </div>

            <div className="flex items-center gap-6">
              <Link to="/super-admin" className="text-white/70 hover:text-white text-sm">
                Dashboard
              </Link>
              <Link to="/super-admin/schools" className="text-white/70 hover:text-white text-sm">
                Schools
              </Link>
              <Link to="/super-admin/users" className="text-white/70 hover:text-white text-sm">
                Users
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-white/70 hover:text-white text-sm"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#2D4F3E] font-display flex items-center gap-3">
            <Settings className="w-8 h-8 text-[#5B7F6D]" />
            Platform Settings
          </h1>
          <p className="text-gray-600 mt-1">
            Configure integrations, security, and system settings
          </p>
        </div>

        <div className="flex gap-8">
          {/* Sidebar Tabs */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-xl border border-gray-200 p-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors',
                    activeTab === tab.id
                      ? 'bg-[#5B7F6D] text-white'
                      : 'text-gray-700 hover:bg-gray-50'
                  )}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Platform Info */}
            <div className="mt-6 bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Platform Info</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Version</span>
                  <span className="font-mono text-gray-700">{platform?.version}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Environment</span>
                  <span className={cn(
                    'px-2 py-0.5 rounded text-xs',
                    platform?.environment === 'production'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-amber-100 text-amber-700'
                  )}>
                    {platform?.environment}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1">
            {activeTab === 'integrations' && (
              <div className="space-y-6">
                <IntegrationCard
                  icon={CreditCard}
                  title="Stripe Payments"
                  description="Process payments and manage subscriptions with Stripe Connect"
                  configured={integrations?.stripe?.configured}
                  status={integrations?.stripe?.status}
                  docsUrl="https://stripe.com/docs/connect"
                />

                <IntegrationCard
                  icon={Mail}
                  title="Brevo Email"
                  description="Transactional emails, drip campaigns, and email marketing"
                  configured={integrations?.brevo?.configured}
                  status={integrations?.brevo?.status}
                  docsUrl="https://developers.brevo.com"
                />

                <IntegrationCard
                  icon={Key}
                  title="Google OAuth"
                  description="Allow users to sign in with their Google accounts"
                  configured={integrations?.googleOAuth?.configured}
                  status={integrations?.googleOAuth?.status}
                  docsUrl="https://console.cloud.google.com/apis/credentials"
                />

                <IntegrationCard
                  icon={Database}
                  title="Turso Database"
                  description="SQLite at the edge with Turso for global performance"
                  configured={integrations?.database?.configured}
                  status={integrations?.database?.status}
                  docsUrl="https://turso.tech/docs"
                />

                <IntegrationCard
                  icon={Bell}
                  title="Inngest"
                  description="Event-driven background jobs and workflows"
                  configured={integrations?.inngest?.configured}
                  status={integrations?.inngest?.status}
                  docsUrl="https://www.inngest.com/docs"
                />
              </div>
            )}

            {activeTab === 'security' && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-[#2D4F3E] mb-6">Security Settings</h2>

                <div className="space-y-6">
                  <SettingToggle
                    title="Require Email Verification"
                    description="Users must verify their email address before accessing the platform"
                    enabled={true}
                  />

                  <SettingToggle
                    title="Two-Factor Authentication"
                    description="Require 2FA for all admin and superadmin accounts"
                    enabled={false}
                  />

                  <SettingToggle
                    title="Session Timeout"
                    description="Automatically log out users after 30 days of inactivity"
                    enabled={true}
                  />

                  <SettingToggle
                    title="Rate Limiting"
                    description="Protect against brute force attacks on login endpoints"
                    enabled={true}
                  />
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100">
                  <h3 className="font-medium text-[#2D4F3E] mb-4">Password Policy</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-600">Minimum Length</label>
                      <input
                        type="number"
                        defaultValue={8}
                        className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Require Special Characters</label>
                      <select className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg">
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-[#2D4F3E] mb-6">Notification Settings</h2>

                <div className="space-y-6">
                  <SettingToggle
                    title="New School Signup"
                    description="Receive email when a new school signs up for EnrollSage"
                    enabled={true}
                  />

                  <SettingToggle
                    title="Trial Expiring"
                    description="Get notified when a school's trial is about to expire"
                    enabled={true}
                  />

                  <SettingToggle
                    title="Payment Failed"
                    description="Alert when a school's subscription payment fails"
                    enabled={true}
                  />

                  <SettingToggle
                    title="System Errors"
                    description="Receive alerts for critical system errors"
                    enabled={true}
                  />
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100">
                  <h3 className="font-medium text-[#2D4F3E] mb-4">Notification Email</h3>
                  <input
                    type="email"
                    placeholder="admin@enrollsage.com"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    All platform notifications will be sent to this email
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'system' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-[#2D4F3E] mb-6">System Configuration</h2>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Platform Name</label>
                      <input
                        type="text"
                        defaultValue="EnrollSage"
                        className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700">Support Email</label>
                      <input
                        type="email"
                        defaultValue="support@enrollsage.com"
                        className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700">Default Timezone</label>
                      <select className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg">
                        <option value="America/New_York">Eastern Time</option>
                        <option value="America/Chicago">Central Time</option>
                        <option value="America/Denver">Mountain Time</option>
                        <option value="America/Los_Angeles">Pacific Time</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700">Default Trial Duration</label>
                      <select className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg">
                        <option value="14">14 days</option>
                        <option value="30">30 days</option>
                        <option value="60">60 days</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-[#2D4F3E] mb-4">Maintenance Mode</h2>
                  <p className="text-sm text-gray-600 mb-4">
                    Enable maintenance mode to prevent users from accessing the platform while you perform updates.
                  </p>
                  <SettingToggle
                    title="Enable Maintenance Mode"
                    description="Show maintenance page to all non-superadmin users"
                    enabled={false}
                  />
                </div>

                <div className="bg-amber-50 rounded-xl border border-amber-200 p-6">
                  <h2 className="text-lg font-semibold text-amber-800 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Danger Zone
                  </h2>
                  <p className="text-sm text-amber-700 mb-4">
                    These actions are irreversible. Please proceed with caution.
                  </p>
                  <div className="space-y-3">
                    <button className="text-sm text-amber-700 hover:text-amber-800 underline">
                      Clear all sessions
                    </button>
                    <br />
                    <button className="text-sm text-red-600 hover:text-red-700 underline">
                      Reset platform to defaults
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="mt-8 flex justify-end">
              <button className="flex items-center gap-2 px-6 py-3 bg-[#5B7F6D] text-white rounded-lg hover:bg-[#2D4F3E] transition-colors">
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// HELPER COMPONENTS
// ═══════════════════════════════════════════════════════════

function IntegrationCard({
  icon: Icon,
  title,
  description,
  configured,
  status,
  docsUrl,
}: {
  icon: typeof CreditCard;
  title: string;
  description: string;
  configured?: boolean;
  status?: string;
  docsUrl: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className={cn(
            'w-12 h-12 rounded-lg flex items-center justify-center',
            configured ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
          )}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-[#2D4F3E] flex items-center gap-2">
              {title}
              {configured ? (
                <span className="flex items-center gap-1 text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                  <CheckCircle className="w-3 h-3" />
                  Connected
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                  <AlertTriangle className="w-3 h-3" />
                  Not Configured
                </span>
              )}
            </h3>
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          </div>
        </div>
        <a
          href={docsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-sm text-[#5B7F6D] hover:underline"
        >
          Docs <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {!configured && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            Add the required environment variables to enable this integration. See documentation for setup instructions.
          </p>
        </div>
      )}
    </div>
  );
}

function SettingToggle({
  title,
  description,
  enabled,
}: {
  title: string;
  description: string;
  enabled: boolean;
}) {
  const [isEnabled, setIsEnabled] = useState(enabled);

  return (
    <div className="flex items-start justify-between">
      <div>
        <h4 className="font-medium text-[#2D4F3E]">{title}</h4>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <button
        onClick={() => setIsEnabled(!isEnabled)}
        className={cn(
          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
          isEnabled ? 'bg-[#5B7F6D]' : 'bg-gray-200'
        )}
      >
        <span
          className={cn(
            'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
            isEnabled ? 'translate-x-6' : 'translate-x-1'
          )}
        />
      </button>
    </div>
  );
}
