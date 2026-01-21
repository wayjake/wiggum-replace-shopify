// 📋 Application Detail - The decision chamber
// "Where futures are shaped, one decision at a time"
//
// ╭──────────────────────────────────────────────────────────────╮
// │         ╔═══════════════════════════════════════╗            │
// │         ║  APPLICATION STATUS WORKFLOW           ║            │
// │         ╠═══════════════════════════════════════╣            │
// │         ║                                        ║            │
// │         ║   draft → submitted → under_review    ║            │
// │         ║           ↓                            ║            │
// │         ║   interview_scheduled → completed     ║            │
// │         ║           ↓                            ║            │
// │         ║   accepted | waitlisted | denied      ║            │
// │         ║           ↓                            ║            │
// │         ║      → enrolled ←                     ║            │
// │         ╚═══════════════════════════════════════╝            │
// ╰──────────────────────────────────────────────────────────────╯

import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  User,
  Calendar,
  Clock,
  FileText,
  Mail,
  Phone,
  Home,
  CheckCircle,
  XCircle,
  Hourglass,
  UserCheck,
  ClipboardList,
  DollarSign,
  CalendarClock,
  MessageSquare,
  AlertTriangle,
  Loader2,
  LogOut,
  GraduationCap,
} from 'lucide-react';
import { requireAdmin } from '../../../lib/auth-guards';
import { getDb, applications, students, households, guardians } from '../../../db';
import { eq, and } from 'drizzle-orm';
import { cn } from '../../../utils';
import { createLogoutCookie } from '../../../lib/auth';

// ═══════════════════════════════════════════════════════════
// SERVER FUNCTIONS
// ═══════════════════════════════════════════════════════════

const getApplication = createServerFn({ method: 'GET' })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const db = getDb();

    try {
      const [application] = await db
        .select()
        .from(applications)
        .where(eq(applications.id, data.id));

      if (!application) {
        return { success: false, error: 'Application not found' };
      }

      // Get student info
      const [student] = await db
        .select()
        .from(students)
        .where(eq(students.id, application.studentId));

      // Get household info
      const [household] = await db
        .select()
        .from(households)
        .where(eq(households.id, application.householdId));

      // Get guardians
      const householdGuardians = await db
        .select()
        .from(guardians)
        .where(eq(guardians.householdId, application.householdId));

      return {
        success: true,
        application,
        student,
        household,
        guardians: householdGuardians,
      };
    } catch (error) {
      console.error('Error fetching application:', error);
      return { success: false, error: 'Failed to fetch application' };
    }
  });

const updateApplicationStatus = createServerFn({ method: 'POST' })
  .validator((data: {
    id: string;
    status: string;
    decisionNotes?: string;
    interviewDate?: string;
    waitlistPosition?: number;
  }) => data)
  .handler(async ({ data }) => {
    const db = getDb();

    try {
      const updateData: Record<string, unknown> = {
        status: data.status,
        updatedAt: new Date(),
      };

      // Handle specific status transitions
      if (['accepted', 'denied', 'waitlisted'].includes(data.status)) {
        updateData.decisionAt = new Date();
        if (data.decisionNotes) {
          updateData.decisionNotes = data.decisionNotes;
        }
      }

      if (data.status === 'interview_scheduled' && data.interviewDate) {
        updateData.interviewScheduledAt = new Date(data.interviewDate);
      }

      if (data.status === 'interview_completed') {
        updateData.interviewCompletedAt = new Date();
      }

      if (data.status === 'waitlisted' && data.waitlistPosition) {
        updateData.waitlistPosition = data.waitlistPosition;
      }

      await db
        .update(applications)
        .set(updateData)
        .where(eq(applications.id, data.id));

      return { success: true };
    } catch (error) {
      console.error('Error updating application:', error);
      return { success: false, error: 'Failed to update application' };
    }
  });

const enrollStudent = createServerFn({ method: 'POST' })
  .validator((data: { applicationId: string; studentId: string }) => data)
  .handler(async ({ data }) => {
    const db = getDb();

    try {
      // Update student enrollment status
      await db
        .update(students)
        .set({
          enrollmentStatus: 'enrolled',
          updatedAt: new Date(),
        })
        .where(eq(students.id, data.studentId));

      // Update application status to enrolled
      await db
        .update(applications)
        .set({
          status: 'enrolled',
          updatedAt: new Date(),
        })
        .where(eq(applications.id, data.applicationId));

      return { success: true };
    } catch (error) {
      console.error('Error enrolling student:', error);
      return { success: false, error: 'Failed to enroll student' };
    }
  });

const logoutUser = createServerFn({ method: 'POST' }).handler(async () => {
  return { cookie: createLogoutCookie() };
});

// ═══════════════════════════════════════════════════════════
// ROUTE DEFINITION
// ═══════════════════════════════════════════════════════════

export const Route = createFileRoute('/admin/applications/$id')({
  head: () => ({
    meta: [
      { title: 'Application Details | School Dashboard | EnrollSage' },
      { name: 'description', content: 'Review and manage application details.' },
    ],
  }),
  loader: async ({ params }) => {
    const [authResult, applicationData] = await Promise.all([
      requireAdmin(),
      getApplication({ data: { id: params.id } }),
    ]);
    return { authResult, ...applicationData, applicationId: params.id };
  },
  component: ApplicationDetailPage,
});

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════

function ApplicationDetailPage() {
  const navigate = useNavigate();
  const { authResult, application, student, household, guardians: guardianList, applicationId } = Route.useLoaderData();

  const [isUpdating, setIsUpdating] = useState(false);
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [decisionType, setDecisionType] = useState<'accepted' | 'denied' | 'waitlisted'>('accepted');
  const [decisionNotes, setDecisionNotes] = useState('');
  const [interviewDate, setInterviewDate] = useState('');
  const [waitlistPosition, setWaitlistPosition] = useState(1);

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

  if (!application) {
    return (
      <div className="min-h-screen bg-[#F8F9F6] flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 mx-auto text-amber-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Application Not Found</h2>
          <Link to="/admin/applications" className="text-[#5B7F6D] hover:underline">
            ← Back to Applications
          </Link>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    const result = await logoutUser();
    if (result.cookie) document.cookie = result.cookie;
    navigate({ to: '/login' });
  };

  // Status transition handlers
  const handleStartReview = async () => {
    setIsUpdating(true);
    await updateApplicationStatus({ data: { id: applicationId, status: 'under_review' } });
    window.location.reload();
  };

  const handleScheduleInterview = async () => {
    if (!interviewDate) return;
    setIsUpdating(true);
    await updateApplicationStatus({
      data: { id: applicationId, status: 'interview_scheduled', interviewDate }
    });
    setShowInterviewModal(false);
    window.location.reload();
  };

  const handleCompleteInterview = async () => {
    setIsUpdating(true);
    await updateApplicationStatus({ data: { id: applicationId, status: 'interview_completed' } });
    window.location.reload();
  };

  const handleMakeDecision = async () => {
    setIsUpdating(true);
    await updateApplicationStatus({
      data: {
        id: applicationId,
        status: decisionType,
        decisionNotes,
        waitlistPosition: decisionType === 'waitlisted' ? waitlistPosition : undefined,
      }
    });
    setShowDecisionModal(false);
    window.location.reload();
  };

  const handleEnroll = async () => {
    setIsUpdating(true);
    await enrollStudent({
      data: { applicationId, studentId: application.studentId }
    });
    setShowEnrollModal(false);
    window.location.reload();
  };

  // Format dates
  const formatDate = (date: Date | null | undefined) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateTime = (date: Date | null | undefined) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // Get available actions based on current status
  const getAvailableActions = () => {
    const actions: JSX.Element[] = [];
    const status = application.status;

    if (status === 'submitted') {
      actions.push(
        <button
          key="review"
          onClick={handleStartReview}
          disabled={isUpdating}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50"
        >
          <ClipboardList className="w-4 h-4" />
          Start Review
        </button>
      );
    }

    if (status === 'under_review') {
      actions.push(
        <button
          key="interview"
          onClick={() => setShowInterviewModal(true)}
          disabled={isUpdating}
          className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
        >
          <CalendarClock className="w-4 h-4" />
          Schedule Interview
        </button>
      );
      actions.push(
        <button
          key="decision"
          onClick={() => setShowDecisionModal(true)}
          disabled={isUpdating}
          className="flex items-center gap-2 px-4 py-2 bg-[#5B7F6D] text-white rounded-lg hover:bg-[#4A6E5C] disabled:opacity-50"
        >
          <CheckCircle className="w-4 h-4" />
          Make Decision
        </button>
      );
    }

    if (status === 'interview_scheduled') {
      actions.push(
        <button
          key="complete-interview"
          onClick={handleCompleteInterview}
          disabled={isUpdating}
          className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
        >
          <CheckCircle className="w-4 h-4" />
          Mark Interview Complete
        </button>
      );
    }

    if (status === 'interview_completed') {
      actions.push(
        <button
          key="decision"
          onClick={() => setShowDecisionModal(true)}
          disabled={isUpdating}
          className="flex items-center gap-2 px-4 py-2 bg-[#5B7F6D] text-white rounded-lg hover:bg-[#4A6E5C] disabled:opacity-50"
        >
          <CheckCircle className="w-4 h-4" />
          Make Decision
        </button>
      );
    }

    if (status === 'accepted') {
      actions.push(
        <button
          key="enroll"
          onClick={() => setShowEnrollModal(true)}
          disabled={isUpdating}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          <GraduationCap className="w-4 h-4" />
          Enroll Student
        </button>
      );
    }

    return actions;
  };

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
              <Link to="/admin/leads" className="text-gray-600 hover:text-[#5B7F6D]">Leads</Link>
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
        {/* Back Link */}
        <Link
          to="/admin/applications"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-[#5B7F6D] mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Applications
        </Link>

        {/* Page Header */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#2D4F3E] font-display">
                {student?.firstName} {student?.lastName}
              </h2>
              <p className="text-gray-600">
                Applying for {application.gradeApplyingFor === 'PK' ? 'Pre-K' :
                  application.gradeApplyingFor === 'K' ? 'Kindergarten' :
                  `Grade ${application.gradeApplyingFor}`} • {application.schoolYear}
              </p>
            </div>
          </div>
          <StatusBadge status={application.status || 'draft'} large />
        </div>

        {/* Status Pipeline */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h3 className="font-semibold text-[#2D4F3E] mb-4">Application Pipeline</h3>
          <StatusPipeline currentStatus={application.status || 'draft'} />
        </div>

        {/* Actions Bar */}
        {getAvailableActions().length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
            <div className="flex items-center gap-3">
              {isUpdating && <Loader2 className="w-5 h-5 animate-spin text-[#5B7F6D]" />}
              {getAvailableActions()}
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-6">
          {/* Main Content - 2 columns */}
          <div className="col-span-2 space-y-6">
            {/* Student Information */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-[#2D4F3E] mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-[#5B7F6D]" />
                Student Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Full Name</label>
                  <p className="font-medium">{student?.firstName} {student?.lastName}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Date of Birth</label>
                  <p className="font-medium">{student?.dateOfBirth ? formatDate(new Date(student.dateOfBirth)) : 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Grade Applying For</label>
                  <p className="font-medium">
                    {application.gradeApplyingFor === 'PK' ? 'Pre-K' :
                      application.gradeApplyingFor === 'K' ? 'Kindergarten' :
                      `Grade ${application.gradeApplyingFor}`}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Application Type</label>
                  <p className="font-medium capitalize">{application.applicationType?.replace('_', ' ') || 'New'}</p>
                </div>
              </div>
            </div>

            {/* Household Information */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-[#2D4F3E] mb-4 flex items-center gap-2">
                <Home className="w-5 h-5 text-[#5B7F6D]" />
                Household Information
              </h3>
              <div className="mb-4">
                <label className="text-sm text-gray-500">Household Name</label>
                <p className="font-medium">{household?.name || 'N/A'}</p>
              </div>

              {/* Guardians */}
              <div>
                <label className="text-sm text-gray-500 block mb-2">Guardians</label>
                <div className="space-y-3">
                  {guardianList?.map((guardian: typeof guardians.$inferSelect) => (
                    <div key={guardian.id} className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium">{guardian.firstName} {guardian.lastName}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                        {guardian.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {guardian.email}
                          </span>
                        )}
                        {guardian.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {guardian.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Decision Notes (if exists) */}
            {application.decisionNotes && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-[#2D4F3E] mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-[#5B7F6D]" />
                  Decision Notes
                </h3>
                <p className="text-gray-700 whitespace-pre-wrap">{application.decisionNotes}</p>
                {application.decisionAt && (
                  <p className="text-sm text-gray-500 mt-2">
                    Decision made on {formatDate(application.decisionAt)}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Sidebar - 1 column */}
          <div className="space-y-6">
            {/* Timeline */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-[#2D4F3E] mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#5B7F6D]" />
                Timeline
              </h3>
              <div className="space-y-4">
                <TimelineItem
                  label="Created"
                  date={application.createdAt}
                  completed
                />
                <TimelineItem
                  label="Submitted"
                  date={application.submittedAt}
                  completed={!!application.submittedAt}
                />
                {application.interviewScheduledAt && (
                  <TimelineItem
                    label="Interview Scheduled"
                    date={application.interviewScheduledAt}
                    completed
                  />
                )}
                {application.interviewCompletedAt && (
                  <TimelineItem
                    label="Interview Completed"
                    date={application.interviewCompletedAt}
                    completed
                  />
                )}
                {application.decisionAt && (
                  <TimelineItem
                    label="Decision Made"
                    date={application.decisionAt}
                    completed
                  />
                )}
              </div>
            </div>

            {/* Application Fee */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-[#2D4F3E] mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-[#5B7F6D]" />
                Application Fee
              </h3>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">
                  ${((application.applicationFeeAmount || 0) / 100).toFixed(2)}
                </span>
                {application.applicationFeePaid ? (
                  <span className="flex items-center gap-1 text-green-600 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    Paid
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-amber-600 text-sm">
                    <Hourglass className="w-4 h-4" />
                    Pending
                  </span>
                )}
              </div>
            </div>

            {/* Waitlist Info (if applicable) */}
            {application.status === 'waitlisted' && application.waitlistPosition && (
              <div className="bg-amber-50 rounded-xl border border-amber-200 p-6">
                <h3 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
                  <Hourglass className="w-5 h-5" />
                  Waitlist Position
                </h3>
                <p className="text-3xl font-bold text-amber-700">#{application.waitlistPosition}</p>
                {application.waitlistNotes && (
                  <p className="text-sm text-amber-600 mt-2">{application.waitlistNotes}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Schedule Interview Modal */}
      {showInterviewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-[#2D4F3E] mb-4">Schedule Interview</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Interview Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={interviewDate}
                  onChange={(e) => setInterviewDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#5B7F6D] focus:ring-2 focus:ring-[#5B7F6D]/10"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowInterviewModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleScheduleInterview}
                disabled={!interviewDate || isUpdating}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
              >
                Schedule Interview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decision Modal */}
      {showDecisionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-[#2D4F3E] mb-4">Make Decision</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Decision</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDecisionType('accepted')}
                    className={cn(
                      'flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-colors',
                      decisionType === 'accepted'
                        ? 'bg-green-500 text-white border-green-500'
                        : 'border-gray-200 hover:bg-gray-50'
                    )}
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => setDecisionType('waitlisted')}
                    className={cn(
                      'flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-colors',
                      decisionType === 'waitlisted'
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'border-gray-200 hover:bg-gray-50'
                    )}
                  >
                    Waitlist
                  </button>
                  <button
                    onClick={() => setDecisionType('denied')}
                    className={cn(
                      'flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-colors',
                      decisionType === 'denied'
                        ? 'bg-red-500 text-white border-red-500'
                        : 'border-gray-200 hover:bg-gray-50'
                    )}
                  >
                    Deny
                  </button>
                </div>
              </div>

              {decisionType === 'waitlisted' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Waitlist Position
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={waitlistPosition}
                    onChange={(e) => setWaitlistPosition(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#5B7F6D] focus:ring-2 focus:ring-[#5B7F6D]/10"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={decisionNotes}
                  onChange={(e) => setDecisionNotes(e.target.value)}
                  rows={3}
                  placeholder="Add any notes about this decision..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#5B7F6D] focus:ring-2 focus:ring-[#5B7F6D]/10"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowDecisionModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleMakeDecision}
                disabled={isUpdating}
                className={cn(
                  'px-4 py-2 text-white rounded-lg disabled:opacity-50',
                  decisionType === 'accepted' && 'bg-green-500 hover:bg-green-600',
                  decisionType === 'waitlisted' && 'bg-amber-500 hover:bg-amber-600',
                  decisionType === 'denied' && 'bg-red-500 hover:bg-red-600'
                )}
              >
                Confirm {decisionType.charAt(0).toUpperCase() + decisionType.slice(1)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enroll Modal */}
      {showEnrollModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-[#2D4F3E] mb-4">Enroll Student</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to enroll <strong>{student?.firstName} {student?.lastName}</strong> for {application.schoolYear}?
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <GraduationCap className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-green-800">This will:</p>
                  <ul className="text-sm text-green-700 mt-1 space-y-1">
                    <li>• Update student status to "Enrolled"</li>
                    <li>• Mark application as "Enrolled"</li>
                    <li>• Make student visible in Students list</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowEnrollModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleEnroll}
                disabled={isUpdating}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                Confirm Enrollment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// HELPER COMPONENTS
// ═══════════════════════════════════════════════════════════

function StatusBadge({ status, large = false }: { status: string; large?: boolean }) {
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
    denied: 'Denied',
    withdrawn: 'Withdrawn',
    enrolled: 'Enrolled',
  };

  return (
    <span className={cn(
      'rounded-full whitespace-nowrap',
      large ? 'text-sm px-4 py-2 font-medium' : 'text-xs px-2 py-1',
      styles[status] || 'bg-gray-100 text-gray-700'
    )}>
      {labels[status] || status}
    </span>
  );
}

function StatusPipeline({ currentStatus }: { currentStatus: string }) {
  const stages = [
    { key: 'submitted', label: 'Submitted' },
    { key: 'under_review', label: 'Review' },
    { key: 'interview', label: 'Interview' },
    { key: 'decision', label: 'Decision' },
    { key: 'enrolled', label: 'Enrolled' },
  ];

  const getStageStatus = (stageKey: string) => {
    const statusOrder = ['draft', 'submitted', 'under_review', 'interview_scheduled', 'interview_completed', 'accepted', 'waitlisted', 'denied', 'enrolled'];
    const currentIndex = statusOrder.indexOf(currentStatus);

    if (currentStatus === 'withdrawn') return 'inactive';
    if (currentStatus === 'denied') {
      if (stageKey === 'decision') return 'denied';
      if (['submitted', 'under_review'].includes(stageKey)) return 'completed';
      return 'inactive';
    }
    if (currentStatus === 'waitlisted') {
      if (stageKey === 'decision') return 'waitlisted';
      if (['submitted', 'under_review'].includes(stageKey)) return 'completed';
      return 'inactive';
    }

    switch (stageKey) {
      case 'submitted':
        return currentIndex >= 1 ? 'completed' : 'inactive';
      case 'under_review':
        return currentIndex >= 2 ? 'completed' : currentIndex === 1 ? 'active' : 'inactive';
      case 'interview':
        if (currentStatus === 'interview_completed') return 'completed';
        if (currentStatus === 'interview_scheduled') return 'active';
        return currentIndex > 4 ? 'completed' : 'inactive';
      case 'decision':
        if (['accepted', 'enrolled'].includes(currentStatus)) return 'completed';
        if (currentStatus === 'interview_completed') return 'active';
        return 'inactive';
      case 'enrolled':
        return currentStatus === 'enrolled' ? 'completed' : 'inactive';
      default:
        return 'inactive';
    }
  };

  return (
    <div className="flex items-center justify-between">
      {stages.map((stage, index) => {
        const stageStatus = getStageStatus(stage.key);

        return (
          <div key={stage.key} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium',
                stageStatus === 'completed' && 'bg-green-500 text-white',
                stageStatus === 'active' && 'bg-[#5B7F6D] text-white',
                stageStatus === 'denied' && 'bg-red-500 text-white',
                stageStatus === 'waitlisted' && 'bg-amber-500 text-white',
                stageStatus === 'inactive' && 'bg-gray-200 text-gray-500'
              )}>
                {stageStatus === 'completed' ? (
                  <CheckCircle className="w-5 h-5" />
                ) : stageStatus === 'denied' ? (
                  <XCircle className="w-5 h-5" />
                ) : stageStatus === 'waitlisted' ? (
                  <Hourglass className="w-5 h-5" />
                ) : (
                  index + 1
                )}
              </div>
              <span className={cn(
                'text-xs mt-2',
                stageStatus === 'active' && 'font-medium text-[#5B7F6D]',
                stageStatus === 'completed' && 'text-green-600',
                stageStatus === 'denied' && 'text-red-600',
                stageStatus === 'waitlisted' && 'text-amber-600',
                stageStatus === 'inactive' && 'text-gray-400'
              )}>
                {stage.label}
              </span>
            </div>
            {index < stages.length - 1 && (
              <div className={cn(
                'flex-1 h-0.5 mx-2 mt-[-20px]',
                getStageStatus(stages[index + 1].key) !== 'inactive' ? 'bg-green-300' : 'bg-gray-200'
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function TimelineItem({ label, date, completed }: { label: string; date?: Date | null; completed: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <div className={cn(
        'w-2 h-2 rounded-full mt-2',
        completed ? 'bg-green-500' : 'bg-gray-300'
      )} />
      <div>
        <p className={cn(
          'text-sm font-medium',
          completed ? 'text-gray-700' : 'text-gray-400'
        )}>
          {label}
        </p>
        <p className="text-xs text-gray-500">
          {date ? new Date(date).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          }) : 'Pending'}
        </p>
      </div>
    </div>
  );
}
