// ⚙️ School Settings - Configure your enrollment kingdom
// "Every school is unique, and settings let that uniqueness shine"
//
// ╭────────────────────────────────────────────────────────────╮
// │  SCHOOL SETTINGS                                            │
// │  Configure branding, Google OAuth, and other school-wide   │
// │  settings. Only school owners and admins can access.        │
// ╰────────────────────────────────────────────────────────────╯

import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { useState, useEffect } from 'react';
import {
  Settings,
  Key,
  Eye,
  EyeOff,
  Save,
  LogOut,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Palette,
  Building2,
} from 'lucide-react';
import { requireAdmin } from '../../lib/auth-guards';
import { getDb, schools, schoolMembers } from '../../db';
import { eq, and } from 'drizzle-orm';
import { cn } from '../../utils';
import { createLogoutCookie } from '../../lib/auth';

// ═══════════════════════════════════════════════════════════
// SERVER FUNCTIONS
// ═══════════════════════════════════════════════════════════

const getSchoolSettings = createServerFn({ method: 'GET' }).handler(async () => {
  const db = getDb();
  const authResult = await requireAdmin();

  if (!authResult.authenticated || !authResult.isAdmin || !authResult.user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    // Get user's school membership
    const membership = await db.query.schoolMembers.findFirst({
      where: eq(schoolMembers.userId, authResult.user.id),
      with: {
        school: true,
      },
    });

    if (!membership?.school) {
      return { success: false, error: 'No school found' };
    }

    const school = membership.school;

    return {
      success: true,
      school: {
        id: school.id,
        name: school.name,
        slug: school.slug,
        subdomain: school.subdomain,
        email: school.email,
        phone: school.phone,
        primaryColor: school.primaryColor,
        accentColor: school.accentColor,
        logoUrl: school.logoUrl,
        // OAuth - mask the secret but indicate if it's set
        googleClientId: school.googleClientId || '',
        hasGoogleClientSecret: !!school.googleClientSecret,
      },
      userRole: membership.role,
    };
  } catch (error) {
    console.error('Error fetching school settings:', error);
    return { success: false, error: 'Failed to load settings' };
  }
});

const updateGoogleOAuth = createServerFn({ method: 'POST' })
  .handler(async (data: { clientId: string; clientSecret?: string }) => {
    const db = getDb();
    const authResult = await requireAdmin();

    if (!authResult.authenticated || !authResult.isAdmin || !authResult.user) {
      return { success: false, error: 'Unauthorized' };
    }

    try {
      // Get user's school membership
      const membership = await db.query.schoolMembers.findFirst({
        where: and(
          eq(schoolMembers.userId, authResult.user.id),
          eq(schoolMembers.status, 'active')
        ),
      });

      if (!membership) {
        return { success: false, error: 'No school membership found' };
      }

      // Only owner and admin can update OAuth settings
      if (membership.role !== 'owner' && membership.role !== 'admin') {
        return { success: false, error: 'Insufficient permissions' };
      }

      // Build update object
      const updateData: Record<string, unknown> = {
        googleClientId: data.clientId || null,
        updatedAt: new Date(),
      };

      // Only update secret if provided (allows clearing by sending empty string)
      if (data.clientSecret !== undefined) {
        updateData.googleClientSecret = data.clientSecret || null;
      }

      await db
        .update(schools)
        .set(updateData)
        .where(eq(schools.id, membership.schoolId));

      return { success: true };
    } catch (error) {
      console.error('Error updating Google OAuth:', error);
      return { success: false, error: 'Failed to update settings' };
    }
  });

const updateSchoolBranding = createServerFn({ method: 'POST' })
  .handler(async (data: { primaryColor: string; accentColor: string; logoUrl?: string }) => {
    const db = getDb();
    const authResult = await requireAdmin();

    if (!authResult.authenticated || !authResult.isAdmin || !authResult.user) {
      return { success: false, error: 'Unauthorized' };
    }

    try {
      const membership = await db.query.schoolMembers.findFirst({
        where: and(
          eq(schoolMembers.userId, authResult.user.id),
          eq(schoolMembers.status, 'active')
        ),
      });

      if (!membership) {
        return { success: false, error: 'No school membership found' };
      }

      if (membership.role !== 'owner' && membership.role !== 'admin') {
        return { success: false, error: 'Insufficient permissions' };
      }

      await db
        .update(schools)
        .set({
          primaryColor: data.primaryColor,
          accentColor: data.accentColor,
          logoUrl: data.logoUrl || null,
          updatedAt: new Date(),
        })
        .where(eq(schools.id, membership.schoolId));

      return { success: true };
    } catch (error) {
      console.error('Error updating branding:', error);
      return { success: false, error: 'Failed to update branding' };
    }
  });

const logoutUser = createServerFn({ method: 'POST' }).handler(async () => {
  return { cookie: createLogoutCookie() };
});

// ═══════════════════════════════════════════════════════════
// ROUTE DEFINITION
// ═══════════════════════════════════════════════════════════

export const Route = createFileRoute('/admin/settings')({
  head: () => ({
    meta: [
      { title: 'Settings | School Dashboard | Enrollsy' },
      { name: 'description', content: 'Configure your school settings, branding, and integrations.' },
    ],
  }),
  loader: async () => {
    const [authResult, settingsData] = await Promise.all([
      requireAdmin(),
      getSchoolSettings(),
    ]);
    return { authResult, ...settingsData };
  },
  component: SettingsPage,
});

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════

function SettingsPage() {
  const navigate = useNavigate();
  const { authResult, success, school, userRole, error } = Route.useLoaderData();

  // Google OAuth state
  const [googleClientId, setGoogleClientId] = useState('');
  const [googleClientSecret, setGoogleClientSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [oauthSaving, setOauthSaving] = useState(false);
  const [oauthMessage, setOauthMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Branding state
  const [primaryColor, setPrimaryColor] = useState('#2F5D50');
  const [accentColor, setAccentColor] = useState('#1F2A44');
  const [logoUrl, setLogoUrl] = useState('');
  const [brandingSaving, setBrandingSaving] = useState(false);
  const [brandingMessage, setBrandingMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Initialize form with loaded data
  useEffect(() => {
    if (school) {
      setGoogleClientId(school.googleClientId || '');
      setPrimaryColor(school.primaryColor || '#2F5D50');
      setAccentColor(school.accentColor || '#1F2A44');
      setLogoUrl(school.logoUrl || '');
    }
  }, [school]);

  // Handle auth redirects
  useEffect(() => {
    if (!authResult.authenticated || !authResult.isAdmin) {
      navigate({ to: authResult.redirect || '/login' });
    }
  }, [authResult, navigate]);

  if (!authResult.authenticated || !authResult.isAdmin) {
    return (
      <div className="min-h-screen bg-[#F7F5F2] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#2F5D50] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleLogout = async () => {
    const result = await logoutUser();
    if (result.cookie) document.cookie = result.cookie;
    navigate({ to: '/login' });
  };

  const handleSaveOAuth = async () => {
    setOauthSaving(true);
    setOauthMessage(null);

    try {
      const result = await updateGoogleOAuth({
        clientId: googleClientId,
        clientSecret: googleClientSecret || undefined,
      });

      if (result.success) {
        setOauthMessage({ type: 'success', text: 'Google OAuth settings saved!' });
        setGoogleClientSecret(''); // Clear secret from form after save
      } else {
        setOauthMessage({ type: 'error', text: result.error || 'Failed to save' });
      }
    } catch (err) {
      setOauthMessage({ type: 'error', text: 'An error occurred' });
    } finally {
      setOauthSaving(false);
    }
  };

  const handleSaveBranding = async () => {
    setBrandingSaving(true);
    setBrandingMessage(null);

    try {
      const result = await updateSchoolBranding({
        primaryColor,
        accentColor,
        logoUrl: logoUrl || undefined,
      });

      if (result.success) {
        setBrandingMessage({ type: 'success', text: 'Branding settings saved!' });
      } else {
        setBrandingMessage({ type: 'error', text: result.error || 'Failed to save' });
      }
    } catch (err) {
      setBrandingMessage({ type: 'error', text: 'An error occurred' });
    } finally {
      setBrandingSaving(false);
    }
  };

  const canEditSettings = userRole === 'owner' || userRole === 'admin';

  return (
    <div className="min-h-screen bg-[#F7F5F2]">
      {/* Admin Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link to="/" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#2F5D50] rounded-lg flex items-center justify-center">
                  <span className="text-xl">🎓</span>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-[#1F2A44] font-display">School Dashboard</h1>
                  <p className="text-xs text-gray-500">{school?.name || 'Loading...'}</p>
                </div>
              </Link>
            </div>
            <nav className="flex items-center gap-6">
              <Link to="/admin" className="text-gray-600 hover:text-[#2F5D50]">Dashboard</Link>
              <Link to="/admin/applications" className="text-gray-600 hover:text-[#2F5D50]">Applications</Link>
              <Link to="/admin/leads" className="text-gray-600 hover:text-[#2F5D50]">Leads</Link>
              <Link to="/admin/families" className="text-gray-600 hover:text-[#2F5D50]">Families</Link>
              <Link to="/admin/students" className="text-gray-600 hover:text-[#2F5D50]">Students</Link>
              <Link to="/admin/settings" className="text-[#2F5D50] font-medium">Settings</Link>
              <button onClick={handleLogout} className="flex items-center gap-1 text-gray-500 hover:text-[#2F5D50] text-sm">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-[#1F2A44] font-display flex items-center gap-3">
            <Settings className="w-7 h-7 text-[#2F5D50]" />
            School Settings
          </h2>
          <p className="text-gray-600">
            Configure your school's branding, integrations, and preferences.
          </p>
        </div>

        {!success ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">
            {error || 'Failed to load settings'}
          </div>
        ) : (
          <div className="space-y-8">
            {/* School Info Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Building2 className="w-5 h-5 text-[#2F5D50]" />
                <h3 className="font-semibold text-[#1F2A44] font-display">School Information</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Name:</span>
                  <span className="ml-2 font-medium">{school?.name}</span>
                </div>
                <div>
                  <span className="text-gray-500">Slug:</span>
                  <span className="ml-2 font-mono text-[#2F5D50]">/{school?.slug}</span>
                </div>
                <div>
                  <span className="text-gray-500">Your Role:</span>
                  <span className="ml-2 font-medium capitalize">{userRole}</span>
                </div>
                {school?.subdomain && (
                  <div>
                    <span className="text-gray-500">Subdomain:</span>
                    <span className="ml-2 font-mono">{school.subdomain}.enrollsy.com</span>
                  </div>
                )}
              </div>
            </div>

            {/* Google OAuth Settings */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-2">
                <Key className="w-5 h-5 text-[#2F5D50]" />
                <h3 className="font-semibold text-[#1F2A44] font-display">Google Sign-In</h3>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                Allow families and staff to sign in with their Google accounts. You'll need to create OAuth credentials in the{' '}
                <a
                  href="https://console.cloud.google.com/apis/credentials"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#2F5D50] hover:underline inline-flex items-center gap-1"
                >
                  Google Cloud Console <ExternalLink className="w-3 h-3" />
                </a>
              </p>

              {!canEditSettings && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
                  Only school owners and admins can modify OAuth settings.
                </div>
              )}

              {/* Status indicator */}
              <div className="mb-6 p-4 rounded-lg bg-gray-50 border border-gray-200">
                <div className="flex items-center gap-2">
                  {school?.googleClientId && school?.hasGoogleClientSecret ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-green-700">Google OAuth is configured</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-600">Google OAuth is not configured</span>
                    </>
                  )}
                </div>
                {school?.googleClientId && (
                  <p className="text-xs text-gray-500 mt-1 font-mono">
                    Client ID: {school.googleClientId.slice(0, 20)}...
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Client ID
                  </label>
                  <input
                    type="text"
                    value={googleClientId}
                    onChange={(e) => setGoogleClientId(e.target.value)}
                    placeholder="123456789-abc123.apps.googleusercontent.com"
                    disabled={!canEditSettings}
                    className={cn(
                      'w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-[#2F5D50] focus:ring-2 focus:ring-[#2F5D50]/10 font-mono text-sm',
                      !canEditSettings && 'bg-gray-50 cursor-not-allowed'
                    )}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Client Secret
                    {school?.hasGoogleClientSecret && (
                      <span className="text-gray-500 font-normal ml-2">(leave blank to keep current)</span>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type={showSecret ? 'text' : 'password'}
                      value={googleClientSecret}
                      onChange={(e) => setGoogleClientSecret(e.target.value)}
                      placeholder={school?.hasGoogleClientSecret ? '••••••••••••••••' : 'Enter client secret'}
                      disabled={!canEditSettings}
                      className={cn(
                        'w-full px-4 py-3 pr-12 rounded-lg border border-gray-200 focus:outline-none focus:border-[#2F5D50] focus:ring-2 focus:ring-[#2F5D50]/10 font-mono text-sm',
                        !canEditSettings && 'bg-gray-50 cursor-not-allowed'
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecret(!showSecret)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showSecret ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {oauthMessage && (
                  <div className={cn(
                    'p-3 rounded-lg text-sm',
                    oauthMessage.type === 'success'
                      ? 'bg-green-50 border border-green-200 text-green-700'
                      : 'bg-red-50 border border-red-200 text-red-700'
                  )}>
                    {oauthMessage.text}
                  </div>
                )}

                {canEditSettings && (
                  <button
                    onClick={handleSaveOAuth}
                    disabled={oauthSaving}
                    className={cn(
                      'flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors',
                      oauthSaving
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-[#2F5D50] text-white hover:bg-[#1F2A44]'
                    )}
                  >
                    {oauthSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save OAuth Settings
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* OAuth Setup Instructions */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="font-medium text-[#1F2A44] mb-3">Setup Instructions</h4>
                <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
                  <li>Go to the Google Cloud Console and create a new project (or use an existing one)</li>
                  <li>Navigate to "APIs & Services" → "Credentials"</li>
                  <li>Click "Create Credentials" → "OAuth client ID"</li>
                  <li>Select "Web application" as the application type</li>
                  <li>Add your redirect URI: <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">https://yourschool.enrollsy.com/api/auth/google/callback</code></li>
                  <li>Copy the Client ID and Client Secret into the fields above</li>
                </ol>
              </div>
            </div>

            {/* Branding Settings */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-2">
                <Palette className="w-5 h-5 text-[#2F5D50]" />
                <h3 className="font-semibold text-[#1F2A44] font-display">Branding</h3>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                Customize your school's appearance on the enrollment portal.
              </p>

              {!canEditSettings && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
                  Only school owners and admins can modify branding settings.
                </div>
              )}

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Primary Color
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        disabled={!canEditSettings}
                        className="w-12 h-12 rounded-lg border border-gray-200 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        disabled={!canEditSettings}
                        className={cn(
                          'flex-1 px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-[#2F5D50] font-mono text-sm',
                          !canEditSettings && 'bg-gray-50 cursor-not-allowed'
                        )}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Accent Color
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        disabled={!canEditSettings}
                        className="w-12 h-12 rounded-lg border border-gray-200 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        disabled={!canEditSettings}
                        className={cn(
                          'flex-1 px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-[#2F5D50] font-mono text-sm',
                          !canEditSettings && 'bg-gray-50 cursor-not-allowed'
                        )}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logo URL (optional)
                  </label>
                  <input
                    type="url"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://example.com/logo.png"
                    disabled={!canEditSettings}
                    className={cn(
                      'w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-[#2F5D50] focus:ring-2 focus:ring-[#2F5D50]/10 text-sm',
                      !canEditSettings && 'bg-gray-50 cursor-not-allowed'
                    )}
                  />
                </div>

                {/* Preview */}
                <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                  <p className="text-xs text-gray-500 mb-3">Preview</p>
                  <div className="flex items-center gap-4">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                      style={{ backgroundColor: primaryColor }}
                    >
                      🎓
                    </div>
                    <div>
                      <p className="font-semibold" style={{ color: accentColor }}>{school?.name}</p>
                      <p className="text-sm text-gray-500">Enrollment Portal</p>
                    </div>
                  </div>
                </div>

                {brandingMessage && (
                  <div className={cn(
                    'p-3 rounded-lg text-sm',
                    brandingMessage.type === 'success'
                      ? 'bg-green-50 border border-green-200 text-green-700'
                      : 'bg-red-50 border border-red-200 text-red-700'
                  )}>
                    {brandingMessage.text}
                  </div>
                )}

                {canEditSettings && (
                  <button
                    onClick={handleSaveBranding}
                    disabled={brandingSaving}
                    className={cn(
                      'flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors',
                      brandingSaving
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-[#2F5D50] text-white hover:bg-[#1F2A44]'
                    )}
                  >
                    {brandingSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Branding
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
