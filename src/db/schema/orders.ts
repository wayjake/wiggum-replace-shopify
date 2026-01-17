// 📦 Where dreams of clean skin become reality
// "The doctor said I wouldn't have so many nosebleeds if I kept my
//  finger outta there." - Ralph on order management

import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { createId } from '@paralleldrive/cuid2';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { products } from './products';

/**
 * ╭─────────────────────────────────────────────────────────╮
 * │  ORDERS TABLE                                            │
 * │  ─────────────────────────────────────────────────────── │
 * │  Every time someone buys our beautiful soap!             │
 * │  Tracks the whole lifecycle: pending → paid → shipped    │
 * ╰─────────────────────────────────────────────────────────╯
 */
export const orders = sqliteTable('orders', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  orderNumber: text('order_number').notNull().unique(), // Human-readable: KS-20240101-0001
  userId: text('user_id').references(() => users.id), // Null for guest checkout
  email: text('email').notNull(), // Always captured, even for guests
  status: text('status', {
    enum: ['pending', 'processing', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded']
  }).notNull().default('pending'),

  // Stripe integration
  stripeSessionId: text('stripe_session_id'),
  stripePaymentIntentId: text('stripe_payment_intent_id'),

  // Money money money (in dollars)
  subtotal: real('subtotal').notNull(),
  shippingAmount: real('shipping_amount').notNull().default(0),
  taxAmount: real('tax_amount').notNull().default(0),
  discountAmount: real('discount_amount').notNull().default(0),
  totalAmount: real('total_amount').notNull(),

  // Shipping details (JSON stringified for flexibility)
  shippingAddress: text('shipping_address', { mode: 'json' }).$type<{
    name: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  }>(),
  shippingMethod: text('shipping_method'),

  // Fulfillment tracking
  trackingNumber: text('tracking_number'),
  trackingUrl: text('tracking_url'),
  shippedAt: integer('shipped_at', { mode: 'timestamp' }),
  deliveredAt: integer('delivered_at', { mode: 'timestamp' }),

  // Discount codes
  discountCode: text('discount_code'),

  // Notes (admin can add notes to orders)
  notes: text('notes'),
  customerNotes: text('customer_notes'), // "Please leave at door"

  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

/**
 * ╭─────────────────────────────────────────────────────────╮
 * │  ORDER ITEMS TABLE                                       │
 * │  ─────────────────────────────────────────────────────── │
 * │  The individual products in each order.                  │
 * │  We snapshot the price at time of purchase!              │
 * ╰─────────────────────────────────────────────────────────╯
 */
export const orderItems = sqliteTable('order_items', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  orderId: text('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productId: text('product_id').notNull().references(() => products.id),
  // Snapshot of product details at time of purchase
  // (in case product is later deleted or price changes)
  productName: text('product_name').notNull(),
  productSlug: text('product_slug').notNull(),
  productImage: text('product_image'),
  quantity: integer('quantity').notNull(),
  unitPrice: real('unit_price').notNull(), // Price per item at purchase time
  totalPrice: real('total_price').notNull(), // quantity * unitPrice
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

/**
 * ╭─────────────────────────────────────────────────────────╮
 * │  ORDER EVENTS TABLE                                      │
 * │  ─────────────────────────────────────────────────────── │
 * │  A timeline of everything that happened to an order.     │
 * │  Great for customer support and debugging!               │
 * ╰─────────────────────────────────────────────────────────╯
 */
export const orderEvents = sqliteTable('order_events', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  orderId: text('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  type: text('type', {
    enum: [
      'created',
      'payment_pending',
      'payment_received',
      'payment_failed',
      'processing',
      'shipped',
      'delivered',
      'cancelled',
      'refunded',
      'note_added',
    ]
  }).notNull(),
  description: text('description'),
  metadata: text('metadata', { mode: 'json' }).$type<Record<string, unknown>>(),
  createdBy: text('created_by'), // User ID or 'system'
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// ═══════════════════════════════════════════════════════════
// RELATIONS
// ═══════════════════════════════════════════════════════════

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  items: many(orderItems),
  events: many(orderEvents),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const orderEventsRelations = relations(orderEvents, ({ one }) => ({
  order: one(orders, {
    fields: [orderEvents.orderId],
    references: [orders.id],
  }),
}));
