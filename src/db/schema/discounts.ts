// 🏷️ Discount Codes - Making soap more affordable, one code at a time
// "I bent my Wookiee!" - Ralph, excited about savings
//
// ╭────────────────────────────────────────────────────────────╮
// │  DISCOUNT TYPES SUPPORTED:                                  │
// │  • Percentage off (e.g., 20% off)                          │
// │  • Fixed amount off (e.g., $5 off)                         │
// │  • Free shipping                                            │
// │                                                             │
// │  CONSTRAINTS:                                               │
// │  • Minimum order amount                                     │
// │  • Maximum discount amount (for percentage)                 │
// │  • Usage limits (total & per customer)                      │
// │  • Date range (start & end dates)                          │
// │  • Product/category restrictions (future)                   │
// ╰────────────────────────────────────────────────────────────╯

import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { createId } from '@paralleldrive/cuid2';
import { relations } from 'drizzle-orm';
import { orders } from './orders';

// ═══════════════════════════════════════════════════════════
// DISCOUNT CODES TABLE
// ═══════════════════════════════════════════════════════════

export const discountCodes = sqliteTable('discount_codes', {
  id: text('id').primaryKey().$defaultFn(() => createId()),

  // The actual code customers enter (e.g., "SOAP20", "FREESHIP")
  code: text('code').notNull().unique(),

  // Human-readable description for admin
  description: text('description'),

  // Type of discount
  // - 'percentage': X% off the order
  // - 'fixed': $X off the order
  // - 'free_shipping': Removes shipping cost
  type: text('type', { enum: ['percentage', 'fixed', 'free_shipping'] }).notNull(),

  // Discount value
  // - For percentage: 0-100 (e.g., 20 = 20% off)
  // - For fixed: dollar amount (e.g., 5 = $5 off)
  // - For free_shipping: ignored
  value: real('value').notNull().default(0),

  // Constraints
  minOrderAmount: real('min_order_amount'), // Minimum cart value to use code
  maxDiscountAmount: real('max_discount_amount'), // Cap for percentage discounts
  maxUses: integer('max_uses'), // Total times code can be used (null = unlimited)
  maxUsesPerCustomer: integer('max_uses_per_customer').default(1), // Per customer (null = unlimited)

  // Tracking
  usedCount: integer('used_count').default(0),

  // Validity period
  startsAt: integer('starts_at', { mode: 'timestamp' }),
  expiresAt: integer('expires_at', { mode: 'timestamp' }),

  // Status
  active: integer('active', { mode: 'boolean' }).default(true),

  // Metadata
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// ═══════════════════════════════════════════════════════════
// DISCOUNT USAGE TABLE
// Track which customers have used which codes
// ═══════════════════════════════════════════════════════════

export const discountUsages = sqliteTable('discount_usages', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  discountCodeId: text('discount_code_id').notNull().references(() => discountCodes.id, { onDelete: 'cascade' }),
  orderId: text('order_id').references(() => orders.id, { onDelete: 'set null' }),
  customerId: text('customer_id'), // User ID or email for guests
  customerEmail: text('customer_email'),
  discountAmount: real('discount_amount').notNull(), // Actual amount saved
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// ═══════════════════════════════════════════════════════════
// RELATIONS
// ═══════════════════════════════════════════════════════════

export const discountCodesRelations = relations(discountCodes, ({ many }) => ({
  usages: many(discountUsages),
}));

export const discountUsagesRelations = relations(discountUsages, ({ one }) => ({
  discountCode: one(discountCodes, {
    fields: [discountUsages.discountCodeId],
    references: [discountCodes.id],
  }),
  order: one(orders, {
    fields: [discountUsages.orderId],
    references: [orders.id],
  }),
}));
