// 🎭 Admin Demo - See the power before you commit
// "The best pitch is showing, not telling"
//
// ╭────────────────────────────────────────────────────────────╮
// │  SCHOOL ADMIN DEMO                                          │
// │  An interactive walkthrough of what school administrators   │
// │  see when they log into Enrollsy. No login required!        │
// ╰────────────────────────────────────────────────────────────╯

import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import {
  Users,
  GraduationCap,
  Home,
  ArrowRight,
  FileText,
  UserPlus,
  Calendar,
  X,
  ChevronRight,
  ChevronLeft,
  Play,
  Sparkles,
  Phone,
  Mail,
  Search,
  BarChart3,
  Settings,
  Bell,
  MessageSquare,
  DollarSign,
} from 'lucide-react';
import { cn } from '../../utils';

// ═══════════════════════════════════════════════════════════
// MOCK DATA - Realistic demo data that tells a story
// ═══════════════════════════════════════════════════════════

const mockStats = {
  totalHouseholds: 127,
  totalStudents: 203,
  enrolledStudents: 178,
  pendingApplications: 14,
  activeLeads: 23,
};

const mockApplications = [
  { id: '1', studentName: 'Emma Thompson', grade: 'K', schoolYear: '2025-2026', status: 'submitted', date: '2 hours ago' },
  { id: '2', studentName: 'Liam Martinez', grade: '3', schoolYear: '2025-2026', status: 'under_review', date: '1 day ago' },
  { id: '3', studentName: 'Sophia Chen', grade: '1', schoolYear: '2025-2026', status: 'interview_scheduled', date: '2 days ago' },
  { id: '4', studentName: 'Noah Williams', grade: 'PK', schoolYear: '2025-2026', status: 'accepted', date: '3 days ago' },
  { id: '5', studentName: 'Olivia Brown', grade: '5', schoolYear: '2025-2026', status: 'submitted', date: '4 days ago' },
];

const mockLeads = [
  { id: '1', name: 'The Garcia Family', students: 2, stage: 'tour_scheduled', date: '3 hours ago' },
  { id: '2', name: 'The Patel Family', students: 1, stage: 'inquiry', date: '1 day ago' },
  { id: '3', name: 'The Kim Family', students: 3, stage: 'tour_completed', date: '2 days ago' },
];

// ═══════════════════════════════════════════════════════════
// GUIDED TOUR STEPS
// ═══════════════════════════════════════════════════════════

const tourSteps = [
  {
    id: 'welcome',
    title: 'Welcome to Your Dashboard! 🎓',
    description: 'This is your command center. At a glance, see everything happening in your school - families, students, applications, and leads.',
    target: 'dashboard-stats',
    position: 'bottom',
  },
  {
    id: 'stats',
    title: 'Real-Time Enrollment Stats',
    description: 'Know your numbers instantly. Track families, students, and watch your enrollment goals come to life.',
    target: 'stats-grid',
    position: 'bottom',
  },
  {
    id: 'applications',
    title: 'Applications at Your Fingertips',
    description: 'Every application flows through here. Review submissions, schedule interviews, and move families through your admissions process.',
    target: 'applications-section',
    position: 'left',
  },
  {
    id: 'leads',
    title: 'Never Miss a Lead',
    description: 'From first inquiry to enrolled student. Track every prospective family, schedule tours, and nurture them toward application.',
    target: 'leads-section',
    position: 'left',
  },
  {
    id: 'quick-actions',
    title: 'One-Click Actions',
    description: 'Add leads, register families, review applications - everything is just one click away. Work smarter, not harder.',
    target: 'quick-actions',
    position: 'left',
  },
];

// ═══════════════════════════════════════════════════════════
// ROUTE DEFINITION
// ═══════════════════════════════════════════════════════════

export const Route = createFileRoute('/demo/admin')({
  head: () => ({
    meta: [
      { title: 'School Admin Demo | Enrollsy' },
      { name: 'description', content: 'See what school administrators can do with Enrollsy. Interactive demo - no login required.' },
      { property: 'og:title', content: 'School Admin Demo | Enrollsy' },
    ],
  }),
  component: AdminDemo,
});

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════

function AdminDemo() {
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
    <div className="min-h-screen bg-[#F7F5F2]">
      {/* Demo Banner */}
      <div className="bg-gradient-to-r from-[#2F5D50] to-[#1F2A44] text-white py-3 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5" />
            <span className="font-medium">Interactive Demo</span>
            <span className="text-white/70">|</span>
            <span className="text-white/70 text-sm">School Administrator View</span>
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
              to="/demo/family"
              className="text-sm text-white/80 hover:text-white"
            >
              View Family Portal Demo →
            </Link>
            <Link
              to="/contact"
              className="bg-white text-[#2F5D50] px-4 py-1.5 rounded-md text-sm font-medium hover:bg-white/90"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>

      {/* Admin Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#2F5D50] rounded-lg flex items-center justify-center">
                  <span className="text-xl">🎓</span>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-[#1F2A44] font-display">School Dashboard</h1>
                  <p className="text-xs text-gray-500">Westlake Academy</p>
                </div>
              </div>
            </div>

            {/* Admin Nav */}
            <nav className="flex items-center gap-6">
              <span className="text-[#2F5D50] font-medium cursor-default">Dashboard</span>
              <span className="text-gray-400 cursor-not-allowed">Applications</span>
              <span className="text-gray-400 cursor-not-allowed">Leads</span>
              <span className="text-gray-400 cursor-not-allowed">Families</span>
              <span className="text-gray-400 cursor-not-allowed">Students</span>
              <span className="text-gray-400 cursor-not-allowed">Settings</span>
              <div className="flex items-center gap-2 text-gray-500">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium">
                  SA
                </div>
                <span className="text-sm">Sarah Admin</span>
              </div>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Header */}
        <div className="mb-8" id="dashboard-stats">
          <h2 className="text-2xl font-bold text-[#1F2A44] font-display">
            Welcome back, Sarah!
          </h2>
          <p className="text-gray-600">Here's what's happening with your school today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8" id="stats-grid">
          <StatCard
            label="Families"
            value={mockStats.totalHouseholds.toString()}
            icon={Home}
            color="evergreen"
            highlighted={showTour && currentStep === 1}
          />
          <StatCard
            label="Total Students"
            value={mockStats.totalStudents.toString()}
            icon={Users}
            color="navy"
            highlighted={showTour && currentStep === 1}
          />
          <StatCard
            label="Enrolled"
            value={mockStats.enrolledStudents.toString()}
            icon={GraduationCap}
            color="blue"
            highlighted={showTour && currentStep === 1}
          />
          <StatCard
            label="Applications"
            value={mockStats.pendingApplications.toString()}
            icon={FileText}
            color="amber"
            badge="Pending"
            highlighted={showTour && currentStep === 1}
          />
          <StatCard
            label="Active Leads"
            value={mockStats.activeLeads.toString()}
            icon={UserPlus}
            color="purple"
            highlighted={showTour && currentStep === 1}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Applications */}
          <div
            className={cn(
              "lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6 transition-all",
              showTour && currentStep === 2 && "ring-2 ring-[#2F5D50] ring-offset-2"
            )}
            id="applications-section"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-[#1F2A44] font-display flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#2F5D50]" />
                Recent Applications
              </h3>
              <span className="text-sm text-[#2F5D50] flex items-center gap-1 cursor-pointer hover:underline">
                View all <ArrowRight className="w-4 h-4" />
              </span>
            </div>
            <div className="space-y-4">
              {mockApplications.map((app) => (
                <div
                  key={app.id}
                  className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 px-2 -mx-2 rounded cursor-pointer"
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
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div
              className={cn(
                "bg-white rounded-xl border border-gray-200 p-6 transition-all",
                showTour && currentStep === 4 && "ring-2 ring-[#2F5D50] ring-offset-2"
              )}
              id="quick-actions"
            >
              <h3 className="font-semibold text-[#1F2A44] mb-4 font-display">Quick Actions</h3>
              <div className="space-y-2">
                <button className="block w-full py-2 px-4 bg-[#2F5D50] text-white rounded-lg text-center hover:bg-[#1F2A44] transition-colors">
                  + Add New Lead
                </button>
                <button className="block w-full py-2 px-4 bg-gray-100 text-[#1F2A44] rounded-lg text-center hover:bg-gray-200 transition-colors">
                  + Register Family
                </button>
                <button className="block w-full py-2 px-4 bg-gray-100 text-[#1F2A44] rounded-lg text-center hover:bg-gray-200 transition-colors">
                  Review Applications
                </button>
              </div>
            </div>

            {/* Recent Leads */}
            <div
              className={cn(
                "bg-white rounded-xl border border-gray-200 p-6 transition-all",
                showTour && currentStep === 3 && "ring-2 ring-[#2F5D50] ring-offset-2"
              )}
              id="leads-section"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[#1F2A44] font-display flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-[#2F5D50]" />
                  Recent Leads
                </h3>
                <span className="text-xs text-[#2F5D50] cursor-pointer hover:underline">
                  View all
                </span>
              </div>
              <div className="space-y-3">
                {mockLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                  >
                    <p className="font-medium text-[#1F2A44] text-sm">{lead.name}</p>
                    <p className="text-xs text-gray-500">
                      {lead.students} student{lead.students !== 1 ? 's' : ''} • {lead.date}
                    </p>
                    <LeadStageBadge stage={lead.stage} />
                  </div>
                ))}
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
          <h3 className="font-semibold text-[#1F2A44] mb-2">Ready to transform your admissions?</h3>
          <p className="text-sm text-gray-600 mb-4">
            See how Enrollsy can work for your school. Schedule a personalized demo with our team.
          </p>
          <div className="flex gap-3">
            <Link
              to="/contact"
              className="flex-1 bg-[#2F5D50] text-white px-4 py-2 rounded-lg text-center text-sm font-medium hover:bg-[#1F2A44]"
            >
              Schedule Demo
            </Link>
            <Link
              to="/demo/family"
              className="flex-1 border border-gray-200 text-[#1F2A44] px-4 py-2 rounded-lg text-center text-sm hover:bg-gray-50"
            >
              Family Demo
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
          <span className="text-xs text-[#2F5D50] font-medium bg-[#2F5D50]/10 px-2 py-1 rounded-full">
            Step {currentStep + 1} of {totalSteps}
          </span>
        </div>

        <h3 className="text-lg font-semibold text-[#1F2A44] mb-2">{step.title}</h3>
        <p className="text-gray-600 text-sm mb-6">{step.description}</p>

        {/* Progress bar */}
        <div className="flex gap-1 mb-4">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                i <= currentStep ? "bg-[#2F5D50]" : "bg-gray-200"
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
              currentStep === 0 ? "text-gray-300 cursor-not-allowed" : "text-gray-600 hover:text-[#2F5D50]"
            )}
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <button
            onClick={onNext}
            className="flex items-center gap-1 bg-[#2F5D50] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#1F2A44]"
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

function StatCard({
  label,
  value,
  icon: Icon,
  badge,
  color,
  highlighted = false,
}: {
  label: string;
  value: string;
  icon: typeof Users;
  badge?: string;
  color: 'evergreen' | 'navy' | 'blue' | 'amber' | 'purple';
  highlighted?: boolean;
}) {
  const colors = {
    evergreen: 'bg-[#2F5D50]/10 text-[#2F5D50]',
    navy: 'bg-[#1F2A44]/10 text-[#1F2A44]',
    blue: 'bg-blue-100 text-blue-600',
    amber: 'bg-amber-100 text-amber-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  return (
    <div className={cn(
      "bg-white rounded-xl border border-gray-200 p-6 transition-all",
      highlighted && "ring-2 ring-[#2F5D50] ring-offset-2"
    )}>
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
