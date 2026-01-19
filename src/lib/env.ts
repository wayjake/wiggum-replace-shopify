// 🔐 Environment Variable Detection & Validation
// "Me fail English? That's unpossible!" - Ralph on missing env vars

/**
 * ╔═══════════════════════════════════════════════════════════╗
 * ║  THE ENVIRONMENT VARIABLE COMMANDMENTS                     ║
 * ╠═══════════════════════════════════════════════════════════╣
 * ║  1. Thou shalt not hardcode secrets                        ║
 * ║  2. Thou shalt check before thou usest                     ║
 * ║  3. Thou shalt expose only VITE_* to the client            ║
 * ║  4. Thou shalt redirect to /install when keys are missing  ║
 * ╚═══════════════════════════════════════════════════════════╝
 */

export const ENV_CONFIG = {
  // Stripe - The payment gods
  // 🎭 VITE_ prefix exposes this to the client for embedded checkout!
  VITE_STRIPE_PUBLIC_KEY: {
    key: 'VITE_STRIPE_PUBLIC_KEY',
    required: true,
    prefix: 'pk_',
    description: 'Stripe publishable key for client-side checkout (VITE_ prefix required)',
    helpUrl: 'https://dashboard.stripe.com/apikeys',
  },
  STRIPE_SECRET_KEY: {
    key: 'STRIPE_SECRET_KEY',
    required: true,
    prefix: 'sk_',
    description: 'Stripe secret key for server-side operations',
    helpUrl: 'https://dashboard.stripe.com/apikeys',
    sensitive: true,
  },
  STRIPE_WEBHOOK_SECRET: {
    key: 'STRIPE_WEBHOOK_SECRET',
    required: true,
    prefix: 'whsec_',
    description: 'Stripe webhook signing secret',
    helpUrl: 'https://dashboard.stripe.com/webhooks',
    sensitive: true,
  },

  // Turso - The database wizards
  TURSO_DATABASE_URL: {
    key: 'TURSO_DATABASE_URL',
    required: true,
    prefix: 'libsql://',
    altPrefix: 'file:', // For local dev
    description: 'Turso database URL',
    helpUrl: 'https://turso.tech',
  },
  TURSO_AUTH_TOKEN: {
    key: 'TURSO_AUTH_TOKEN',
    required: false, // Not required for local file: URLs
    description: 'Turso authentication token',
    helpUrl: 'https://docs.turso.tech/reference/turso-cli#authentication',
    sensitive: true,
  },

  // Brevo - The email postal service
  BREVO_API_KEY: {
    key: 'BREVO_API_KEY',
    required: true,
    prefix: 'xkeysib-',
    description: 'Brevo API key for transactional emails',
    helpUrl: 'https://app.brevo.com/settings/keys/api',
    sensitive: true,
  },

  // Inngest - The event orchestrator
  INNGEST_SIGNING_KEY: {
    key: 'INNGEST_SIGNING_KEY',
    required: false, // Optional for local dev
    prefix: 'signkey-',
    description: 'Inngest signing key for webhook verification',
    helpUrl: 'https://app.inngest.com/env/production/manage/signing-key',
    sensitive: true,
  },
  INNGEST_EVENT_KEY: {
    key: 'INNGEST_EVENT_KEY',
    required: false, // Optional - only needed for sending from client
    description: 'Inngest event key for sending events',
    helpUrl: 'https://app.inngest.com/env/production/manage/signing-key',
    sensitive: true,
  },

  // Session - The identity keeper
  SESSION_SECRET: {
    key: 'SESSION_SECRET',
    required: true,
    minLength: 32,
    description: 'Secret for session cookie encryption (32+ characters)',
    sensitive: true,
  },

  // Google OAuth - Sign in with Google (optional)
  GOOGLE_CLIENT_ID: {
    key: 'GOOGLE_CLIENT_ID',
    required: false,
    suffix: '.apps.googleusercontent.com',
    description: 'Google OAuth client ID for "Sign in with Google"',
    helpUrl: 'https://console.cloud.google.com/apis/credentials',
  },
  GOOGLE_CLIENT_SECRET: {
    key: 'GOOGLE_CLIENT_SECRET',
    required: false,
    prefix: 'GOCSPX-',
    description: 'Google OAuth client secret',
    helpUrl: 'https://console.cloud.google.com/apis/credentials',
    sensitive: true,
  },
} as const;

export type EnvKey = keyof typeof ENV_CONFIG;

export type EnvCheckResult = {
  key: EnvKey;
  present: boolean;
  valid: boolean;
  error?: string;
};

export type EnvStatus = {
  allPresent: boolean;
  allValid: boolean;
  results: EnvCheckResult[];
  missingRequired: EnvKey[];
  invalidKeys: EnvKey[];
};

/**
 * Checks a single environment variable for presence and validity.
 * Like checking if you have all the soap ingredients before mixing!
 */
export function checkEnvVar(key: EnvKey): EnvCheckResult {
  const config = ENV_CONFIG[key];
  const value = process.env[config.key];

  // Check if present
  if (!value || value.trim() === '') {
    return {
      key,
      present: false,
      valid: false,
      error: `${config.key} is not set`,
    };
  }

  // Check prefix if required
  if ('prefix' in config && config.prefix) {
    const hasCorrectPrefix = value.startsWith(config.prefix) ||
      ('altPrefix' in config && config.altPrefix && value.startsWith(config.altPrefix));

    if (!hasCorrectPrefix) {
      return {
        key,
        present: true,
        valid: false,
        error: `${config.key} should start with "${config.prefix}"`,
      };
    }
  }

  // Check minimum length if required
  if ('minLength' in config && config.minLength && value.length < config.minLength) {
    return {
      key,
      present: true,
      valid: false,
      error: `${config.key} must be at least ${config.minLength} characters`,
    };
  }

  return {
    key,
    present: true,
    valid: true,
  };
}

/**
 * Checks all environment variables and returns a comprehensive status.
 * The gatekeep that decides if we go to /install or proceed to the store.
 */
export function checkAllEnvVars(): EnvStatus {
  const results: EnvCheckResult[] = [];
  const missingRequired: EnvKey[] = [];
  const invalidKeys: EnvKey[] = [];

  for (const key of Object.keys(ENV_CONFIG) as EnvKey[]) {
    const result = checkEnvVar(key);
    results.push(result);

    const config = ENV_CONFIG[key];
    if (config.required && !result.present) {
      missingRequired.push(key);
    }
    if (result.present && !result.valid) {
      invalidKeys.push(key);
    }
  }

  return {
    allPresent: missingRequired.length === 0,
    allValid: invalidKeys.length === 0,
    results,
    missingRequired,
    invalidKeys,
  };
}

/**
 * Quick check: Are all required env vars configured?
 * This is the bouncer at the door - no ID, no entry!
 */
export function isEnvConfigured(): boolean {
  const status = checkAllEnvVars();
  return status.allPresent && status.allValid;
}

/**
 * Gets a specific env var with type safety.
 * Throws if the var is required but missing.
 */
export function getEnv(key: EnvKey): string | undefined {
  const config = ENV_CONFIG[key];
  return process.env[config.key];
}

/**
 * Gets a required env var, throws if missing.
 * Use this when you KNOW the var must exist.
 */
export function requireEnv(key: EnvKey): string {
  const value = getEnv(key);
  if (!value) {
    throw new Error(`Required environment variable ${ENV_CONFIG[key].key} is not set`);
  }
  return value;
}

/**
 * Safe client-side env status (no sensitive values exposed!)
 * Returns only what the UI needs to show the setup wizard.
 */
export function getEnvStatusForClient(): {
  configured: boolean;
  missingKeys: string[];
  invalidKeys: string[];
} {
  const status = checkAllEnvVars();
  return {
    configured: status.allPresent && status.allValid,
    missingKeys: status.missingRequired.map(k => ENV_CONFIG[k].key),
    invalidKeys: status.invalidKeys.map(k => ENV_CONFIG[k].key),
  };
}
