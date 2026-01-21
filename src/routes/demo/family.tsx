// 👨‍👩‍👧‍👦 Family Portal Demo - Walk in a parent's shoes
// "Show them the simplicity, and they'll want it for their school"
//
// ╭────────────────────────────────────────────────────────────╮
// │  FAMILY PORTAL DEMO                                         │
// │  An interactive walkthrough of what parents see when they   │
// │  manage their children's enrollment. No login required!     │
// ╰────────────────────────────────────────────────────────────╯

import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import {
  Home,
  Users,
  GraduationCap,
  FileText,
  DollarSign,
  MessageSquare,
  Settings,
  ChevronRight,
  ChevronLeft,
  Clock,
  CheckCircle,
  AlertCircle,
  X,
  Play,
  Sparkles,
  CreditCard,
  Calendar,
  Download,
  Eye,
} from 'lucide-react';
import { cn } from '../../utils';

// ═══════════════════════════════════════════════════════════
// MOCK DATA - A day in the life of the Martinez family
// ═══════════════════════════════════════════════════════════

const mockFamily = {
  name: 'The Martinez Family',
  parent: 'Maria Martinez',
};

const mockStudents = [
  {
    id: '1',
    firstName: 'Sofia',
    lastName: 'Martinez',
    preferredName: null,
    gradeLevel: '3',
    enrollmentStatus: 'enrolled',
    dateOfBirth: '2016-04-12',
  },
  {
    id: '2',
    firstName: 'Diego',
    lastName: 'Martinez',
    preferredName: 'Didi',
    gradeLevel: 'K',
    enrollmentStatus: 'applicant',
    dateOfBirth: '2019-09-28',
  },
];

const mockApplications = [
  {
    id: '1',
    studentName: 'Diego Martinez',
    gradeApplyingFor: 'K',
    schoolYear: '2025-2026',
    status: 'under_review',
    submittedAt: '2025-01-15',
  },
];

const mockInvoices = [
  {
    id: '1',
    invoiceNumber: 'INV-2025-001',
    description: 'Spring Semester Tuition',
    total: 425000,
    amountDue: 425000,
    status: 'pending',
    dueDate: 'Feb 1, 2025',
  },
  {
    id: '2',
    invoiceNumber: 'INV-2024-004',
    description: 'Fall Semester Tuition',
    total: 425000,
    amountDue: 0,
    status: 'paid',
    dueDate: 'Aug 1, 2024',
  },
];

const mockPaymentPlans = {
  active: true,
  nextPayment: '$1,500.00',
  nextDate: 'Feb 1, 2025',
  remaining: 4,
};

// ═══════════════════════════════════════════════════════════
// GUIDED TOUR STEPS
// ═══════════════════════════════════════════════════════════

const tourSteps = [
  {
    id: 'welcome',
    title: 'Welcome to Your Family Portal! 🏠',
    description: 'Everything about your children\'s enrollment in one place. Track applications, view billing, and stay connected with the school.',
    target: 'welcome-section',
    position: 'bottom',
  },
  {
    id: 'children',
    title: 'Your Children at a Glance',
    description: 'See all your enrolled children and their status. Enrolled, applying, or waitlisted - it\'s all here.',
    target: 'children-section',
    position: 'right',
  },
  {
    id: 'applications',
    title: 'Track Every Application',
    description: 'No more wondering "did they receive it?" Watch your application move through the process in real-time.',
    target: 'applications-section',
    position: 'right',
  },
  {
    id: 'billing',
    title: 'Clear, Simple Billing',
    description: 'See what you owe, pay online, and set up autopay. No more paper statements or confused phone calls.',
    target: 'billing-section',
    position: 'left',
  },
  {
    id: 'quick-actions',
    title: 'Everything One Click Away',
    description: 'Start a new application, make a payment, or contact the school. Parents love how simple this is.',
    target: 'quick-actions',
    position: 'left',
  },
];

// ═══════════════════════════════════════════════════════════
// ROUTE DEFINITION
// ═══════════════════════════════════════════════════════════

export const Route = createFileRoute('/demo/family')({
  head: () => ({
    meta: [
      { title: 'Family Portal Demo | EnrollSage' },
      { name: 'description', content: 'See what parents experience with EnrollSage. Track applications, manage billing, and stay connected.' },
      { property: 'og:title', content: 'Family Portal Demo | EnrollSage' },
    ],
  }),
  component: FamilyDemo,
});

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════

function FamilyDemo() {
  const [currentStep, setCurrentStep] = useState(0);
  const [showTour, setShowTour] = useState(true);
  const [tourCompleted, setTourCompleted] = useState(false);

  const nextStep = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setTourCompleted(true);
      setShowTour(false);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const restartTour = () => {
    setCurrentStep(0);
    setShowTour(true);
    setTourCompleted(false);
  };

  return (
    <div className="min-h-screen bg-[#F8F9F6]">
      {/* Demo Banner */}
      <div className="bg-gradient-to-r from-[#2D4F3E] to-[#5B7F6D] text-white py-3 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5" />
            <span className="font-medium">Interactive Demo</span>
            <span className="text-white/70">|</span>
            <span className="text-white/70 text-sm">Family Portal View</span>
          </div>
          <div className="flex items-center gap-4">
            {tourCompleted && (
              <button
                onClick={restartTour}
                className="text-sm text-white/80 hover:text-white flex items-center gap-1"
              >
                <Play className="w-4 h-4" /> Restart Tour
              </button>
            )}
            <Link
              to="/demo/admin"
              className="text-sm text-white/80 hover:text-white"
            >
              ← View Admin Demo
            </Link>
            <Link
              to="/contact"
              className="bg-white text-[#2D4F3E] px-4 py-1.5 rounded-md text-sm font-medium hover:bg-white/90"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#5B7F6D] rounded-lg flex items-center justify-center">
                <span className="text-lg">🌿</span>
              </div>
              <span className="font-bold text-lg text-[#2D4F3E] font-display">Family Portal</span>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {mockFamily.parent}
              </span>
              <div className="w-8 h-8 bg-[#5B7F6D]/10 rounded-full flex items-center justify-center text-sm font-medium text-[#5B7F6D]">
                MM
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8" id="welcome-section">
          <h1 className="text-2xl font-bold text-[#2D4F3E] font-display">
            Welcome, Maria!
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your family's enrollment and stay connected with the school.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Students Section */}
            <div
              className={cn(
                "bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-all",
                showTour && currentStep === 1 && "ring-2 ring-[#5B7F6D] ring-offset-2"
              )}
              id="children-section"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[#2D4F3E] flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-[#5B7F6D]" />
                  Your Children
                </h2>
              </div>

              <div className="space-y-4">
                {mockStudents.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[#5B7F6D]/10 rounded-full flex items-center justify-center">
                        <span className="text-xl">
                          {student.firstName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-[#2D4F3E]">
                          {student.preferredName || student.firstName} {student.lastName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {student.gradeLevel === 'K' ? 'Kindergarten' :
                            student.gradeLevel === 'PK' ? 'Pre-K' :
                              `Grade ${student.gradeLevel}`}
                        </p>
                      </div>
                    </div>
                    <EnrollmentStatusBadge status={student.enrollmentStatus} />
                  </div>
                ))}
              </div>
            </div>

            {/* Applications Section */}
            <div
              className={cn(
                "bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-all",
                showTour && currentStep === 2 && "ring-2 ring-[#5B7F6D] ring-offset-2"
              )}
              id="applications-section"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[#2D4F3E] flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#5B7F6D]" />
                  Applications
                </h2>
                <span className="text-sm text-[#5B7F6D] cursor-pointer hover:underline">
                  View all
                </span>
              </div>

              <div className="space-y-3">
                {mockApplications.map((app) => (
                  <div
                    key={app.id}
                    className="p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-[#2D4F3E]">
                          {app.studentName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {app.gradeApplyingFor === 'K' ? 'Kindergarten' : `Grade ${app.gradeApplyingFor}`} • {app.schoolYear}
                        </p>
                      </div>
                      <ApplicationStatusBadge status={app.status} />
                    </div>

                    {/* Application Timeline Preview */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>Submitted</span>
                        </div>
                        <ChevronRight className="w-4 h-4" />
                        <div className="flex items-center gap-1">
                          <div className="w-4 h-4 rounded-full border-2 border-amber-500 animate-pulse" />
                          <span className="text-amber-600 font-medium">Under Review</span>
                        </div>
                        <ChevronRight className="w-4 h-4" />
                        <div className="flex items-center gap-1 text-gray-300">
                          <Clock className="w-4 h-4" />
                          <span>Decision</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Empty state for starting new application */}
                <div className="p-4 border border-dashed border-gray-200 rounded-lg text-center hover:bg-gray-50 cursor-pointer transition-colors">
                  <FileText className="w-6 h-6 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">Start a new application</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div
              className={cn(
                "bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-all",
                showTour && currentStep === 4 && "ring-2 ring-[#5B7F6D] ring-offset-2"
              )}
              id="quick-actions"
            >
              <h3 className="font-semibold text-[#2D4F3E] mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <QuickAction
                  icon={FileText}
                  label="Start New Application"
                  href="#"
                />
                <QuickAction
                  icon={DollarSign}
                  label="Make a Payment"
                  href="#"
                />
                <QuickAction
                  icon={MessageSquare}
                  label="Contact School"
                  href="#"
                />
                <QuickAction
                  icon={Settings}
                  label="Account Settings"
                  href="#"
                />
              </div>
            </div>

            {/* Billing Summary */}
            <div
              className={cn(
                "bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-all",
                showTour && currentStep === 3 && "ring-2 ring-[#5B7F6D] ring-offset-2"
              )}
              id="billing-section"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[#2D4F3E] flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-[#5B7F6D]" />
                  Billing
                </h3>
                <span className="text-xs text-[#5B7F6D] cursor-pointer hover:underline">
                  View all
                </span>
              </div>

              {/* Payment Plan Status */}
              {mockPaymentPlans.active && (
                <div className="bg-[#5B7F6D]/5 border border-[#5B7F6D]/20 rounded-lg p-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#5B7F6D] font-medium">Payment Plan Active</span>
                    <CreditCard className="w-4 h-4 text-[#5B7F6D]" />
                  </div>
                  <p className="text-sm font-medium text-[#2D4F3E] mt-1">
                    Next: {mockPaymentPlans.nextPayment} on {mockPaymentPlans.nextDate}
                  </p>
                  <p className="text-xs text-gray-500">{mockPaymentPlans.remaining} payments remaining</p>
                </div>
              )}

              <div className="space-y-3">
                {mockInvoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-[#2D4F3E]">
                          {invoice.invoiceNumber}
                        </p>
                        <p className="text-xs text-gray-500">{invoice.description}</p>
                      </div>
                      <InvoiceStatusBadge status={invoice.status} />
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-gray-500">
                        Due: {invoice.dueDate}
                      </p>
                      <p className="text-sm font-medium text-[#2D4F3E]">
                        {invoice.status === 'paid' ? (
                          <span className="text-green-600">Paid</span>
                        ) : (
                          `$${(invoice.amountDue / 100).toLocaleString()}`
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pay Now Button */}
              <button className="w-full mt-4 bg-[#5B7F6D] text-white py-2 rounded-lg text-sm font-medium hover:bg-[#2D4F3E] transition-colors">
                Make a Payment
              </button>
            </div>

            {/* School Info */}
            <div className="bg-[#5B7F6D] rounded-xl p-6 text-white">
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
              <div className="mt-4 pt-4 border-t border-white/20">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-white/70" />
                  <span className="text-white/70">School Year:</span>
                  <span>2024-2025</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Tour Overlay */}
      {showTour && (
        <TourOverlay
          step={tourSteps[currentStep]}
          currentStep={currentStep}
          totalSteps={tourSteps.length}
          onNext={nextStep}
          onPrev={prevStep}
          onClose={() => {
            setShowTour(false);
            setTourCompleted(true);
          }}
        />
      )}

      {/* Completion CTA */}
      {tourCompleted && !showTour && (
        <div className="fixed bottom-6 right-6 bg-white rounded-xl shadow-lg border border-gray-200 p-6 max-w-sm animate-slide-up">
          <h3 className="font-semibold text-[#2D4F3E] mb-2">Parents love this experience</h3>
          <p className="text-sm text-gray-600 mb-4">
            Give your families a portal they'll actually want to use. See EnrollSage in action with a personalized demo.
          </p>
          <div className="flex gap-3">
            <Link
              to="/contact"
              className="flex-1 bg-[#5B7F6D] text-white px-4 py-2 rounded-lg text-center text-sm font-medium hover:bg-[#2D4F3E]"
            >
              Schedule Demo
            </Link>
            <Link
              to="/demo/admin"
              className="flex-1 border border-gray-200 text-[#2D4F3E] px-4 py-2 rounded-lg text-center text-sm hover:bg-gray-50"
            >
              Admin Demo
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// TOUR OVERLAY COMPONENT
// ═══════════════════════════════════════════════════════════

function TourOverlay({
  step,
  currentStep,
  totalSteps,
  onNext,
  onPrev,
  onClose,
}: {
  step: typeof tourSteps[0];
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
}) {
  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-40" />

      {/* Tour Card - Fixed position at bottom */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-white rounded-xl shadow-xl p-6 w-full max-w-md animate-slide-up">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-[#5B7F6D] font-medium bg-[#5B7F6D]/10 px-2 py-1 rounded-full">
            Step {currentStep + 1} of {totalSteps}
          </span>
        </div>

        <h3 className="text-lg font-semibold text-[#2D4F3E] mb-2">{step.title}</h3>
        <p className="text-gray-600 text-sm mb-6">{step.description}</p>

        {/* Progress bar */}
        <div className="flex gap-1 mb-4">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                i <= currentStep ? "bg-[#5B7F6D]" : "bg-gray-200"
              )}
            />
          ))}
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={onPrev}
            disabled={currentStep === 0}
            className={cn(
              "flex items-center gap-1 text-sm",
              currentStep === 0 ? "text-gray-300 cursor-not-allowed" : "text-gray-600 hover:text-[#5B7F6D]"
            )}
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <button
            onClick={onNext}
            className="flex items-center gap-1 bg-[#5B7F6D] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#2D4F3E]"
          >
            {currentStep === totalSteps - 1 ? 'Finish Tour' : 'Next'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
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
    <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group text-left">
      <div className="w-8 h-8 bg-[#5B7F6D]/10 rounded-lg flex items-center justify-center text-[#5B7F6D] group-hover:bg-[#5B7F6D] group-hover:text-white transition-colors">
        <Icon className="w-4 h-4" />
      </div>
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
    </button>
  );
}

function EnrollmentStatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; text: string; icon: React.ComponentType<{ className?: string }> }> = {
    enrolled: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
    applicant: { bg: 'bg-blue-100', text: 'text-blue-700', icon: Clock },
    accepted: { bg: 'bg-[#5B7F6D]/20', text: 'text-[#5B7F6D]', icon: CheckCircle },
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
    enrolled: 'bg-[#5B7F6D]/20 text-[#5B7F6D]',
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

  const labels: Record<string, string> = {
    draft: 'Draft',
    pending: 'Due',
    sent: 'Sent',
    paid: 'Paid',
    overdue: 'Overdue',
    void: 'Void',
  };

  return (
    <span className={cn('text-xs px-2 py-1 rounded-full', styles[status] || 'bg-gray-100 text-gray-600')}>
      {labels[status] || status}
    </span>
  );
}
