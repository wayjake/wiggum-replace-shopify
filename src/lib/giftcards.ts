// 🎁 Gift Card Logic - Making soap dreams come true
// "I'm a unitard!" - Ralph, receiving a gift card
//
// ╭────────────────────────────────────────────────────────────╮
// │  GIFT CARD OPERATIONS                                       │
// │  • Generate unique codes                                    │
// │  • Validate and check balance                               │
// │  • Redeem at checkout                                       │
// │  • Track transactions                                       │
// ╰────────────────────────────────────────────────────────────╯

import { getDb, giftCards, giftCardTransactions } from '../db';
import { eq, sql } from 'drizzle-orm';
import { randomBytes } from 'crypto';

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

export type GiftCard = typeof giftCards.$inferSelect;
export type GiftCardTransaction = typeof giftCardTransactions.$inferSelect;

export type GiftCardValidationResult = {
  valid: boolean;
  error?: string;
  giftCard?: {
    id: string;
    code: string;
    currentBalance: number;
    status: string;
  };
};

// ═══════════════════════════════════════════════════════════
// CODE GENERATION
// ═══════════════════════════════════════════════════════════

/**
 * Generate a unique gift card code.
 * Format: SOAP-XXXX-XXXX-XXXX (16 alphanumeric chars)
 */
export function generateGiftCardCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars (0, O, I, 1)
  const bytes = randomBytes(12);
  let code = '';

  for (let i = 0; i < 12; i++) {
    code += chars[bytes[i] % chars.length];
  }

  // Format: SOAP-XXXX-XXXX-XXXX
  return `SOAP-${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8, 12)}`;
}

// ═══════════════════════════════════════════════════════════
// VALIDATION
// ═══════════════════════════════════════════════════════════

/**
 * Validate a gift card code and check if it can be used.
 */
export async function validateGiftCard(code: string): Promise<GiftCardValidationResult> {
  const db = getDb();

  // Normalize code (uppercase, remove spaces/dashes for flexible input)
  const normalizedCode = code.toUpperCase().replace(/[\s-]/g, '');
  const formattedCode = normalizedCode.length === 12
    ? `SOAP-${normalizedCode.slice(0, 4)}-${normalizedCode.slice(4, 8)}-${normalizedCode.slice(8, 12)}`
    : code.toUpperCase().trim();

  const giftCard = await db.query.giftCards.findFirst({
    where: eq(giftCards.code, formattedCode),
  });

  if (!giftCard) {
    return { valid: false, error: 'Invalid gift card code' };
  }

  // Check status
  if (giftCard.status === 'pending') {
    return { valid: false, error: 'This gift card has not been activated yet' };
  }

  if (giftCard.status === 'disabled') {
    return { valid: false, error: 'This gift card has been disabled' };
  }

  if (giftCard.status === 'depleted') {
    return { valid: false, error: 'This gift card has no remaining balance' };
  }

  if (giftCard.status === 'expired') {
    return { valid: false, error: 'This gift card has expired' };
  }

  // Check expiration
  if (giftCard.expiresAt && new Date(giftCard.expiresAt) < new Date()) {
    // Update status to expired
    await db
      .update(giftCards)
      .set({ status: 'expired', updatedAt: new Date() })
      .where(eq(giftCards.id, giftCard.id));
    return { valid: false, error: 'This gift card has expired' };
  }

  // Check balance
  if (giftCard.currentBalance <= 0) {
    return { valid: false, error: 'This gift card has no remaining balance' };
  }

  return {
    valid: true,
    giftCard: {
      id: giftCard.id,
      code: giftCard.code,
      currentBalance: giftCard.currentBalance,
      status: giftCard.status,
    },
  };
}

// ═══════════════════════════════════════════════════════════
// REDEMPTION
// ═══════════════════════════════════════════════════════════

/**
 * Redeem a gift card for an order.
 *
 * @param giftCardId - The gift card ID
 * @param amount - Amount to redeem (will be capped at available balance)
 * @param orderId - The order this redemption is for
 * @param userId - The user making the redemption
 * @returns The actual amount redeemed
 */
export async function redeemGiftCard(
  giftCardId: string,
  amount: number,
  orderId: string,
  userId?: string | null
): Promise<{ success: boolean; amountRedeemed: number; newBalance: number; error?: string }> {
  const db = getDb();

  // Get current gift card
  const giftCard = await db.query.giftCards.findFirst({
    where: eq(giftCards.id, giftCardId),
  });

  if (!giftCard || giftCard.status !== 'active') {
    return { success: false, amountRedeemed: 0, newBalance: 0, error: 'Gift card not available' };
  }

  // Calculate actual redemption amount
  const amountToRedeem = Math.min(amount, giftCard.currentBalance);
  const newBalance = giftCard.currentBalance - amountToRedeem;

  // Update gift card balance
  await db
    .update(giftCards)
    .set({
      currentBalance: newBalance,
      status: newBalance <= 0 ? 'depleted' : 'active',
      updatedAt: new Date(),
    })
    .where(eq(giftCards.id, giftCardId));

  // Create transaction record
  await db.insert(giftCardTransactions).values({
    giftCardId,
    type: 'redemption',
    amount: -amountToRedeem,
    balanceAfter: newBalance,
    orderId,
    description: `Redeemed for order`,
    createdBy: userId || 'system',
  });

  return {
    success: true,
    amountRedeemed: amountToRedeem,
    newBalance,
  };
}

// ═══════════════════════════════════════════════════════════
// CREATION & ACTIVATION
// ═══════════════════════════════════════════════════════════

/**
 * Create a new gift card.
 */
export async function createGiftCard(data: {
  amount: number;
  purchaserId?: string;
  purchaserEmail?: string;
  recipientEmail?: string;
  recipientName?: string;
  personalMessage?: string;
  expiresInDays?: number;
}): Promise<GiftCard> {
  const db = getDb();

  const code = generateGiftCardCode();
  const expiresAt = data.expiresInDays
    ? new Date(Date.now() + data.expiresInDays * 24 * 60 * 60 * 1000)
    : null;

  const [giftCard] = await db
    .insert(giftCards)
    .values({
      code,
      initialBalance: data.amount,
      currentBalance: data.amount,
      purchaserId: data.purchaserId || null,
      purchaserEmail: data.purchaserEmail || null,
      recipientEmail: data.recipientEmail || null,
      recipientName: data.recipientName || null,
      personalMessage: data.personalMessage || null,
      status: 'pending',
      expiresAt,
    })
    .returning();

  return giftCard;
}

/**
 * Activate a gift card after successful payment.
 */
export async function activateGiftCard(
  giftCardId: string,
  orderId: string
): Promise<void> {
  const db = getDb();

  const giftCard = await db.query.giftCards.findFirst({
    where: eq(giftCards.id, giftCardId),
  });

  if (!giftCard) return;

  await db
    .update(giftCards)
    .set({
      status: 'active',
      purchaseOrderId: orderId,
      updatedAt: new Date(),
    })
    .where(eq(giftCards.id, giftCardId));

  // Create activation transaction
  await db.insert(giftCardTransactions).values({
    giftCardId,
    type: 'purchase',
    amount: giftCard.initialBalance,
    balanceAfter: giftCard.initialBalance,
    orderId,
    description: 'Gift card activated',
    createdBy: 'system',
  });
}

/**
 * Refund a gift card redemption (e.g., if order is cancelled).
 */
export async function refundGiftCardRedemption(
  giftCardId: string,
  amount: number,
  orderId: string,
  reason?: string
): Promise<void> {
  const db = getDb();

  const giftCard = await db.query.giftCards.findFirst({
    where: eq(giftCards.id, giftCardId),
  });

  if (!giftCard) return;

  const newBalance = giftCard.currentBalance + amount;

  await db
    .update(giftCards)
    .set({
      currentBalance: newBalance,
      status: 'active',
      updatedAt: new Date(),
    })
    .where(eq(giftCards.id, giftCardId));

  await db.insert(giftCardTransactions).values({
    giftCardId,
    type: 'refund',
    amount: amount,
    balanceAfter: newBalance,
    orderId,
    description: reason || 'Refund from cancelled order',
    createdBy: 'system',
  });
}

// ═══════════════════════════════════════════════════════════
// ADMIN HELPERS
// ═══════════════════════════════════════════════════════════

/**
 * Get all gift cards for admin view.
 */
export async function getAllGiftCards(): Promise<GiftCard[]> {
  const db = getDb();
  return db.query.giftCards.findMany({
    orderBy: (giftCards, { desc }) => [desc(giftCards.createdAt)],
  });
}

/**
 * Get a gift card with its transaction history.
 */
export async function getGiftCardWithTransactions(id: string) {
  const db = getDb();
  return db.query.giftCards.findFirst({
    where: eq(giftCards.id, id),
    with: {
      transactions: {
        orderBy: (transactions, { desc }) => [desc(transactions.createdAt)],
      },
    },
  });
}

/**
 * Manually adjust a gift card balance (admin only).
 */
export async function adjustGiftCardBalance(
  giftCardId: string,
  adjustment: number,
  reason: string,
  adminId: string
): Promise<void> {
  const db = getDb();

  const giftCard = await db.query.giftCards.findFirst({
    where: eq(giftCards.id, giftCardId),
  });

  if (!giftCard) return;

  const newBalance = Math.max(0, giftCard.currentBalance + adjustment);

  await db
    .update(giftCards)
    .set({
      currentBalance: newBalance,
      status: newBalance <= 0 ? 'depleted' : 'active',
      updatedAt: new Date(),
    })
    .where(eq(giftCards.id, giftCardId));

  await db.insert(giftCardTransactions).values({
    giftCardId,
    type: 'adjustment',
    amount: adjustment,
    balanceAfter: newBalance,
    description: reason,
    createdBy: adminId,
  });
}

/**
 * Disable a gift card.
 */
export async function disableGiftCard(giftCardId: string): Promise<void> {
  const db = getDb();
  await db
    .update(giftCards)
    .set({ status: 'disabled', updatedAt: new Date() })
    .where(eq(giftCards.id, giftCardId));
}
