// 🎛️ The control center for your database dreams
// "My cat's breath smells like cat food." - Ralph on database config

import type { Config } from 'drizzle-kit';

/**
 * ╭─────────────────────────────────────────────────────────╮
 * │  DRIZZLE CONFIGURATION                                   │
 * │  ─────────────────────────────────────────────────────── │
 * │  This tells drizzle-kit where to find schemas and        │
 * │  where to output migrations. The connection details      │
 * │  come from environment variables.                        │
 * ╰─────────────────────────────────────────────────────────╯
 */

export default {
  schema: './src/db/schema/index.ts',
  out: './src/db/migrations',
  dialect: 'turso',
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
} satisfies Config;
