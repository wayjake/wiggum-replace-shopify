// 🏫 Schools Schema - The multi-tenant foundation of EnrollSage
// "Each school is its own world, but they all live in our universe"

import { sqliteTable, text, integer, unique } from 'drizzle-orm/sqlite-core';
import { createId } from '@paralleldrive/cuid2';
import { relations } from 'drizzle-orm';
import { users } from './users';

/**
 * ╭─────────────────────────────────────────────────────────╮
 * │  SCHOOLS TABLE                                           │
 * │  ─────────────────────────────────────────────────────── │
 * │  Each school is a tenant with its own data, branding,   │
 * │  and Stripe Connect account for payments.               │
 * ╰─────────────────────────────────────────────────────────╯
 */
export const schools = sqliteTable('schools', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),           // URL-friendly: 'westlake-academy'
  subdomain: text('subdomain').unique(),           // Optional: 'westlake' for westlake.enrollsage.com

  // School settings
  timezone: text('timezone').default('America/New_York'),
  currentSchoolYear: text('current_school_year'),  // '2025-2026'
  gradesOffered: text('grades_offered'),           // JSON: ['K', '1', '2', ..., '12']

  // Stripe Connect for payments
  stripeAccountId: text('stripe_account_id'),
  stripeAccountStatus: text('stripe_account_status', {
    enum: ['pending', 'active', 'restricted', 'disabled']
  }).default('pending'),

  // Branding
  logoUrl: text('logo_url'),
  primaryColor: text('primary_color').default('#5B7F6D'),
  accentColor: text('accent_color').default('#2D4F3E'),

  // Google OAuth for this school (optional)
  googleClientId: text('google_client_id'),
  googleClientSecret: text('google_client_secret'),

  // School contact
  email: text('email'),
  phone: text('phone'),
  addressLine1: text('address_line_1'),
  addressLine2: text('address_line_2'),
  city: text('city'),
  state: text('state'),
  postalCode: text('postal_code'),
  country: text('country').default('US'),

  // Subscription & status
  status: text('status', {
    enum: ['trial', 'active', 'suspended', 'cancelled']
  }).default('trial'),
  trialEndsAt: integer('trial_ends_at', { mode: 'timestamp' }),
  planId: text('plan_id'),                         // For billing tiers later

  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

/**
 * ╭─────────────────────────────────────────────────────────╮
 * │  SCHOOL MEMBERS TABLE                                    │
 * │  ─────────────────────────────────────────────────────── │
 * │  Links users to schools with specific roles. A user can │
 * │  belong to multiple schools (consultant scenario).      │
 * ╰─────────────────────────────────────────────────────────╯
 */
export const schoolMembers = sqliteTable('school_members', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),

  // Role within this school
  role: text('role', {
    enum: ['owner', 'admin', 'admissions', 'business_office', 'readonly']
  }).notNull().default('readonly'),

  // Invitation tracking
  invitedBy: text('invited_by').references(() => users.id),
  invitedAt: integer('invited_at', { mode: 'timestamp' }),
  acceptedAt: integer('accepted_at', { mode: 'timestamp' }),

  status: text('status', {
    enum: ['pending', 'active', 'deactivated']
  }).default('pending'),

  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, (table) => ({
  uniqueUserSchool: unique().on(table.userId, table.schoolId),
}));

/**
 * ╭─────────────────────────────────────────────────────────╮
 * │  SCHOOL YEARS TABLE                                      │
 * │  ─────────────────────────────────────────────────────── │
 * │  Track school years for enrollment periods.             │
 * ╰─────────────────────────────────────────────────────────╯
 */
export const schoolYears = sqliteTable('school_years', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),

  name: text('name').notNull(),                    // '2025-2026'
  startDate: integer('start_date', { mode: 'timestamp' }),
  endDate: integer('end_date', { mode: 'timestamp' }),

  enrollmentOpenDate: integer('enrollment_open_date', { mode: 'timestamp' }),
  enrollmentCloseDate: integer('enrollment_close_date', { mode: 'timestamp' }),

  isCurrent: integer('is_current', { mode: 'boolean' }).default(false),

  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// ═══════════════════════════════════════════════════════════
// RELATIONS
// ═══════════════════════════════════════════════════════════

export const schoolsRelations = relations(schools, ({ many }) => ({
  members: many(schoolMembers),
  schoolYears: many(schoolYears),
}));

export const schoolMembersRelations = relations(schoolMembers, ({ one }) => ({
  user: one(users, {
    fields: [schoolMembers.userId],
    references: [users.id],
  }),
  school: one(schools, {
    fields: [schoolMembers.schoolId],
    references: [schools.id],
  }),
  inviter: one(users, {
    fields: [schoolMembers.invitedBy],
    references: [users.id],
  }),
}));

export const schoolYearsRelations = relations(schoolYears, ({ one }) => ({
  school: one(schools, {
    fields: [schoolYears.schoolId],
    references: [schools.id],
  }),
}));
