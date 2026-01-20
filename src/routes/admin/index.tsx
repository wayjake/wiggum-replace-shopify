// 🎛️ School Admin Dashboard - Mission control for enrollment operations
// "Education is the most powerful weapon which you can use to change the world" - Nelson Mandela
//
// ╭────────────────────────────────────────────────────────────╮
// │  🏫 SCHOOL STAFF DASHBOARD                                  │
// │  Admissions directors, business office staff, and school   │
// │  administrators manage their school from here.             │
// ╰────────────────────────────────────────────────────────────╯

import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { useEffect } from 'react';
import {
  Users,
  GraduationCap,
  Home,
  ArrowRight,
  FileText,
  UserPlus,
  Calendar,
  LogOut,
} from 'lucide-react';
import { requireAdmin } from '../../lib/auth-guards';
import { getDb, households, students, applications, leads } from '../../db';
import { eq, desc, count, and, sql } from 'drizzle-orm';
import { cn } from '../../utils';
import { createLogoutCookie } from '../../lib/auth';

// ═══════════════════════════════════════════════════════════
// SERVER FUNCTIONS - Real data from the school database!
// ═══════════════════════════════════════════════════════════

const getDashboardStats = createServerFn({ method: 'GET' }).handler(async () => {
  const db = getDb();

  try {
    // Get total households (families)
    const [householdCount] = await db.select({ count: count() }).from(households);

    // Get total students
    const [studentCount] = await db.select({ count: count() }).from(students);

    // Get enrolled students
    const [enrolledCount] = await db
      .select({ count: count() })
      .from(students)
      .where(eq(students.enrollmentStatus, 'enrolled'));

    // Get pending applications
    const [pendingApps] = await db
      .select({ count: count() })
      .from(applications)
      .where(eq(applications.status, 'submitted'));

    // Get active leads
    const [activeLeads] = await db
      .select({ count: count() })
      .from(leads)
      .where(
        and(
          sql`${leads.stage} != 'converted'`,
          sql`${leads.stage} != 'lost'`
        )
      );

    // Get recent applications
    const recentApplications = await db
      .select({
        id: applications.id,
        studentId: applications.studentId,
        status: applications.status,
        gradeApplyingFor: applications.gradeApplyingFor,
        schoolYear: applications.schoolYear,
        submittedAt: applications.submittedAt,
      })
      .from(applications)
      .orderBy(desc(applications.submittedAt))
      .limit(5);

    // Get student info for each application
    const applicationsWithStudents = await Promise.all(
      recentApplications.map(async (app) => {
        const [student] = await db
          .select({
            firstName: students.firstName,
            lastName: students.lastName,
          })
          .from(students)
          .where(eq(students.id, app.studentId));

        return {
          ...app,
          studentName: student ? `${student.firstName} ${student.lastName}` : 'Unknown',
        };
      })
    );

    // Get recent leads
    const recentLeads = await db
      .select({
        id: leads.id,
        firstName: leads.firstName,
        lastName: leads.lastName,
        email: leads.email,
        stage: leads.stage,
        numberOfStudents: leads.numberOfStudents,
        createdAt: leads.createdAt,
      })
      .from(leads)
      .orderBy(desc(leads.createdAt))
      .limit(5);

    return {
      success: true,
      stats: {
        totalHouseholds: Number(householdCount?.count || 0),
        totalStudents: Number(studentCount?.count || 0),
        enrolledStudents: Number(enrolledCount?.count || 0),
        pendingApplications: Number(pendingApps?.count || 0),
        activeLeads: Number(activeLeads?.count || 0),
      },
      recentApplications: applicationsWithStudents.map((app) => ({
        id: app.id,
        studentName: app.studentName,
        grade: app.gradeApplyingFor,
        schoolYear: app.schoolYear,
        status: app.status || 'draft',
        date: formatRelativeTime(app.submittedAt),
      })),
      recentLeads: recentLeads.map((lead) => ({
        id: lead.id,
        name: `${lead.firstName} ${lead.lastName}`,
        email: lead.email || '',
        stage: lead.stage || 'inquiry',
        students: lead.numberOfStudents || 1,
        date: formatRelativeTime(lead.createdAt),
      })),
    };
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return {
      success: false,
      stats: {
        totalHouseholds: 0,
        totalStudents: 0,
        enrolledStudents: 0,
        pendingApplications: 0,
        activeLeads: 0,
      },
      recentApplications: [],
      recentLeads: [],
    };
  }
});

const logoutUser = createServerFn({ method: 'POST' }).handler(async () => {
  return { cookie: createLogoutCookie() };
});

// Helper for relative time formatting
function formatRelativeTime(date: Date | null | undefined): string {
  if (!date) return 'Unknown';
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return '1 day ago';
  return `${diffDays} days ago`;
}

// ═══════════════════════════════════════════════════════════
// ROUTE DEFINITION
// ═══════════════════════════════════════════════════════════

export const Route = createFileRoute('/admin/')({
  head: () => ({
    meta: [
      { title: 'School Dashboard | Enrollsy' },
      { name: 'description', content: 'Manage your school enrollments, applications, and families.' },
    ],
  }),
  loader: async () => {
    const [authResult, dashboardData] = await Promise.all([
      requireAdmin(),
      getDashboardStats(),
    ]);
    return { authResult, ...dashboardData };
  },
  component: AdminDashboard,
});

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════

function AdminDashboard() {
  const navigate = useNavigate();
  const { authResult, stats, recentApplications, recentLeads } = Route.useLoaderData();

  // Handle auth redirects
  useEffect(() => {
    if (!authResult.authenticated || !authResult.isAdmin) {
      navigate({ to: authResult.redirect || '/login' });
    }
  }, [authResult, navigate]);

  // Don't render if not authenticated/admin
  if (!authResult.authenticated || !authResult.isAdmin) {
    return (
      <div className="min-h-screen bg-[#F7F5F2] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#2F5D50] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleLogout = async () => {
    const result = await logoutUser();
    if (result.cookie) {
      document.cookie = result.cookie;
    }
    navigate({ to: '/login' });
  };

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
                  <p className="text-xs text-gray-500">Westlake Academy</p>
                </div>
              </Link>
            </div>

            {/* Admin Nav */}
            <nav className="flex items-center gap-6">
              <Link to="/admin" className="text-[#2F5D50] font-medium">Dashboard</Link>
              <Link to="/admin/applications" className="text-gray-600 hover:text-[#2F5D50]">Applications</Link>
              <Link to="/admin/leads" className="text-gray-600 hover:text-[#2F5D50]">Leads</Link>
              <Link to="/admin/families" className="text-gray-600 hover:text-[#2F5D50]">Families</Link>
              <Link to="/admin/students" className="text-gray-600 hover:text-[#2F5D50]">Students</Link>
              <Link to="/admin/settings" className="text-gray-600 hover:text-[#2F5D50]">Settings</Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 text-gray-500 hover:text-[#2F5D50] text-sm"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-[#1F2A44] font-display">
            Welcome back, {authResult.user?.firstName || 'Admin'}!
          </h2>
          <p className="text-gray-600">Here's what's happening with your school today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <StatCard
            label="Families"
            value={stats.totalHouseholds.toString()}
            icon={Home}
            color="evergreen"
          />
          <StatCard
            label="Total Students"
            value={stats.totalStudents.toString()}
            icon={Users}
            color="navy"
          />
          <StatCard
            label="Enrolled"
            value={stats.enrolledStudents.toString()}
            icon={GraduationCap}
            color="blue"
          />
          <StatCard
            label="Applications"
            value={stats.pendingApplications.toString()}
            icon={FileText}
            color="amber"
            badge={stats.pendingApplications > 0 ? 'Pending' : undefined}
          />
          <StatCard
            label="Active Leads"
            value={stats.activeLeads.toString()}
            icon={UserPlus}
            color="purple"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Applications */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-[#1F2A44] font-display flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#2F5D50]" />
                Recent Applications
              </h3>
              <a
                href="/admin/applications"
                className="text-sm text-[#2F5D50] hover:underline flex items-center gap-1"
              >
                View all <ArrowRight className="w-4 h-4" />
              </a>
            </div>
            <div className="space-y-4">
              {recentApplications.length > 0 ? recentApplications.map((app) => (
                <div
                  key={app.id}
                  className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                >
                  <div>
                    <p className="font-medium text-[#1F2A44]">{app.studentName}</p>
                    <p className="text-sm text-gray-500">
                      Grade {app.grade} • {app.schoolYear} • {app.date}
                    </p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={app.status} />
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No applications yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-[#1F2A44] mb-4 font-display">Quick Actions</h3>
              <div className="space-y-2">
                <a
                  href="/admin/leads/new"
                  className="block w-full py-2 px-4 bg-[#2F5D50] text-white rounded-lg text-center hover:bg-[#1F2A44] transition-colors"
                >
                  + Add New Lead
                </a>
                <a
                  href="/admin/families/new"
                  className="block w-full py-2 px-4 bg-gray-100 text-[#1F2A44] rounded-lg text-center hover:bg-gray-200 transition-colors"
                >
                  + Register Family
                </a>
                <a
                  href="/admin/applications"
                  className="block w-full py-2 px-4 bg-gray-100 text-[#1F2A44] rounded-lg text-center hover:bg-gray-200 transition-colors"
                >
                  Review Applications
                </a>
              </div>
            </div>

            {/* Recent Leads */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[#1F2A44] font-display flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-[#2F5D50]" />
                  Recent Leads
                </h3>
                <a
                  href="/admin/leads"
                  className="text-xs text-[#2F5D50] hover:underline"
                >
                  View all
                </a>
              </div>
              <div className="space-y-3">
                {recentLeads.length > 0 ? recentLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="p-3 bg-gray-50 rounded-lg"
                  >
                    <p className="font-medium text-[#1F2A44] text-sm">{lead.name}</p>
                    <p className="text-xs text-gray-500">
                      {lead.students} student{lead.students !== 1 ? 's' : ''} • {lead.date}
                    </p>
                    <LeadStageBadge stage={lead.stage} />
                  </div>
                )) : (
                  <p className="text-sm text-gray-500 text-center py-4">No leads yet</p>
                )}
              </div>
            </div>

            {/* Enrollment Period */}
            <div className="bg-[#2F5D50] rounded-xl p-6 text-white">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5" />
                <span className="text-sm text-white/70">Current School Year</span>
              </div>
              <p className="text-2xl font-bold">2025-2026</p>
              <p className="text-sm text-white/70 mt-1">Enrollment Open</p>
              <div className="mt-4 pt-4 border-t border-white/20">
                <p className="text-xs text-white/60">Deadline: July 31, 2025</p>
              </div>
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
  label,
  value,
  icon: Icon,
  badge,
  color,
}: {
  label: string;
  value: string;
  icon: typeof Users;
  badge?: string;
  color: 'evergreen' | 'navy' | 'blue' | 'amber' | 'purple';
}) {
  const colors = {
    evergreen: 'bg-[#2F5D50]/10 text-[#2F5D50]',
    navy: 'bg-[#1F2A44]/10 text-[#1F2A44]',
    blue: 'bg-blue-100 text-blue-600',
    amber: 'bg-amber-100 text-amber-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', colors[color])}>
          <Icon className="w-5 h-5" />
        </div>
        {badge && (
          <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
            {badge}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-[#1F2A44]">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    submitted: 'bg-blue-100 text-blue-700',
    under_review: 'bg-amber-100 text-amber-700',
    interview_scheduled: 'bg-purple-100 text-purple-700',
    interview_completed: 'bg-purple-100 text-purple-700',
    accepted: 'bg-green-100 text-green-700',
    waitlisted: 'bg-orange-100 text-orange-700',
    denied: 'bg-red-100 text-red-700',
    withdrawn: 'bg-gray-100 text-gray-700',
    enrolled: 'bg-[#2F5D50]/20 text-[#2F5D50]',
  };

  const labels: Record<string, string> = {
    draft: 'Draft',
    submitted: 'Submitted',
    under_review: 'Under Review',
    interview_scheduled: 'Interview Scheduled',
    interview_completed: 'Interview Done',
    accepted: 'Accepted',
    waitlisted: 'Waitlisted',
    denied: 'Denied',
    withdrawn: 'Withdrawn',
    enrolled: 'Enrolled',
  };

  return (
    <span className={cn('text-xs px-2 py-1 rounded-full', styles[status] || 'bg-gray-100 text-gray-700')}>
      {labels[status] || status}
    </span>
  );
}

function LeadStageBadge({ stage }: { stage: string }) {
  const styles: Record<string, string> = {
    inquiry: 'bg-blue-100 text-blue-700',
    tour_scheduled: 'bg-purple-100 text-purple-700',
    tour_completed: 'bg-amber-100 text-amber-700',
    applied: 'bg-green-100 text-green-700',
    converted: 'bg-[#2F5D50]/20 text-[#2F5D50]',
    lost: 'bg-gray-100 text-gray-500',
  };

  const labels: Record<string, string> = {
    inquiry: 'Inquiry',
    tour_scheduled: 'Tour Scheduled',
    tour_completed: 'Tour Completed',
    applied: 'Applied',
    converted: 'Converted',
    lost: 'Lost',
  };

  return (
    <span className={cn('text-xs px-2 py-1 rounded-full mt-1 inline-block', styles[stage] || 'bg-gray-100 text-gray-700')}>
      {labels[stage] || stage}
    </span>
  );
}
