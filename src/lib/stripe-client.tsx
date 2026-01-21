// 💳 Stripe Client - Browser-side Stripe integration
// "Cards go in, payments come out - you can't explain that!" - Ralph
//
// ╭──────────────────────────────────────────────────────────────╮
// │  STRIPE ELEMENTS PROVIDER                                     │
// │  Provides Stripe.js context to React components.              │
// │  Use this to wrap any components that need card input.        │
// ╰──────────────────────────────────────────────────────────────╯

'use client';

import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { useState, useEffect, createContext, useContext, type ReactNode } from 'react';

// ═══════════════════════════════════════════════════════════
// STRIPE PROMISE (singleton)
// ═══════════════════════════════════════════════════════════

let stripePromise: Promise<Stripe | null> | null = null;

/**
 * Gets or creates the Stripe.js promise.
 * Uses the publishable key from the environment.
 */
export function getStripePromise(publishableKey: string | null): Promise<Stripe | null> {
  if (!publishableKey) {
    return Promise.resolve(null);
  }
  if (!stripePromise) {
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
}

// ═══════════════════════════════════════════════════════════
// STRIPE PROVIDER
// ═══════════════════════════════════════════════════════════

type StripeContextValue = {
  stripe: Stripe | null;
  isLoading: boolean;
  error: string | null;
};

const StripeContext = createContext<StripeContextValue>({
  stripe: null,
  isLoading: true,
  error: null,
});

export function useStripeContext() {
  return useContext(StripeContext);
}

/**
 * Stripe Elements provider wrapper.
 * Automatically loads Stripe.js with the publishable key.
 */
export function StripeProvider({
  publishableKey,
  children,
}: {
  publishableKey: string | null;
  children: ReactNode;
}) {
  const [stripe, setStripe] = useState<Stripe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!publishableKey) {
      setError('Stripe is not configured');
      setIsLoading(false);
      return;
    }

    getStripePromise(publishableKey)
      .then((stripeInstance) => {
        setStripe(stripeInstance);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load Stripe');
        setIsLoading(false);
      });
  }, [publishableKey]);

  return (
    <StripeContext.Provider value={{ stripe, isLoading, error }}>
      {stripe ? (
        <Elements
          stripe={stripe}
          options={{
            appearance: {
              theme: 'stripe',
              variables: {
                colorPrimary: '#5B7F6D',
                colorBackground: '#ffffff',
                colorText: '#2D4F3E',
                colorDanger: '#dc2626',
                fontFamily: 'system-ui, sans-serif',
                borderRadius: '8px',
              },
            },
          }}
        >
          {children}
        </Elements>
      ) : (
        children
      )}
    </StripeContext.Provider>
  );
}

// ═══════════════════════════════════════════════════════════
// ELEMENT OPTIONS
// ═══════════════════════════════════════════════════════════

/**
 * Default options for Stripe CardElement.
 */
export const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#2D4F3E',
      fontFamily: 'system-ui, sans-serif',
      '::placeholder': {
        color: '#9CA3AF',
      },
    },
    invalid: {
      color: '#dc2626',
      iconColor: '#dc2626',
    },
  },
  hidePostalCode: false,
};

// ═══════════════════════════════════════════════════════════
// RE-EXPORTS from @stripe/react-stripe-js
// ═══════════════════════════════════════════════════════════

export {
  CardElement,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
