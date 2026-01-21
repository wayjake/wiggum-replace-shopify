// 🎯 Lead Detail - The full picture of a prospective family
// "Understanding their journey helps us serve them better"
//
// ╭────────────────────────────────────────────────────────────╮
// │  LEAD MANAGEMENT                                            │
// │  View lead details, update stage, schedule tours,           │
// │  and convert qualified leads to applicants.                 │
// ╰────────────────────────────────────────────────────────────╯

import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { useState, useEffect } from 'react';
import {
  UserPlus,
  ArrowLeft,
  Edit2,
  Save,
  X,
  Mail,
  Phone,
  Users,
  Calendar,
  Clock,
  MessageSquare,
  Globe,
  CheckCircle,
  ArrowRight,
  AlertCircle,
  LogOut,
  Trash2,
  GraduationCap,
} from 'lucide-react';
import { requireAdmin } from '../../../lib/auth-guards';
import { getDb, leads, households, students, guardians, applications } from '../../../db';
import { eq } from 'drizzle-orm';
import { cn } from '../../../utils';
import { createLogoutCookie } from '../../../lib/auth';

// ═══════════════════════════════════════════════════════════
// SERVER FUNCTIONS
// ═══════════════════════════════════════════════════════════

const getLead = createServerFn({ method: 'GET' }).handler(
  async (input: { data: { leadId: string } }) => {
    const { leadId } = input.data;
    const db = getDb();

    try {
      const [lead] = await db.select().from(leads).where(eq(leads.id, leadId));

      if (!lead) {
        return { success: false, error: 'Lead not found', lead: null };
      }

      return {
        success: true,
        lead: {
          ...lead,
          interestedGrades: lead.interestedGrades ? JSON.parse(lead.interestedGrades) : [],
        },
      };
    } catch (error) {
      console.error('Get lead error:', error);
      return { success: false, error: 'Failed to load lead', lead: null };
    }
  }
);

const updateLeadStage = createServerFn({ method: 'POST' }).handler(
  async (input: { data: { leadId: string; stage: string; tourScheduledAt?: string; lostReason?: string } }) => {
    const { leadId, stage, tourScheduledAt, lostReason } = input.data;
    const db = getDb();

    try {
      const updates: any = {
        stage,
        updatedAt: new Date(),
      };

      if (stage === 'tour_scheduled' && tourScheduledAt) {
        updates.tourScheduledAt = new Date(tourScheduledAt);
      }

      if (stage === 'tour_completed') {
        updates.tourCompletedAt = new Date();
      }

      if (stage === 'lost' && lostReason) {
        updates.lostReason = lostReason;
        updates.lostAt = new Date();
      }

      await db.update(leads).set(updates).where(eq(leads.id, leadId));

      return { success: true };
    } catch (error) {
      console.error('Update lead stage error:', error);
      return { success: false, error: 'Failed to update lead stage' };
    }
  }
);

const updateLead = createServerFn({ method: 'POST' }).handler(
  async (input: {
    data: {
      leadId: string;
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      notes?: string;
    };
  }) => {
    const { leadId, ...updates } = input.data;
    const db = getDb();

    try {
      await db
        .update(leads)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(leads.id, leadId));

      return { success: true };
    } catch (error) {
      console.error('Update lead error:', error);
      return { success: false, error: 'Failed to update lead' };
    }
  }
);

const convertLeadToApplicant = createServerFn({ method: 'POST' }).handler(
  async (input: { data: { leadId: string; schoolId: string; schoolYear: string; gradeLevel: string } }) => {
    const { leadId, schoolId, schoolYear, gradeLevel } = input.data;
    const db = getDb();

    try {
      // Get the lead
      const [lead] = await db.select().from(leads).where(eq(leads.id, leadId));
      if (!lead) {
        return { success: false, error: 'Lead not found' };
      }

      // Create household
      const [newHousehold] = await db
        .insert(households)
        .values({
          schoolId: lead.schoolId,
          name: `The ${lead.lastName} Family`,
          primaryEmail: lead.email,
          primaryPhone: lead.phone,
          status: 'prospective',
        })
        .returning({ id: households.id });

      // Create guardian from lead contact
      await db.insert(guardians).values({
        householdId: newHousehold.id,
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email,
        phone: lead.phone,
        isPrimary: true,
        hasPortalAccess: true,
      });

      // Create student(s)
      const numStudents = lead.numberOfStudents || 1;
      const studentIds: string[] = [];

      for (let i = 0; i < numStudents; i++) {
        const [newStudent] = await db
          .insert(students)
          .values({
            schoolId: lead.schoolId,
            householdId: newHousehold.id,
            firstName: i === 0 ? 'Student' : `Student ${i + 1}`,
            lastName: lead.lastName,
            gradeLevel: gradeLevel,
            enrollmentStatus: 'applicant',
          })
          .returning({ id: students.id });
        studentIds.push(newStudent.id);
      }

      // Create application for first student
      await db.insert(applications).values({
        schoolId: lead.schoolId,
        studentId: studentIds[0],
        householdId: newHousehold.id,
        schoolYear,
        gradeApplyingFor: gradeLevel,
        status: 'draft',
        leadId,
      });

      // Update lead status
      await db
        .update(leads)
        .set({
          stage: 'converted',
          convertedToHouseholdId: newHousehold.id,
          convertedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(leads.id, leadId));

      return { success: true, householdId: newHousehold.id };
    } catch (error) {
      console.error('Convert lead error:', error);
      return { success: false, error: 'Failed to convert lead' };
    }
  }
);

const logoutUser = createServerFn({ method: 'POST' }).handler(async () => {
  return { cookie: createLogoutCookie() };
});

// ═══════════════════════════════════════════════════════════
// ROUTE DEFINITION
// ═══════════════════════════════════════════════════════════

export const Route = createFileRoute('/admin/leads/$id')({
  head: () => ({
    meta: [
      { title: 'Lead Detail | School Dashboard | EnrollSage' },
      { name: 'description', content: 'View and manage lead details.' },
    ],
  }),
  loader: async ({ params }) => {
    const [authResult, leadData] = await Promise.all([
      requireAdmin(),
      getLead({ data: { leadId: params.id } }),
    ]);
    return { authResult, ...leadData };
  },
  component: LeadDetailPage,
});

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════

function LeadDetailPage() {
  const navigate = useNavigate();
  const { authResult, lead, error: loadError } = Route.useLoaderData();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [showTourModal, setShowTourModal] = useState(false);
  const [showLostModal, setShowLostModal] = useState(false);

  // Edit form state
  const [editFirstName, setEditFirstName] = useState(lead?.firstName || '');
  const [editLastName, setEditLastName] = useState(lead?.lastName || '');
  const [editEmail, setEditEmail] = useState(lead?.email || '');
  const [editPhone, setEditPhone] = useState(lead?.phone || '');
  const [editNotes, setEditNotes] = useState(lead?.notes || '');

  // Modal state
  const [tourDate, setTourDate] = useState('');
  const [lostReason, setLostReason] = useState('');
  const [convertGrade, setConvertGrade] = useState('');
  const [convertSchoolYear, setConvertSchoolYear] = useState('2025-2026');

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

  if (!lead) {
    return (
      <div className="min-h-screen bg-[#F8F9F6]">
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <Link to="/admin/leads" className="text-gray-600 hover:text-[#5B7F6D]">
              <ArrowLeft className="w-4 h-4 inline mr-2" />
              Back to Leads
            </Link>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Lead Not Found</h2>
            <p className="text-gray-500">{loadError || 'The lead you are looking for does not exist.'}</p>
          </div>
        </main>
      </div>
    );
  }

  const handleSave = async () => {
    setError('');
    setIsSaving(true);

    try {
      const result = await updateLead({
        data: {
          leadId: lead.id,
          firstName: editFirstName,
          lastName: editLastName,
          email: editEmail || undefined,
          phone: editPhone || undefined,
          notes: editNotes || undefined,
        },
      });

      if (!result.success) {
        setError(result.error || 'Failed to save changes');
      } else {
        setIsEditing(false);
        window.location.reload();
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStageChange = async (newStage: string) => {
    if (newStage === 'tour_scheduled') {
      setShowTourModal(true);
      return;
    }

    if (newStage === 'lost') {
      setShowLostModal(true);
      return;
    }

    if (newStage === 'converted') {
      setShowConvertModal(true);
      return;
    }

    setIsSaving(true);
    try {
      const result = await updateLeadStage({ data: { leadId: lead.id, stage: newStage } });
      if (result.success) {
        window.location.reload();
      } else {
        setError(result.error || 'Failed to update stage');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const handleScheduleTour = async () => {
    if (!tourDate) {
      setError('Please select a tour date');
      return;
    }

    setIsSaving(true);
    try {
      const result = await updateLeadStage({
        data: { leadId: lead.id, stage: 'tour_scheduled', tourScheduledAt: tourDate },
      });
      if (result.success) {
        setShowTourModal(false);
        window.location.reload();
      } else {
        setError(result.error || 'Failed to schedule tour');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const handleMarkLost = async () => {
    setIsSaving(true);
    try {
      const result = await updateLeadStage({
        data: { leadId: lead.id, stage: 'lost', lostReason },
      });
      if (result.success) {
        setShowLostModal(false);
        window.location.reload();
      } else {
        setError(result.error || 'Failed to update stage');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConvert = async () => {
    if (!convertGrade) {
      setError('Please select a grade level');
      return;
    }

    setIsSaving(true);
    try {
      const result = await convertLeadToApplicant({
        data: {
          leadId: lead.id,
          schoolId: lead.schoolId,
          schoolYear: convertSchoolYear,
          gradeLevel: convertGrade,
        },
      });

      if (result.success) {
        setShowConvertModal(false);
        navigate({ to: '/admin/families' });
      } else {
        setError(result.error || 'Failed to convert lead');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const stages = ['inquiry', 'tour_scheduled', 'tour_completed', 'applied', 'converted'];
  const currentStageIndex = stages.indexOf(lead.stage || 'inquiry');

  const grades = ['PK', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

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
                  <p className="text-xs text-gray-500">Lead Management</p>
                </div>
              </Link>
            </div>
            <nav className="flex items-center gap-6">
              <Link to="/admin" className="text-gray-600 hover:text-[#5B7F6D]">Dashboard</Link>
              <Link to="/admin/leads" className="text-[#5B7F6D] font-medium">Leads</Link>
              <button onClick={handleLogout} className="flex items-center gap-1 text-gray-500 hover:text-[#5B7F6D] text-sm">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Back Link */}
        <Link
          to="/admin/leads"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-[#5B7F6D] mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Leads
        </Link>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Header */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                <UserPlus className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                {isEditing ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editFirstName}
                      onChange={(e) => setEditFirstName(e.target.value)}
                      className="px-2 py-1 border border-gray-300 rounded text-xl font-bold"
                    />
                    <input
                      type="text"
                      value={editLastName}
                      onChange={(e) => setEditLastName(e.target.value)}
                      className="px-2 py-1 border border-gray-300 rounded text-xl font-bold"
                    />
                  </div>
                ) : (
                  <h1 className="text-2xl font-bold text-[#2D4F3E] font-display">
                    {lead.firstName} {lead.lastName}
                  </h1>
                )}
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  {lead.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-4 h-4" /> {lead.email}
                    </span>
                  )}
                  {lead.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-4 h-4" /> {lead.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2 bg-[#5B7F6D] text-white rounded-lg hover:bg-[#2D4F3E]"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
              )}
            </div>
          </div>

          {/* Stage Progress */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Pipeline Stage</h3>
            <div className="flex items-center gap-2">
              {stages.map((stage, index) => (
                <div key={stage} className="flex items-center">
                  <button
                    onClick={() => handleStageChange(stage)}
                    disabled={lead.stage === 'converted' || lead.stage === 'lost'}
                    className={cn(
                      'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                      index <= currentStageIndex
                        ? 'bg-[#5B7F6D] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                  >
                    {stage.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </button>
                  {index < stages.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-gray-400 mx-1" />
                  )}
                </div>
              ))}
            </div>

            {lead.stage !== 'converted' && lead.stage !== 'lost' && (
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setShowLostModal(true)}
                  className="text-sm text-red-600 hover:underline"
                >
                  Mark as Lost
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Interest Details */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-[#2D4F3E] mb-4 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-[#5B7F6D]" />
                Interest Details
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 uppercase">Number of Students</label>
                  <p className="text-[#2D4F3E] font-medium flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {lead.numberOfStudents || 1} student{(lead.numberOfStudents || 1) !== 1 ? 's' : ''}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase">Interested School Year</label>
                  <p className="text-[#2D4F3E] font-medium flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {lead.interestedSchoolYear || '—'}
                  </p>
                </div>
              </div>

              {lead.interestedGrades && lead.interestedGrades.length > 0 && (
                <div className="mt-4">
                  <label className="text-xs text-gray-500 uppercase">Interested Grades</label>
                  <div className="flex gap-2 mt-1">
                    {lead.interestedGrades.map((grade: string) => (
                      <span key={grade} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                        {grade}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-[#2D4F3E] mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#5B7F6D]" />
                Notes
              </h2>
              {isEditing ? (
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                />
              ) : (
                <p className="text-gray-600">{lead.notes || 'No notes yet'}</p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Source */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-[#2D4F3E] mb-4 flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#5B7F6D]" />
                Source
              </h3>
              <p className="text-gray-700 capitalize">{lead.source?.replace('_', ' ') || 'Website'}</p>
              {lead.sourceDetail && (
                <p className="text-sm text-gray-500 mt-1">{lead.sourceDetail}</p>
              )}
            </div>

            {/* Tour Info */}
            {(lead.tourScheduledAt || lead.tourCompletedAt) && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-[#2D4F3E] mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#5B7F6D]" />
                  Tour
                </h3>
                {lead.tourScheduledAt && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span>Scheduled: {new Date(lead.tourScheduledAt).toLocaleDateString()}</span>
                  </div>
                )}
                {lead.tourCompletedAt && (
                  <div className="flex items-center gap-2 text-sm text-green-600 mt-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>Completed: {new Date(lead.tourCompletedAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            )}

            {/* Quick Actions */}
            {lead.stage !== 'converted' && lead.stage !== 'lost' && (
              <div className="bg-[#5B7F6D] rounded-xl p-6 text-white">
                <h3 className="font-semibold mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  {lead.stage === 'inquiry' && (
                    <button
                      onClick={() => setShowTourModal(true)}
                      className="w-full py-2 px-4 bg-white text-[#5B7F6D] rounded-lg font-medium hover:bg-gray-100"
                    >
                      Schedule Tour
                    </button>
                  )}
                  {(lead.stage === 'tour_completed' || lead.stage === 'applied') && (
                    <button
                      onClick={() => setShowConvertModal(true)}
                      className="w-full py-2 px-4 bg-white text-[#5B7F6D] rounded-lg font-medium hover:bg-gray-100"
                    >
                      Convert to Applicant
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-[#2D4F3E] mb-4">Timeline</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-4 h-4" />
                  Created: {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : '—'}
                </div>
                {lead.updatedAt && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-4 h-4" />
                    Updated: {new Date(lead.updatedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Tour Modal */}
      {showTourModal && (
        <Modal onClose={() => setShowTourModal(false)}>
          <h2 className="text-xl font-semibold text-[#2D4F3E] mb-4">Schedule Tour</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tour Date & Time</label>
            <input
              type="datetime-local"
              value={tourDate}
              onChange={(e) => setTourDate(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-200"
            />
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => setShowTourModal(false)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={handleScheduleTour}
              disabled={isSaving}
              className="px-4 py-2 bg-[#5B7F6D] text-white rounded-lg hover:bg-[#2D4F3E]"
            >
              {isSaving ? 'Saving...' : 'Schedule Tour'}
            </button>
          </div>
        </Modal>
      )}

      {/* Lost Modal */}
      {showLostModal && (
        <Modal onClose={() => setShowLostModal(false)}>
          <h2 className="text-xl font-semibold text-[#2D4F3E] mb-4">Mark Lead as Lost</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Reason (optional)</label>
            <textarea
              value={lostReason}
              onChange={(e) => setLostReason(e.target.value)}
              placeholder="Why was this lead lost?"
              rows={3}
              className="w-full px-4 py-3 rounded-lg border border-gray-200"
            />
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => setShowLostModal(false)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={handleMarkLost}
              disabled={isSaving}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              {isSaving ? 'Saving...' : 'Mark as Lost'}
            </button>
          </div>
        </Modal>
      )}

      {/* Convert Modal */}
      {showConvertModal && (
        <Modal onClose={() => setShowConvertModal(false)}>
          <h2 className="text-xl font-semibold text-[#2D4F3E] mb-4">Convert to Applicant</h2>
          <p className="text-sm text-gray-600 mb-4">
            This will create a household, guardian, student, and draft application for this lead.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Grade Level *</label>
              <select
                value={convertGrade}
                onChange={(e) => setConvertGrade(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-200"
              >
                <option value="">Select grade</option>
                {grades.map((grade) => (
                  <option key={grade} value={grade}>{grade}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">School Year</label>
              <select
                value={convertSchoolYear}
                onChange={(e) => setConvertSchoolYear(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-200"
              >
                <option value="2024-2025">2024-2025</option>
                <option value="2025-2026">2025-2026</option>
                <option value="2026-2027">2026-2027</option>
              </select>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => setShowConvertModal(false)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={handleConvert}
              disabled={isSaving || !convertGrade}
              className="px-4 py-2 bg-[#5B7F6D] text-white rounded-lg hover:bg-[#2D4F3E] disabled:bg-gray-300"
            >
              {isSaving ? 'Converting...' : 'Convert Lead'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
        {children}
      </div>
    </div>
  );
}
