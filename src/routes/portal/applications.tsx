// 📝 Applications - Track your children's enrollment applications
// "Every application is a step toward their future"
//
// ╭────────────────────────────────────────────────────────────╮
// │  APPLICATIONS OVERVIEW                                     │
// │  View all applications, track their status, and see what  │
// │  steps are needed to complete the enrollment process.      │
// ╰────────────────────────────────────────────────────────────╯

import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import {
  validateSession,
  parseSessionCookie,
  createLogoutCookie,
} from '../../lib/auth';
import { getDb, households, guardians, students, applications } from '../../db';
import { eq, desc } from 'drizzle-orm';
import {
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Plus,
  Calendar,
  LogOut,
  User,
} from 'lucide-react';
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

const getApplicationsData = createServerFn({ method: 'GET' }).handler(async () => {
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

  try {
    // Find the guardian record linked to this user
    const [guardian] = await db
      .select()
      .from(guardians)
      .where(eq(guardians.userId, session.user.id));

    if (!guardian) {
      return {
        success: true,
        hasHousehold: false,
        applications: [],
        students: [],
      };
    }

    // Get household info
    const [household] = await db
      .select()
      .from(households)
      .where(eq(households.id, guardian.householdId));

    // Get students in this household
    const householdStudents = await db
      .select()
      .from(students)
      .where(eq(students.householdId, guardian.householdId));

    // Get all applications for these students
    const studentIds = householdStudents.map((s) => s.id);
    let allApplications: any[] = [];

    for (const studentId of studentIds) {
      const apps = await db
        .select()
        .from(applications)
        .where(eq(applications.studentId, studentId))
        .orderBy(desc(applications.createdAt));

      allApplications = [...allApplications, ...apps];
    }

    // Sort by most recent first
    allApplications.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    return {
      success: true,
      hasHousehold: true,
      household: household ? { id: household.id, name: household.name } : null,
      applications: allApplications.map((app) => {
        const student = householdStudents.find((s) => s.id === app.studentId);
        return {
          id: app.id,
          studentId: app.studentId,
          studentName: student ? `${student.firstName} ${student.lastName}` : 'Unknown',
          applicationType: app.applicationType,
          gradeApplyingFor: app.gradeApplyingFor,
          schoolYear: app.schoolYear,
          status: app.status,
          submittedAt: app.submittedAt,
          applicationFeePaid: app.applicationFeePaid,
          createdAt: app.createdAt,
        };
      }),
      students: householdStudents.map((s) => ({
        id: s.id,
        firstName: s.firstName,
        lastName: s.lastName,
        gradeLevel: s.gradeLevel,
        enrollmentStatus: s.enrollmentStatus,
      })),
    };
  } catch (error) {
    console.error('Applications data error:', error);
    return { success: false, error: 'Failed to load applications' };
  }
});

const logoutUser = createServerFn({ method: 'POST' }).handler(async () => {
  return { cookie: createLogoutCookie() };
});

// Helper for formatting dates
function formatDate(dateStr: string | Date | null): string {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ═══════════════════════════════════════════════════════════
// ROUTE DEFINITION
// ═══════════════════════════════════════════════════════════

export const Route = createFileRoute('/portal/applications')({
  head: () => ({
    meta: [
      { title: 'Applications | Family Portal | Enrollsy' },
      { name: 'description', content: 'View and track your children\'s enrollment applications.' },
    ],
  }),
  loader: async () => {
    const [session, applicationsData] = await Promise.all([
      getSessionUser(),
      getApplicationsData(),
    ]);
    return { ...session, ...applicationsData };
  },
  component: ApplicationsPage,
});

function ApplicationsPage() {
  const navigate = useNavigate();
  const {
    authenticated,
    user,
    hasHousehold,
    applications: appList,
    students: studentList,
  } = Route.useLoaderData();

  if (!authenticated || !user) {
    navigate({ to: '/login' });
    return null;
  }

  if (user.role !== 'customer') {
    navigate({ to: user.role === 'superadmin' ? '/super-admin' : '/admin' });
    return null;
  }

  const handleLogout = async () => {
    const result = await logoutUser();
    if (result.cookie) document.cookie = result.cookie;
    navigate({ to: '/login' });
  };

  // Group applications by status
  const activeApps = appList?.filter((a: any) =>
    ['draft', 'submitted', 'under_review', 'interview_scheduled', 'interview_completed'].includes(a.status)
  ) || [];
  const decisionApps = appList?.filter((a: any) =>
    ['accepted', 'waitlisted', 'denied'].includes(a.status)
  ) || [];
  const completedApps = appList?.filter((a: any) =>
    ['enrolled', 'withdrawn'].includes(a.status)
  ) || [];

  return (
    <div className="min-h-screen bg-[#F7F5F2]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-6">
              <Link to="/portal" className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#2F5D50] rounded-lg flex items-center justify-center">
                  <span className="text-lg">🎓</span>
                </div>
                <span className="font-bold text-lg text-[#1F2A44] font-display">Family Portal</span>
              </Link>
            </div>
            <nav className="flex items-center gap-6">
              <Link to="/portal" className="text-gray-600 hover:text-[#2F5D50] text-sm">Dashboard</Link>
              <Link to="/portal/applications" className="text-[#2F5D50] font-medium text-sm">Applications</Link>
              <Link to="/portal/billing" className="text-gray-600 hover:text-[#2F5D50] text-sm">Billing</Link>
              <button onClick={handleLogout} className="flex items-center gap-1 text-gray-500 hover:text-[#2F5D50] text-sm">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#1F2A44] font-display flex items-center gap-3">
              <FileText className="w-7 h-7 text-[#2F5D50]" />
              Applications
            </h1>
            <p className="text-gray-600">Track the status of your enrollment applications</p>
          </div>
          <a
            href="/portal/apply"
            className="flex items-center gap-2 bg-[#2F5D50] text-white px-4 py-2 rounded-lg hover:bg-[#1F2A44] transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Application
          </a>
        </div>

        {!hasHousehold ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <FileText className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <h2 className="text-lg font-semibold text-gray-700 mb-2">No Applications</h2>
            <p className="text-gray-500 mb-4">Complete your family registration to start an application.</p>
            <Link
              to="/contact"
              className="text-[#2F5D50] hover:underline"
            >
              Contact the school to get started
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Active Applications */}
            {activeApps.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-[#1F2A44] mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  In Progress ({activeApps.length})
                </h2>
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="divide-y divide-gray-100">
                    {activeApps.map((app: any) => (
                      <ApplicationCard key={app.id} application={app} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Decisions */}
            {decisionApps.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-[#1F2A44] mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Decisions ({decisionApps.length})
                </h2>
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="divide-y divide-gray-100">
                    {decisionApps.map((app: any) => (
                      <ApplicationCard key={app.id} application={app} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Completed */}
            {completedApps.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-[#1F2A44] mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-gray-400" />
                  Completed ({completedApps.length})
                </h2>
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="divide-y divide-gray-100">
                    {completedApps.map((app: any) => (
                      <ApplicationCard key={app.id} application={app} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Empty State */}
            {(!appList || appList.length === 0) && (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <FileText className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <h2 className="text-lg font-semibold text-gray-700 mb-2">No Applications Yet</h2>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  Start a new application to enroll your child in the upcoming school year.
                </p>
                <a
                  href="/portal/apply"
                  className="inline-flex items-center gap-2 bg-[#2F5D50] text-white px-6 py-3 rounded-lg hover:bg-[#1F2A44] transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Start Application
                </a>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function ApplicationCard({ application }: { application: any }) {
  const statusConfig = getStatusConfig(application.status);

  return (
    <Link
      to={`/portal/applications/${application.id}`}
      className="block p-6 hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#2F5D50]/10 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-[#2F5D50]" />
          </div>
          <div>
            <h3 className="font-semibold text-[#1F2A44]">{application.studentName}</h3>
            <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
              <span>
                {application.gradeApplyingFor === 'PK' ? 'Pre-K' :
                  application.gradeApplyingFor === 'K' ? 'Kindergarten' :
                    `Grade ${application.gradeApplyingFor}`}
              </span>
              <span>•</span>
              <span>{application.schoolYear}</span>
              {application.applicationType === 'reenroll' && (
                <>
                  <span>•</span>
                  <span className="text-blue-600">Re-enrollment</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <StatusBadge status={application.status} />
            <div className="text-xs text-gray-500 mt-1 flex items-center gap-1 justify-end">
              <Calendar className="w-3 h-3" />
              {application.submittedAt
                ? `Submitted ${formatDate(application.submittedAt)}`
                : `Started ${formatDate(application.createdAt)}`}
            </div>
          </div>
          {!application.applicationFeePaid && application.status !== 'draft' && (
            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
              Fee pending
            </span>
          )}
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>
      </div>

      {/* Status Timeline Preview */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-1">
          {['draft', 'submitted', 'under_review', 'decision', 'enrolled'].map((step, index) => {
            const isActive = getStepStatus(application.status, step);
            const isCurrent = isCurrentStep(application.status, step);
            return (
              <div key={step} className="flex items-center">
                <div
                  className={cn(
                    'w-3 h-3 rounded-full',
                    isActive ? 'bg-[#2F5D50]' : 'bg-gray-200',
                    isCurrent && 'ring-2 ring-[#2F5D50] ring-offset-2'
                  )}
                />
                {index < 4 && (
                  <div
                    className={cn(
                      'w-8 h-0.5 mx-1',
                      isActive ? 'bg-[#2F5D50]' : 'bg-gray-200'
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>Started</span>
          <span>Submitted</span>
          <span>Review</span>
          <span>Decision</span>
          <span>Enrolled</span>
        </div>
      </div>
    </Link>
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
    interview_completed: 'Interview Completed',
    accepted: 'Accepted! 🎉',
    waitlisted: 'Waitlisted',
    denied: 'Not Admitted',
    withdrawn: 'Withdrawn',
    enrolled: 'Enrolled ✓',
  };

  return (
    <span className={cn('text-xs px-2 py-1 rounded-full', styles[status] || 'bg-gray-100 text-gray-700')}>
      {labels[status] || status}
    </span>
  );
}

function getStatusConfig(status: string) {
  const configs: Record<string, { color: string; icon: typeof Clock }> = {
    draft: { color: 'gray', icon: FileText },
    submitted: { color: 'blue', icon: Clock },
    under_review: { color: 'amber', icon: Clock },
    accepted: { color: 'green', icon: CheckCircle },
    waitlisted: { color: 'orange', icon: Clock },
    denied: { color: 'red', icon: AlertCircle },
    enrolled: { color: 'emerald', icon: CheckCircle },
  };
  return configs[status] || configs.draft;
}

function getStepStatus(currentStatus: string, step: string): boolean {
  const order = ['draft', 'submitted', 'under_review', 'decision', 'enrolled'];
  const statusMapping: Record<string, string> = {
    draft: 'draft',
    submitted: 'submitted',
    under_review: 'under_review',
    interview_scheduled: 'under_review',
    interview_completed: 'under_review',
    accepted: 'decision',
    waitlisted: 'decision',
    denied: 'decision',
    enrolled: 'enrolled',
    withdrawn: 'decision',
  };

  const currentIndex = order.indexOf(statusMapping[currentStatus] || 'draft');
  const stepIndex = order.indexOf(step);
  return stepIndex <= currentIndex;
}

function isCurrentStep(currentStatus: string, step: string): boolean {
  const statusMapping: Record<string, string> = {
    draft: 'draft',
    submitted: 'submitted',
    under_review: 'under_review',
    interview_scheduled: 'under_review',
    interview_completed: 'under_review',
    accepted: 'decision',
    waitlisted: 'decision',
    denied: 'decision',
    enrolled: 'enrolled',
    withdrawn: 'decision',
  };
  return statusMapping[currentStatus] === step;
}
