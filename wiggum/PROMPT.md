# 🚨 RALPH WIGGUM - Storefront Transformation Protocol 🚨

```
     .-"""-.
    /        \
   | ●    ●  |
   |    __   |    "Me fail English? That's unpossible!"
    \  \__/  /          - Ralph Wiggum, Business Consultant
     '------'
```

> *"I'm helping!"* - What you'll say when this prompt works

---

## 🎯 Mission Briefing

Transform this TanStack Start application into a fully-functional storefront with:
- Environment variable installation wizard
- Stripe payment integration
- Product catalog with beautiful soap products
- **Brevo email integration** for customer communications & drip campaigns
- **Inngest** for async event handling (fulfillment, email sequences)
- **Role-based access control** (Admin & Customer portals)
- Dashboard access gated behind working payment setup

**Base Example:** Karen's Beautiful Soap - artisanal, handcrafted soap products

---

## 🎨 Site Identity & Metadata

### Favicon Setup (USER ACTION REQUIRED)

```
┌──────────────────────────────────────────────────────────────┐
│  🖼️ FAVICON SETUP INSTRUCTIONS                                │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Your store needs a favicon! Here's how to set it up:        │
│                                                               │
│  1. Create your favicon:                                      │
│     • Use a tool like favicon.io or realfavicongenerator.net │
│     • Recommended: 32x32px PNG or SVG for best results       │
│     • Include apple-touch-icon (180x180px) for iOS           │
│                                                               │
│  2. Place files in /public directory:                        │
│     public/                                                   │
│     ├── favicon.ico          (legacy browsers)               │
│     ├── favicon-32x32.png    (modern browsers)               │
│     ├── favicon-16x16.png    (tabs)                          │
│     ├── apple-touch-icon.png (iOS home screen)               │
│     └── site.webmanifest     (PWA support)                   │
│                                                               │
│  3. The root layout will automatically reference these.      │
│                                                               │
│  💡 TIP: Match your favicon to your brand colors!            │
│     Karen's Soap: A soap bubble or leaf in forest green      │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### Site Metadata Protocol (ALWAYS FOLLOW)

```
┌──────────────────────────────────────────────────────────────┐
│  📝 METADATA RULES FOR EVERY ROUTE                            │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  EVERY route file MUST include proper metadata:              │
│                                                               │
│  1. Page Title - Format: "{Page Name} | {Store Name}"        │
│     • Homepage: "Karen's Beautiful Soap | Handcrafted Luxury"│
│     • Product:  "Lavender Dreams | Karen's Beautiful Soap"   │
│     • Cart:     "Shopping Cart | Karen's Beautiful Soap"     │
│                                                               │
│  2. Meta Description - 150-160 characters, action-oriented   │
│     • Include primary keyword                                 │
│     • Clear value proposition                                 │
│     • Call to action when appropriate                        │
│                                                               │
│  3. Open Graph tags for social sharing:                      │
│     • og:title, og:description, og:image                     │
│     • og:type (website, product, etc.)                       │
│                                                               │
│  Example Implementation:                                      │
│  ───────────────────────────────────                         │
│  export const Route = createFileRoute('/shop')({             │
│    meta: () => [                                             │
│      { title: 'Shop | Karen's Beautiful Soap' },             │
│      { name: 'description', content: 'Browse our...' },      │
│      { property: 'og:title', content: 'Shop Our Soaps' },    │
│    ],                                                        │
│    // ...                                                    │
│  });                                                         │
│                                                               │
│  🚨 WHEN CREATING/MODIFYING ROUTES:                          │
│     ALWAYS update title and description to match content!    │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 📋 Phase 1: Installation Wizard

### Environment Variable Detection

Create an installation flow that activates when required `.env` variables are missing:

```
Required Variables:
├── STRIPE_PUBLIC_KEY      → Publishable key from Stripe Dashboard
├── STRIPE_SECRET_KEY      → Secret key (sk_test_... or sk_live_...)
├── STRIPE_WEBHOOK_SECRET  → Webhook signing secret (whsec_...)
├── TURSO_DATABASE_URL     → Turso libSQL URL (libsql://your-db.turso.io)
├── TURSO_AUTH_TOKEN       → Turso authentication token
├── SESSION_SECRET         → Random 32+ char string for session encryption
├── BREVO_API_KEY          → Brevo (formerly Sendinblue) API key
└── INNGEST_SIGNING_KEY    → Inngest event signing key (optional for dev)
```

The installation flow can write directly to the local .env file when on localhost.

### Installation View Requirements

1. **Detection Logic**: Check for missing variables on app load
2. **Friendly UI**: Guide users (self developing their own store front) step-by-step, not a wall of text
3. **Platform-Specific Instructions**:
   - **Local Development**: `.env` file in project root
   - **Vercel Deployment**: Settings → Environment Variables panel

### Local `.env` Setup Guide

```env
# 🧼 Karen's Beautiful Soap - Environment Configuration
# Copy this to .env.local and fill in your values

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 💳 STRIPE CONFIGURATION
# Get these from: https://dashboard.stripe.com/apikeys
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STRIPE_PUBLIC_KEY=pk_test_xxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxx

# Webhook Secret (for local dev, use Stripe CLI)
# Run: stripe listen --forward-to localhost:3000/api/stripe/webhook
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxx

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🗄️ TURSO DATABASE (Drizzle ORM)
# Get these from: https://turso.tech or via CLI
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TURSO_DATABASE_URL=libsql://your-database-name.turso.io
TURSO_AUTH_TOKEN=eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9...

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 📧 BREVO EMAIL (formerly Sendinblue)
# Get your API key from: https://app.brevo.com/settings/keys/api
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BREVO_API_KEY=xkeysib-xxxxxxxxxxxx

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ⚡ INNGEST (Background Jobs & Events)
# Get keys from: https://app.inngest.com/env/production/manage/signing-key
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INNGEST_SIGNING_KEY=signkey-xxxxxxxxxxxx
INNGEST_EVENT_KEY=eventkey-xxxxxxxxxxxx

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🔐 SECURITY
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SESSION_SECRET=generate-a-random-32-character-string-here
```

### Vercel Deployment Guide

```
┌─────────────────────────────────────────────────────────────┐
│ VERCEL ENVIRONMENT VARIABLES SETUP                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Go to your Vercel Project Dashboard                      │
│  2. Click "Settings" in the top navigation                   │
│  3. Select "Environment Variables" from the sidebar          │
│  4. Add each variable:                                       │
│                                                              │
│     ┌──────────────────────┬──────────────────────────┐     │
│     │ Name                 │ Value                    │     │
│     ├──────────────────────┼──────────────────────────┤     │
│     │ STRIPE_PUBLIC_KEY    │ pk_live_...              │     │
│     │ STRIPE_SECRET_KEY    │ sk_live_...              │     │
│     │ STRIPE_WEBHOOK_SECRET│ whsec_...                │     │
│     │ TURSO_DATABASE_URL   │ libsql://...             │     │
│     │ TURSO_AUTH_TOKEN     │ eyJhbGciOi...            │     │
│     │ SESSION_SECRET       │ [random-string]          │     │
│     │ BREVO_API_KEY        │ xkeysib-...              │     │
│     │ INNGEST_SIGNING_KEY  │ signkey-...              │     │
│     │ INNGEST_EVENT_KEY    │ eventkey-...             │     │
│     └──────────────────────┴──────────────────────────┘     │
│                                                              │
│  5. Select environments: Production, Preview, Development    │
│  6. Click "Save"                                             │
│  7. Redeploy for changes to take effect                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Turso Database Setup Guide

When `TURSO_DATABASE_URL` is missing, show this wizard:

```
┌──────────────────────────────────────────────────────────────┐
│  🗄️ TURSO DATABASE SETUP                                     │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Turso is SQLite at the edge - fast, cheap, perfect for us.  │
│                                                               │
│  Step 1: Install Turso CLI                                   │
│  ───────────────────────────────────                         │
│  macOS:   brew install tursodatabase/tap/turso               │
│  Linux:   curl -sSfL https://get.tur.so/install.sh | bash    │
│  Windows: Use WSL, then Linux command                        │
│                                                               │
│  Step 2: Sign Up & Login                                     │
│  ───────────────────────────────────                         │
│  $ turso auth signup     # First time                        │
│  $ turso auth login      # Returning user                    │
│                                                               │
│  Step 3: Create Your Database                                │
│  ───────────────────────────────────                         │
│  $ turso db create soap-store                                │
│                                                               │
│  Step 4: Get Your Credentials                                │
│  ───────────────────────────────────                         │
│  $ turso db show soap-store --url                            │
│    → Copy this as TURSO_DATABASE_URL                         │
│                                                               │
│  $ turso db tokens create soap-store                         │
│    → Copy this as TURSO_AUTH_TOKEN                           │
│                                                               │
│  Step 5: Add to your .env file                               │
│  ───────────────────────────────────                         │
│  TURSO_DATABASE_URL=libsql://soap-store-yourname.turso.io    │
│  TURSO_AUTH_TOKEN=eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVC...      │
│                                                               │
│  ────────────────────────────────────────────────────────    │
│  💡 LOCAL DEVELOPMENT TIP                                    │
│  For offline work, use a local file instead:                 │
│  TURSO_DATABASE_URL=file:./local.db                          │
│  (No auth token needed for local files)                      │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### Drizzle ORM Migrations

All database changes flow through Drizzle. Here's the ritual:

```bash
# 🎭 THE MIGRATION DANCE

# After changing any schema file in src/db/schema/*:
npx drizzle-kit generate    # Creates migration SQL files
npx drizzle-kit push        # Applies changes to database

# On app startup (production):
# Migrations run automatically via migrate() function
```

**The app MUST run pending migrations on startup before serving requests.**

---

## 📋 Phase 2: Stripe Integration Gate

### The Golden Rule

> **No Stripe, No Dashboard.** Period.

Before users can access their store dashboard, verify:

1. ✅ `STRIPE_PUBLIC_KEY` is valid (starts with `pk_`)
2. ✅ `STRIPE_SECRET_KEY` is valid (starts with `sk_`)
3. ✅ Can successfully call Stripe API (test connection)
4. ✅ Webhook endpoint is configured

### Stripe Verification Flow

```typescript
// Pseudo-code for the verification dance
async function verifyStripeConnection() {
  // 🎭 Act 1: Check if keys exist
  if (!process.env.STRIPE_SECRET_KEY) {
    return { valid: false, reason: 'missing_secret_key' };
  }

  // 🎭 Act 2: Attempt a harmless API call
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    await stripe.customers.list({ limit: 1 });
    return { valid: true };
  } catch (error) {
    return { valid: false, reason: 'invalid_key_or_connection' };
  }
}
```

### Blocking Screen

When Stripe isn't ready, show a friendly but firm blocker:

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│     🧼 Almost Ready to Sell Soap! 🧼                         │
│                                                              │
│     Your payment processing isn't configured yet.           │
│     Complete these steps to access your dashboard:          │
│                                                              │
│     □ Add Stripe API keys                                   │
│     □ Verify connection                                     │
│     □ Configure webhook endpoint                            │
│                                                              │
│     [Configure Stripe →]                                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Phase 3: Brevo Email Integration

### Brevo Setup Guide

```
┌──────────────────────────────────────────────────────────────┐
│  📧 BREVO EMAIL SETUP                                         │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Brevo (formerly Sendinblue) handles all customer emails:    │
│  • Order confirmations                                        │
│  • Shipping notifications                                     │
│  • Welcome sequences (drip campaigns)                        │
│  • Marketing emails (with consent)                           │
│                                                               │
│  Step 1: Create Brevo Account                                │
│  ───────────────────────────────────                         │
│  1. Go to https://www.brevo.com                              │
│  2. Sign up for a free account (300 emails/day free tier)    │
│  3. Verify your email address                                │
│                                                               │
│  Step 2: Get Your API Key                                    │
│  ───────────────────────────────────                         │
│  1. Go to Settings → API Keys (or SMTP & API)                │
│  2. Click "Generate a new API key"                           │
│  3. Name it (e.g., "Soap Store Production")                  │
│  4. Copy the key immediately (shown only once!)              │
│                                                               │
│  Step 3: Add to Environment                                  │
│  ───────────────────────────────────                         │
│  BREVO_API_KEY=xkeysib-your-key-here                         │
│                                                               │
│  Step 4: Configure Sender                                    │
│  ───────────────────────────────────                         │
│  1. Go to Settings → Senders & IP                            │
│  2. Add your sender email (e.g., hello@karenssoap.com)       │
│  3. Verify the domain or email address                       │
│                                                               │
│  ────────────────────────────────────────────────────────    │
│  💡 TEMPLATE IDS                                             │
│  Set up these transactional templates in Brevo:              │
│  • Welcome Email (new customer)                              │
│  • Order Confirmation                                        │
│  • Shipping Notification                                     │
│  • Review Request (post-delivery)                            │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### Brevo Client Setup

```typescript
// src/lib/brevo.ts
// 📬 The postal service of our soap empire

import * as SibApiV3Sdk from '@sendinblue/client';

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
apiInstance.setApiKey(
  SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY!
);

// 🎯 Send transactional email
export async function sendTransactionalEmail({
  to,
  templateId,
  params,
}: {
  to: { email: string; name?: string };
  templateId: number;
  params: Record<string, string>;
}) {
  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
  sendSmtpEmail.to = [to];
  sendSmtpEmail.templateId = templateId;
  sendSmtpEmail.params = params;

  return apiInstance.sendTransacEmail(sendSmtpEmail);
}

// 📋 Add contact to list (for marketing consent)
export async function addContactToList(
  email: string,
  listId: number,
  attributes?: Record<string, string>
) {
  const contactsApi = new SibApiV3Sdk.ContactsApi();
  contactsApi.setApiKey(
    SibApiV3Sdk.ContactsApiApiKeys.apiKey,
    process.env.BREVO_API_KEY!
  );

  return contactsApi.createContact({
    email,
    listIds: [listId],
    attributes,
  });
}
```

### Email Templates to Create in Brevo

```
┌──────────────────────────────────────────────────────────────┐
│  TRANSACTIONAL EMAIL TEMPLATES                                │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Template 1: MAGIC_LINK (ID: store in constants)             │
│  ─────────────────────────────────────                       │
│  Subject: "Sign in to Karen's Beautiful Soap 🪄"             │
│  Params: {{ params.MAGIC_LINK }}                             │
│  Note: Link expires in 15 minutes. Include clear CTA button. │
│                                                               │
│  Template 2: WELCOME_EMAIL (ID: store in constants)          │
│  ─────────────────────────────────────                       │
│  Subject: "Welcome to Karen's Beautiful Soap! 🧼"            │
│  Params: {{ params.FIRSTNAME }}, {{ params.STORE_URL }}      │
│                                                               │
│  Template 3: ORDER_CONFIRMATION (ID: store in constants)     │
│  ─────────────────────────────────────                       │
│  Subject: "Order Confirmed: #{{ params.ORDER_NUMBER }}"      │
│  Params: ORDER_NUMBER, ITEMS, TOTAL, SHIPPING_ADDRESS        │
│                                                               │
│  Template 4: SHIPPING_NOTIFICATION                           │
│  ─────────────────────────────────────                       │
│  Subject: "Your soap is on its way! 📦"                      │
│  Params: ORDER_NUMBER, TRACKING_URL, DELIVERY_ESTIMATE       │
│                                                               │
│  Template 5: REVIEW_REQUEST (sent 7 days after delivery)     │
│  ─────────────────────────────────────                       │
│  Subject: "How was your soap? We'd love to know!"            │
│  Params: FIRSTNAME, PRODUCT_NAME, REVIEW_URL                 │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 📋 Phase 4: Inngest Event System

### Inngest Setup Guide

```
┌──────────────────────────────────────────────────────────────┐
│  ⚡ INNGEST SETUP - Background Jobs & Event Handling          │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Inngest handles all async operations:                       │
│  • Product fulfillment workflows                             │
│  • Drip email campaigns after purchase                       │
│  • Webhook processing                                        │
│  • Scheduled tasks                                           │
│                                                               │
│  Step 1: Install Inngest                                     │
│  ───────────────────────────────────                         │
│  npm install inngest                                         │
│                                                               │
│  Step 2: Create Inngest Account                              │
│  ───────────────────────────────────                         │
│  1. Go to https://www.inngest.com                            │
│  2. Sign up (generous free tier)                             │
│  3. Create a new app                                         │
│                                                               │
│  Step 3: Get Your Keys                                       │
│  ───────────────────────────────────                         │
│  1. Go to your app's settings                                │
│  2. Copy the Signing Key and Event Key                       │
│  3. Add to environment variables                             │
│                                                               │
│  Step 4: Local Development                                   │
│  ───────────────────────────────────                         │
│  # Run Inngest Dev Server alongside your app                 │
│  npx inngest-cli@latest dev                                  │
│                                                               │
│  # This opens http://localhost:8288 for testing              │
│  # No signing key needed for local dev!                      │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### Inngest Client & Functions

```typescript
// src/lib/inngest.ts
// ⚡ The nervous system of our async operations

import { Inngest } from 'inngest';

// Create the client
export const inngest = new Inngest({
  id: 'soap-store',
  // Event key only needed for sending events from client
});

// 🛒 Event: Order Completed
// Triggered after successful Stripe payment
export const orderCompleted = inngest.createFunction(
  { id: 'order-completed', name: 'Order Completed Flow' },
  { event: 'shop/order.completed' },
  async ({ event, step }) => {
    const { orderId, customerId, email, items } = event.data;

    // Step 1: Send order confirmation email
    await step.run('send-confirmation-email', async () => {
      await sendTransactionalEmail({
        to: { email },
        templateId: BREVO_TEMPLATES.ORDER_CONFIRMATION,
        params: { ORDER_NUMBER: orderId, /* ... */ },
      });
    });

    // Step 2: Update inventory
    await step.run('update-inventory', async () => {
      await updateProductStock(items);
    });

    // Step 3: Notify admin of new order
    await step.run('notify-admin', async () => {
      await notifyAdminNewOrder(orderId);
    });
  }
);

// 📧 Drip Campaign: New Customer Welcome Sequence
export const welcomeDripCampaign = inngest.createFunction(
  { id: 'welcome-drip', name: 'Welcome Drip Campaign' },
  { event: 'shop/customer.created' },
  async ({ event, step }) => {
    const { customerId, email, firstName } = event.data;

    // Day 0: Welcome email (immediate)
    await step.run('welcome-email', async () => {
      await sendTransactionalEmail({
        to: { email, name: firstName },
        templateId: BREVO_TEMPLATES.WELCOME,
        params: { FIRSTNAME: firstName },
      });
    });

    // Day 3: Tips for using your soap
    await step.sleep('wait-3-days', '3 days');
    await step.run('tips-email', async () => {
      await sendTransactionalEmail({
        to: { email },
        templateId: BREVO_TEMPLATES.SOAP_TIPS,
        params: { FIRSTNAME: firstName },
      });
    });

    // Day 7: Invite to leave a review
    await step.sleep('wait-4-more-days', '4 days');
    await step.run('review-request', async () => {
      await sendTransactionalEmail({
        to: { email },
        templateId: BREVO_TEMPLATES.REVIEW_REQUEST,
        params: { FIRSTNAME: firstName },
      });
    });
  }
);

// 📦 Product Fulfillment Workflow
export const fulfillmentWorkflow = inngest.createFunction(
  { id: 'fulfillment', name: 'Order Fulfillment Workflow' },
  { event: 'shop/order.ready-to-ship' },
  async ({ event, step }) => {
    const { orderId, trackingNumber, email } = event.data;

    // Send shipping notification
    await step.run('shipping-notification', async () => {
      await sendTransactionalEmail({
        to: { email },
        templateId: BREVO_TEMPLATES.SHIPPING_NOTIFICATION,
        params: {
          ORDER_NUMBER: orderId,
          TRACKING_URL: `https://track.example.com/${trackingNumber}`,
        },
      });
    });

    // Schedule delivery follow-up (estimated delivery + 2 days)
    await step.sleep('wait-for-delivery', '7 days');
    await step.run('delivery-followup', async () => {
      await sendTransactionalEmail({
        to: { email },
        templateId: BREVO_TEMPLATES.DELIVERY_FOLLOWUP,
        params: { ORDER_NUMBER: orderId },
      });
    });
  }
);
```

### Inngest API Route

```typescript
// src/routes/api/inngest.ts
// 🔌 The webhook endpoint for Inngest

import { serve } from 'inngest/express'; // or appropriate adapter
import { inngest, orderCompleted, welcomeDripCampaign, fulfillmentWorkflow } from '~/lib/inngest';

export const POST = serve({
  client: inngest,
  functions: [
    orderCompleted,
    welcomeDripCampaign,
    fulfillmentWorkflow,
  ],
});
```

### Event Trigger Points

```
┌──────────────────────────────────────────────────────────────┐
│  🎯 WHERE TO TRIGGER INNGEST EVENTS                           │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Stripe Webhook Handler:                                     │
│  ─────────────────────────────────────                       │
│  checkout.session.completed → send 'shop/order.completed'    │
│                                                               │
│  User Registration:                                          │
│  ─────────────────────────────────────                       │
│  After first purchase → send 'shop/customer.created'         │
│                                                               │
│  Admin Dashboard:                                            │
│  ─────────────────────────────────────                       │
│  "Mark as Shipped" → send 'shop/order.ready-to-ship'        │
│                                                               │
│  Example trigger:                                            │
│  ─────────────────────────────────────                       │
│  await inngest.send({                                        │
│    name: 'shop/order.completed',                             │
│    data: { orderId, customerId, email, items },              │
│  });                                                         │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 📋 Phase 5: Look & Feel

### Brand Identity: Karen's Beautiful Soap

```
┌──────────────────────────────────────────────────────────────┐
│  BRAND COLORS                                                 │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Primary:     #2D5A4A  (Forest Green - Nature, Organic)      │
│  Secondary:   #F5EBE0  (Cream - Softness, Purity)            │
│  Accent:      #D4A574  (Warm Honey - Warmth, Handcrafted)    │
│  Dark:        #1A1A1A  (Charcoal - Sophistication)           │
│  Light:       #FDFCFB  (Off-White - Clean, Fresh)            │
│                                                               │
│  TYPOGRAPHY                                                   │
│  Headings:    "Playfair Display" or "Old Standard TT"        │
│  Body:        "Karla" or "Inter"                             │
│                                                               │
│  MOOD                                                         │
│  Natural • Artisanal • Luxurious • Approachable              │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### Design Tokens (CSS Variables)

```css
/* styles.css */
:root {
  /* Colors */
  --soap-forest: #2D5A4A;
  --soap-cream: #F5EBE0;
  --soap-honey: #D4A574;
  --soap-charcoal: #1A1A1A;
  --soap-pearl: #FDFCFB;

  /* Typography */
  --font-display: 'Playfair Display', serif;
  --font-body: 'Karla', sans-serif;
}
```

### Component Aesthetics

```
┌─────────────────────────────────────────────────────────────┐
│  PRODUCT CARDS                                               │
│  ─────────────────────────────────────────────────────────  │
│  • Soft shadows (shadow-md hover:shadow-xl)                 │
│  • Rounded corners (rounded-2xl)                            │
│  • Image zoom on hover (scale-105 transition)               │
│  • Cream background with subtle borders                     │
│                                                              │
│  BUTTONS                                                     │
│  ─────────────────────────────────────────────────────────  │
│  • Primary: Forest green with cream text                    │
│  • Secondary: Outlined with honey border                    │
│  • Hover: Subtle lift with deeper shadow                    │
│                                                              │
│  NAVIGATION                                                  │
│  ─────────────────────────────────────────────────────────  │
│  • Sticky header with backdrop blur                         │
│  • Logo left, cart icon right                               │
│  • Minimal, elegant links                                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Phase 6: User Authentication & Roles

### User Types

```
┌──────────────────────────────────────────────────────────────┐
│  👥 USER ROLE SYSTEM                                          │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Two base user types with distinct portals:                  │
│                                                               │
│  🔑 ADMIN (Store Owner)                                      │
│  ─────────────────────────────────────                       │
│  • Full access to store management                           │
│  • Product CRUD operations                                   │
│  • Order management & fulfillment                            │
│  • Analytics & reporting                                     │
│  • Store settings & configuration                            │
│                                                               │
│  🛒 CUSTOMER (Shopper)                                       │
│  ─────────────────────────────────────                       │
│  • View and purchase products                                │
│  • Access to customer portal after purchase                  │
│  • View order history                                        │
│  • Manage saved payment methods                              │
│  • Update shipping addresses                                 │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### Authentication Schema (Magic Link / Passwordless)

```typescript
// src/db/schema/users.ts
// 👤 The identity layer of our soap empire
// 🪄 We use magic links - no passwords to remember (or forget)!

import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { createId } from '@paralleldrive/cuid2';

export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  email: text('email').notNull().unique(),
  role: text('role', { enum: ['admin', 'customer'] }).default('customer'),
  stripeCustomerId: text('stripe_customer_id'),  // For saved payment methods
  firstName: text('first_name'),
  lastName: text('last_name'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// 🪄 Magic link tokens for passwordless authentication
export const magicTokens = sqliteTable('magic_tokens', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  email: text('email').notNull(),
  token: text('token').notNull().unique(),  // Secure random token
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),  // 15 min expiry
  usedAt: integer('used_at', { mode: 'timestamp' }),  // null until used
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// 💳 Saved payment methods from Stripe
export const paymentMethods = sqliteTable('payment_methods', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').references(() => users.id).notNull(),
  stripePaymentMethodId: text('stripe_payment_method_id').notNull(),
  type: text('type'),  // 'card', 'bank_account', etc.
  last4: text('last_4'),
  brand: text('brand'),  // 'visa', 'mastercard', etc.
  isDefault: integer('is_default', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});
```

### Admin Dashboard Features

```
┌──────────────────────────────────────────────────────────────┐
│  🎛️ ADMIN DASHBOARD                                          │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  /admin/                     Dashboard Overview              │
│  ├── Quick stats: Today's sales, pending orders, low stock  │
│  ├── Recent orders widget                                    │
│  └── Revenue chart (last 7 days)                            │
│                                                               │
│  /admin/products             Product Management              │
│  ├── Product listing with search/filter                     │
│  ├── Add new product form                                   │
│  ├── Edit product modal                                     │
│  ├── Stock level indicators                                 │
│  └── Sync status with Stripe                                │
│                                                               │
│  /admin/orders               Order Management                │
│  ├── Order listing with status filters                      │
│  ├── Order detail view                                      │
│  ├── "Mark as Shipped" action (triggers Inngest event)      │
│  ├── Tracking number input                                  │
│  └── Refund/cancel actions                                  │
│                                                               │
│  /admin/customers            Customer Overview               │
│  ├── Customer list with order history                       │
│  └── Customer lifetime value                                │
│                                                               │
│  /admin/settings             Store Settings                  │
│  ├── Store name & branding                                  │
│  ├── Email template configuration                           │
│  └── Notification preferences                               │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### Customer Portal Features

```
┌──────────────────────────────────────────────────────────────┐
│  👤 CUSTOMER PORTAL                                          │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  /account/                   Account Overview                │
│  ├── Welcome message with recent order status               │
│  └── Quick links to common actions                          │
│                                                               │
│  /account/orders             Order History                   │
│  ├── List of all past orders                                │
│  ├── Order status tracking                                  │
│  ├── Download invoices                                      │
│  └── Reorder functionality                                  │
│                                                               │
│  /account/payment-methods    Payment Management              │
│  ├── List saved cards (from Stripe)                         │
│  ├── Add new payment method                                 │
│  ├── Set default payment method                             │
│  └── Remove saved cards                                     │
│                                                               │
│  /account/addresses          Shipping Addresses              │
│  ├── Saved shipping addresses                               │
│  ├── Add/edit addresses                                     │
│  └── Set default shipping address                           │
│                                                               │
│  /account/profile            Profile Settings                │
│  ├── Update email/password                                  │
│  └── Communication preferences                              │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### Route Protection Middleware

```typescript
// src/lib/auth.ts
// 🛡️ The bouncer at the door of our soap club
// 🪄 Magic link edition - no passwords, just vibes

import { redirect } from '@tanstack/react-router';

// Check if user is authenticated
export async function requireAuth(context: RouterContext) {
  const session = await getSession(context.request);
  if (!session?.userId) {
    throw redirect({ to: '/login', search: { redirect: context.location.href } });
  }
  return session;
}

// Check if user is admin
export async function requireAdmin(context: RouterContext) {
  const session = await requireAuth(context);
  const user = await db.query.users.findFirst({
    where: eq(users.id, session.userId),
  });

  if (user?.role !== 'admin') {
    throw redirect({ to: '/account' });  // Customers go to their portal
  }
  return { session, user };
}

// Check if user is customer (post-purchase)
export async function requireCustomer(context: RouterContext) {
  const session = await requireAuth(context);
  return session;
}
```

### Magic Link Authentication Flow

```typescript
// src/lib/magic-link.ts
// 🪄 The spell that lets users in without remembering passwords

import { randomBytes } from 'crypto';
import { db } from '@/db';
import { magicTokens, users } from '@/db/schema';
import { sendTransactionalEmail } from './brevo';

// Generate a magic link and send it via email
export async function sendMagicLink(email: string) {
  // 🎲 Generate secure random token
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  // 💾 Store token in database
  await db.insert(magicTokens).values({
    email,
    token,
    expiresAt,
  });

  // 📧 Send the magic link via Brevo
  const magicUrl = `${process.env.APP_URL}/auth/verify?token=${token}`;
  await sendTransactionalEmail({
    to: { email },
    templateId: BREVO_TEMPLATES.MAGIC_LINK,
    params: { MAGIC_LINK: magicUrl },
  });
}

// Verify a magic link token and create session
export async function verifyMagicToken(token: string) {
  // 🔍 Find the token
  const magicToken = await db.query.magicTokens.findFirst({
    where: and(
      eq(magicTokens.token, token),
      isNull(magicTokens.usedAt),
      gt(magicTokens.expiresAt, new Date()),
    ),
  });

  if (!magicToken) {
    return { success: false, error: 'invalid_or_expired_token' };
  }

  // ✅ Mark token as used
  await db.update(magicTokens)
    .set({ usedAt: new Date() })
    .where(eq(magicTokens.id, magicToken.id));

  // 👤 Find or create user
  let user = await db.query.users.findFirst({
    where: eq(users.email, magicToken.email),
  });

  if (!user) {
    [user] = await db.insert(users)
      .values({ email: magicToken.email })
      .returning();
  }

  return { success: true, user };
}
```

---

## 📋 Phase 7: Product Catalog

### Sample Products (Karen's Beautiful Soap)

```
┌─────────────────────────────────────────────────────────────┐
│  PRODUCT CATALOG                                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  🌿 LAVENDER DREAMS                                          │
│     "Drift off with the soothing scent of French lavender"  │
│     Price: $12.00 | Category: Relaxation                    │
│     Ingredients: Olive oil, lavender essential oil, shea    │
│                                                              │
│  🍯 HONEY OAT COMFORT                                        │
│     "Nature's gentlest exfoliation"                          │
│     Price: $14.00 | Category: Exfoliating                   │
│     Ingredients: Oatmeal, raw honey, coconut oil            │
│                                                              │
│  🌹 ROSE PETAL LUXURY                                        │
│     "Feel like royalty with every wash"                      │
│     Price: $16.00 | Category: Luxury                        │
│     Ingredients: Rose petals, rosehip oil, vitamin E        │
│                                                              │
│  🍊 CITRUS BURST                                             │
│     "Wake up your senses"                                    │
│     Price: $11.00 | Category: Energizing                    │
│     Ingredients: Orange zest, lemon oil, grapefruit         │
│                                                              │
│  🥥 COCONUT MILK BLISS                                       │
│     "Tropical hydration in a bar"                            │
│     Price: $13.00 | Category: Moisturizing                  │
│     Ingredients: Coconut milk, coconut oil, vanilla         │
│                                                              │
│  🌲 FOREST PINE FRESHNESS                                    │
│     "Bring the outdoors in"                                  │
│     Price: $12.00 | Category: Fresh                         │
│     Ingredients: Pine needles, cedarwood, eucalyptus        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Phase 8: Route Structure

```
src/routes/
├── __root.tsx              # Layout with nav, footer
├── index.tsx               # Landing page / Hero
├── install/
│   └── index.tsx           # Installation wizard
│
├── 🌐 PUBLIC ROUTES
├── shop/
│   ├── index.tsx           # Product grid
│   └── $productId.tsx      # Product detail page
├── cart/
│   └── index.tsx           # Shopping cart
├── checkout/
│   └── index.tsx           # Stripe checkout
│
├── 🔐 AUTH ROUTES (Magic Link)
├── login.tsx               # Email input → sends magic link
├── auth/
│   └── verify.tsx          # Handles magic link token verification
│
├── 🛒 CUSTOMER PORTAL (requires: authenticated customer)
├── account/
│   ├── __layout.tsx        # Customer portal layout
│   ├── index.tsx           # Account dashboard
│   ├── orders/
│   │   ├── index.tsx       # Order history
│   │   └── $orderId.tsx    # Order details
│   ├── payment-methods.tsx # Manage saved cards
│   ├── addresses.tsx       # Shipping addresses
│   └── profile.tsx         # Profile settings
│
├── 🔑 ADMIN DASHBOARD (requires: admin role)
├── admin/
│   ├── __layout.tsx        # Admin layout (sidebar nav)
│   ├── index.tsx           # Admin dashboard home
│   ├── products/
│   │   ├── index.tsx       # Product listing
│   │   ├── new.tsx         # Add new product
│   │   └── $productId.tsx  # Edit product
│   ├── orders/
│   │   ├── index.tsx       # Order management
│   │   └── $orderId.tsx    # Order details & fulfillment
│   ├── customers.tsx       # Customer list & details
│   └── settings.tsx        # Store settings
│
└── 📡 API ROUTES
    └── api/
        ├── stripe/
        │   ├── checkout.ts     # Create checkout session
        │   └── webhook.ts      # Handle Stripe webhooks
        ├── inngest.ts          # Inngest webhook endpoint
        └── brevo/
            └── webhook.ts      # Brevo webhook handler
```

### Route Access Control Matrix

```
┌─────────────────────────────────────────────────────────────┐
│  ROUTE ACCESS CONTROL                                        │
├──────────────────┬──────────────────────────────────────────┤
│  Route           │  Access Requirements                     │
├──────────────────┼──────────────────────────────────────────┤
│  /               │  Public                                  │
│  /shop/*         │  Public                                  │
│  /cart           │  Public                                  │
│  /checkout       │  Public (Stripe config required)         │
│  /login          │  Public (redirect if logged in)          │
│  /register       │  Public (redirect if logged in)          │
│  /install        │  Show only when env vars missing         │
│  /account/*      │  🔒 Authenticated Customer               │
│  /admin/*        │  🔒 Authenticated Admin                  │
├──────────────────┴──────────────────────────────────────────┤
│                                                              │
│  Gate Logic:                                                 │
│  ─────────────────────────────────────                      │
│  if (!envVarsPresent)    → redirect to /install             │
│  if (!authenticated)     → redirect to /login               │
│  if (role !== 'admin')   → redirect to /account             │
│  if (role === 'admin')   → allow /admin/* access            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎬 Implementation Order

```
    ╔═══════════════════════════════════════════════════════╗
    ║  RALPH'S IMPLEMENTATION ROADMAP                        ║
    ╠═══════════════════════════════════════════════════════╣
    ║                                                        ║
    ║  FOUNDATION                                            ║
    ║  1. [ ] Clean up demo routes (delete /demo)            ║
    ║  2. [ ] Create env detection utility                   ║
    ║  3. [ ] Install Drizzle ORM + @libsql/client           ║
    ║  4. [ ] Set up db schema (products, orders, users)     ║
    ║  5. [ ] Configure drizzle.config.ts for Turso          ║
    ║  6. [ ] Create migration runner (app startup)          ║
    ║  7. [ ] Add favicon & site metadata infrastructure     ║
    ║                                                        ║
    ║  INSTALLATION WIZARD                                   ║
    ║  8. [ ] Build installation wizard UI                   ║
    ║  9. [ ] Add Turso setup instructions view              ║
    ║  10.[ ] Add Stripe setup instructions view             ║
    ║  11.[ ] Add Brevo setup instructions view              ║
    ║  12.[ ] Add Inngest setup instructions view            ║
    ║  13.[ ] Add Vercel deployment instructions             ║
    ║                                                        ║
    ║  STRIPE INTEGRATION                                    ║
    ║  14.[ ] Set up Stripe SDK integration                  ║
    ║  15.[ ] Create Stripe verification endpoint            ║
    ║  16.[ ] Build the Stripe gate middleware               ║
    ║                                                        ║
    ║  BREVO EMAIL INTEGRATION                               ║
    ║  17.[ ] Install @sendinblue/client package             ║
    ║  18.[ ] Create Brevo client utility                    ║
    ║  19.[ ] Set up transactional email templates           ║
    ║  20.[ ] Create Brevo webhook handler                   ║
    ║                                                        ║
    ║  INNGEST EVENT SYSTEM                                  ║
    ║  21.[ ] Install inngest package                        ║
    ║  22.[ ] Create Inngest client and event definitions    ║
    ║  23.[ ] Build order completion workflow                ║
    ║  24.[ ] Build welcome drip campaign function           ║
    ║  25.[ ] Build fulfillment workflow function            ║
    ║  26.[ ] Create /api/inngest endpoint                   ║
    ║                                                        ║
    ║  USER AUTHENTICATION                                   ║
    ║  27.[ ] Create users & payment_methods schema          ║
    ║  28.[ ] Build login/register routes                    ║
    ║  29.[ ] Create session management                      ║
    ║  30.[ ] Build auth middleware (requireAuth, etc.)      ║
    ║                                                        ║
    ║  STOREFRONT                                            ║
    ║  31.[ ] Design and build landing page                  ║
    ║  32.[ ] Create product catalog components              ║
    ║  33.[ ] Build shopping cart (state management)         ║
    ║  34.[ ] Implement Stripe checkout flow                 ║
    ║                                                        ║
    ║  ADMIN DASHBOARD                                       ║
    ║  35.[ ] Create admin layout with sidebar               ║
    ║  36.[ ] Build admin dashboard home (stats/charts)      ║
    ║  37.[ ] Add product management CRUD                    ║
    ║  38.[ ] Add order management & fulfillment             ║
    ║  39.[ ] Add customer overview                          ║
    ║  40.[ ] Add store settings                             ║
    ║                                                        ║
    ║  CUSTOMER PORTAL                                       ║
    ║  41.[ ] Create customer portal layout                  ║
    ║  42.[ ] Build order history view                       ║
    ║  43.[ ] Add payment method management                  ║
    ║  44.[ ] Add address management                         ║
    ║  45.[ ] Add profile settings                           ║
    ║                                                        ║
    ║  POLISH                                                ║
    ║  46.[ ] Apply brand styling throughout                 ║
    ║  47.[ ] Add error handling & loading states            ║
    ║  48.[ ] Update meta tags on all routes                 ║
    ║  49.[ ] Test full checkout + email flow                ║
    ║  50.[ ] Test admin/customer portal flows               ║
    ║                                                        ║
    ╚═══════════════════════════════════════════════════════╝
```

---

## 📁 Wiggum Prompt Files Overview

```
┌──────────────────────────────────────────────────────────────┐
│  📂 WIGGUM DIRECTORY STRUCTURE                               │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  wiggum/                                                      │
│  ├── PROMPT.md              ← You are here! 📍               │
│  │   Main transformation protocol with all phases,           │
│  │   setup guides, code examples, and implementation plan.   │
│  │                                                           │
│  ├── context/                                                │
│  │   ├── architecture.md    Database, Stripe, and system     │
│  │   │                      architecture diagrams & patterns │
│  │   │                                                       │
│  │   ├── constraints.md     Hard rules, security guidelines, │
│  │   │                      access control, and boundaries   │
│  │   │                                                       │
│  │   └── glossary.md        Term definitions for tech stack, │
│  │                          business concepts, and patterns  │
│  │                                                           │
│  └── notes.md               Development journal, decisions,  │
│                             gotchas, and future considerations│
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 💡 Pro Tips from Ralph

```
    "I bent my Wookiee!"         → Don't break the build
    "Tastes like burning!"       → Test your Stripe webhooks locally
    "My cat's breath..."         → Use environment variables, never hardcode keys
    "I'm learnding!"             → Document as you go
    "The doctor said I wouldn't  → Always update route metadata (title, description)
     have so many nosebleeds
     if I kept my finger outta
     there."
    "Me fail English?"           → Validate all user inputs with Zod
```

---

## 🚨 CRITICAL REMINDERS

1. **ALWAYS update site metadata** when creating or modifying routes
2. **NEVER commit API keys** - use environment variables
3. **Favicon is user responsibility** - remind them to add it!
4. **Inngest dev server** must run alongside the app locally
5. **Brevo templates** need to be created in their dashboard first

---

*Remember: The store won't run without Stripe, Turso, Brevo, and Inngest configured. That's the law. Ralph's law.* 🚨
