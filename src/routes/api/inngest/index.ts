// 🔌 Inngest API Handler - Where events come to life
// "I'm helping!" - Ralph, processing async workflows
//
// This endpoint handles Inngest's event processing requests.
// Register all your Inngest functions here to enable async workflows.

import { serve } from 'inngest/nitro';
import { inngest, inngestFunctions } from '../../../lib/inngest';

/**
 * ╭─────────────────────────────────────────────────────────╮
 * │  INNGEST SERVE HANDLER                                   │
 * │  ─────────────────────────────────────────────────────── │
 * │  This endpoint serves all registered Inngest functions.  │
 * │  Inngest will call this endpoint to process events.      │
 * │                                                          │
 * │  For local development, run:                             │
 * │    npx inngest-cli@latest dev                            │
 * │                                                          │
 * │  This opens http://localhost:8288 for testing events.    │
 * ╰─────────────────────────────────────────────────────────╯
 */

export default serve({
  client: inngest,
  functions: inngestFunctions,
});
