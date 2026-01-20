// 🎯 Leads - The admissions pipeline
// "Every inquiry is a family dreaming of what's possible for their child"
//
// ╭────────────────────────────────────────────────────────────╮
// │  LEAD MANAGEMENT (CRM)                                      │
// │  Track prospective families from inquiry to application.   │
// │  The start of every enrollment journey.                    │
// ╰────────────────────────────────────────────────────────────╯

import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { useState, useEffect } from 'react';
import {
  UserPlus,
  Search,
  ChevronRight,
  Plus,
  Phone,
  Mail,
  Calendar,
  Users,
  LogOut,
  ArrowRight,
} from 'lucide-react';
import { requireAdmin } from '../../lib/auth-guards';
import { getDb, leads } from '../../db';
import { eq, desc, count, and, sql } from 'drizzle-orm';
import { cn } from '../../utils';
import { createLogoutCookie } from '../../lib/auth';

// ═══════════════════════════════════════════════════════════
// SERVER FUNCTIONS
// ═══════════════════════════════════════════════════════════

const getLeads = createServerFn({ method: 'GET' }).handler(async () => {
  const db = getDb();

  try {
    const leadList = await db
      .select({
        id: leads.id,
        firstName: leads.firstName,
        lastName: leads.lastName,
        email: leads.email,
        phone: leads.phone,
        source: leads.source,
        sourceDetail: leads.sourceDetail,
        stage: leads.stage,
        interestedGrades: leads.interestedGrades,
        interestedSchoolYear: leads.interestedSchoolYear,
        numberOfStudents: leads.numberOfStudents,
        notes: leads.notes,
        tourScheduledAt: leads.tourScheduledAt,
        createdAt: leads.createdAt,
      })
      .from(leads)
      .orderBy(desc(leads.createdAt));

    // Get stats
    const [totalCount] = await db.select({ count: count() }).from(leads);
    const [inquiryCount] = await db
      .select({ count: count() })
      .from(leads)
      .where(eq(leads.stage, 'inquiry'));
    const [tourScheduledCount] = await db
      .select({ count: count() })
      .from(leads)
      .where(eq(leads.stage, 'tour_scheduled'));
    const [appliedCount] = await db
      .select({ count: count() })
      .from(leads)
      .where(eq(leads.stage, 'applied'));
    const [convertedCount] = await db
      .select({ count: count() })
      .from(leads)
      .where(eq(leads.stage, 'converted'));

    return {
      success: true,
      leads: leadList.map((l) => ({
        ...l,
        interestedGrades: l.interestedGrades ? JSON.parse(l.interestedGrades as string) : [],
      })),
      stats: {
        total: Number(totalCount?.count || 0),
        inquiry: Number(inquiryCount?.count || 0),
        tourScheduled: Number(tourScheduledCount?.count || 0),
        applied: Number(appliedCount?.count || 0),
        converted: Number(convertedCount?.count || 0),
      },
    };
  } catch (error) {
    console.error('Error fetching leads:', error);
    return {
      success: false,
      leads: [],
      stats: { total: 0, inquiry: 0, tourScheduled: 0, applied: 0, converted: 0 },
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

export const Route = createFileRoute('/admin/leads')({
  head: () => ({
    meta: [
      { title: 'Leads | School Dashboard | EnrollSage' },
      { name: 'description', content: 'Track and manage prospective family inquiries.' },
    ],
  }),
  loader: async () => {
    const [authResult, leadsData] = await Promise.all([
      requireAdmin(),
      getLeads(),
    ]);
    return { authResult, ...leadsData };
  },
  component: LeadsPage,
});

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════

function LeadsPage() {
  const navigate = useNavigate();
  const { authResult, leads: leadList, stats } = Route.useLoaderData();
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');

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

  // Filter leads
  const filteredLeads = leadList.filter((lead) => {
    const matchesSearch =
      `${lead.firstName} ${lead.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStage = stageFilter === 'all' || lead.stage === stageFilter;
    return matchesSearch && matchesStage;
  });

  // Pipeline stages for filtering
  const stages = [
    { value: 'all', label: 'All Stages', count: stats.total },
    { value: 'inquiry', label: 'Inquiry', count: stats.inquiry },
    { value: 'tour_scheduled', label: 'Tour Scheduled', count: stats.tourScheduled },
    { value: 'applied', label: 'Applied', count: stats.applied },
    { value: 'converted', label: 'Converted', count: stats.converted },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9F6]">
      {/* Admin Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link to="/" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#5B7F6D] rounded-lg flex items-center justify-center">
                  <span className="text-xl">🎓</span>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-[#2D4F3E] font-display">School Dashboard</h1>
                  <p className="text-xs text-gray-500">Westlake Academy</p>
                </div>
              </Link>
            </div>
            <nav className="flex items-center gap-6">
              <Link to="/admin" className="text-gray-600 hover:text-[#5B7F6D]">Dashboard</Link>
              <Link to="/admin/applications" className="text-gray-600 hover:text-[#5B7F6D]">Applications</Link>
              <Link to="/admin/leads" className="text-[#5B7F6D] font-medium">Leads</Link>
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
              <UserPlus className="w-7 h-7 text-[#5B7F6D]" />
              Leads
            </h2>
            <p className="text-gray-600">
              {stats.inquiry} inquiries, {stats.tourScheduled} tours scheduled, {stats.applied} applied
            </p>
          </div>
          <a
            href="/admin/leads/new"
            className="flex items-center gap-2 bg-[#5B7F6D] text-white px-4 py-2 rounded-lg hover:bg-[#2D4F3E] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Lead
          </a>
        </div>

        {/* Pipeline View */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {stages.map((stage) => (
            <button
              key={stage.value}
              onClick={() => setStageFilter(stage.value)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg border whitespace-nowrap transition-colors',
                stageFilter === stage.value
                  ? 'bg-[#5B7F6D] text-white border-[#5B7F6D]'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              )}
            >
              {stage.label}
              <span className={cn(
                'text-xs px-2 py-0.5 rounded-full',
                stageFilter === stage.value
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-100 text-gray-600'
              )}>
                {stage.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search leads by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-[#5B7F6D] focus:ring-2 focus:ring-[#5B7F6D]/10"
            />
          </div>
        </div>

        {/* Leads List */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {filteredLeads.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {filteredLeads.map((lead) => (
                <Link
                  key={lead.id}
                  to={`/admin/leads/${lead.id}`}
                  className="block p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                        <UserPlus className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#2D4F3E]">
                          {lead.firstName} {lead.lastName}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                          {lead.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" /> {lead.email}
                            </span>
                          )}
                          {lead.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {lead.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Users className="w-4 h-4" />
                          {lead.numberOfStudents || 1} student{(lead.numberOfStudents || 1) !== 1 ? 's' : ''}
                        </div>
                        {lead.interestedSchoolYear && (
                          <div className="text-xs text-gray-500 mt-1">
                            {lead.interestedSchoolYear}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <StageBadge stage={lead.stage || 'inquiry'} />
                        <div className="text-xs text-gray-500 mt-1">
                          {formatRelativeTime(lead.createdAt)}
                        </div>
                      </div>
                      {lead.tourScheduledAt && (
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-xs text-purple-600">
                            <Calendar className="w-3 h-3" />
                            Tour: {new Date(lead.tourScheduledAt).toLocaleDateString()}
                          </div>
                        </div>
                      )}
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                  {lead.notes && (
                    <p className="mt-3 text-sm text-gray-600 line-clamp-1">
                      {lead.notes}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <UserPlus className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <h3 className="font-semibold text-gray-700 mb-2">
                {searchQuery || stageFilter !== 'all' ? 'No leads found' : 'No leads yet'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchQuery || stageFilter !== 'all'
                  ? 'Try adjusting your search or filter'
                  : 'Start tracking prospective families by adding leads'}
              </p>
              {!searchQuery && stageFilter === 'all' && (
                <a
                  href="/admin/leads/new"
                  className="inline-flex items-center gap-2 bg-[#5B7F6D] text-white px-4 py-2 rounded-lg hover:bg-[#2D4F3E]"
                >
                  <Plus className="w-4 h-4" />
                  Add Lead
                </a>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function StageBadge({ stage }: { stage: string }) {
  const styles: Record<string, string> = {
    inquiry: 'bg-blue-100 text-blue-700',
    tour_scheduled: 'bg-purple-100 text-purple-700',
    tour_completed: 'bg-amber-100 text-amber-700',
    applied: 'bg-green-100 text-green-700',
    converted: 'bg-[#5B7F6D]/20 text-[#5B7F6D]',
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
    <span className={cn('text-xs px-2 py-1 rounded-full whitespace-nowrap', styles[stage] || 'bg-gray-100 text-gray-700')}>
      {labels[stage] || stage}
    </span>
  );
}
