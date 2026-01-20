// 📚 Schema Index - The table of contents for our database
// "The household-first model: because families pay the bills, not kindergartners"

/**
 * ╭─────────────────────────────────────────────────────────╮
 * │  SCHEMA EXPORTS                                          │
 * │  ─────────────────────────────────────────────────────── │
 * │  All our database tables and their relationships live    │
 * │  here. Import * from this file to get everything.        │
 * │                                                          │
 * │  🏫 Enrollsy Schema Architecture:                        │
 * │  ┌─────────┐    ┌────────────┐    ┌──────────┐          │
 * │  │  Users  │───▶│  Schools   │───▶│Households│          │
 * │  └─────────┘    └────────────┘    └──────────┘          │
 * │       │              │                  │               │
 * │       ▼              ▼                  ▼               │
 * │  ┌─────────┐    ┌────────────┐    ┌──────────┐          │
 * │  │Sessions │    │  Members   │    │ Students │          │
 * │  └─────────┘    └────────────┘    └──────────┘          │
 * ╰─────────────────────────────────────────────────────────╯
 */

// ═══════════════════════════════════════════════════════════
// 🔐 IDENTITY LAYER - Global user accounts
// ═══════════════════════════════════════════════════════════
export {
  users,
  sessions,
  paymentMethods,
  addresses,
  oauthAccounts,
  staffInvitations,
  usersRelations,
  sessionsRelations,
  paymentMethodsRelations,
  addressesRelations,
  oauthAccountsRelations,
  staffInvitationsRelations,
} from './users';

// ═══════════════════════════════════════════════════════════
// 🏫 MULTI-TENANT LAYER - Schools and their staff
// ═══════════════════════════════════════════════════════════
export {
  schools,
  schoolMembers,
  schoolYears,
  schoolsRelations,
  schoolMembersRelations,
  schoolYearsRelations,
} from './schools';

// ═══════════════════════════════════════════════════════════
// 👨‍👩‍👧‍👦 HOUSEHOLD LAYER - Families and students
// ═══════════════════════════════════════════════════════════
export {
  households,
  guardians,
  students,
  studentHouseholds,
  householdsRelations,
  guardiansRelations,
  studentsRelations,
  studentHouseholdsRelations,
} from './households';

// ═══════════════════════════════════════════════════════════
// 🎯 ADMISSIONS LAYER - CRM and applications
// ═══════════════════════════════════════════════════════════
export {
  leads,
  leadActivities,
  applications,
  applicationResponses,
  applicationDocuments,
  applicationChecklists,
  leadsRelations,
  leadActivitiesRelations,
  applicationsRelations,
  applicationResponsesRelations,
  applicationDocumentsRelations,
  applicationChecklistsRelations,
} from './admissions';

// ═══════════════════════════════════════════════════════════
// 💰 BILLING LAYER - Invoices and payments
// ═══════════════════════════════════════════════════════════
export {
  invoices,
  invoiceItems,
  payments,
  paymentPlans,
  scheduledPayments,
  accountCredits,
  invoicesRelations,
  invoiceItemsRelations,
  paymentsRelations,
  paymentPlansRelations,
  scheduledPaymentsRelations,
  accountCreditsRelations,
} from './billing';
