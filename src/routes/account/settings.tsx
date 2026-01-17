// ⚙️ Account Settings - Customize your soap experience
// "I'm a furniture!" - Ralph on personal preferences

import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { User, Mail, Lock, Bell, ChevronRight, Save, LogOut } from 'lucide-react';
import { cn } from '../../utils';

export const Route = createFileRoute('/account/settings')({
  head: () => ({
    meta: [
      { title: "Settings | My Account | Karen's Beautiful Soap" },
      { name: 'description', content: 'Manage your account settings and preferences.' },
    ],
  }),
  component: AccountSettings,
});

// ═══════════════════════════════════════════════════════════
// SAMPLE DATA
// ═══════════════════════════════════════════════════════════

const USER = {
  firstName: 'Sarah',
  lastName: 'Mitchell',
  email: 'sarah@example.com',
  phone: '(503) 555-0123',
};

function AccountSettings() {
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'notifications'>('profile');
  const [formData, setFormData] = useState(USER);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'password', label: 'Password', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ] as const;

  return (
    <div className="min-h-screen bg-[#FDFCFB]">
      {/* Header */}
      <header className="bg-white border-b border-[#F5EBE0]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#2D5A4A] rounded-full flex items-center justify-center">
                <span className="text-xl">🧼</span>
              </div>
              <span className="text-xl font-bold text-[#1A1A1A] font-display">Karen's Beautiful Soap</span>
            </Link>
            <nav className="flex items-center gap-6">
              <Link to="/shop" className="text-gray-600 hover:text-[#2D5A4A]">Shop</Link>
              <Link to="/account" className="text-[#2D5A4A] font-medium">My Account</Link>
              <Link to="/cart" className="text-gray-600 hover:text-[#2D5A4A]">Cart</Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link to="/account" className="hover:text-[#2D5A4A]">My Account</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-[#1A1A1A]">Settings</span>
        </nav>

        <h1 className="text-2xl font-bold text-[#1A1A1A] mb-8 font-display">Account Settings</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Sidebar Tabs */}
          <div className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors',
                  activeTab === tab.id
                    ? 'bg-[#2D5A4A] text-white'
                    : 'text-gray-600 hover:bg-[#F5EBE0]'
                )}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
            <div className="pt-4 mt-4 border-t border-[#F5EBE0]">
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-red-600 hover:bg-red-50 transition-colors">
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="md:col-span-3">
            <div className="bg-white rounded-xl border border-[#F5EBE0] p-6">
              {activeTab === 'profile' && (
                <div>
                  <h2 className="text-lg font-semibold text-[#1A1A1A] mb-6 font-display">Profile Information</h2>
                  <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                        <input
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          className="w-full px-4 py-3 rounded-lg border border-[#F5EBE0] focus:outline-none focus:border-[#2D5A4A]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                        <input
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          className="w-full px-4 py-3 rounded-lg border border-[#F5EBE0] focus:outline-none focus:border-[#2D5A4A]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full pl-12 pr-4 py-3 rounded-lg border border-[#F5EBE0] focus:outline-none focus:border-[#2D5A4A]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-[#F5EBE0] focus:outline-none focus:border-[#2D5A4A]"
                      />
                    </div>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex items-center gap-2 bg-[#2D5A4A] text-white px-6 py-3 rounded-lg hover:bg-[#1A1A1A] transition-colors disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'password' && (
                <div>
                  <h2 className="text-lg font-semibold text-[#1A1A1A] mb-6 font-display">Change Password</h2>
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                      <input
                        type="password"
                        placeholder="Enter your current password"
                        className="w-full px-4 py-3 rounded-lg border border-[#F5EBE0] focus:outline-none focus:border-[#2D5A4A]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                      <input
                        type="password"
                        placeholder="Enter a new password"
                        className="w-full px-4 py-3 rounded-lg border border-[#F5EBE0] focus:outline-none focus:border-[#2D5A4A]"
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        Must be at least 8 characters with a number and uppercase letter
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                      <input
                        type="password"
                        placeholder="Confirm your new password"
                        className="w-full px-4 py-3 rounded-lg border border-[#F5EBE0] focus:outline-none focus:border-[#2D5A4A]"
                      />
                    </div>
                    <button className="flex items-center gap-2 bg-[#2D5A4A] text-white px-6 py-3 rounded-lg hover:bg-[#1A1A1A] transition-colors">
                      <Lock className="w-4 h-4" />
                      Update Password
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div>
                  <h2 className="text-lg font-semibold text-[#1A1A1A] mb-6 font-display">Notification Preferences</h2>
                  <div className="space-y-4">
                    <NotificationToggle
                      label="Order Updates"
                      description="Get notified when your order ships or is delivered"
                      defaultChecked={true}
                    />
                    <NotificationToggle
                      label="Promotions & Sales"
                      description="Be the first to know about special offers and discounts"
                      defaultChecked={true}
                    />
                    <NotificationToggle
                      label="New Products"
                      description="Stay updated when we release new soap varieties"
                      defaultChecked={false}
                    />
                    <NotificationToggle
                      label="Soap Care Tips"
                      description="Receive helpful tips for getting the most from your soaps"
                      defaultChecked={false}
                    />
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

function NotificationToggle({
  label,
  description,
  defaultChecked,
}: {
  label: string;
  description: string;
  defaultChecked: boolean;
}) {
  const [enabled, setEnabled] = useState(defaultChecked);

  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-[#FDFCFB]">
      <div>
        <p className="font-medium text-[#1A1A1A]">{label}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <button
        onClick={() => setEnabled(!enabled)}
        className={cn(
          'relative w-12 h-6 rounded-full transition-colors',
          enabled ? 'bg-[#2D5A4A]' : 'bg-gray-200'
        )}
      >
        <span
          className={cn(
            'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform',
            enabled ? 'left-7' : 'left-1'
          )}
        />
      </button>
    </div>
  );
}
