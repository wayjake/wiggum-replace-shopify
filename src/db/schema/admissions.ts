// 🎯 Admissions Schema - The CRM and application tracking system
// "Track every inquiry from first contact to enrolled student"

import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { createId } from '@paralleldrive/cuid2';
import { relations } from 'drizzle-orm';
import { schools, schoolYears } from './schools';
import { users } from './users';
import { households, students } from './households';

/**
 * ╭─────────────────────────────────────────────────────────╮
 * │  LEADS TABLE                                             │
 * │  ─────────────────────────────────────────────────────── │
 * │  Before they become applicants. Track interest, tours,  │
 * │  and nurture until they're ready to apply.              │
 * ╰─────────────────────────────────────────────────────────╯
 */
export const leads = sqliteTable('leads', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),

  // Contact info
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email'),
  phone: text('phone'),

  // Lead details
  source: text('source', {
    enum: ['website', 'referral', 'event', 'social', 'advertisement', 'other']
  }).default('website'),
  sourceDetail: text('source_detail'),             // "Open House March 2025" or "Referred by Smith family"

  stage: text('stage', {
    enum: ['inquiry', 'tour_scheduled', 'tour_completed', 'applied', 'converted', 'lost']
  }).default('inquiry'),

  // Interest
  interestedGrades: text('interested_grades'),     // JSON array: ['6', '7']
  interestedSchoolYear: text('interested_school_year'), // '2025-2026'
  numberOfStudents: integer('number_of_students').default(1),

  notes: text('notes'),

  // Conversion tracking
  convertedToHouseholdId: text('converted_to_household_id').references(() => households.id),
  convertedAt: integer('converted_at', { mode: 'timestamp' }),

  // Lost tracking
  lostReason: text('lost_reason'),
  lostAt: integer('lost_at', { mode: 'timestamp' }),

  // Assignment
  assignedTo: text('assigned_to').references(() => users.id),

  // Follow-up tracking
  lastContactedAt: integer('last_contacted_at', { mode: 'timestamp' }),
  nextFollowUpAt: integer('next_follow_up_at', { mode: 'timestamp' }),

  // Tour info
  tourScheduledAt: integer('tour_scheduled_at', { mode: 'timestamp' }),
  tourCompletedAt: integer('tour_completed_at', { mode: 'timestamp' }),
  tourNotes: text('tour_notes'),

  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

/**
 * ╭─────────────────────────────────────────────────────────╮
 * │  LEAD ACTIVITIES TABLE                                   │
 * │  ─────────────────────────────────────────────────────── │
 * │  Activity log for lead interactions - emails, calls,    │
 * │  notes, stage changes.                                  │
 * ╰─────────────────────────────────────────────────────────╯
 */
export const leadActivities = sqliteTable('lead_activities', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  leadId: text('lead_id').notNull().references(() => leads.id, { onDelete: 'cascade' }),

  type: text('type', {
    enum: ['email_sent', 'email_received', 'call', 'meeting', 'tour', 'note', 'stage_change', 'task_completed']
  }).notNull(),

  subject: text('subject'),                        // For emails
  description: text('description'),
  performedBy: text('performed_by').references(() => users.id),

  metadata: text('metadata'),                      // JSON for extra data

  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

/**
 * ╭─────────────────────────────────────────────────────────╮
 * │  APPLICATIONS TABLE                                      │
 * │  ─────────────────────────────────────────────────────── │
 * │  Formal applications for enrollment. Tied to a student  │
 * │  and household, tracks status through decision.         │
 * ╰─────────────────────────────────────────────────────────╯
 */
export const applications = sqliteTable('applications', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  studentId: text('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  householdId: text('household_id').notNull().references(() => households.id, { onDelete: 'cascade' }),
  schoolYearId: text('school_year_id').references(() => schoolYears.id),

  // Application type
  applicationType: text('application_type', {
    enum: ['new', 're_enrollment', 'transfer']
  }).default('new'),

  schoolYear: text('school_year').notNull(),       // '2025-2026'
  gradeApplyingFor: text('grade_applying_for').notNull(),

  // Status
  status: text('status', {
    enum: ['draft', 'submitted', 'under_review', 'interview_scheduled', 'interview_completed',
           'accepted', 'waitlisted', 'denied', 'withdrawn', 'enrolled']
  }).default('draft'),

  submittedAt: integer('submitted_at', { mode: 'timestamp' }),
  lastSavedAt: integer('last_saved_at', { mode: 'timestamp' }),

  // Decision
  decisionAt: integer('decision_at', { mode: 'timestamp' }),
  decisionBy: text('decision_by').references(() => users.id),
  decisionNotes: text('decision_notes'),

  // Application fee
  applicationFeeAmount: integer('application_fee_amount'), // in cents
  applicationFeePaid: integer('application_fee_paid', { mode: 'boolean' }).default(false),
  applicationFeePaidAt: integer('application_fee_paid_at', { mode: 'timestamp' }),
  applicationFeeStripePaymentId: text('application_fee_stripe_payment_id'),

  // Interview
  interviewScheduledAt: integer('interview_scheduled_at', { mode: 'timestamp' }),
  interviewCompletedAt: integer('interview_completed_at', { mode: 'timestamp' }),
  interviewNotes: text('interview_notes'),

  // Waitlist
  waitlistPosition: integer('waitlist_position'),
  waitlistNotes: text('waitlist_notes'),

  // Converted from lead
  leadId: text('lead_id').references(() => leads.id),

  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

/**
 * ╭─────────────────────────────────────────────────────────╮
 * │  APPLICATION RESPONSES TABLE                             │
 * │  ─────────────────────────────────────────────────────── │
 * │  Stores form responses for applications as JSON.        │
 * │  Links to a form template for validation.               │
 * ╰─────────────────────────────────────────────────────────╯
 */
export const applicationResponses = sqliteTable('application_responses', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  applicationId: text('application_id').notNull().references(() => applications.id, { onDelete: 'cascade' }),

  sectionName: text('section_name').notNull(),     // 'student_info', 'parent_info', etc.
  responses: text('responses').notNull(),          // JSON of form responses

  completedAt: integer('completed_at', { mode: 'timestamp' }),

  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

/**
 * ╭─────────────────────────────────────────────────────────╮
 * │  APPLICATION DOCUMENTS TABLE                             │
 * │  ─────────────────────────────────────────────────────── │
 * │  Files uploaded for applications - transcripts, recs,   │
 * │  immunization records, etc.                             │
 * ╰─────────────────────────────────────────────────────────╯
 */
export const applicationDocuments = sqliteTable('application_documents', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  applicationId: text('application_id').notNull().references(() => applications.id, { onDelete: 'cascade' }),

  name: text('name').notNull(),
  documentType: text('document_type', {
    enum: ['transcript', 'recommendation', 'immunization', 'birth_certificate', 'passport', 'other']
  }).default('other'),

  fileUrl: text('file_url').notNull(),
  fileName: text('file_name'),
  fileSize: integer('file_size'),                  // bytes
  mimeType: text('mime_type'),

  uploadedBy: text('uploaded_by').references(() => users.id),

  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

/**
 * ╭─────────────────────────────────────────────────────────╮
 * │  APPLICATION CHECKLISTS TABLE                            │
 * │  ─────────────────────────────────────────────────────── │
 * │  Track completion of required items per application.    │
 * ╰─────────────────────────────────────────────────────────╯
 */
export const applicationChecklists = sqliteTable('application_checklists', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  applicationId: text('application_id').notNull().references(() => applications.id, { onDelete: 'cascade' }),

  itemName: text('item_name').notNull(),           // 'Submit transcript', 'Schedule interview'
  itemType: text('item_type', {
    enum: ['document', 'form', 'payment', 'interview', 'other']
  }).default('other'),

  isRequired: integer('is_required', { mode: 'boolean' }).default(true),
  isCompleted: integer('is_completed', { mode: 'boolean' }).default(false),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  completedBy: text('completed_by').references(() => users.id),

  notes: text('notes'),

  sortOrder: integer('sort_order').default(0),

  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// ═══════════════════════════════════════════════════════════
// RELATIONS
// ═══════════════════════════════════════════════════════════

export const leadsRelations = relations(leads, ({ one, many }) => ({
  school: one(schools, {
    fields: [leads.schoolId],
    references: [schools.id],
  }),
  assignedUser: one(users, {
    fields: [leads.assignedTo],
    references: [users.id],
  }),
  convertedHousehold: one(households, {
    fields: [leads.convertedToHouseholdId],
    references: [households.id],
  }),
  activities: many(leadActivities),
}));

export const leadActivitiesRelations = relations(leadActivities, ({ one }) => ({
  lead: one(leads, {
    fields: [leadActivities.leadId],
    references: [leads.id],
  }),
  performer: one(users, {
    fields: [leadActivities.performedBy],
    references: [users.id],
  }),
}));

export const applicationsRelations = relations(applications, ({ one, many }) => ({
  school: one(schools, {
    fields: [applications.schoolId],
    references: [schools.id],
  }),
  student: one(students, {
    fields: [applications.studentId],
    references: [students.id],
  }),
  household: one(households, {
    fields: [applications.householdId],
    references: [households.id],
  }),
  schoolYear: one(schoolYears, {
    fields: [applications.schoolYearId],
    references: [schoolYears.id],
  }),
  decisionMaker: one(users, {
    fields: [applications.decisionBy],
    references: [users.id],
  }),
  lead: one(leads, {
    fields: [applications.leadId],
    references: [leads.id],
  }),
  responses: many(applicationResponses),
  documents: many(applicationDocuments),
  checklists: many(applicationChecklists),
}));

export const applicationResponsesRelations = relations(applicationResponses, ({ one }) => ({
  application: one(applications, {
    fields: [applicationResponses.applicationId],
    references: [applications.id],
  }),
}));

export const applicationDocumentsRelations = relations(applicationDocuments, ({ one }) => ({
  application: one(applications, {
    fields: [applicationDocuments.applicationId],
    references: [applications.id],
  }),
  uploader: one(users, {
    fields: [applicationDocuments.uploadedBy],
    references: [users.id],
  }),
}));

export const applicationChecklistsRelations = relations(applicationChecklists, ({ one }) => ({
  application: one(applications, {
    fields: [applicationChecklists.applicationId],
    references: [applications.id],
  }),
  completer: one(users, {
    fields: [applicationChecklists.completedBy],
    references: [users.id],
  }),
}));
