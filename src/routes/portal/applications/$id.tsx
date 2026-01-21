// 📄 Application Detail - Family view of their application
// "Track your journey from application to enrollment"
//
// ╭──────────────────────────────────────────────────────────────╮
// │  🎒 APPLICATION STATUS VIEW                                   │
// │  Families can see their application status, timeline,        │
// │  and any required actions or next steps.                     │
// ╰──────────────────────────────────────────────────────────────╯

import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { useEffect } from 'react';
import {
  ArrowLeft,
  User,
  Calendar,
  Clock,
  FileText,
  CheckCircle,
  XCircle,
  Hourglass,
  GraduationCap,
  DollarSign,
  MessageSquare,
  LogOut,
  AlertTriangle,
  Home,
  CalendarClock,
  PartyPopper,
} from 'lucide-react';
import {
  validateSession,
  parseSessionCookie,
  createLogoutCookie,
} from '../../../lib/auth';
import { getDb, applications, students, households, guardians } from '../../../db';
import { eq, and } from 'drizzle-orm';
import { cn } from '../../../utils';

// ═══════════════════════════════════════════════════════════
// SERVER FUNCTIONS
// ═══════════════════════════════════════════════════════════

const getApplicationDetail = createServerFn({ method: 'GET' }).handler(
  async (input: { data: { id: string } }) => {
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

    // Get guardian linked to this user
    const [guardian] = await db
      .select()
      .from(guardians)
      .where(eq(guardians.userId, session.user.id));

    if (!guardian) {
      return {
        authenticated: true,
        user: session.user,
        authorized: false,
        error: 'No household found',
      };
    }

    // Get application
    const [application] = await db
      .select()
      .from(applications)
      .where(eq(applications.id, input.data.id));

    if (!application) {
      return {
        authenticated: true,
        user: session.user,
        authorized: false,
        error: 'Application not found',
      };
    }

    // Verify this application belongs to the user's household
    if (application.householdId !== guardian.householdId) {
      return {
        authenticated: true,
        user: session.user,
        authorized: false,
        error: 'Not authorized to view this application',
      };
    }

    // Get student
    const [student] = await db
      .select()
      .from(students)
      .where(eq(students.id, application.studentId));

    // Get household
    const [household] = await db
      .select()
      .from(households)
      .where(eq(households.id, application.householdId));

    return {
      authenticated: true,
      user: session.user,
      authorized: true,
      application: {
        id: application.id,
        status: application.status,
        applicationType: application.applicationType,
        schoolYear: application.schoolYear,
        gradeApplyingFor: application.gradeApplyingFor,
        submittedAt: application.submittedAt,
        decisionAt: application.decisionAt,
        decisionNotes: application.decisionNotes,
        applicationFeeAmount: application.applicationFeeAmount,
        applicationFeePaid: application.applicationFeePaid,
        interviewScheduledAt: application.interviewScheduledAt,
        interviewCompletedAt: application.interviewCompletedAt,
        waitlistPosition: application.waitlistPosition,
        createdAt: application.createdAt,
      },
      student: student
        ? {
            id: student.id,
            firstName: student.firstName,
            lastName: student.lastName,
            dateOfBirth: student.dateOfBirth,
          }
        : null,
      household: household
        ? {
            id: household.id,
            name: household.name,
          }
        : null,
    };
  }
);

const logoutUser = createServerFn({ method: 'POST' }).handler(async () => {
  return { cookie: createLogoutCookie() };
});

// ═══════════════════════════════════════════════════════════
// ROUTE DEFINITION
// ═══════════════════════════════════════════════════════════

export const Route = createFileRoute('/portal/applications/$id')({
  head: () => ({
    meta: [
      { title: 'Application Details | Family Portal | EnrollSage' },
      { name: 'description', content: 'View your application status and details.' },
    ],
  }),
  loader: async ({ params }) => {
    return await getApplicationDetail({ data: { id: params.id } });
  },
  component: ApplicationDetailPage,
});

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════

function ApplicationDetailPage() {
  const navigate = useNavigate();
  const data = Route.useLoaderData();

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

  // Error states
  if (!data.authorized || !data.application) {
    return (
      <div className="min-h-screen bg-[#F8F9F6]">
        <PortalHeader user={data.user} onLogout={handleLogout} />
        <main className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <AlertTriangle className="w-12 h-12 mx-auto text-amber-500 mb-4" />
            <h2 className="text-xl font-semibold text-[#2D4F3E] mb-2">
              Application Not Found
            </h2>
            <p className="text-gray-600 mb-6">
              {data.error || 'Unable to load this application.'}
            </p>
            <Link
              to="/portal"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#5B7F6D] text-white rounded-lg hover:bg-[#4A6E5C]"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Portal
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const { application, student } = data;
  const status = application.status || 'draft';

  // Format dates
  const formatDate = (date: Date | null | undefined) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateTime = (date: Date | null | undefined) => {
    if (!date) return 'Not scheduled';
    return new Date(date).toLocaleString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-[#F8F9F6]">
      <PortalHeader user={data.user} onLogout={handleLogout} />

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Back Link */}
        <Link
          to="/portal"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-[#5B7F6D] mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Portal
        </Link>

        {/* Status Banner */}
        <StatusBanner status={status} waitlistPosition={application.waitlistPosition} />

        {/* Student Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-[#5B7F6D]/10 rounded-full flex items-center justify-center">
              <span className="text-2xl font-medium text-[#5B7F6D]">
                {student?.firstName?.charAt(0) || '?'}
              </span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#2D4F3E]">
                {student?.firstName} {student?.lastName}
              </h1>
              <p className="text-gray-500">
                {application.gradeApplyingFor === 'PK' ? 'Pre-K' :
                  application.gradeApplyingFor === 'K' ? 'Kindergarten' :
                  `Grade ${application.gradeApplyingFor}`} • {application.schoolYear}
              </p>
            </div>
            <StatusBadge status={status} className="ml-auto" />
          </div>
        </div>

        {/* Progress Timeline */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-[#2D4F3E] mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#5B7F6D]" />
            Application Timeline
          </h2>
          <ApplicationTimeline
            status={status}
            submittedAt={application.submittedAt}
            interviewScheduledAt={application.interviewScheduledAt}
            interviewCompletedAt={application.interviewCompletedAt}
            decisionAt={application.decisionAt}
          />
        </div>

        {/* Interview Details (if scheduled) */}
        {application.interviewScheduledAt && status === 'interview_scheduled' && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-purple-800 mb-4 flex items-center gap-2">
              <CalendarClock className="w-5 h-5" />
              Upcoming Interview
            </h2>
            <p className="text-purple-700 text-lg">
              {formatDateTime(application.interviewScheduledAt)}
            </p>
            <p className="text-purple-600 text-sm mt-2">
              Please arrive 10 minutes early. Contact the admissions office if you need to reschedule.
            </p>
          </div>
        )}

        {/* Application Details */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-[#2D4F3E] mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#5B7F6D]" />
            Application Details
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <DetailRow label="Application ID" value={application.id.slice(0, 8).toUpperCase()} />
            <DetailRow label="Type" value={application.applicationType?.replace('_', ' ') || 'New'} capitalize />
            <DetailRow label="School Year" value={application.schoolYear} />
            <DetailRow
              label="Grade"
              value={
                application.gradeApplyingFor === 'PK' ? 'Pre-Kindergarten' :
                application.gradeApplyingFor === 'K' ? 'Kindergarten' :
                `Grade ${application.gradeApplyingFor}`
              }
            />
            <DetailRow label="Submitted" value={formatDate(application.submittedAt)} />
            {application.decisionAt && (
              <DetailRow label="Decision Date" value={formatDate(application.decisionAt)} />
            )}
          </div>
        </div>

        {/* Application Fee */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-[#2D4F3E] mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-[#5B7F6D]" />
            Application Fee
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-[#2D4F3E]">
                ${((application.applicationFeeAmount || 0) / 100).toFixed(2)}
              </p>
              <p className="text-sm text-gray-500">Non-refundable application fee</p>
            </div>
            {application.applicationFeePaid ? (
              <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Paid</span>
              </div>
            ) : (
              <Link
                to="/portal/billing"
                className="flex items-center gap-2 px-6 py-3 bg-[#5B7F6D] text-white rounded-lg hover:bg-[#4A6E5C]"
              >
                <DollarSign className="w-4 h-4" />
                Pay Now
              </Link>
            )}
          </div>
        </div>

        {/* Decision Notes (if available and accepted/denied/waitlisted) */}
        {application.decisionNotes && ['accepted', 'denied', 'waitlisted'].includes(status) && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-[#2D4F3E] mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#5B7F6D]" />
              Message from Admissions
            </h2>
            <p className="text-gray-700 whitespace-pre-wrap">{application.decisionNotes}</p>
          </div>
        )}

        {/* Next Steps based on status */}
        <NextStepsCard status={status} applicationFeePaid={!!application.applicationFeePaid} />

        {/* Contact Support */}
        <div className="bg-gray-50 rounded-xl p-6 text-center">
          <p className="text-gray-600 mb-2">Have questions about your application?</p>
          <a
            href="mailto:admissions@school.edu"
            className="text-[#5B7F6D] hover:underline font-medium"
          >
            Contact the Admissions Office
          </a>
        </div>
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// HELPER COMPONENTS
// ═══════════════════════════════════════════════════════════

function PortalHeader({ user, onLogout }: { user: any; onLogout: () => void }) {
  return (
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
              {user.firstName} {user.lastName}
            </span>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#5B7F6D] transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

function StatusBanner({ status, waitlistPosition }: { status: string; waitlistPosition?: number | null }) {
  const banners: Record<string, { bg: string; icon: typeof CheckCircle; title: string; message: string }> = {
    submitted: {
      bg: 'bg-blue-50 border-blue-200',
      icon: FileText,
      title: 'Application Submitted',
      message: 'Your application has been received and is awaiting review.',
    },
    under_review: {
      bg: 'bg-amber-50 border-amber-200',
      icon: Clock,
      title: 'Under Review',
      message: 'Our admissions team is reviewing your application.',
    },
    interview_scheduled: {
      bg: 'bg-purple-50 border-purple-200',
      icon: CalendarClock,
      title: 'Interview Scheduled',
      message: 'An interview has been scheduled. See details below.',
    },
    interview_completed: {
      bg: 'bg-purple-50 border-purple-200',
      icon: CheckCircle,
      title: 'Interview Completed',
      message: 'Thank you for completing your interview. A decision will be made soon.',
    },
    accepted: {
      bg: 'bg-green-50 border-green-200',
      icon: PartyPopper,
      title: 'Congratulations! You\'re Accepted!',
      message: 'Welcome to our school community! Complete enrollment to secure your spot.',
    },
    waitlisted: {
      bg: 'bg-orange-50 border-orange-200',
      icon: Hourglass,
      title: `Waitlisted${waitlistPosition ? ` - Position #${waitlistPosition}` : ''}`,
      message: 'You\'re on our waitlist. We\'ll notify you if a spot becomes available.',
    },
    denied: {
      bg: 'bg-red-50 border-red-200',
      icon: XCircle,
      title: 'Application Not Accepted',
      message: 'We\'re sorry, your application was not accepted at this time.',
    },
    enrolled: {
      bg: 'bg-[#5B7F6D]/10 border-[#5B7F6D]/30',
      icon: GraduationCap,
      title: 'Enrolled!',
      message: 'Enrollment is complete. Welcome to the school!',
    },
  };

  const banner = banners[status];
  if (!banner) return null;

  const Icon = banner.icon;

  return (
    <div className={cn('rounded-xl border p-6 mb-6', banner.bg)}>
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
          <Icon className="w-6 h-6 text-[#5B7F6D]" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[#2D4F3E]">{banner.title}</h2>
          <p className="text-gray-600 mt-1">{banner.message}</p>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status, className }: { status: string; className?: string }) {
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
    interview_scheduled: 'Interview Scheduled',
    interview_completed: 'Interview Completed',
    accepted: 'Accepted',
    waitlisted: 'Waitlisted',
    denied: 'Not Admitted',
    withdrawn: 'Withdrawn',
    enrolled: 'Enrolled',
  };

  return (
    <span className={cn('px-3 py-1 rounded-full text-sm font-medium', styles[status] || 'bg-gray-100 text-gray-700', className)}>
      {labels[status] || status}
    </span>
  );
}

function ApplicationTimeline({
  status,
  submittedAt,
  interviewScheduledAt,
  interviewCompletedAt,
  decisionAt,
}: {
  status: string;
  submittedAt?: Date | null;
  interviewScheduledAt?: Date | null;
  interviewCompletedAt?: Date | null;
  decisionAt?: Date | null;
}) {
  const steps = [
    { key: 'submitted', label: 'Submitted', date: submittedAt },
    { key: 'review', label: 'Under Review', date: status !== 'submitted' ? new Date() : null },
    { key: 'interview', label: 'Interview', date: interviewCompletedAt || interviewScheduledAt },
    { key: 'decision', label: 'Decision', date: decisionAt },
  ];

  const getStepStatus = (stepKey: string, index: number) => {
    const statusOrder = ['submitted', 'under_review', 'interview_scheduled', 'interview_completed', 'accepted', 'waitlisted', 'denied', 'enrolled'];
    const currentIndex = statusOrder.indexOf(status);

    if (stepKey === 'submitted') return submittedAt ? 'completed' : 'pending';
    if (stepKey === 'review') return currentIndex >= 1 ? 'completed' : 'pending';
    if (stepKey === 'interview') {
      if (interviewCompletedAt) return 'completed';
      if (interviewScheduledAt && status === 'interview_scheduled') return 'current';
      if (currentIndex >= 4) return 'completed'; // Decision made, interview assumed done
      return 'pending';
    }
    if (stepKey === 'decision') {
      if (['accepted', 'denied', 'waitlisted', 'enrolled'].includes(status)) return 'completed';
      return 'pending';
    }
    return 'pending';
  };

  return (
    <div className="relative">
      {steps.map((step, index) => {
        const stepStatus = getStepStatus(step.key, index);

        return (
          <div key={step.key} className="flex items-start gap-4 mb-6 last:mb-0">
            {/* Icon */}
            <div className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
              stepStatus === 'completed' && 'bg-green-100',
              stepStatus === 'current' && 'bg-[#5B7F6D]',
              stepStatus === 'pending' && 'bg-gray-100'
            )}>
              {stepStatus === 'completed' ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : stepStatus === 'current' ? (
                <div className="w-3 h-3 bg-white rounded-full" />
              ) : (
                <div className="w-3 h-3 bg-gray-300 rounded-full" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1">
              <p className={cn(
                'font-medium',
                stepStatus === 'completed' && 'text-green-700',
                stepStatus === 'current' && 'text-[#5B7F6D]',
                stepStatus === 'pending' && 'text-gray-400'
              )}>
                {step.label}
              </p>
              {step.date && stepStatus !== 'pending' && (
                <p className="text-sm text-gray-500">
                  {new Date(step.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              )}
            </div>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div className={cn(
                'absolute left-5 w-0.5 h-8 -mt-2 ml-[-1px]',
                stepStatus === 'completed' || getStepStatus(steps[index + 1].key, index + 1) !== 'pending'
                  ? 'bg-green-200'
                  : 'bg-gray-200'
              )} style={{ top: `${(index + 1) * 64 + 24}px` }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function DetailRow({ label, value, capitalize }: { label: string; value: string; capitalize?: boolean }) {
  return (
    <div className="p-3 bg-gray-50 rounded-lg">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className={cn('font-medium text-[#2D4F3E]', capitalize && 'capitalize')}>{value}</p>
    </div>
  );
}

function NextStepsCard({ status, applicationFeePaid }: { status: string; applicationFeePaid: boolean }) {
  const nextSteps: Record<string, { title: string; steps: string[] }> = {
    submitted: {
      title: 'What happens next?',
      steps: [
        applicationFeePaid ? '✓ Application fee paid' : 'Pay your application fee',
        'Admissions team will review your application',
        'You may be contacted for an interview',
        'You\'ll receive a decision notification',
      ],
    },
    under_review: {
      title: 'Your application is being reviewed',
      steps: [
        'Our team is carefully reviewing all materials',
        'This process typically takes 2-3 weeks',
        'You may be contacted for an interview',
        'Check back here for updates',
      ],
    },
    interview_scheduled: {
      title: 'Prepare for your interview',
      steps: [
        'Arrive 10 minutes early',
        'Bring any requested documents',
        'Be prepared to discuss your child\'s interests',
        'Ask questions about the school',
      ],
    },
    accepted: {
      title: 'Complete your enrollment',
      steps: [
        'Review your acceptance letter',
        'Complete the enrollment deposit',
        'Submit required enrollment documents',
        'Register for orientation',
      ],
    },
    waitlisted: {
      title: 'While you wait',
      steps: [
        'We\'ll contact you if a spot opens',
        'Keep your contact information updated',
        'Consider submitting a letter of continued interest',
        'Explore other options as a backup',
      ],
    },
    enrolled: {
      title: 'Welcome to the school!',
      steps: [
        'Complete any remaining paperwork',
        'Attend new family orientation',
        'Get your school supplies list',
        'Mark the first day of school on your calendar',
      ],
    },
  };

  const content = nextSteps[status];
  if (!content) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
      <h2 className="text-lg font-semibold text-[#2D4F3E] mb-4">{content.title}</h2>
      <ul className="space-y-3">
        {content.steps.map((step, index) => (
          <li key={index} className="flex items-start gap-3">
            <div className="w-6 h-6 bg-[#5B7F6D]/10 rounded-full flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-xs font-medium text-[#5B7F6D]">{index + 1}</span>
            </div>
            <span className="text-gray-600">{step}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
