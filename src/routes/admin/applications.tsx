// 📝 Applications - The gateway to enrollment
// "Every application tells a story of a family's hopes and dreams"
//
// ╭────────────────────────────────────────────────────────────╮
// │  APPLICATION MANAGEMENT                                     │
// │  Review, track, and process student applications.          │
// │  The heart of the admissions workflow.                     │
// ╰────────────────────────────────────────────────────────────╯

import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  ChevronRight,
  User,
  Calendar,
  Clock,
  LogOut,
  Filter,
} from 'lucide-react';
import { requireAdmin } from '../../lib/auth-guards';
import { getDb, applications, students, households } from '../../db';
import { eq, desc, count } from 'drizzle-orm';
import { cn } from '../../utils';
import { createLogoutCookie } from '../../lib/auth';

// ═══════════════════════════════════════════════════════════
// SERVER FUNCTIONS
// ═══════════════════════════════════════════════════════════

const getApplications = createServerFn({ method: 'GET' }).handler(async () => {
  const db = getDb();

  try {
    const applicationList = await db
      .select({
        id: applications.id,
        studentId: applications.studentId,
        householdId: applications.householdId,
        applicationType: applications.applicationType,
        schoolYear: applications.schoolYear,
        gradeApplyingFor: applications.gradeApplyingFor,
        status: applications.status,
        submittedAt: applications.submittedAt,
        applicationFeePaid: applications.applicationFeePaid,
        createdAt: applications.createdAt,
      })
      .from(applications)
      .orderBy(desc(applications.submittedAt), desc(applications.createdAt));

    // Enrich with student and household data
    const enrichedApplications = await Promise.all(
      applicationList.map(async (app) => {
        const [student] = await db
          .select({
            firstName: students.firstName,
            lastName: students.lastName,
          })
          .from(students)
          .where(eq(students.id, app.studentId));

        const [household] = await db
          .select({ name: households.name })
          .from(households)
          .where(eq(households.id, app.householdId));

        return {
          ...app,
          studentName: student ? `${student.firstName} ${student.lastName}` : 'Unknown',
          householdName: household?.name || 'Unknown',
        };
      })
    );

    // Get stats
    const [totalCount] = await db.select({ count: count() }).from(applications);
    const [submittedCount] = await db
      .select({ count: count() })
      .from(applications)
      .where(eq(applications.status, 'submitted'));
    const [reviewCount] = await db
      .select({ count: count() })
      .from(applications)
      .where(eq(applications.status, 'under_review'));
    const [acceptedCount] = await db
      .select({ count: count() })
      .from(applications)
      .where(eq(applications.status, 'accepted'));

    return {
      success: true,
      applications: enrichedApplications,
      stats: {
        total: Number(totalCount?.count || 0),
        submitted: Number(submittedCount?.count || 0),
        underReview: Number(reviewCount?.count || 0),
        accepted: Number(acceptedCount?.count || 0),
      },
    };
  } catch (error) {
    console.error('Error fetching applications:', error);
    return {
      success: false,
      applications: [],
      stats: { total: 0, submitted: 0, underReview: 0, accepted: 0 },
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

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return '1 day ago';
  return `${diffDays} days ago`;
}

// ═══════════════════════════════════════════════════════════
// ROUTE DEFINITION
// ═══════════════════════════════════════════════════════════

export const Route = createFileRoute('/admin/applications')({
  head: () => ({
    meta: [
      { title: 'Applications | School Dashboard | EnrollSage' },
      { name: 'description', content: 'Review and manage student applications.' },
    ],
  }),
  loader: async () => {
    const [authResult, applicationsData] = await Promise.all([
      requireAdmin(),
      getApplications(),
    ]);
    return { authResult, ...applicationsData };
  },
  component: ApplicationsPage,
});

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════

function ApplicationsPage() {
  const navigate = useNavigate();
  const { authResult, applications: appList, stats } = Route.useLoaderData();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

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

  // Filter applications
  const filteredApps = appList.filter((app) => {
    const matchesSearch =
      app.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.householdName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
                  <p className="text-xs text-gray-500">Westlake Academy</p>
                </div>
              </Link>
            </div>
            <nav className="flex items-center gap-6">
              <Link to="/admin" className="text-gray-600 hover:text-[#5B7F6D]">Dashboard</Link>
              <Link to="/admin/applications" className="text-[#5B7F6D] font-medium">Applications</Link>
              <a href="/admin/leads" className="text-gray-600 hover:text-[#5B7F6D]">Leads</a>
              <Link to="/admin/families" className="text-gray-600 hover:text-[#5B7F6D]">Families</Link>
              <Link to="/admin/students" className="text-gray-600 hover:text-[#5B7F6D]">Students</Link>
              <button onClick={handleLogout} className="flex items-center gap-1 text-gray-500 hover:text-[#5B7F6D] text-sm">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-[#2D4F3E] font-display flex items-center gap-3">
              <FileText className="w-7 h-7 text-[#5B7F6D]" />
              Applications
            </h2>
            <p className="text-gray-600">
              {stats.submitted} submitted, {stats.underReview} under review, {stats.accepted} accepted
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <button
            onClick={() => setStatusFilter('all')}
            className={cn(
              'p-4 rounded-lg border text-left transition-colors',
              statusFilter === 'all'
                ? 'bg-[#5B7F6D] text-white border-[#5B7F6D]'
                : 'bg-white border-gray-200 hover:bg-gray-50'
            )}
          >
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className={cn('text-sm', statusFilter === 'all' ? 'text-white/70' : 'text-gray-500')}>Total</p>
          </button>
          <button
            onClick={() => setStatusFilter('submitted')}
            className={cn(
              'p-4 rounded-lg border text-left transition-colors',
              statusFilter === 'submitted'
                ? 'bg-blue-500 text-white border-blue-500'
                : 'bg-white border-gray-200 hover:bg-gray-50'
            )}
          >
            <p className="text-2xl font-bold">{stats.submitted}</p>
            <p className={cn('text-sm', statusFilter === 'submitted' ? 'text-white/70' : 'text-gray-500')}>Submitted</p>
          </button>
          <button
            onClick={() => setStatusFilter('under_review')}
            className={cn(
              'p-4 rounded-lg border text-left transition-colors',
              statusFilter === 'under_review'
                ? 'bg-amber-500 text-white border-amber-500'
                : 'bg-white border-gray-200 hover:bg-gray-50'
            )}
          >
            <p className="text-2xl font-bold">{stats.underReview}</p>
            <p className={cn('text-sm', statusFilter === 'under_review' ? 'text-white/70' : 'text-gray-500')}>Under Review</p>
          </button>
          <button
            onClick={() => setStatusFilter('accepted')}
            className={cn(
              'p-4 rounded-lg border text-left transition-colors',
              statusFilter === 'accepted'
                ? 'bg-green-500 text-white border-green-500'
                : 'bg-white border-gray-200 hover:bg-gray-50'
            )}
          >
            <p className="text-2xl font-bold">{stats.accepted}</p>
            <p className={cn('text-sm', statusFilter === 'accepted' ? 'text-white/70' : 'text-gray-500')}>Accepted</p>
          </button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by student or family name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-[#5B7F6D] focus:ring-2 focus:ring-[#5B7F6D]/10"
            />
          </div>
          {statusFilter !== 'all' && (
            <button
              onClick={() => setStatusFilter('all')}
              className="text-sm text-[#5B7F6D] hover:underline"
            >
              Clear filter
            </button>
          )}
        </div>

        {/* Applications List */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {filteredApps.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {filteredApps.map((app) => (
                <Link
                  key={app.id}
                  to={`/admin/applications/${app.id}`}
                  className="block p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#2D4F3E]">{app.studentName}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                          <span>{app.householdName}</span>
                          <span>•</span>
                          <span>
                            {app.gradeApplyingFor === 'PK' ? 'Pre-K' :
                              app.gradeApplyingFor === 'K' ? 'Kindergarten' :
                                `Grade ${app.gradeApplyingFor}`}
                          </span>
                          <span>•</span>
                          <span>{app.schoolYear}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right text-sm">
                        <div className="flex items-center gap-1 text-gray-500">
                          <Clock className="w-3 h-3" />
                          {formatRelativeTime(app.submittedAt)}
                        </div>
                        {!app.applicationFeePaid && (
                          <span className="text-xs text-amber-600">Fee pending</span>
                        )}
                      </div>
                      <StatusBadge status={app.status || 'draft'} />
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <h3 className="font-semibold text-gray-700 mb-2">
                {searchQuery || statusFilter !== 'all' ? 'No applications found' : 'No applications yet'}
              </h3>
              <p className="text-gray-500">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your search or filter'
                  : 'Applications will appear here when families apply'}
              </p>
            </div>
          )}
        </div>
      </main>
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
    enrolled: 'bg-[#5B7F6D]/20 text-[#5B7F6D]',
  };

  const labels: Record<string, string> = {
    draft: 'Draft',
    submitted: 'Submitted',
    under_review: 'Under Review',
    interview_scheduled: 'Interview',
    interview_completed: 'Interview Done',
    accepted: 'Accepted',
    waitlisted: 'Waitlisted',
    denied: 'Denied',
    withdrawn: 'Withdrawn',
    enrolled: 'Enrolled',
  };

  return (
    <span className={cn('text-xs px-2 py-1 rounded-full whitespace-nowrap', styles[status] || 'bg-gray-100 text-gray-700')}>
      {labels[status] || status}
    </span>
  );
}
