// 🏷️ Discount Code Logic - The brains behind the savings
// "I'm Idaho!" - Ralph, successfully applying a discount
//
// ╭────────────────────────────────────────────────────────────╮
// │  DISCOUNT VALIDATION & APPLICATION                          │
// │  • Validates code eligibility                               │
// │  • Calculates discount amount                               │
// │  • Tracks usage for limits                                  │
// ╰────────────────────────────────────────────────────────────╯

import { getDb, discountCodes, discountUsages } from '../db';
import { eq, and, sql } from 'drizzle-orm';

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

export type DiscountCode = typeof discountCodes.$inferSelect;

export type DiscountValidationResult = {
  valid: boolean;
  error?: string;
  discount?: {
    id: string;
    code: string;
    type: 'percentage' | 'fixed' | 'free_shipping';
    value: number;
    description?: string | null;
  };
};

export type DiscountApplicationResult = {
  discountAmount: number;
  newSubtotal: number;
  newShipping: number;
  newTotal: number;
  message: string;
};

// ═══════════════════════════════════════════════════════════
// VALIDATION
// ═══════════════════════════════════════════════════════════

/**
 * Validate a discount code for a given cart.
 *
 * @param code - The discount code entered by the customer
 * @param subtotal - Cart subtotal before discount
 * @param customerId - User ID (if logged in)
 * @param customerEmail - Customer email (for guest checkout)
 * @returns Validation result with discount info if valid
 */
export async function validateDiscountCode(
  code: string,
  subtotal: number,
  customerId?: string | null,
  customerEmail?: string | null
): Promise<DiscountValidationResult> {
  const db = getDb();

  // 1. Find the discount code
  const discount = await db.query.discountCodes.findFirst({
    where: eq(discountCodes.code, code.toUpperCase().trim()),
  });

  if (!discount) {
    return { valid: false, error: 'Invalid discount code' };
  }

  // 2. Check if active
  if (!discount.active) {
    return { valid: false, error: 'This discount code is no longer active' };
  }

  // 3. Check date validity
  const now = new Date();

  if (discount.startsAt && discount.startsAt > now) {
    return { valid: false, error: 'This discount code is not yet active' };
  }

  if (discount.expiresAt && discount.expiresAt < now) {
    return { valid: false, error: 'This discount code has expired' };
  }

  // 4. Check total usage limit
  if (discount.maxUses !== null && discount.usedCount >= discount.maxUses) {
    return { valid: false, error: 'This discount code has reached its usage limit' };
  }

  // 5. Check per-customer usage limit
  if (discount.maxUsesPerCustomer !== null && (customerId || customerEmail)) {
    const customerUsageCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(discountUsages)
      .where(
        and(
          eq(discountUsages.discountCodeId, discount.id),
          customerId
            ? eq(discountUsages.customerId, customerId)
            : customerEmail
            ? eq(discountUsages.customerEmail, customerEmail)
            : undefined
        )
      );

    if (customerUsageCount[0]?.count >= discount.maxUsesPerCustomer) {
      return { valid: false, error: 'You have already used this discount code' };
    }
  }

  // 6. Check minimum order amount
  if (discount.minOrderAmount !== null && subtotal < discount.minOrderAmount) {
    return {
      valid: false,
      error: `Minimum order of $${discount.minOrderAmount.toFixed(2)} required for this code`,
    };
  }

  // 🎉 Code is valid!
  return {
    valid: true,
    discount: {
      id: discount.id,
      code: discount.code,
      type: discount.type as 'percentage' | 'fixed' | 'free_shipping',
      value: discount.value,
      description: discount.description,
    },
  };
}

// ═══════════════════════════════════════════════════════════
// APPLICATION
// ═══════════════════════════════════════════════════════════

/**
 * Calculate the discount amount for a cart.
 *
 * @param discount - The validated discount code
 * @param subtotal - Cart subtotal before discount
 * @param shipping - Current shipping cost
 * @returns The discount amount and new totals
 */
export function calculateDiscount(
  discount: {
    type: 'percentage' | 'fixed' | 'free_shipping';
    value: number;
    maxDiscountAmount?: number | null;
  },
  subtotal: number,
  shipping: number
): DiscountApplicationResult {
  let discountAmount = 0;
  let newShipping = shipping;
  let message = '';

  switch (discount.type) {
    case 'percentage': {
      discountAmount = (subtotal * discount.value) / 100;

      // Apply max discount cap if set
      if (discount.maxDiscountAmount !== null && discount.maxDiscountAmount !== undefined) {
        discountAmount = Math.min(discountAmount, discount.maxDiscountAmount);
      }

      message = `${discount.value}% off applied`;
      break;
    }

    case 'fixed': {
      discountAmount = Math.min(discount.value, subtotal); // Can't discount more than subtotal
      message = `$${discount.value.toFixed(2)} off applied`;
      break;
    }

    case 'free_shipping': {
      discountAmount = shipping;
      newShipping = 0;
      message = 'Free shipping applied';
      break;
    }
  }

  const newSubtotal = discount.type === 'free_shipping' ? subtotal : subtotal - discountAmount;
  const newTotal = newSubtotal + newShipping;

  return {
    discountAmount,
    newSubtotal,
    newShipping,
    newTotal,
    message,
  };
}

// ═══════════════════════════════════════════════════════════
// USAGE TRACKING
// ═══════════════════════════════════════════════════════════

/**
 * Record discount code usage after a successful order.
 *
 * @param discountCodeId - The discount code ID
 * @param orderId - The order ID
 * @param customerId - User ID (if logged in)
 * @param customerEmail - Customer email
 * @param discountAmount - The actual discount amount applied
 */
export async function recordDiscountUsage(
  discountCodeId: string,
  orderId: string,
  customerId: string | null,
  customerEmail: string | null,
  discountAmount: number
): Promise<void> {
  const db = getDb();

  // Create usage record
  await db.insert(discountUsages).values({
    discountCodeId,
    orderId,
    customerId,
    customerEmail,
    discountAmount,
  });

  // Increment usage count on the discount code
  await db
    .update(discountCodes)
    .set({
      usedCount: sql`${discountCodes.usedCount} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(discountCodes.id, discountCodeId));
}

// ═══════════════════════════════════════════════════════════
// ADMIN HELPERS
// ═══════════════════════════════════════════════════════════

/**
 * Create a new discount code.
 */
export async function createDiscountCode(data: {
  code: string;
  description?: string;
  type: 'percentage' | 'fixed' | 'free_shipping';
  value: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  maxUses?: number;
  maxUsesPerCustomer?: number;
  startsAt?: Date;
  expiresAt?: Date;
  active?: boolean;
}): Promise<DiscountCode> {
  const db = getDb();

  const [discount] = await db
    .insert(discountCodes)
    .values({
      code: data.code.toUpperCase().trim(),
      description: data.description,
      type: data.type,
      value: data.value,
      minOrderAmount: data.minOrderAmount,
      maxDiscountAmount: data.maxDiscountAmount,
      maxUses: data.maxUses,
      maxUsesPerCustomer: data.maxUsesPerCustomer ?? 1,
      startsAt: data.startsAt,
      expiresAt: data.expiresAt,
      active: data.active ?? true,
    })
    .returning();

  return discount;
}

/**
 * Get all discount codes for admin.
 */
export async function getAllDiscountCodes(): Promise<DiscountCode[]> {
  const db = getDb();
  return db.select().from(discountCodes).orderBy(discountCodes.createdAt);
}

/**
 * Update a discount code.
 */
export async function updateDiscountCode(
  id: string,
  data: Partial<Omit<DiscountCode, 'id' | 'createdAt' | 'usedCount'>>
): Promise<void> {
  const db = getDb();
  await db
    .update(discountCodes)
    .set({
      ...data,
      code: data.code?.toUpperCase().trim(),
      updatedAt: new Date(),
    })
    .where(eq(discountCodes.id, id));
}

/**
 * Delete a discount code.
 */
export async function deleteDiscountCode(id: string): Promise<void> {
  const db = getDb();
  await db.delete(discountCodes).where(eq(discountCodes.id, id));
}
