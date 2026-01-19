// 🎁 Gift Cards - The gift that keeps on giving (clean hands)
// "I bent my Wookiee!" - Ralph, excited about gift cards
//
// ╭────────────────────────────────────────────────────────────╮
// │  GIFT CARD SYSTEM                                           │
// │  • Purchase gift cards in fixed denominations               │
// │  • Send to recipients via email                             │
// │  • Redeem at checkout (partial or full balance)            │
// │  • Track transactions and balance history                   │
// ╰────────────────────────────────────────────────────────────╯

import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { createId } from '@paralleldrive/cuid2';
import { relations } from 'drizzle-orm';
import { orders } from './orders';
import { users } from './users';

// ═══════════════════════════════════════════════════════════
// GIFT CARDS TABLE
// ═══════════════════════════════════════════════════════════

export const giftCards = sqliteTable('gift_cards', {
  id: text('id').primaryKey().$defaultFn(() => createId()),

  // Unique code for redemption (e.g., "SOAP-XXXX-XXXX-XXXX")
  code: text('code').notNull().unique(),

  // Value
  initialBalance: real('initial_balance').notNull(),
  currentBalance: real('current_balance').notNull(),

  // Purchaser info
  purchaserId: text('purchaser_id').references(() => users.id, { onDelete: 'set null' }),
  purchaserEmail: text('purchaser_email'),
  purchaseOrderId: text('purchase_order_id').references(() => orders.id, { onDelete: 'set null' }),

  // Recipient info
  recipientEmail: text('recipient_email'),
  recipientName: text('recipient_name'),
  personalMessage: text('personal_message'),

  // Status
  // - 'pending': Just created, awaiting payment
  // - 'active': Paid and ready to use
  // - 'depleted': Balance is zero
  // - 'expired': Past expiration date
  // - 'disabled': Manually disabled by admin
  status: text('status', {
    enum: ['pending', 'active', 'depleted', 'expired', 'disabled']
  }).default('pending').notNull(),

  // Expiration (optional - null means never expires)
  expiresAt: integer('expires_at', { mode: 'timestamp' }),

  // When the gift card was delivered to recipient
  deliveredAt: integer('delivered_at', { mode: 'timestamp' }),

  // Metadata
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// ═══════════════════════════════════════════════════════════
// GIFT CARD TRANSACTIONS TABLE
// Track all uses and adjustments
// ═══════════════════════════════════════════════════════════

export const giftCardTransactions = sqliteTable('gift_card_transactions', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  giftCardId: text('gift_card_id').notNull().references(() => giftCards.id, { onDelete: 'cascade' }),

  // Transaction type
  // - 'purchase': Initial purchase/activation
  // - 'redemption': Used at checkout
  // - 'refund': Returned funds
  // - 'adjustment': Manual admin adjustment
  type: text('type', {
    enum: ['purchase', 'redemption', 'refund', 'adjustment']
  }).notNull(),

  // Amount (positive for credits, negative for debits)
  amount: real('amount').notNull(),

  // Balance after this transaction
  balanceAfter: real('balance_after').notNull(),

  // Related order (for redemptions)
  orderId: text('order_id').references(() => orders.id, { onDelete: 'set null' }),

  // Notes
  description: text('description'),

  // Who made the transaction
  createdBy: text('created_by'), // User ID or 'system'

  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// ═══════════════════════════════════════════════════════════
// RELATIONS
// ═══════════════════════════════════════════════════════════

export const giftCardsRelations = relations(giftCards, ({ one, many }) => ({
  purchaser: one(users, {
    fields: [giftCards.purchaserId],
    references: [users.id],
  }),
  purchaseOrder: one(orders, {
    fields: [giftCards.purchaseOrderId],
    references: [orders.id],
  }),
  transactions: many(giftCardTransactions),
}));

export const giftCardTransactionsRelations = relations(giftCardTransactions, ({ one }) => ({
  giftCard: one(giftCards, {
    fields: [giftCardTransactions.giftCardId],
    references: [giftCards.id],
  }),
  order: one(orders, {
    fields: [giftCardTransactions.orderId],
    references: [orders.id],
  }),
}));
