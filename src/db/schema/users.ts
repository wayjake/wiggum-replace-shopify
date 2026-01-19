// 👤 The identity layer of our soap empire
// "I'm Idaho!" - Ralph, probably every user when they sign up

import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { createId } from '@paralleldrive/cuid2';
import { relations } from 'drizzle-orm';

/**
 * ╭─────────────────────────────────────────────────────────╮
 * │  USERS TABLE                                             │
 * │  ─────────────────────────────────────────────────────── │
 * │  Everyone who enters our soap wonderland gets a record.  │
 * │  Admins run the show, customers buy the goods.           │
 * ╰─────────────────────────────────────────────────────────╯
 */
export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'), // null if using OAuth only
  role: text('role', { enum: ['admin', 'customer'] }).notNull().default('customer'),
  stripeCustomerId: text('stripe_customer_id'), // Links to Stripe for payments
  firstName: text('first_name'),
  lastName: text('last_name'),
  emailVerified: integer('email_verified', { mode: 'boolean' }).default(false),
  marketingConsent: integer('marketing_consent', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

/**
 * ╭─────────────────────────────────────────────────────────╮
 * │  SESSIONS TABLE                                          │
 * │  ─────────────────────────────────────────────────────── │
 * │  The "you may enter" tokens that keep users logged in.   │
 * │  Each session = one logged-in device/browser.            │
 * ╰─────────────────────────────────────────────────────────╯
 */
export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

/**
 * ╭─────────────────────────────────────────────────────────╮
 * │  PAYMENT METHODS TABLE                                   │
 * │  ─────────────────────────────────────────────────────── │
 * │  Customer's saved cards for quick checkout.              │
 * │  Synced with Stripe - never store raw card data!         │
 * ╰─────────────────────────────────────────────────────────╯
 */
export const paymentMethods = sqliteTable('payment_methods', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  stripePaymentMethodId: text('stripe_payment_method_id').notNull(),
  type: text('type'), // 'card', 'bank_account', etc.
  last4: text('last_4'),
  brand: text('brand'), // 'visa', 'mastercard', etc.
  expiryMonth: integer('expiry_month'),
  expiryYear: integer('expiry_year'),
  isDefault: integer('is_default', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

/**
 * ╭─────────────────────────────────────────────────────────╮
 * │  OAUTH ACCOUNTS TABLE                                    │
 * │  ─────────────────────────────────────────────────────── │
 * │  Links to external OAuth providers (Google, etc).        │
 * │  Users can have multiple OAuth connections.              │
 * ╰─────────────────────────────────────────────────────────╯
 */
export const oauthAccounts = sqliteTable('oauth_accounts', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  provider: text('provider').notNull(), // 'google', 'github', etc.
  providerAccountId: text('provider_account_id').notNull(), // The user's ID from the provider
  email: text('email'), // Email from the provider (for reference)
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

/**
 * ╭─────────────────────────────────────────────────────────╮
 * │  ADDRESSES TABLE                                         │
 * │  ─────────────────────────────────────────────────────── │
 * │  Where the soap gets shipped! Multiple per user.         │
 * │  Can designate one as default shipping address.          │
 * ╰─────────────────────────────────────────────────────────╯
 */
export const addresses = sqliteTable('addresses', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(), // "Home", "Office", "Mom's House"
  line1: text('line_1').notNull(),
  line2: text('line_2'),
  city: text('city').notNull(),
  state: text('state').notNull(),
  postalCode: text('postal_code').notNull(),
  country: text('country').notNull().default('US'),
  isDefault: integer('is_default', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// ═══════════════════════════════════════════════════════════
// RELATIONS - The web of connections between our tables
// ═══════════════════════════════════════════════════════════

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  paymentMethods: many(paymentMethods),
  addresses: many(addresses),
  oauthAccounts: many(oauthAccounts),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const paymentMethodsRelations = relations(paymentMethods, ({ one }) => ({
  user: one(users, {
    fields: [paymentMethods.userId],
    references: [users.id],
  }),
}));

export const addressesRelations = relations(addresses, ({ one }) => ({
  user: one(users, {
    fields: [addresses.userId],
    references: [users.id],
  }),
}));

export const oauthAccountsRelations = relations(oauthAccounts, ({ one }) => ({
  user: one(users, {
    fields: [oauthAccounts.userId],
    references: [users.id],
  }),
}));
