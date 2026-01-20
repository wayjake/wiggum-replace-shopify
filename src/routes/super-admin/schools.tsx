// 🏫 Schools Management - The heart of our multi-tenant platform
// "Every school has a story, and we help them write the next chapter"
//
// ╭────────────────────────────────────────────────────────────╮
// │  SCHOOL DIRECTORY                                          │
// │  View and manage all schools on the Enrollsy platform.    │
// │  Create new schools, configure settings, monitor usage.    │
// ╰────────────────────────────────────────────────────────────╯

import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { useState } from 'react';
import {
  Building2,
  Search,
  Plus,
  ChevronRight,
  MapPin,
  Phone,
  Mail,
  Users,
  GraduationCap,
  LogOut,
} from 'lucide-react';
import { validateSession, parseSessionCookie, createLogoutCookie } from '../../lib/auth';
import { getDb, schools, households, students, schoolMembers } from '../../db';
import { eq, desc, count } from 'drizzle-orm';
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

const getSchools = createServerFn({ method: 'GET' }).handler(async () => {
  const db = getDb();

  try {
    const schoolList = await db
      .select({
        id: schools.id,
        name: schools.name,
        slug: schools.slug,
        subdomain: schools.subdomain,
        email: schools.email,
        phone: schools.phone,
        city: schools.city,
        state: schools.state,
        status: schools.status,
        currentSchoolYear: schools.currentSchoolYear,
        createdAt: schools.createdAt,
      })
      .from(schools)
      .orderBy(desc(schools.createdAt));

    // Enrich with counts
    const enrichedSchools = await Promise.all(
      schoolList.map(async (school) => {
        const [householdCount] = await db
          .select({ count: count() })
          .from(households)
          .where(eq(households.schoolId, school.id));

        const [studentCount] = await db
          .select({ count: count() })
          .from(students)
          .where(eq(students.schoolId, school.id));

        const [staffCount] = await db
          .select({ count: count() })
          .from(schoolMembers)
          .where(eq(schoolMembers.schoolId, school.id));

        return {
          ...school,
          householdCount: Number(householdCount?.count || 0),
          studentCount: Number(studentCount?.count || 0),
          staffCount: Number(staffCount?.count || 0),
        };
      })
    );

    return { success: true, schools: enrichedSchools };
  } catch (error) {
    console.error('Error fetching schools:', error);
    return { success: false, schools: [] };
  }
});

const logoutUser = createServerFn({ method: 'POST' }).handler(async () => {
  return { cookie: createLogoutCookie() };
});

// ═══════════════════════════════════════════════════════════
// ROUTE DEFINITION
// ═══════════════════════════════════════════════════════════

export const Route = createFileRoute('/super-admin/schools')({
  head: () => ({
    meta: [
      { title: 'Schools | Enrollsy Super Admin' },
      { name: 'description', content: 'View and manage all schools on the Enrollsy platform.' },
    ],
  }),
  loader: async () => {
    const [session, schoolsData] = await Promise.all([
      getSessionUser(),
      getSchools(),
    ]);
    return { ...session, ...schoolsData };
  },
  component: SchoolsPage,
});

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════

function SchoolsPage() {
  const navigate = useNavigate();
  const { authenticated, user, schools: schoolList } = Route.useLoaderData();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // 🚫 Auth check
  if (!authenticated || !user || user.role !== 'superadmin') {
    navigate({ to: '/login' });
    return null;
  }

  const handleLogout = async () => {
    const result = await logoutUser();
    if (result.cookie) document.cookie = result.cookie;
    navigate({ to: '/login' });
  };

  // Filter schools
  const filteredSchools = schoolList.filter((school) => {
    const matchesSearch =
      school.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      school.slug?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      school.city?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || school.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-[#F7F5F2]">
      {/* Top Navigation */}
      <nav className="bg-[#1F2A44] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#2F5D50] rounded-lg flex items-center justify-center">
                  <span className="text-lg">🎓</span>
                </div>
                <span className="font-bold text-lg font-display">Enrollsy</span>
              </Link>
              <span className="text-xs bg-white/10 px-2 py-1 rounded">Super Admin</span>
            </div>

            <div className="flex items-center gap-6">
              <Link to="/super-admin" className="text-white/70 hover:text-white text-sm">Dashboard</Link>
              <Link to="/super-admin/schools" className="text-white text-sm font-medium">Schools</Link>
              <a href="/super-admin/users" className="text-white/70 hover:text-white text-sm">Users</a>
              <button onClick={handleLogout} className="flex items-center gap-2 text-white/70 hover:text-white text-sm">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#1F2A44] font-display flex items-center gap-3">
              <Building2 className="w-8 h-8 text-[#2F5D50]" />
              Schools
            </h1>
            <p className="text-gray-600">{schoolList.length} schools on the platform</p>
          </div>
          <Link
            to="/super-admin/schools/new"
            className="flex items-center gap-2 bg-[#2F5D50] text-white px-4 py-2 rounded-lg hover:bg-[#1F2A44] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create School
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search schools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-[#2F5D50] focus:ring-2 focus:ring-[#2F5D50]/10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-[#2F5D50]"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="trial">Trial</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        {/* Schools List */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {filteredSchools.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {filteredSchools.map((school) => (
                <Link
                  key={school.id}
                  to={`/super-admin/schools/${school.id}`}
                  className="block p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-[#2F5D50] rounded-xl flex items-center justify-center text-white">
                        <Building2 className="w-7 h-7" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-[#1F2A44]">{school.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                          <span className="text-[#2F5D50] font-mono text-xs">/{school.slug}</span>
                          {school.city && school.state && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {school.city}, {school.state}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                          {school.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" /> {school.email}
                            </span>
                          )}
                          {school.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {school.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-right">
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1 text-gray-600">
                            <Users className="w-4 h-4" /> {school.householdCount} families
                          </span>
                          <span className="flex items-center gap-1 text-gray-600">
                            <GraduationCap className="w-4 h-4" /> {school.studentCount} students
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {school.staffCount} staff members • {school.currentSchoolYear}
                        </div>
                      </div>
                      <StatusBadge status={school.status || 'active'} />
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <Building2 className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <h3 className="font-semibold text-gray-700 mb-2">
                {searchQuery || statusFilter !== 'all' ? 'No schools found' : 'No schools yet'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your search or filter'
                  : 'Get started by creating your first school'}
              </p>
              {!searchQuery && statusFilter === 'all' && (
                <Link
                  to="/super-admin/schools/new"
                  className="inline-flex items-center gap-2 bg-[#2F5D50] text-white px-4 py-2 rounded-lg hover:bg-[#1F2A44]"
                >
                  <Plus className="w-4 h-4" />
                  Create School
                </Link>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    trial: 'bg-amber-100 text-amber-700',
    inactive: 'bg-gray-100 text-gray-600',
    suspended: 'bg-red-100 text-red-700',
  };

  return (
    <span className={cn('text-xs px-3 py-1 rounded-full font-medium', styles[status] || 'bg-gray-100 text-gray-600')}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
