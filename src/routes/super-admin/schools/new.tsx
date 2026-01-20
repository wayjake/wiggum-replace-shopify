// 🏫 Create New School - Onboarding a new tenant to the platform
// "A new school means new stories waiting to be written"
//
// ╭────────────────────────────────────────────────────────────╮
// │  SCHOOL ONBOARDING                                          │
// │  Create a new school account with all essential settings.  │
// │  Sets up their tenant space and initial configuration.     │
// ╰────────────────────────────────────────────────────────────╯

import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { useState } from 'react';
import {
  Building2,
  ArrowLeft,
  ArrowRight,
  MapPin,
  Mail,
  Phone,
  Globe,
  Calendar,
  LogOut,
  Check,
  AlertCircle,
} from 'lucide-react';
import { validateSession, parseSessionCookie, createLogoutCookie } from '../../../lib/auth';
import { getDb, schools } from '../../../db';
import { eq } from 'drizzle-orm';
import { cn } from '../../../utils';

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

const createSchool = createServerFn({ method: 'POST' }).handler(
  async (input: {
    data: {
      name: string;
      slug: string;
      email?: string;
      phone?: string;
      addressLine1?: string;
      addressLine2?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      currentSchoolYear?: string;
      timezone?: string;
      gradesOffered?: string[];
    };
  }) => {
    const { data } = input;
    const db = getDb();

    try {
      // Check if slug is already taken
      const [existing] = await db
        .select({ id: schools.id })
        .from(schools)
        .where(eq(schools.slug, data.slug.toLowerCase()));

      if (existing) {
        return { success: false, error: 'A school with this URL slug already exists' };
      }

      // Create the school
      const [newSchool] = await db
        .insert(schools)
        .values({
          name: data.name,
          slug: data.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
          email: data.email || null,
          phone: data.phone || null,
          addressLine1: data.addressLine1 || null,
          addressLine2: data.addressLine2 || null,
          city: data.city || null,
          state: data.state || null,
          postalCode: data.postalCode || null,
          currentSchoolYear: data.currentSchoolYear || '2025-2026',
          timezone: data.timezone || 'America/New_York',
          gradesOffered: data.gradesOffered ? JSON.stringify(data.gradesOffered) : null,
          status: 'trial',
          trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        })
        .returning({ id: schools.id });

      return { success: true, schoolId: newSchool.id };
    } catch (error) {
      console.error('Create school error:', error);
      return { success: false, error: 'Failed to create school' };
    }
  }
);

const logoutUser = createServerFn({ method: 'POST' }).handler(async () => {
  return { cookie: createLogoutCookie() };
});

// ═══════════════════════════════════════════════════════════
// ROUTE DEFINITION
// ═══════════════════════════════════════════════════════════

export const Route = createFileRoute('/super-admin/schools/new')({
  head: () => ({
    meta: [
      { title: 'Create School | EnrollSage Super Admin' },
      { name: 'description', content: 'Create a new school on the EnrollSage platform.' },
    ],
  }),
  loader: async () => {
    const session = await getSessionUser();
    return session;
  },
  component: CreateSchoolPage,
});

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════

function CreateSchoolPage() {
  const navigate = useNavigate();
  const { authenticated, user } = Route.useLoaderData();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);

  // Form state
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [currentSchoolYear, setCurrentSchoolYear] = useState('2025-2026');
  const [timezone, setTimezone] = useState('America/New_York');
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);

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

  // Auto-generate slug from name
  const handleNameChange = (value: string) => {
    setName(value);
    if (!slug || slug === generateSlug(name)) {
      setSlug(generateSlug(value));
    }
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('School name is required');
      return;
    }

    if (!slug.trim()) {
      setError('URL slug is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createSchool({
        data: {
          name: name.trim(),
          slug: slug.trim(),
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          addressLine1: addressLine1.trim() || undefined,
          addressLine2: addressLine2.trim() || undefined,
          city: city.trim() || undefined,
          state: state.trim() || undefined,
          postalCode: postalCode.trim() || undefined,
          currentSchoolYear,
          timezone,
          gradesOffered: selectedGrades.length > 0 ? selectedGrades : undefined,
        },
      });

      if (!result.success) {
        setError(result.error || 'Failed to create school');
        setIsSubmitting(false);
        return;
      }

      // Navigate to the new school's page
      navigate({ to: `/super-admin/schools/${result.schoolId}` });
    } catch (err) {
      console.error('Submit error:', err);
      setError('An unexpected error occurred');
      setIsSubmitting(false);
    }
  };

  const grades = ['PK', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

  const toggleGrade = (grade: string) => {
    setSelectedGrades((prev) =>
      prev.includes(grade) ? prev.filter((g) => g !== grade) : [...prev, grade]
    );
  };

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
              <Link to="/super-admin/schools" className="text-white text-sm font-medium">
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

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Link */}
        <Link
          to="/super-admin/schools"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-[#5B7F6D] mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Schools
        </Link>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#2D4F3E] font-display flex items-center gap-3">
            <Building2 className="w-8 h-8 text-[#5B7F6D]" />
            Create New School
          </h1>
          <p className="text-gray-600 mt-1">
            Set up a new school account on the EnrollSage platform
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-4 mb-8">
          {[
            { num: 1, label: 'Basic Info' },
            { num: 2, label: 'Contact' },
            { num: 3, label: 'Settings' },
          ].map((s) => (
            <div key={s.num} className="flex items-center gap-2">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                  step >= s.num
                    ? 'bg-[#5B7F6D] text-white'
                    : 'bg-gray-200 text-gray-500'
                )}
              >
                {step > s.num ? <Check className="w-4 h-4" /> : s.num}
              </div>
              <span
                className={cn(
                  'text-sm',
                  step >= s.num ? 'text-[#2D4F3E] font-medium' : 'text-gray-500'
                )}
              >
                {s.label}
              </span>
              {s.num < 3 && <div className="w-8 h-px bg-gray-300 mx-2" />}
            </div>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  School Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Westlake Academy"
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-[#5B7F6D] focus:ring-2 focus:ring-[#5B7F6D]/10"
                />
              </div>

              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
                  URL Slug *
                </label>
                <div className="flex items-center">
                  <span className="px-4 py-3 bg-gray-100 border border-r-0 border-gray-200 rounded-l-lg text-gray-500 text-sm">
                    enrollsage.com/
                  </span>
                  <input
                    type="text"
                    id="slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="westlake-academy"
                    className="flex-1 px-4 py-3 rounded-r-lg border border-gray-200 focus:outline-none focus:border-[#5B7F6D] focus:ring-2 focus:ring-[#5B7F6D]/10"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  This will be the school's unique URL identifier
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Contact Info */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="w-4 h-4 inline mr-1" /> Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="info@school.edu"
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-[#5B7F6D] focus:ring-2 focus:ring-[#5B7F6D]/10"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="w-4 h-4 inline mr-1" /> Phone
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(512) 555-0100"
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-[#5B7F6D] focus:ring-2 focus:ring-[#5B7F6D]/10"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="address1" className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" /> Address
                </label>
                <input
                  type="text"
                  id="address1"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  placeholder="1234 Education Lane"
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-[#5B7F6D] focus:ring-2 focus:ring-[#5B7F6D]/10"
                />
                <input
                  type="text"
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  placeholder="Suite 100 (optional)"
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-[#5B7F6D] focus:ring-2 focus:ring-[#5B7F6D]/10 mt-2"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Austin"
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-[#5B7F6D] focus:ring-2 focus:ring-[#5B7F6D]/10"
                  />
                </div>
                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                    State
                  </label>
                  <input
                    type="text"
                    id="state"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="TX"
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-[#5B7F6D] focus:ring-2 focus:ring-[#5B7F6D]/10"
                  />
                </div>
                <div>
                  <label htmlFor="postal" className="block text-sm font-medium text-gray-700 mb-2">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    id="postal"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="78701"
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-[#5B7F6D] focus:ring-2 focus:ring-[#5B7F6D]/10"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Settings */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="schoolYear" className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" /> Current School Year
                  </label>
                  <select
                    id="schoolYear"
                    value={currentSchoolYear}
                    onChange={(e) => setCurrentSchoolYear(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-[#5B7F6D]"
                  >
                    <option value="2024-2025">2024-2025</option>
                    <option value="2025-2026">2025-2026</option>
                    <option value="2026-2027">2026-2027</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-2">
                    <Globe className="w-4 h-4 inline mr-1" /> Timezone
                  </label>
                  <select
                    id="timezone"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-[#5B7F6D]"
                  >
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Grades Offered
                </label>
                <div className="flex flex-wrap gap-2">
                  {grades.map((grade) => (
                    <button
                      key={grade}
                      type="button"
                      onClick={() => toggleGrade(grade)}
                      className={cn(
                        'px-4 py-2 rounded-lg border text-sm font-medium transition-colors',
                        selectedGrades.includes(grade)
                          ? 'bg-[#5B7F6D] text-white border-[#5B7F6D]'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-[#5B7F6D]'
                      )}
                    >
                      {grade}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Select all grade levels this school offers
                </p>
              </div>

              {/* Trial Notice */}
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  <strong>Note:</strong> New schools start with a 30-day free trial. After the trial,
                  they'll need to subscribe to continue using EnrollSage.
                </p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-2 text-gray-600 hover:text-[#5B7F6D]"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                disabled={step === 1 && (!name.trim() || !slug.trim())}
                className={cn(
                  'flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors',
                  step === 1 && (!name.trim() || !slug.trim())
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-[#5B7F6D] text-white hover:bg-[#2D4F3E]'
                )}
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  'flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors',
                  isSubmitting
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-[#5B7F6D] text-white hover:bg-[#2D4F3E]'
                )}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Building2 className="w-4 h-4" />
                    Create School
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </main>
    </div>
  );
}
