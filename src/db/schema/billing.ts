// 💰 Billing Schema - Household-level tuition and payments
// "Tuition feels simple, predictable, and transparent"

import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { createId } from '@paralleldrive/cuid2';
import { relations } from 'drizzle-orm';
import { schools } from './schools';
import { households, students } from './households';
import { users } from './users';

/**
 * ╭─────────────────────────────────────────────────────────╮
 * │  INVOICES TABLE                                          │
 * │  ─────────────────────────────────────────────────────── │
 * │  Bills sent to households. Contains line items for      │
 * │  tuition, fees, activities, etc.                        │
 * ╰─────────────────────────────────────────────────────────╯
 */
export const invoices = sqliteTable('invoices', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  householdId: text('household_id').notNull().references(() => households.id, { onDelete: 'cascade' }),

  invoiceNumber: text('invoice_number').unique(),  // 'INV-2025-0001'
  description: text('description'),

  // Amounts (all in cents)
  subtotal: integer('subtotal').notNull().default(0),
  discountAmount: integer('discount_amount').default(0),
  creditAmount: integer('credit_amount').default(0),
  total: integer('total').notNull().default(0),
  amountPaid: integer('amount_paid').default(0),
  amountDue: integer('amount_due').notNull().default(0),

  // Dates
  issueDate: text('issue_date'),                   // ISO date string
  dueDate: text('due_date'),                       // ISO date string
  periodStart: text('period_start'),               // For recurring invoices
  periodEnd: text('period_end'),

  // Status
  status: text('status', {
    enum: ['draft', 'pending', 'sent', 'partially_paid', 'paid', 'overdue', 'void', 'refunded']
  }).default('draft'),

  sentAt: integer('sent_at', { mode: 'timestamp' }),
  paidAt: integer('paid_at', { mode: 'timestamp' }),
  voidedAt: integer('voided_at', { mode: 'timestamp' }),
  voidReason: text('void_reason'),

  // Stripe
  stripeInvoiceId: text('stripe_invoice_id'),

  notes: text('notes'),                            // Internal notes
  memo: text('memo'),                              // Memo shown on invoice

  createdBy: text('created_by').references(() => users.id),

  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

/**
 * ╭─────────────────────────────────────────────────────────╮
 * │  INVOICE ITEMS TABLE                                     │
 * │  ─────────────────────────────────────────────────────── │
 * │  Line items on invoices. Can be tied to specific        │
 * │  students or household-level.                           │
 * ╰─────────────────────────────────────────────────────────╯
 */
export const invoiceItems = sqliteTable('invoice_items', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  invoiceId: text('invoice_id').notNull().references(() => invoices.id, { onDelete: 'cascade' }),
  studentId: text('student_id').references(() => students.id, { onDelete: 'set null' }), // Optional

  description: text('description').notNull(),
  itemType: text('item_type', {
    enum: ['tuition', 'enrollment_fee', 'application_fee', 'activity_fee', 'book_fee', 'technology_fee', 'lunch', 'aftercare', 'credit', 'adjustment', 'other']
  }).default('other'),

  quantity: integer('quantity').default(1),
  unitAmount: integer('unit_amount').notNull(),    // in cents
  amount: integer('amount').notNull(),             // quantity * unitAmount (in cents)

  // For recurring items
  periodStart: text('period_start'),
  periodEnd: text('period_end'),

  sortOrder: integer('sort_order').default(0),

  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

/**
 * ╭─────────────────────────────────────────────────────────╮
 * │  PAYMENTS TABLE                                          │
 * │  ─────────────────────────────────────────────────────── │
 * │  Individual payments made by households. Can be tied    │
 * │  to invoices or be general account credits.             │
 * ╰─────────────────────────────────────────────────────────╯
 */
export const payments = sqliteTable('payments', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  householdId: text('household_id').notNull().references(() => households.id, { onDelete: 'cascade' }),
  invoiceId: text('invoice_id').references(() => invoices.id, { onDelete: 'set null' }),

  amount: integer('amount').notNull(),             // in cents
  refundedAmount: integer('refunded_amount').default(0), // in cents

  method: text('method', {
    enum: ['card', 'ach', 'check', 'cash', 'transfer', 'other']
  }).notNull(),

  status: text('status', {
    enum: ['pending', 'processing', 'succeeded', 'failed', 'refunded', 'partially_refunded', 'cancelled']
  }).default('pending'),

  // Stripe
  stripePaymentIntentId: text('stripe_payment_intent_id'),
  stripeChargeId: text('stripe_charge_id'),

  // For manual payments
  checkNumber: text('check_number'),
  referenceNumber: text('reference_number'),

  notes: text('notes'),

  processedAt: integer('processed_at', { mode: 'timestamp' }),
  processedBy: text('processed_by').references(() => users.id),

  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

/**
 * ╭─────────────────────────────────────────────────────────╮
 * │  PAYMENT PLANS TABLE                                     │
 * │  ─────────────────────────────────────────────────────── │
 * │  Scheduled payment arrangements for households. Can be  │
 * │  monthly, quarterly, or custom schedules.               │
 * ╰─────────────────────────────────────────────────────────╯
 */
export const paymentPlans = sqliteTable('payment_plans', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  householdId: text('household_id').notNull().references(() => households.id, { onDelete: 'cascade' }),
  studentId: text('student_id').references(() => students.id, { onDelete: 'set null' }), // Optional

  name: text('name').notNull(),                    // 'Monthly Tuition Plan 2025-2026'
  description: text('description'),

  totalAmount: integer('total_amount').notNull(),  // Total to be paid (in cents)
  paidAmount: integer('paid_amount').default(0),   // Amount already paid
  remainingAmount: integer('remaining_amount').notNull(), // Total - paid

  numberOfPayments: integer('number_of_payments').notNull(),
  paymentAmount: integer('payment_amount').notNull(), // Each payment (in cents)

  frequency: text('frequency', {
    enum: ['weekly', 'biweekly', 'monthly', 'quarterly', 'annual', 'custom']
  }).notNull(),

  startDate: text('start_date').notNull(),         // ISO date string
  endDate: text('end_date'),

  dayOfMonth: integer('day_of_month'),             // For monthly: 1-28
  dayOfWeek: integer('day_of_week'),               // For weekly: 0-6 (Sun-Sat)

  // Auto-pay settings
  autoPay: integer('auto_pay', { mode: 'boolean' }).default(false),
  paymentMethodId: text('payment_method_id'),

  status: text('status', {
    enum: ['draft', 'active', 'paused', 'completed', 'cancelled']
  }).default('draft'),

  createdBy: text('created_by').references(() => users.id),

  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

/**
 * ╭─────────────────────────────────────────────────────────╮
 * │  SCHEDULED PAYMENTS TABLE                                │
 * │  ─────────────────────────────────────────────────────── │
 * │  Individual scheduled payments from payment plans.      │
 * ╰─────────────────────────────────────────────────────────╯
 */
export const scheduledPayments = sqliteTable('scheduled_payments', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  paymentPlanId: text('payment_plan_id').notNull().references(() => paymentPlans.id, { onDelete: 'cascade' }),

  amount: integer('amount').notNull(),             // in cents
  dueDate: text('due_date').notNull(),             // ISO date string

  status: text('status', {
    enum: ['scheduled', 'processing', 'completed', 'failed', 'skipped', 'cancelled']
  }).default('scheduled'),

  // Links to actual payment when processed
  paymentId: text('payment_id').references(() => payments.id),

  processedAt: integer('processed_at', { mode: 'timestamp' }),
  failureReason: text('failure_reason'),
  retryCount: integer('retry_count').default(0),

  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

/**
 * ╭─────────────────────────────────────────────────────────╮
 * │  ACCOUNT CREDITS TABLE                                   │
 * │  ─────────────────────────────────────────────────────── │
 * │  Credits on household accounts (financial aid,          │
 * │  overpayments, refunds, etc.)                           │
 * ╰─────────────────────────────────────────────────────────╯
 */
export const accountCredits = sqliteTable('account_credits', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  householdId: text('household_id').notNull().references(() => households.id, { onDelete: 'cascade' }),

  amount: integer('amount').notNull(),             // in cents
  remainingAmount: integer('remaining_amount').notNull(), // Unused portion

  type: text('type', {
    enum: ['financial_aid', 'scholarship', 'discount', 'overpayment', 'refund', 'adjustment', 'other']
  }).default('other'),

  description: text('description'),
  reference: text('reference'),                    // External reference

  expiresAt: integer('expires_at', { mode: 'timestamp' }),

  createdBy: text('created_by').references(() => users.id),

  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// ═══════════════════════════════════════════════════════════
// RELATIONS
// ═══════════════════════════════════════════════════════════

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  school: one(schools, {
    fields: [invoices.schoolId],
    references: [schools.id],
  }),
  household: one(households, {
    fields: [invoices.householdId],
    references: [households.id],
  }),
  creator: one(users, {
    fields: [invoices.createdBy],
    references: [users.id],
  }),
  items: many(invoiceItems),
  payments: many(payments),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
  student: one(students, {
    fields: [invoiceItems.studentId],
    references: [students.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  school: one(schools, {
    fields: [payments.schoolId],
    references: [schools.id],
  }),
  household: one(households, {
    fields: [payments.householdId],
    references: [households.id],
  }),
  invoice: one(invoices, {
    fields: [payments.invoiceId],
    references: [invoices.id],
  }),
  processor: one(users, {
    fields: [payments.processedBy],
    references: [users.id],
  }),
}));

export const paymentPlansRelations = relations(paymentPlans, ({ one, many }) => ({
  school: one(schools, {
    fields: [paymentPlans.schoolId],
    references: [schools.id],
  }),
  household: one(households, {
    fields: [paymentPlans.householdId],
    references: [households.id],
  }),
  student: one(students, {
    fields: [paymentPlans.studentId],
    references: [students.id],
  }),
  creator: one(users, {
    fields: [paymentPlans.createdBy],
    references: [users.id],
  }),
  scheduledPayments: many(scheduledPayments),
}));

export const scheduledPaymentsRelations = relations(scheduledPayments, ({ one }) => ({
  paymentPlan: one(paymentPlans, {
    fields: [scheduledPayments.paymentPlanId],
    references: [paymentPlans.id],
  }),
  payment: one(payments, {
    fields: [scheduledPayments.paymentId],
    references: [payments.id],
  }),
}));

export const accountCreditsRelations = relations(accountCredits, ({ one }) => ({
  school: one(schools, {
    fields: [accountCredits.schoolId],
    references: [schools.id],
  }),
  household: one(households, {
    fields: [accountCredits.householdId],
    references: [households.id],
  }),
  creator: one(users, {
    fields: [accountCredits.createdBy],
    references: [users.id],
  }),
}));
