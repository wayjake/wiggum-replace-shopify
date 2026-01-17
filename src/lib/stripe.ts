// 💳 Stripe Integration - The payment processing heart
// "My cat's breath smells like cat food." - Ralph on secure payments

import Stripe from 'stripe';

/**
 * ╭─────────────────────────────────────────────────────────╮
 * │  STRIPE CLIENT                                           │
 * │  ─────────────────────────────────────────────────────── │
 * │  The one and only Stripe instance for server-side ops.   │
 * │  Never expose this to the client!                        │
 * ╰─────────────────────────────────────────────────────────╯
 */

let _stripe: Stripe | null = null;

/**
 * Gets the Stripe client, initializing if needed.
 * Throws if STRIPE_SECRET_KEY is not set.
 */
export function getStripe(): Stripe {
  if (!_stripe) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not set');
    }
    _stripe = new Stripe(secretKey, {
      apiVersion: '2025-01-27.acacia', // Use the latest API version
      typescript: true,
    });
  }
  return _stripe;
}

/**
 * Verifies that Stripe is properly configured and accessible.
 * Makes a test API call to ensure the keys work.
 */
export async function verifyStripeConnection(): Promise<{
  valid: boolean;
  error?: string;
  mode?: 'test' | 'live';
}> {
  try {
    const stripe = getStripe();
    // Make a simple API call to verify the connection
    const balance = await stripe.balance.retrieve();

    // Determine if we're in test or live mode
    const secretKey = process.env.STRIPE_SECRET_KEY || '';
    const mode = secretKey.startsWith('sk_test_') ? 'test' : 'live';

    return { valid: true, mode };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { valid: false, error: message };
  }
}

/**
 * Verifies a Stripe webhook signature.
 * Always use this before processing webhook events!
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not set');
  }

  const stripe = getStripe();
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

// ═══════════════════════════════════════════════════════════
// CHECKOUT SESSION HELPERS
// ═══════════════════════════════════════════════════════════

export type CartItem = {
  productId: string;
  name: string;
  price: number; // In dollars
  quantity: number;
  image?: string;
};

/**
 * Creates a Stripe Checkout Session for the given cart items.
 * Returns the session URL for redirecting the customer.
 */
export async function createCheckoutSession({
  items,
  customerEmail,
  customerId,
  successUrl,
  cancelUrl,
  metadata,
}: {
  items: CartItem[];
  customerEmail?: string;
  customerId?: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}): Promise<{ sessionId: string; url: string }> {
  const stripe = getStripe();

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map(
    (item) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
          images: item.image ? [item.image] : undefined,
          metadata: {
            productId: item.productId,
          },
        },
        unit_amount: Math.round(item.price * 100), // Convert to cents
      },
      quantity: item.quantity,
    })
  );

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: lineItems,
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: metadata || {},
    shipping_address_collection: {
      allowed_countries: ['US', 'CA'], // Add more as needed
    },
    billing_address_collection: 'auto',
  };

  // Add customer info if available
  if (customerId) {
    sessionParams.customer = customerId;
  } else if (customerEmail) {
    sessionParams.customer_email = customerEmail;
  }

  const session = await stripe.checkout.sessions.create(sessionParams);

  if (!session.url) {
    throw new Error('Failed to create checkout session URL');
  }

  return {
    sessionId: session.id,
    url: session.url,
  };
}

/**
 * Retrieves a checkout session with expanded line items.
 * Useful for order confirmation pages.
 */
export async function getCheckoutSession(
  sessionId: string
): Promise<Stripe.Checkout.Session> {
  const stripe = getStripe();
  return stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['line_items', 'customer', 'payment_intent'],
  });
}

// ═══════════════════════════════════════════════════════════
// CUSTOMER MANAGEMENT
// ═══════════════════════════════════════════════════════════

/**
 * Creates a Stripe customer for the given user.
 * Returns the Stripe customer ID to store in our database.
 */
export async function createStripeCustomer({
  email,
  name,
  metadata,
}: {
  email: string;
  name?: string;
  metadata?: Record<string, string>;
}): Promise<string> {
  const stripe = getStripe();

  const customer = await stripe.customers.create({
    email,
    name,
    metadata,
  });

  return customer.id;
}

/**
 * Retrieves a Stripe customer by ID.
 */
export async function getStripeCustomer(
  customerId: string
): Promise<Stripe.Customer | null> {
  const stripe = getStripe();

  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted) return null;
    return customer as Stripe.Customer;
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════
// PAYMENT METHODS
// ═══════════════════════════════════════════════════════════

/**
 * Lists payment methods for a customer.
 */
export async function listPaymentMethods(
  customerId: string
): Promise<Stripe.PaymentMethod[]> {
  const stripe = getStripe();

  const methods = await stripe.paymentMethods.list({
    customer: customerId,
    type: 'card',
  });

  return methods.data;
}

/**
 * Creates a SetupIntent for saving a new payment method.
 * Returns the client secret for use with Stripe Elements.
 */
export async function createSetupIntent(
  customerId: string
): Promise<string> {
  const stripe = getStripe();

  const setupIntent = await stripe.setupIntents.create({
    customer: customerId,
    payment_method_types: ['card'],
  });

  return setupIntent.client_secret!;
}

/**
 * Detaches (removes) a payment method from a customer.
 */
export async function detachPaymentMethod(
  paymentMethodId: string
): Promise<void> {
  const stripe = getStripe();
  await stripe.paymentMethods.detach(paymentMethodId);
}

// ═══════════════════════════════════════════════════════════
// REFUNDS
// ═══════════════════════════════════════════════════════════

/**
 * Creates a refund for a payment intent.
 */
export async function createRefund({
  paymentIntentId,
  amount,
  reason,
}: {
  paymentIntentId: string;
  amount?: number; // In cents, undefined = full refund
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
}): Promise<Stripe.Refund> {
  const stripe = getStripe();

  return stripe.refunds.create({
    payment_intent: paymentIntentId,
    amount,
    reason,
  });
}
