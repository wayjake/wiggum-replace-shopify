// 👨‍👩‍👧‍👦 Family Portal - Where parents see their children's journey
// "The best thing about memories is making them" - Portal landing page
//
// ╭────────────────────────────────────────────────────────────╮
// │  🏠 FAMILY PORTAL                                          │
// │  Parents view their children's enrollment status,          │
// │  applications, billing, and communicate with the school.   │
// ╰────────────────────────────────────────────────────────────╯

import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import {
  validateSession,
  parseSessionCookie,
  createLogoutCookie,
} from '../../lib/auth';
import { getDb, households, guardians, students, applications, invoices } from '../../db';
import { eq, desc } from 'drizzle-orm';
import {
  Home,
  Users,
  GraduationCap,
  FileText,
  DollarSign,
  MessageSquare,
  Settings,
  LogOut,
  ChevronRight,
  Clock,
  CheckCircle,
  AlertCircle,
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

const getFamilyData = createServerFn({ method: 'GET' }).handler(async () => {
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
        household: null,
        students: [],
        applications: [],
        invoices: [],
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

    // Get applications for these students
    const studentIds = householdStudents.map((s) => s.id);
    let studentApplications: any[] = [];
    if (studentIds.length > 0) {
      for (const studentId of studentIds) {
        const apps = await db
          .select()
          .from(applications)
          .where(eq(applications.studentId, studentId))
          .orderBy(desc(applications.createdAt));
        studentApplications = [...studentApplications, ...apps];
      }
    }

    // Get invoices for this household
    const householdInvoices = await db
      .select()
      .from(invoices)
      .where(eq(invoices.householdId, guardian.householdId))
      .orderBy(desc(invoices.createdAt))
      .limit(5);

    return {
      success: true,
      hasHousehold: true,
      household: household
        ? {
            id: household.id,
            name: household.name,
            status: household.status,
          }
        : null,
      students: householdStudents.map((s) => ({
        id: s.id,
        firstName: s.firstName,
        lastName: s.lastName,
        preferredName: s.preferredName,
        gradeLevel: s.gradeLevel,
        enrollmentStatus: s.enrollmentStatus,
        dateOfBirth: s.dateOfBirth,
      })),
      applications: studentApplications.map((app) => {
        const student = householdStudents.find((s) => s.id === app.studentId);
        return {
          id: app.id,
          studentName: student ? `${student.firstName} ${student.lastName}` : 'Unknown',
          gradeApplyingFor: app.gradeApplyingFor,
          schoolYear: app.schoolYear,
          status: app.status,
          submittedAt: app.submittedAt,
        };
      }),
      invoices: householdInvoices.map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        total: inv.total,
        amountDue: inv.amountDue,
        status: inv.status,
        dueDate: inv.dueDate,
      })),
    };
  } catch (error) {
    console.error('Family data error:', error);
    return { success: false, error: 'Failed to load family data' };
  }
});

const logoutUser = createServerFn({ method: 'POST' }).handler(async () => {
  return { cookie: createLogoutCookie() };
});

// ═══════════════════════════════════════════════════════════
// ROUTE DEFINITION
// ═══════════════════════════════════════════════════════════

export const Route = createFileRoute('/portal/')({
  head: () => ({
    meta: [
      { title: 'Family Portal | Enrollsy' },
      {
        name: 'description',
        content: 'View your children\'s enrollment status, applications, and billing information.',
      },
    ],
  }),
  loader: async () => {
    const [session, familyData] = await Promise.all([
      getSessionUser(),
      getFamilyData(),
    ]);

    return {
      ...session,
      ...familyData,
    };
  },
  component: FamilyPortal,
});

function FamilyPortal() {
  const navigate = useNavigate();
  const {
    authenticated,
    user,
    hasHousehold,
    household: _household,
    students: familyStudents,
    applications: studentApplications,
    invoices: householdInvoices,
  } = Route.useLoaderData();

  // Redirect if not authenticated
  if (!authenticated || !user) {
    navigate({ to: '/login' });
    return null;
  }

  // Redirect superadmin and admin to their dashboards
  if (user.role === 'superadmin') {
    navigate({ to: '/super-admin' });
    return null;
  }
  if (user.role === 'admin') {
    navigate({ to: '/admin' });
    return null;
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
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#2F5D50] rounded-lg flex items-center justify-center">
                <span className="text-lg">🎓</span>
              </div>
              <span className="font-bold text-lg text-[#1F2A44] font-display">Family Portal</span>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {user.firstName} {user.lastName}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#2F5D50] transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#1F2A44] font-display">
            Welcome, {user.firstName}!
          </h1>
          <p className="text-gray-600 mt-1">
            {hasHousehold
              ? `Manage your family's enrollment and stay connected with the school.`
              : `Complete your family registration to get started.`}
          </p>
        </div>

        {!hasHousehold ? (
          // No household - prompt to complete registration
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-[#2F5D50]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Home className="w-8 h-8 text-[#2F5D50]" />
            </div>
            <h2 className="text-xl font-semibold text-[#1F2A44] mb-2">
              Complete Your Family Registration
            </h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              To view your children's enrollment status and manage applications,
              please contact the school to complete your family registration.
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#2F5D50] text-white rounded-lg hover:bg-[#1F2A44] transition-colors"
            >
              Contact the School
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Students Section */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-[#1F2A44] flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-[#2F5D50]" />
                    Your Children
                  </h2>
                </div>

                {familyStudents && familyStudents.length > 0 ? (
                  <div className="space-y-4">
                    {familyStudents.map((student: any) => (
                      <div
                        key={student.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-[#2F5D50]/10 rounded-full flex items-center justify-center">
                            <span className="text-xl">
                              {student.firstName.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-[#1F2A44]">
                              {student.preferredName || student.firstName} {student.lastName}
                            </p>
                            <p className="text-sm text-gray-500">
                              {student.gradeLevel ? `Grade ${student.gradeLevel}` : 'Grade not assigned'}
                            </p>
                          </div>
                        </div>
                        <EnrollmentStatusBadge status={student.enrollmentStatus} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No students registered yet</p>
                  </div>
                )}
              </div>

              {/* Applications Section */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-[#1F2A44] flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#2F5D50]" />
                    Applications
                  </h2>
                  <a
                    href="/portal/applications"
                    className="text-sm text-[#2F5D50] hover:underline"
                  >
                    View all
                  </a>
                </div>

                {studentApplications && studentApplications.length > 0 ? (
                  <div className="space-y-3">
                    {studentApplications.slice(0, 3).map((app: any) => (
                      <div
                        key={app.id}
                        className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div>
                          <p className="font-medium text-[#1F2A44]">
                            {app.studentName}
                          </p>
                          <p className="text-sm text-gray-500">
                            Grade {app.gradeApplyingFor} • {app.schoolYear}
                          </p>
                        </div>
                        <ApplicationStatusBadge status={app.status} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No applications yet</p>
                    <a
                      href="/portal/apply"
                      className="text-[#2F5D50] hover:underline text-sm"
                    >
                      Start an application
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-[#1F2A44] mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <QuickAction
                    icon={FileText}
                    label="Start New Application"
                    href="/portal/apply"
                  />
                  <QuickAction
                    icon={DollarSign}
                    label="View Billing"
                    href="/portal/billing"
                  />
                  <QuickAction
                    icon={MessageSquare}
                    label="Contact School"
                    href="/contact"
                  />
                  <QuickAction
                    icon={Settings}
                    label="Account Settings"
                    href="/portal/settings"
                  />
                </div>
              </div>

              {/* Billing Summary */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-[#1F2A44] flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-[#2F5D50]" />
                    Billing
                  </h3>
                  <a
                    href="/portal/billing"
                    className="text-xs text-[#2F5D50] hover:underline"
                  >
                    View all
                  </a>
                </div>

                {householdInvoices && householdInvoices.length > 0 ? (
                  <div className="space-y-3">
                    {householdInvoices.slice(0, 2).map((invoice: any) => (
                      <div
                        key={invoice.id}
                        className="p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-[#1F2A44]">
                            {invoice.invoiceNumber || 'Invoice'}
                          </p>
                          <InvoiceStatusBadge status={invoice.status} />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Due: {invoice.dueDate || 'N/A'}
                        </p>
                        <p className="text-sm font-medium text-[#1F2A44] mt-1">
                          ${((invoice.amountDue || 0) / 100).toFixed(2)} due
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No invoices yet
                  </p>
                )}
              </div>

              {/* School Info */}
              <div className="bg-[#2F5D50] rounded-xl p-6 text-white">
                <h3 className="font-semibold mb-2">Westlake Academy</h3>
                <p className="text-sm text-white/70 mb-4">
                  1234 Education Lane<br />
                  Austin, TX 78701
                </p>
                <div className="space-y-2 text-sm">
                  <p className="text-white/70">
                    <span className="text-white">Phone:</span> (512) 555-0100
                  </p>
                  <p className="text-white/70">
                    <span className="text-white">Email:</span> info@westlakeacademy.edu
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// HELPER COMPONENTS
// ═══════════════════════════════════════════════════════════

function QuickAction({
  icon: Icon,
  label,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
    >
      <div className="w-8 h-8 bg-[#2F5D50]/10 rounded-lg flex items-center justify-center text-[#2F5D50] group-hover:bg-[#2F5D50] group-hover:text-white transition-colors">
        <Icon className="w-4 h-4" />
      </div>
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
    </a>
  );
}

function EnrollmentStatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; text: string; icon: React.ComponentType<{ className?: string }> }> = {
    enrolled: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
    applicant: { bg: 'bg-blue-100', text: 'text-blue-700', icon: Clock },
    accepted: { bg: 'bg-[#2F5D50]/20', text: 'text-[#2F5D50]', icon: CheckCircle },
    waitlisted: { bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock },
    prospective: { bg: 'bg-gray-100', text: 'text-gray-700', icon: Clock },
    withdrawn: { bg: 'bg-red-100', text: 'text-red-700', icon: AlertCircle },
  };

  const config = styles[status] || styles.prospective;
  const Icon = config.icon;

  const labels: Record<string, string> = {
    enrolled: 'Enrolled',
    applicant: 'Applicant',
    accepted: 'Accepted',
    waitlisted: 'Waitlisted',
    prospective: 'Prospective',
    withdrawn: 'Withdrawn',
    graduated: 'Graduated',
    denied: 'Not Admitted',
  };

  return (
    <span className={cn('inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full', config.bg, config.text)}>
      <Icon className="w-3 h-3" />
      {labels[status] || status}
    </span>
  );
}

function ApplicationStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    submitted: 'bg-blue-100 text-blue-700',
    under_review: 'bg-amber-100 text-amber-700',
    interview_scheduled: 'bg-purple-100 text-purple-700',
    accepted: 'bg-green-100 text-green-700',
    waitlisted: 'bg-orange-100 text-orange-700',
    denied: 'bg-red-100 text-red-700',
    enrolled: 'bg-[#2F5D50]/20 text-[#2F5D50]',
  };

  const labels: Record<string, string> = {
    draft: 'Draft',
    submitted: 'Submitted',
    under_review: 'Under Review',
    interview_scheduled: 'Interview Scheduled',
    accepted: 'Accepted',
    waitlisted: 'Waitlisted',
    denied: 'Not Admitted',
    enrolled: 'Enrolled',
  };

  return (
    <span className={cn('text-xs px-2 py-1 rounded-full', styles[status] || 'bg-gray-100 text-gray-700')}>
      {labels[status] || status}
    </span>
  );
}

function InvoiceStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600',
    pending: 'bg-amber-100 text-amber-700',
    sent: 'bg-blue-100 text-blue-700',
    paid: 'bg-green-100 text-green-700',
    overdue: 'bg-red-100 text-red-700',
    void: 'bg-gray-100 text-gray-500',
  };

  return (
    <span className={cn('text-xs px-2 py-1 rounded-full', styles[status] || 'bg-gray-100 text-gray-600')}>
      {status}
    </span>
  );
}
