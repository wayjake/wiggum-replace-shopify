// 🎯 Add New Lead - Capturing the spark of interest
// "Every great enrollment journey starts with a single inquiry"
//
// ╭────────────────────────────────────────────────────────────╮
// │  NEW LEAD FORM                                              │
// │  Capture prospective family information and track them     │
// │  through the admissions pipeline.                          │
// ╰────────────────────────────────────────────────────────────╯

import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { useState, useEffect } from 'react';
import {
  UserPlus,
  ArrowLeft,
  User,
  Mail,
  Phone,
  Users,
  Calendar,
  GraduationCap,
  MessageSquare,
  Globe,
  LogOut,
  AlertCircle,
} from 'lucide-react';
import { requireAdmin } from '../../../lib/auth-guards';
import { getDb, leads, schools } from '../../../db';
import { eq } from 'drizzle-orm';
import { cn } from '../../../utils';
import { createLogoutCookie } from '../../../lib/auth';

// ═══════════════════════════════════════════════════════════
// SERVER FUNCTIONS
// ═══════════════════════════════════════════════════════════

const getSchoolData = createServerFn({ method: 'GET' }).handler(async () => {
  const db = getDb();

  // For now, get the first school. In a real multi-tenant setup,
  // we'd get this from the admin's session
  const [school] = await db.select().from(schools).limit(1);

  return {
    school: school ? {
      id: school.id,
      name: school.name,
      currentSchoolYear: school.currentSchoolYear || '2025-2026',
      gradesOffered: school.gradesOffered ? JSON.parse(school.gradesOffered) : [],
    } : null,
  };
});

const createLead = createServerFn({ method: 'POST' }).handler(
  async (input: {
    data: {
      schoolId: string;
      firstName: string;
      lastName: string;
      email?: string;
      phone?: string;
      source?: string;
      sourceDetail?: string;
      interestedGrades?: string[];
      interestedSchoolYear?: string;
      numberOfStudents?: number;
      notes?: string;
    };
  }) => {
    const { data } = input;
    const db = getDb();

    try {
      const [newLead] = await db
        .insert(leads)
        .values({
          schoolId: data.schoolId,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email || null,
          phone: data.phone || null,
          source: data.source as any || 'website',
          sourceDetail: data.sourceDetail || null,
          interestedGrades: data.interestedGrades ? JSON.stringify(data.interestedGrades) : null,
          interestedSchoolYear: data.interestedSchoolYear || null,
          numberOfStudents: data.numberOfStudents || 1,
          notes: data.notes || null,
          stage: 'inquiry',
        })
        .returning({ id: leads.id });

      return { success: true, leadId: newLead.id };
    } catch (error) {
      console.error('Create lead error:', error);
      return { success: false, error: 'Failed to create lead' };
    }
  }
);

const logoutUser = createServerFn({ method: 'POST' }).handler(async () => {
  return { cookie: createLogoutCookie() };
});

// ═══════════════════════════════════════════════════════════
// ROUTE DEFINITION
// ═══════════════════════════════════════════════════════════

export const Route = createFileRoute('/admin/leads/new')({
  head: () => ({
    meta: [
      { title: 'Add Lead | School Dashboard | EnrollSage' },
      { name: 'description', content: 'Add a new prospective family lead.' },
    ],
  }),
  loader: async () => {
    const [authResult, schoolData] = await Promise.all([
      requireAdmin(),
      getSchoolData(),
    ]);
    return { authResult, ...schoolData };
  },
  component: AddLeadPage,
});

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════

function AddLeadPage() {
  const navigate = useNavigate();
  const { authResult, school } = Route.useLoaderData();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [source, setSource] = useState('website');
  const [sourceDetail, setSourceDetail] = useState('');
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
  const [interestedSchoolYear, setInterestedSchoolYear] = useState(school?.currentSchoolYear || '2025-2026');
  const [numberOfStudents, setNumberOfStudents] = useState(1);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!authResult.authenticated || !authResult.isAdmin) {
      navigate({ to: authResult.redirect || '/login' });
    }
  }, [authResult, navigate]);

  if (!authResult.authenticated || !authResult.isAdmin) {
    return (
      <div className="min-h-screen bg-[#F8F9F6] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#5B7F6D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleLogout = async () => {
    const result = await logoutUser();
    if (result.cookie) document.cookie = result.cookie;
    navigate({ to: '/login' });
  };

  const toggleGrade = (grade: string) => {
    setSelectedGrades((prev) =>
      prev.includes(grade) ? prev.filter((g) => g !== grade) : [...prev, grade]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!firstName.trim() || !lastName.trim()) {
      setError('First name and last name are required');
      return;
    }

    if (!school) {
      setError('No school configured');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createLead({
        data: {
          schoolId: school.id,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          source,
          sourceDetail: sourceDetail.trim() || undefined,
          interestedGrades: selectedGrades.length > 0 ? selectedGrades : undefined,
          interestedSchoolYear,
          numberOfStudents,
          notes: notes.trim() || undefined,
        },
      });

      if (!result.success) {
        setError(result.error || 'Failed to create lead');
        setIsSubmitting(false);
        return;
      }

      // Navigate to leads list
      navigate({ to: '/admin/leads' });
    } catch (err) {
      console.error('Submit error:', err);
      setError('An unexpected error occurred');
      setIsSubmitting(false);
    }
  };

  const grades = school?.gradesOffered?.length > 0
    ? school.gradesOffered
    : ['PK', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

  const sources = [
    { value: 'website', label: 'Website Inquiry' },
    { value: 'referral', label: 'Referral' },
    { value: 'event', label: 'Event / Open House' },
    { value: 'social', label: 'Social Media' },
    { value: 'advertisement', label: 'Advertisement' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9F6]">
      {/* Admin Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link to="/" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#5B7F6D] rounded-lg flex items-center justify-center">
                  <span className="text-xl">🌿</span>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-[#2D4F3E] font-display">School Dashboard</h1>
                  <p className="text-xs text-gray-500">{school?.name || 'EnrollSage'}</p>
                </div>
              </Link>
            </div>
            <nav className="flex items-center gap-6">
              <Link to="/admin" className="text-gray-600 hover:text-[#5B7F6D]">Dashboard</Link>
              <Link to="/admin/applications" className="text-gray-600 hover:text-[#5B7F6D]">Applications</Link>
              <Link to="/admin/leads" className="text-[#5B7F6D] font-medium">Leads</Link>
              <Link to="/admin/families" className="text-gray-600 hover:text-[#5B7F6D]">Families</Link>
              <button onClick={handleLogout} className="flex items-center gap-1 text-gray-500 hover:text-[#5B7F6D] text-sm">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {/* Back Link */}
        <Link
          to="/admin/leads"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-[#5B7F6D] mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Leads
        </Link>

        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-[#2D4F3E] font-display flex items-center gap-3">
            <UserPlus className="w-7 h-7 text-[#5B7F6D]" />
            Add New Lead
          </h2>
          <p className="text-gray-600 mt-1">
            Capture information about a prospective family
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-8 space-y-8">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold text-[#2D4F3E] mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-[#5B7F6D]" />
              Contact Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-[#5B7F6D] focus:ring-2 focus:ring-[#5B7F6D]/10"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Smith"
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-[#5B7F6D] focus:ring-2 focus:ring-[#5B7F6D]/10"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-1" /> Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john.smith@email.com"
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
          </div>

          {/* Lead Source */}
          <div>
            <h3 className="text-lg font-semibold text-[#2D4F3E] mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5 text-[#5B7F6D]" />
              Lead Source
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {sources.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setSource(s.value)}
                  className={cn(
                    'px-4 py-3 rounded-lg border text-sm font-medium transition-colors',
                    source === s.value
                      ? 'bg-[#5B7F6D] text-white border-[#5B7F6D]'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-[#5B7F6D]'
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {(source === 'referral' || source === 'event' || source === 'other') && (
              <div className="mt-4">
                <label htmlFor="sourceDetail" className="block text-sm font-medium text-gray-700 mb-2">
                  {source === 'referral' ? 'Referred by' : source === 'event' ? 'Event name' : 'Details'}
                </label>
                <input
                  type="text"
                  id="sourceDetail"
                  value={sourceDetail}
                  onChange={(e) => setSourceDetail(e.target.value)}
                  placeholder={
                    source === 'referral'
                      ? 'Smith Family'
                      : source === 'event'
                      ? 'Spring Open House 2025'
                      : 'How did they hear about us?'
                  }
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-[#5B7F6D] focus:ring-2 focus:ring-[#5B7F6D]/10"
                />
              </div>
            )}
          </div>

          {/* Interest */}
          <div>
            <h3 className="text-lg font-semibold text-[#2D4F3E] mb-4 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-[#5B7F6D]" />
              Student Interest
            </h3>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="numberOfStudents" className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="w-4 h-4 inline mr-1" /> Number of Students
                </label>
                <select
                  id="numberOfStudents"
                  value={numberOfStudents}
                  onChange={(e) => setNumberOfStudents(parseInt(e.target.value))}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-[#5B7F6D]"
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n} student{n !== 1 ? 's' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="schoolYear" className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" /> Interested School Year
                </label>
                <select
                  id="schoolYear"
                  value={interestedSchoolYear}
                  onChange={(e) => setInterestedSchoolYear(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-[#5B7F6D]"
                >
                  <option value="2024-2025">2024-2025</option>
                  <option value="2025-2026">2025-2026</option>
                  <option value="2026-2027">2026-2027</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Interested Grades
              </label>
              <div className="flex flex-wrap gap-2">
                {grades.map((grade: string) => (
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
            </div>
          </div>

          {/* Notes */}
          <div>
            <h3 className="text-lg font-semibold text-[#2D4F3E] mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#5B7F6D]" />
              Notes
            </h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional information about this lead..."
              rows={4}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-[#5B7F6D] focus:ring-2 focus:ring-[#5B7F6D]/10"
            />
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-100">
            <Link
              to="/admin/leads"
              className="text-gray-600 hover:text-[#5B7F6D]"
            >
              Cancel
            </Link>
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
                  <UserPlus className="w-4 h-4" />
                  Add Lead
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
