// 🏫 School Detail - Deep dive into a single school's world
// "Every school has its own rhythm, we just help them find it"
//
// ╭────────────────────────────────────────────────────────────╮
// │  SCHOOL MANAGEMENT                                          │
// │  View and edit school details, manage staff, monitor usage.│
// │  The nerve center for school-level operations.             │
// ╰────────────────────────────────────────────────────────────╯

import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { useState } from 'react';
import {
  Building2,
  ArrowLeft,
  Edit2,
  Save,
  X,
  MapPin,
  Mail,
  Phone,
  Users,
  GraduationCap,
  Home,
  Calendar,
  Clock,
  LogOut,
  Settings,
  Shield,
  UserPlus,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { validateSession, parseSessionCookie, createLogoutCookie } from '../../../lib/auth';
import { getDb, schools, households, students, schoolMembers, users } from '../../../db';
import { eq, count, desc } from 'drizzle-orm';
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

const getSchoolDetails = createServerFn({ method: 'GET' }).handler(
  async (input: { data: { schoolId: string } }) => {
    const { schoolId } = input.data;
    const db = getDb();

    try {
      // Get school
      const [school] = await db
        .select()
        .from(schools)
        .where(eq(schools.id, schoolId));

      if (!school) {
        return { success: false, error: 'School not found', school: null, stats: null, staff: [] };
      }

      // Get counts
      const [householdCount] = await db
        .select({ count: count() })
        .from(households)
        .where(eq(households.schoolId, schoolId));

      const [studentCount] = await db
        .select({ count: count() })
        .from(students)
        .where(eq(students.schoolId, schoolId));

      // Get staff members
      const staffList = await db
        .select({
          id: schoolMembers.id,
          role: schoolMembers.role,
          status: schoolMembers.status,
          userId: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          acceptedAt: schoolMembers.acceptedAt,
        })
        .from(schoolMembers)
        .innerJoin(users, eq(schoolMembers.userId, users.id))
        .where(eq(schoolMembers.schoolId, schoolId))
        .orderBy(desc(schoolMembers.createdAt));

      return {
        success: true,
        school: {
          ...school,
          gradesOffered: school.gradesOffered ? JSON.parse(school.gradesOffered) : [],
        },
        stats: {
          households: Number(householdCount?.count || 0),
          students: Number(studentCount?.count || 0),
          staff: staffList.length,
        },
        staff: staffList,
      };
    } catch (error) {
      console.error('Get school details error:', error);
      return { success: false, error: 'Failed to load school', school: null, stats: null, staff: [] };
    }
  }
);

const updateSchool = createServerFn({ method: 'POST' }).handler(
  async (input: {
    data: {
      schoolId: string;
      name?: string;
      email?: string;
      phone?: string;
      addressLine1?: string;
      addressLine2?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      status?: string;
      currentSchoolYear?: string;
    };
  }) => {
    const { schoolId, ...updates } = input.data;
    const db = getDb();

    try {
      await db
        .update(schools)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(schools.id, schoolId));

      return { success: true };
    } catch (error) {
      console.error('Update school error:', error);
      return { success: false, error: 'Failed to update school' };
    }
  }
);

const logoutUser = createServerFn({ method: 'POST' }).handler(async () => {
  return { cookie: createLogoutCookie() };
});

// ═══════════════════════════════════════════════════════════
// ROUTE DEFINITION
// ═══════════════════════════════════════════════════════════

export const Route = createFileRoute('/super-admin/schools/$id')({
  head: () => ({
    meta: [
      { title: 'School Details | EnrollSage Super Admin' },
      { name: 'description', content: 'Manage school settings and view usage statistics.' },
    ],
  }),
  loader: async ({ params }) => {
    const [session, schoolData] = await Promise.all([
      getSessionUser(),
      getSchoolDetails({ data: { schoolId: params.id } }),
    ]);
    return { ...session, ...schoolData };
  },
  component: SchoolDetailPage,
});

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════

function SchoolDetailPage() {
  const navigate = useNavigate();
  const { authenticated, user, school, stats, staff, error: loadError } = Route.useLoaderData();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Edit form state
  const [editName, setEditName] = useState(school?.name || '');
  const [editEmail, setEditEmail] = useState(school?.email || '');
  const [editPhone, setEditPhone] = useState(school?.phone || '');
  const [editAddressLine1, setEditAddressLine1] = useState(school?.addressLine1 || '');
  const [editCity, setEditCity] = useState(school?.city || '');
  const [editState, setEditState] = useState(school?.state || '');
  const [editPostalCode, setEditPostalCode] = useState(school?.postalCode || '');
  const [editStatus, setEditStatus] = useState(school?.status || 'trial');

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

  if (!school) {
    return (
      <div className="min-h-screen bg-[#F8F9F6]">
        <nav className="bg-[#2D4F3E] text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link to="/" className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#5B7F6D] rounded-lg flex items-center justify-center">
                  <span className="text-lg">🌿</span>
                </div>
                <span className="font-bold text-lg font-display">EnrollSage</span>
              </Link>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">School Not Found</h2>
            <p className="text-gray-500 mb-6">{loadError || 'The school you are looking for does not exist.'}</p>
            <Link
              to="/super-admin/schools"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#5B7F6D] text-white rounded-lg hover:bg-[#2D4F3E]"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Schools
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const handleSave = async () => {
    setError('');
    setIsSaving(true);

    try {
      const result = await updateSchool({
        data: {
          schoolId: school.id,
          name: editName,
          email: editEmail || undefined,
          phone: editPhone || undefined,
          addressLine1: editAddressLine1 || undefined,
          city: editCity || undefined,
          state: editState || undefined,
          postalCode: editPostalCode || undefined,
          status: editStatus,
        },
      });

      if (!result.success) {
        setError(result.error || 'Failed to save changes');
      } else {
        setIsEditing(false);
        // Refresh the page to show updated data
        window.location.reload();
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditName(school.name);
    setEditEmail(school.email || '');
    setEditPhone(school.phone || '');
    setEditAddressLine1(school.addressLine1 || '');
    setEditCity(school.city || '');
    setEditState(school.state || '');
    setEditPostalCode(school.postalCode || '');
    setEditStatus(school.status || 'trial');
    setError('');
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Link */}
        <Link
          to="/super-admin/schools"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-[#5B7F6D] mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Schools
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-[#5B7F6D] rounded-xl flex items-center justify-center text-white">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              {isEditing ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="text-2xl font-bold text-[#2D4F3E] font-display px-2 py-1 border border-gray-300 rounded-lg"
                />
              ) : (
                <h1 className="text-2xl font-bold text-[#2D4F3E] font-display">{school.name}</h1>
              )}
              <p className="text-gray-500 text-sm font-mono">/{school.slug}</p>
              <StatusBadge status={school.status || 'trial'} />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isEditing ? (
              <>
                <button
                  onClick={cancelEdit}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 bg-[#5B7F6D] text-white rounded-lg hover:bg-[#2D4F3E]"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Changes
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#5B7F6D] text-white rounded-lg hover:bg-[#2D4F3E]"
              >
                <Edit2 className="w-4 h-4" />
                Edit School
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard icon={Home} label="Families" value={stats?.households || 0} />
          <StatCard icon={GraduationCap} label="Students" value={stats?.students || 0} />
          <StatCard icon={Users} label="Staff" value={stats?.staff || 0} />
          <StatCard icon={Calendar} label="School Year" value={school.currentSchoolYear || '—'} isText />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* School Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Info */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-[#2D4F3E] mb-4 flex items-center gap-2">
                <Mail className="w-5 h-5 text-[#5B7F6D]" />
                Contact Information
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 uppercase">Email</label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="info@school.edu"
                      className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg"
                    />
                  ) : (
                    <p className="text-[#2D4F3E]">{school.email || '—'}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase">Phone</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="(512) 555-0100"
                      className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg"
                    />
                  ) : (
                    <p className="text-[#2D4F3E]">{school.phone || '—'}</p>
                  )}
                </div>
              </div>
              <div className="mt-4">
                <label className="text-xs text-gray-500 uppercase">Address</label>
                {isEditing ? (
                  <div className="space-y-2 mt-1">
                    <input
                      type="text"
                      value={editAddressLine1}
                      onChange={(e) => setEditAddressLine1(e.target.value)}
                      placeholder="Street address"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={editCity}
                        onChange={(e) => setEditCity(e.target.value)}
                        placeholder="City"
                        className="px-3 py-2 border border-gray-200 rounded-lg"
                      />
                      <input
                        type="text"
                        value={editState}
                        onChange={(e) => setEditState(e.target.value)}
                        placeholder="State"
                        className="px-3 py-2 border border-gray-200 rounded-lg"
                      />
                      <input
                        type="text"
                        value={editPostalCode}
                        onChange={(e) => setEditPostalCode(e.target.value)}
                        placeholder="ZIP"
                        className="px-3 py-2 border border-gray-200 rounded-lg"
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-[#2D4F3E]">
                    {school.addressLine1 && (
                      <>
                        {school.addressLine1}
                        <br />
                      </>
                    )}
                    {school.city && school.state && (
                      <>
                        {school.city}, {school.state} {school.postalCode}
                      </>
                    )}
                    {!school.addressLine1 && !school.city && '—'}
                  </p>
                )}
              </div>
            </div>

            {/* Staff Members */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[#2D4F3E] flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#5B7F6D]" />
                  Staff Members
                </h2>
                <button className="flex items-center gap-1 text-sm text-[#5B7F6D] hover:underline">
                  <UserPlus className="w-4 h-4" />
                  Invite Staff
                </button>
              </div>

              {staff && staff.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {staff.map((member: any) => (
                    <div key={member.id} className="py-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">
                            {member.firstName?.charAt(0)}{member.lastName?.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-[#2D4F3E]">
                            {member.firstName} {member.lastName}
                          </p>
                          <p className="text-sm text-gray-500">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <RoleBadge role={member.role || 'readonly'} />
                        <MemberStatusBadge status={member.status || 'pending'} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No staff members yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status & Settings */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-[#2D4F3E] mb-4 flex items-center gap-2">
                <Settings className="w-4 h-4 text-[#5B7F6D]" />
                Account Status
              </h3>

              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-500 uppercase">Status</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg"
                    >
                      <option value="trial">Trial</option>
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status</span>
                    <StatusBadge status={school.status || 'trial'} />
                  </div>
                  {school.trialEndsAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Trial Ends</span>
                      <span className="text-sm font-medium text-[#2D4F3E]">
                        {new Date(school.trialEndsAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Created</span>
                    <span className="text-sm text-gray-500">
                      {school.createdAt ? new Date(school.createdAt).toLocaleDateString() : '—'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Grades Offered */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-[#2D4F3E] mb-4 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-[#5B7F6D]" />
                Grades Offered
              </h3>
              {school.gradesOffered && school.gradesOffered.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {school.gradesOffered.map((grade: string) => (
                    <span
                      key={grade}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                    >
                      {grade}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No grades configured</p>
              )}
            </div>

            {/* Danger Zone */}
            <div className="bg-red-50 rounded-xl border border-red-200 p-6">
              <h3 className="font-semibold text-red-700 mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Danger Zone
              </h3>
              <button className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700">
                <Trash2 className="w-4 h-4" />
                Delete School
              </button>
              <p className="text-xs text-red-500 mt-2">
                This action cannot be undone. All data will be permanently deleted.
              </p>
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

function StatCard({
  icon: Icon,
  label,
  value,
  isText = false,
}: {
  icon: typeof Users;
  label: string;
  value: number | string;
  isText?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#5B7F6D]/10 rounded-lg flex items-center justify-center text-[#5B7F6D]">
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className={cn('font-bold text-[#2D4F3E]', isText ? 'text-lg' : 'text-2xl')}>
            {value}
          </p>
          <p className="text-sm text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    trial: 'bg-amber-100 text-amber-700',
    suspended: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-600',
  };

  return (
    <span className={cn('text-xs px-3 py-1 rounded-full font-medium inline-block mt-1', styles[status] || 'bg-gray-100 text-gray-600')}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    owner: 'bg-purple-100 text-purple-700',
    admin: 'bg-blue-100 text-blue-700',
    admissions: 'bg-green-100 text-green-700',
    business_office: 'bg-amber-100 text-amber-700',
    readonly: 'bg-gray-100 text-gray-600',
  };

  const labels: Record<string, string> = {
    owner: 'Owner',
    admin: 'Admin',
    admissions: 'Admissions',
    business_office: 'Business Office',
    readonly: 'Read Only',
  };

  return (
    <span className={cn('text-xs px-2 py-1 rounded-full', styles[role] || 'bg-gray-100 text-gray-600')}>
      {labels[role] || role}
    </span>
  );
}

function MemberStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    pending: 'bg-amber-100 text-amber-700',
    deactivated: 'bg-gray-100 text-gray-500',
  };

  return (
    <span className={cn('text-xs px-2 py-1 rounded-full', styles[status] || 'bg-gray-100 text-gray-600')}>
      {status}
    </span>
  );
}
