// 👨‍👩‍👧‍👦 Households Schema - The family-centric core of Enrollsy
// "Families, not just students. One household, one bill, one portal."

import { sqliteTable, text, integer, unique } from 'drizzle-orm/sqlite-core';
import { createId } from '@paralleldrive/cuid2';
import { relations } from 'drizzle-orm';
import { schools } from './schools';
import { users } from './users';

/**
 * ╭─────────────────────────────────────────────────────────╮
 * │  HOUSEHOLDS TABLE                                        │
 * │  ─────────────────────────────────────────────────────── │
 * │  The family unit - billing, communication, and portal   │
 * │  access all revolve around households, not students.    │
 * ╰─────────────────────────────────────────────────────────╯
 */
export const households = sqliteTable('households', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),

  name: text('name'),                              // "The Smith Family"
  primaryEmail: text('primary_email'),             // Main contact email
  primaryPhone: text('primary_phone'),

  // Address
  addressLine1: text('address_line_1'),
  addressLine2: text('address_line_2'),
  city: text('city'),
  state: text('state'),
  postalCode: text('postal_code'),
  country: text('country').default('US'),

  // Billing (Stripe)
  stripeCustomerId: text('stripe_customer_id'),
  defaultPaymentMethodId: text('default_payment_method_id'),
  autoPay: integer('auto_pay', { mode: 'boolean' }).default(false),

  // Status
  status: text('status', {
    enum: ['prospective', 'active', 'inactive', 'withdrawn']
  }).default('prospective'),

  notes: text('notes'),

  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

/**
 * ╭─────────────────────────────────────────────────────────╮
 * │  GUARDIANS TABLE                                         │
 * │  ─────────────────────────────────────────────────────── │
 * │  Adults in a household - parents, guardians, etc.       │
 * │  Can link to a user account for portal access.          │
 * ╰─────────────────────────────────────────────────────────╯
 */
export const guardians = sqliteTable('guardians', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  householdId: text('household_id').notNull().references(() => households.id, { onDelete: 'cascade' }),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }), // Links to user account

  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email'),
  phone: text('phone'),
  phoneType: text('phone_type', { enum: ['mobile', 'home', 'work'] }).default('mobile'),

  // Relationship to students
  relationship: text('relationship', {
    enum: ['mother', 'father', 'stepmother', 'stepfather', 'grandmother', 'grandfather', 'guardian', 'other']
  }),

  // Roles within household
  isPrimary: integer('is_primary', { mode: 'boolean' }).default(false),        // Primary contact
  hasPortalAccess: integer('has_portal_access', { mode: 'boolean' }).default(true),
  isBillingContact: integer('is_billing_contact', { mode: 'boolean' }).default(false),
  isEmergencyContact: integer('is_emergency_contact', { mode: 'boolean' }).default(false),
  canPickup: integer('can_pickup', { mode: 'boolean' }).default(true),

  // Employment (optional)
  employer: text('employer'),
  occupation: text('occupation'),

  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

/**
 * ╭─────────────────────────────────────────────────────────╮
 * │  STUDENTS TABLE                                          │
 * │  ─────────────────────────────────────────────────────── │
 * │  Students belong to households. Can be linked to        │
 * │  multiple households for split custody situations.      │
 * ╰─────────────────────────────────────────────────────────╯
 */
export const students = sqliteTable('students', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  householdId: text('household_id').notNull().references(() => households.id, { onDelete: 'cascade' }),

  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  preferredName: text('preferred_name'),           // Nickname

  dateOfBirth: text('date_of_birth'),              // ISO date string
  gender: text('gender', { enum: ['male', 'female', 'non_binary', 'prefer_not_to_say'] }),
  gradeLevel: text('grade_level'),                 // Current grade: 'K', '1', '2', ..., '12'

  // Enrollment status
  enrollmentStatus: text('enrollment_status', {
    enum: ['prospective', 'applicant', 'accepted', 'waitlisted', 'enrolled', 'withdrawn', 'graduated', 'denied']
  }).default('prospective'),

  enrolledDate: text('enrolled_date'),             // ISO date string
  withdrawnDate: text('withdrawn_date'),
  expectedGraduationYear: integer('expected_graduation_year'),

  // Medical & Emergency
  allergies: text('allergies'),
  medicalNotes: text('medical_notes'),
  medications: text('medications'),

  // Previous school
  previousSchool: text('previous_school'),

  // Student ID (school-assigned)
  studentNumber: text('student_number'),

  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

/**
 * ╭─────────────────────────────────────────────────────────╮
 * │  STUDENT HOUSEHOLDS TABLE                                │
 * │  ─────────────────────────────────────────────────────── │
 * │  For split custody: students can belong to multiple     │
 * │  households with different billing/communication prefs. │
 * ╰─────────────────────────────────────────────────────────╯
 */
export const studentHouseholds = sqliteTable('student_households', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  studentId: text('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  householdId: text('household_id').notNull().references(() => households.id, { onDelete: 'cascade' }),

  isPrimary: integer('is_primary', { mode: 'boolean' }).default(true),
  billingPercentage: integer('billing_percentage').default(100), // For split billing
  custodyNotes: text('custody_notes'),

  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, (table) => ({
  uniqueStudentHousehold: unique().on(table.studentId, table.householdId),
}));

// ═══════════════════════════════════════════════════════════
// RELATIONS
// ═══════════════════════════════════════════════════════════

export const householdsRelations = relations(households, ({ one, many }) => ({
  school: one(schools, {
    fields: [households.schoolId],
    references: [schools.id],
  }),
  guardians: many(guardians),
  students: many(students),
  studentHouseholds: many(studentHouseholds),
}));

export const guardiansRelations = relations(guardians, ({ one }) => ({
  household: one(households, {
    fields: [guardians.householdId],
    references: [households.id],
  }),
  user: one(users, {
    fields: [guardians.userId],
    references: [users.id],
  }),
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
  school: one(schools, {
    fields: [students.schoolId],
    references: [schools.id],
  }),
  household: one(households, {
    fields: [students.householdId],
    references: [households.id],
  }),
  additionalHouseholds: many(studentHouseholds),
}));

export const studentHouseholdsRelations = relations(studentHouseholds, ({ one }) => ({
  student: one(students, {
    fields: [studentHouseholds.studentId],
    references: [students.id],
  }),
  household: one(households, {
    fields: [studentHouseholds.householdId],
    references: [households.id],
  }),
}));
