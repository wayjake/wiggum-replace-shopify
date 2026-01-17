// 🧼 The soap that pays the bills
// "Mmm, this tastes like Grandma!" - Ralph, probably describing our soaps

import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { createId } from '@paralleldrive/cuid2';
import { relations } from 'drizzle-orm';

/**
 * ╭─────────────────────────────────────────────────────────╮
 * │  PRODUCTS TABLE                                          │
 * │  ─────────────────────────────────────────────────────── │
 * │  Every bar of artisanal soap that Karen lovingly crafts. │
 * │  Synced with Stripe Products for checkout.               │
 * ╰─────────────────────────────────────────────────────────╯
 */
export const products = sqliteTable('products', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(), // URL-friendly name
  description: text('description'),
  shortDescription: text('short_description'), // For product cards
  price: real('price').notNull(), // In dollars (e.g., 12.00)
  compareAtPrice: real('compare_at_price'), // "Was $15, now $12!"
  category: text('category'), // 'Relaxation', 'Exfoliating', etc.
  ingredients: text('ingredients'), // For the ingredient-conscious
  imageUrl: text('image_url'),
  images: text('images', { mode: 'json' }).$type<string[]>(), // Additional gallery images
  stripeProductId: text('stripe_product_id'),
  stripePriceId: text('stripe_price_id'),
  inStock: integer('in_stock', { mode: 'boolean' }).default(true),
  stockQuantity: integer('stock_quantity').default(0),
  lowStockThreshold: integer('low_stock_threshold').default(10),
  weight: real('weight'), // In ounces, for shipping
  featured: integer('featured', { mode: 'boolean' }).default(false),
  sortOrder: integer('sort_order').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

/**
 * ╭─────────────────────────────────────────────────────────╮
 * │  CATEGORIES TABLE                                        │
 * │  ─────────────────────────────────────────────────────── │
 * │  Organize soaps into browsable collections.              │
 * │  "Relaxation", "Exfoliating", "Luxury", "Fresh"...       │
 * ╰─────────────────────────────────────────────────────────╯
 */
export const categories = sqliteTable('categories', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  imageUrl: text('image_url'),
  sortOrder: integer('sort_order').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

/**
 * ╭─────────────────────────────────────────────────────────╮
 * │  PRODUCT REVIEWS TABLE                                   │
 * │  ─────────────────────────────────────────────────────── │
 * │  What customers say about their soap experience.         │
 * │  (Post-MVP feature, but schema ready!)                   │
 * ╰─────────────────────────────────────────────────────────╯
 */
export const productReviews = sqliteTable('product_reviews', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  productId: text('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull(), // References users table
  rating: integer('rating').notNull(), // 1-5 stars
  title: text('title'),
  body: text('body'),
  verified: integer('verified', { mode: 'boolean' }).default(false), // Bought the product?
  helpful: integer('helpful').default(0), // "Was this review helpful?" count
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// ═══════════════════════════════════════════════════════════
// RELATIONS
// ═══════════════════════════════════════════════════════════

export const productsRelations = relations(products, ({ many }) => ({
  reviews: many(productReviews),
}));

export const productReviewsRelations = relations(productReviews, ({ one }) => ({
  product: one(products, {
    fields: [productReviews.productId],
    references: [products.id],
  }),
}));
