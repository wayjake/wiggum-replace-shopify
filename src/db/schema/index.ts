// 📚 Schema Index - The table of contents for our database
// "I'm learnding!" - Ralph, browsing through schema definitions

/**
 * ╭─────────────────────────────────────────────────────────╮
 * │  SCHEMA EXPORTS                                          │
 * │  ─────────────────────────────────────────────────────── │
 * │  All our database tables and their relationships live    │
 * │  here. Import * from this file to get everything.        │
 * ╰─────────────────────────────────────────────────────────╯
 */

// 👤 User-related tables
export {
  users,
  sessions,
  paymentMethods,
  addresses,
  usersRelations,
  sessionsRelations,
  paymentMethodsRelations,
  addressesRelations,
} from './users';

// 🧼 Product-related tables
export {
  products,
  categories,
  productReviews,
  productsRelations,
  productReviewsRelations,
} from './products';

// 📦 Order-related tables
export {
  orders,
  orderItems,
  orderEvents,
  ordersRelations,
  orderItemsRelations,
  orderEventsRelations,
} from './orders';
