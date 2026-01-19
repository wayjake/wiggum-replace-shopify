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
  oauthAccounts,
  usersRelations,
  sessionsRelations,
  paymentMethodsRelations,
  addressesRelations,
  oauthAccountsRelations,
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

// 🏷️ Discount-related tables
export {
  discountCodes,
  discountUsages,
  discountCodesRelations,
  discountUsagesRelations,
} from './discounts';

// 🎁 Gift card tables
export {
  giftCards,
  giftCardTransactions,
  giftCardsRelations,
  giftCardTransactionsRelations,
} from './giftcards';
