// 🌊 The wellspring of all data
// "Hi, Super Nintendo Chalmers!" - Ralph greeting our database

import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';

/**
 * ╭─────────────────────────────────────────────────────────╮
 * │  DATABASE CLIENT                                         │
 * │  ─────────────────────────────────────────────────────── │
 * │  The one and only connection to our Turso database.      │
 * │  We use libSQL for the connection and Drizzle for ORM.   │
 * ╰─────────────────────────────────────────────────────────╯
 */

// Creating the client - like turning on a faucet of possibilities
// Note: This will throw if env vars are missing, which is intentional
// for server-side code. The install wizard handles the UI for missing vars.
function createDbClient() {
  const url = process.env.TURSO_DATABASE_URL;

  if (!url) {
    throw new Error('TURSO_DATABASE_URL is not set');
  }

  // Local file:// URLs don't need auth tokens
  const isLocalFile = url.startsWith('file:');
  const authToken = isLocalFile ? undefined : process.env.TURSO_AUTH_TOKEN;

  if (!isLocalFile && !authToken) {
    throw new Error('TURSO_AUTH_TOKEN is required for remote databases');
  }

  return createClient({
    url,
    authToken,
  });
}

// Lazy initialization - only create client when first accessed
let _client: ReturnType<typeof createClient> | null = null;
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

/**
 * Gets the database client, initializing if needed.
 * Uses lazy initialization to avoid errors when env vars aren't set yet.
 */
export function getDb() {
  if (!_db) {
    _client = createDbClient();
    _db = drizzle(_client, { schema });
  }
  return _db;
}

// For convenience, export the db directly
// But note: accessing this will throw if env vars aren't set!
export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_, prop) {
    return getDb()[prop as keyof typeof _db];
  },
});

// Type export for the discerning developer
export type Database = ReturnType<typeof getDb>;

// Re-export schema for convenience
export { schema };

// Export all schema types
export * from './schema';
