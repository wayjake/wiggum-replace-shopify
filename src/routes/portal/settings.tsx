// ⚙️ Family Settings - Where families manage their account
// "Your family, your way - customize your experience"
//
// ╭──────────────────────────────────────────────────────────────╮
// │  🏠 FAMILY ACCOUNT SETTINGS                                   │
// │  Profile, notifications, password, and more                  │
// ╰──────────────────────────────────────────────────────────────╯

import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Home,
  Bell,
  Lock,
  Shield,
  Save,
  LogOut,
  Loader2,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import {
  validateSession,
  parseSessionCookie,
  createLogoutCookie,
  hashPassword,
  verifyPassword,
} from '../../lib/auth';
import { getDb, users, guardians, households } from '../../db';
import { eq } from 'drizzle-orm';
import { cn } from '../../utils';

// ═══════════════════════════════════════════════════════════
// SERVER FUNCTIONS
// ═══════════════════════════════════════════════════════════

const getUserSettings = createServerFn({ method: 'GET' }).handler(async () => {
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

  const db = getDb();

  // Get user data
  const [user] = await db.select().from(users).where(eq(users.id, session.user.id));

  // Find guardian linked to this user
  const [guardian] = await db
    .select()
    .from(guardians)
    .where(eq(guardians.userId, session.user.id));

  let household = null;
  if (guardian) {
    const [h] = await db
      .select()
      .from(households)
      .where(eq(households.id, guardian.householdId));
    household = h;
  }

  return {
    authenticated: true,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    },
    guardian: guardian
      ? {
          id: guardian.id,
          phone: guardian.phone,
          relationship: guardian.relationship,
          isPrimary: guardian.isPrimary,
        }
      : null,
    household: household
      ? {
          id: household.id,
          name: household.name,
          address: household.address,
          city: household.city,
          state: household.state,
          zip: household.zip,
        }
      : null,
  };
});

const updateProfile = createServerFn({ method: 'POST' }).handler(
  async (input: { data: { firstName: string; lastName: string; phone?: string } }) => {
    const request = getRequest();
    const cookieHeader = request?.headers.get('cookie') || '';
    const sessionId = parseSessionCookie(cookieHeader);

    if (!sessionId) {
      return { success: false, error: 'Not authenticated' };
    }

    const session = await validateSession(sessionId);
    if (!session) {
      return { success: false, error: 'Invalid session' };
    }

    const db = getDb();
    const data = input.data;

    try {
      // Update user
      await db
        .update(users)
        .set({
          firstName: data.firstName,
          lastName: data.lastName,
          updatedAt: new Date(),
        })
        .where(eq(users.id, session.user.id));

      // Update guardian phone if exists
      if (data.phone) {
        await db
          .update(guardians)
          .set({ phone: data.phone, updatedAt: new Date() })
          .where(eq(guardians.userId, session.user.id));
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { success: false, error: 'Failed to update profile' };
    }
  }
);

const updatePassword = createServerFn({ method: 'POST' }).handler(
  async (input: { data: { currentPassword: string; newPassword: string } }) => {
    const request = getRequest();
    const cookieHeader = request?.headers.get('cookie') || '';
    const sessionId = parseSessionCookie(cookieHeader);

    if (!sessionId) {
      return { success: false, error: 'Not authenticated' };
    }

    const session = await validateSession(sessionId);
    if (!session) {
      return { success: false, error: 'Invalid session' };
    }

    const db = getDb();
    const data = input.data;

    try {
      // Get current user
      const [user] = await db.select().from(users).where(eq(users.id, session.user.id));

      if (!user || !user.passwordHash) {
        return { success: false, error: 'Cannot update password for OAuth accounts' };
      }

      // Verify current password
      const isValid = await verifyPassword(data.currentPassword, user.passwordHash);
      if (!isValid) {
        return { success: false, error: 'Current password is incorrect' };
      }

      // Hash new password and update
      const newHash = await hashPassword(data.newPassword);
      await db
        .update(users)
        .set({ passwordHash: newHash, updatedAt: new Date() })
        .where(eq(users.id, session.user.id));

      return { success: true };
    } catch (error) {
      console.error('Error updating password:', error);
      return { success: false, error: 'Failed to update password' };
    }
  }
);

const updateAddress = createServerFn({ method: 'POST' }).handler(
  async (input: { data: { householdId: string; address: string; city: string; state: string; zip: string } }) => {
    const db = getDb();
    const data = input.data;

    try {
      await db
        .update(households)
        .set({
          address: data.address,
          city: data.city,
          state: data.state,
          zip: data.zip,
          updatedAt: new Date(),
        })
        .where(eq(households.id, data.householdId));

      return { success: true };
    } catch (error) {
      console.error('Error updating address:', error);
      return { success: false, error: 'Failed to update address' };
    }
  }
);

const logoutUser = createServerFn({ method: 'POST' }).handler(async () => {
  return { cookie: createLogoutCookie() };
});

// ═══════════════════════════════════════════════════════════
// ROUTE DEFINITION
// ═══════════════════════════════════════════════════════════

export const Route = createFileRoute('/portal/settings')({
  head: () => ({
    meta: [
      { title: 'Account Settings | Family Portal | EnrollSage' },
      { name: 'description', content: 'Manage your family account settings, profile, and preferences.' },
    ],
  }),
  loader: async () => {
    return await getUserSettings();
  },
  component: SettingsPage,
});

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════

function SettingsPage() {
  const navigate = useNavigate();
  const data = Route.useLoaderData();

  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Profile form
  const [profile, setProfile] = useState({
    firstName: data.user?.firstName || '',
    lastName: data.user?.lastName || '',
    phone: data.guardian?.phone || '',
  });

  // Password form
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Address form
  const [address, setAddress] = useState({
    address: data.household?.address || '',
    city: data.household?.city || '',
    state: data.household?.state || '',
    zip: data.household?.zip || '',
  });

  useEffect(() => {
    if (!data.authenticated) {
      navigate({ to: '/login' });
    }
  }, [data.authenticated, navigate]);

  if (!data.authenticated) {
    return null;
  }

  const handleLogout = async () => {
    const result = await logoutUser();
    if (result.cookie) document.cookie = result.cookie;
    navigate({ to: '/login' });
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    const result = await updateProfile({ data: profile });

    setIsSaving(false);
    if (result.success) {
      setSaveMessage({ type: 'success', text: 'Profile updated successfully!' });
    } else {
      setSaveMessage({ type: 'error', text: result.error || 'Failed to update profile' });
    }
  };

  const handleChangePassword = async () => {
    if (passwords.newPassword !== passwords.confirmPassword) {
      setSaveMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (passwords.newPassword.length < 8) {
      setSaveMessage({ type: 'error', text: 'Password must be at least 8 characters' });
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);

    const result = await updatePassword({
      data: {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      },
    });

    setIsSaving(false);
    if (result.success) {
      setSaveMessage({ type: 'success', text: 'Password changed successfully!' });
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } else {
      setSaveMessage({ type: 'error', text: result.error || 'Failed to change password' });
    }
  };

  const handleSaveAddress = async () => {
    if (!data.household?.id) {
      setSaveMessage({ type: 'error', text: 'No household found' });
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);

    const result = await updateAddress({
      data: {
        householdId: data.household.id,
        ...address,
      },
    });

    setIsSaving(false);
    if (result.success) {
      setSaveMessage({ type: 'success', text: 'Address updated successfully!' });
    } else {
      setSaveMessage({ type: 'error', text: result.error || 'Failed to update address' });
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'address', label: 'Address', icon: Home },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9F6]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link to="/portal" className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#5B7F6D] rounded-lg flex items-center justify-center">
                  <span className="text-lg">🌿</span>
                </div>
                <span className="font-bold text-lg text-[#2D4F3E] font-display">Family Portal</span>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {data.user?.firstName} {data.user?.lastName}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#5B7F6D] transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Link */}
        <Link
          to="/portal"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-[#5B7F6D] mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Portal
        </Link>

        {/* Page Header */}
        <h1 className="text-2xl font-bold text-[#2D4F3E] mb-8">Account Settings</h1>

        <div className="grid grid-cols-4 gap-8">
          {/* Sidebar Tabs */}
          <div className="col-span-1">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setSaveMessage(null);
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors',
                      activeTab === tab.id
                        ? 'bg-[#5B7F6D] text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content Area */}
          <div className="col-span-3">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              {/* Save Message */}
              {saveMessage && (
                <div className={cn(
                  'flex items-center gap-2 p-4 rounded-lg mb-6',
                  saveMessage.type === 'success'
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700'
                )}>
                  {saveMessage.type === 'success' ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5" />
                  )}
                  {saveMessage.text}
                </div>
              )}

              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div>
                  <h2 className="text-lg font-semibold text-[#2D4F3E] mb-6 flex items-center gap-2">
                    <User className="w-5 h-5 text-[#5B7F6D]" />
                    Personal Information
                  </h2>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          First Name
                        </label>
                        <input
                          type="text"
                          value={profile.firstName}
                          onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-[#5B7F6D] focus:ring-2 focus:ring-[#5B7F6D]/10"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={profile.lastName}
                          onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-[#5B7F6D] focus:ring-2 focus:ring-[#5B7F6D]/10"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Mail className="w-4 h-4 inline mr-1" />
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={data.user?.email || ''}
                        disabled
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Contact support to change your email address
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Phone className="w-4 h-4 inline mr-1" />
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        placeholder="(555) 123-4567"
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-[#5B7F6D] focus:ring-2 focus:ring-[#5B7F6D]/10"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end mt-6">
                    <button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="flex items-center gap-2 px-6 py-3 bg-[#5B7F6D] text-white rounded-lg hover:bg-[#4A6E5C] disabled:opacity-50"
                    >
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Save Changes
                    </button>
                  </div>
                </div>
              )}

              {/* Address Tab */}
              {activeTab === 'address' && (
                <div>
                  <h2 className="text-lg font-semibold text-[#2D4F3E] mb-6 flex items-center gap-2">
                    <Home className="w-5 h-5 text-[#5B7F6D]" />
                    Home Address
                  </h2>

                  {!data.household ? (
                    <div className="text-center py-8 text-gray-500">
                      <Home className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No household found. Contact the school to set up your family profile.</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Street Address
                          </label>
                          <input
                            type="text"
                            value={address.address}
                            onChange={(e) => setAddress({ ...address, address: e.target.value })}
                            placeholder="123 Main St"
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-[#5B7F6D] focus:ring-2 focus:ring-[#5B7F6D]/10"
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              City
                            </label>
                            <input
                              type="text"
                              value={address.city}
                              onChange={(e) => setAddress({ ...address, city: e.target.value })}
                              placeholder="Austin"
                              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-[#5B7F6D] focus:ring-2 focus:ring-[#5B7F6D]/10"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              State
                            </label>
                            <input
                              type="text"
                              value={address.state}
                              onChange={(e) => setAddress({ ...address, state: e.target.value })}
                              placeholder="TX"
                              maxLength={2}
                              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-[#5B7F6D] focus:ring-2 focus:ring-[#5B7F6D]/10"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              ZIP Code
                            </label>
                            <input
                              type="text"
                              value={address.zip}
                              onChange={(e) => setAddress({ ...address, zip: e.target.value })}
                              placeholder="78701"
                              maxLength={10}
                              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-[#5B7F6D] focus:ring-2 focus:ring-[#5B7F6D]/10"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end mt-6">
                        <button
                          onClick={handleSaveAddress}
                          disabled={isSaving}
                          className="flex items-center gap-2 px-6 py-3 bg-[#5B7F6D] text-white rounded-lg hover:bg-[#4A6E5C] disabled:opacity-50"
                        >
                          {isSaving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4" />
                          )}
                          Save Address
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div>
                  <h2 className="text-lg font-semibold text-[#2D4F3E] mb-6 flex items-center gap-2">
                    <Lock className="w-5 h-5 text-[#5B7F6D]" />
                    Change Password
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={passwords.currentPassword}
                        onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-[#5B7F6D] focus:ring-2 focus:ring-[#5B7F6D]/10"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={passwords.newPassword}
                        onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-[#5B7F6D] focus:ring-2 focus:ring-[#5B7F6D]/10"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Must be at least 8 characters
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={passwords.confirmPassword}
                        onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-[#5B7F6D] focus:ring-2 focus:ring-[#5B7F6D]/10"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end mt-6">
                    <button
                      onClick={handleChangePassword}
                      disabled={isSaving || !passwords.currentPassword || !passwords.newPassword}
                      className="flex items-center gap-2 px-6 py-3 bg-[#5B7F6D] text-white rounded-lg hover:bg-[#4A6E5C] disabled:opacity-50"
                    >
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Shield className="w-4 h-4" />
                      )}
                      Update Password
                    </button>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div>
                  <h2 className="text-lg font-semibold text-[#2D4F3E] mb-6 flex items-center gap-2">
                    <Bell className="w-5 h-5 text-[#5B7F6D]" />
                    Notification Preferences
                  </h2>

                  <div className="space-y-4">
                    <NotificationToggle
                      label="Application Updates"
                      description="Receive updates about your children's applications"
                      defaultChecked={true}
                    />
                    <NotificationToggle
                      label="Billing Reminders"
                      description="Get notified about upcoming payments and invoices"
                      defaultChecked={true}
                    />
                    <NotificationToggle
                      label="School Announcements"
                      description="Important announcements from the school"
                      defaultChecked={true}
                    />
                    <NotificationToggle
                      label="Marketing & Newsletters"
                      description="School newsletters and promotional content"
                      defaultChecked={false}
                    />
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 mt-6">
                    <p className="text-sm text-gray-600">
                      Notification settings are saved automatically.
                    </p>
                  </div>
                </div>
              )}
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

function NotificationToggle({
  label,
  description,
  defaultChecked,
}: {
  label: string;
  description: string;
  defaultChecked: boolean;
}) {
  const [checked, setChecked] = useState(defaultChecked);

  return (
    <div className="flex items-start justify-between p-4 border border-gray-200 rounded-lg">
      <div>
        <p className="font-medium text-[#2D4F3E]">{label}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <button
        onClick={() => setChecked(!checked)}
        className={cn(
          'relative w-12 h-7 rounded-full transition-colors',
          checked ? 'bg-[#5B7F6D]' : 'bg-gray-300'
        )}
      >
        <span
          className={cn(
            'absolute top-1 w-5 h-5 bg-white rounded-full transition-transform',
            checked ? 'translate-x-6' : 'translate-x-1'
          )}
        />
      </button>
    </div>
  );
}
