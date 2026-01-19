# 🏗️ Architecture Overview

```
    ┌─────────────────────────────────────────────────────────────────────────────┐
    │                           THE BIG PICTURE                                    │
    │                                                                              │
    │   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
    │   │   Browser   │───▶│  TanStack   │───▶│   Turso     │    │   Brevo     │  │
    │   │   (React)   │◀───│   Start     │◀───│   (SQLite)  │    │   (Email)   │  │
    │   └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘  │
    │         │                   │                  ▲                  ▲          │
    │         │                   │                  │                  │          │
    │         ▼                   ▼                  │                  │          │
    │   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
    │   │   Stripe    │◀──▶│   Drizzle   │───▶│ Migrations  │    │  Inngest    │  │
    │   │   (Pay)     │    │   (ORM)     │    │   (Auto)    │    │  (Events)   │  │
    │   └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘  │
    │         │                                                        │          │
    │         │              ┌─────────────┐                          │          │
    │         └─────────────▶│   Session   │◀─────────────────────────┘          │
    │                        │   (Auth)    │                                      │
    │                        └─────────────┘                                      │
    │                                                                              │
    └─────────────────────────────────────────────────────────────────────────────┘
```

---

## 👥 User Authentication Flow (Magic Link / Passwordless)

```
    ┌─────────────────────────────────────────────────────────────────────────────┐
    │                  MAGIC LINK AUTHENTICATION ARCHITECTURE                      │
    │                                                                              │
    │   ┌─────────────────┐                                                        │
    │   │  /login         │ User enters email                                     │
    │   │  (email only)   │──────┐                                                │
    │   └─────────────────┘      │                                                │
    │                            ▼                                                │
    │                      ┌─────────────┐     ┌─────────────┐                    │
    │                      │  Generate   │────▶│   Send      │                    │
    │                      │  Token      │     │   via Brevo │                    │
    │                      └─────────────┘     └─────────────┘                    │
    │                            │                   │                            │
    │                            ▼                   ▼                            │
    │                      ┌─────────────┐     ┌─────────────┐                    │
    │                      │   Turso     │     │  📧 Email   │                    │
    │                      │(magic_tokens)     │  with link  │                    │
    │                      └─────────────┘     └─────────────┘                    │
    │                                                │                            │
    │                          User clicks link      │                            │
    │                                                ▼                            │
    │                      ┌─────────────┐     ┌─────────────┐                    │
    │                      │/auth/verify │────▶│  Validate   │                    │
    │                      │  ?token=... │     │   Token     │                    │
    │                      └─────────────┘     └─────────────┘                    │
    │                                                │                            │
    │                         Valid & not expired?   │                            │
    │                                                ▼                            │
    │                      ┌─────────────┐     ┌─────────────┐                    │
    │                      │  Find/Create│────▶│   Create    │                    │
    │                      │   User      │     │   Session   │                    │
    │                      └─────────────┘     └─────────────┘                    │
    │                                                │                            │
    │                                                ▼                            │
    │           ┌────────────────────────────────────┴────────────────────────┐   │
    │           │                                                              │   │
    │           ▼                                                              ▼   │
    │   ┌───────────────┐                                            ┌───────────────┐
    │   │  role=admin   │                                            │ role=customer │
    │   │               │                                            │               │
    │   │  /admin/*     │                                            │  /account/*   │
    │   │  Full store   │                                            │  Order history│
    │   │  management   │                                            │  Payment mgmt │
    │   └───────────────┘                                            └───────────────┘
    │                                                                              │
    └─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📧 Brevo Email Architecture

```
    ┌─────────────────────────────────────────────────────────────────────────────┐
    │                          BREVO EMAIL FLOW                                    │
    │                                                                              │
    │   Event Triggers:                                                            │
    │   ───────────────                                                           │
    │                                                                              │
    │   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
    │   │   Order     │    │  Customer   │    │   Ship      │    │   Review    │  │
    │   │  Complete   │    │   Created   │    │  Fulfilled  │    │  Request    │  │
    │   └──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘  │
    │          │                  │                  │                  │          │
    │          └──────────────────┼──────────────────┼──────────────────┘          │
    │                             ▼                  ▼                             │
    │                      ┌─────────────────────────────┐                        │
    │                      │         Inngest             │                        │
    │                      │    (Event Orchestrator)     │                        │
    │                      └─────────────┬───────────────┘                        │
    │                                    │                                        │
    │                                    ▼                                        │
    │                      ┌─────────────────────────────┐                        │
    │                      │        Brevo API            │                        │
    │                      │  (Transactional Emails)     │                        │
    │                      └─────────────┬───────────────┘                        │
    │                                    │                                        │
    │              ┌─────────────────────┼─────────────────────┐                  │
    │              ▼                     ▼                     ▼                  │
    │      ┌─────────────┐       ┌─────────────┐       ┌─────────────┐           │
    │      │   Welcome   │       │   Order     │       │  Shipping   │           │
    │      │   Email     │       │   Confirm   │       │   Update    │           │
    │      └─────────────┘       └─────────────┘       └─────────────┘           │
    │                                                                              │
    └─────────────────────────────────────────────────────────────────────────────┘
```

---

## ⚡ Inngest Event System Architecture

```
    ┌─────────────────────────────────────────────────────────────────────────────┐
    │                        INNGEST EVENT SYSTEM                                  │
    │                                                                              │
    │   Event Sources:                                                             │
    │   ──────────────                                                            │
    │                                                                              │
    │   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                     │
    │   │   Stripe    │    │   Admin     │    │   System    │                     │
    │   │  Webhook    │    │  Actions    │    │  Scheduled  │                     │
    │   └──────┬──────┘    └──────┬──────┘    └──────┬──────┘                     │
    │          │                  │                  │                            │
    │          └──────────────────┼──────────────────┘                            │
    │                             ▼                                               │
    │                      ┌─────────────────────────────┐                        │
    │                      │     inngest.send()          │                        │
    │                      │   Event Dispatcher          │                        │
    │                      └─────────────┬───────────────┘                        │
    │                                    │                                        │
    │                                    ▼                                        │
    │                      ┌─────────────────────────────┐                        │
    │                      │     /api/inngest            │                        │
    │                      │   Function Handler          │                        │
    │                      └─────────────┬───────────────┘                        │
    │                                    │                                        │
    │          ┌─────────────────────────┼─────────────────────────┐              │
    │          ▼                         ▼                         ▼              │
    │   ┌─────────────┐          ┌─────────────┐          ┌─────────────┐        │
    │   │   Order     │          │   Welcome   │          │ Fulfillment │        │
    │   │  Completed  │          │   Drip      │          │  Workflow   │        │
    │   │  Function   │          │  Campaign   │          │  Function   │        │
    │   └──────┬──────┘          └──────┬──────┘          └──────┬──────┘        │
    │          │                        │                        │                │
    │          │   ┌────────────────────┴────────────────────────┘                │
    │          │   │                                                              │
    │          ▼   ▼                                                              │
    │   ┌─────────────────────────────┐                                          │
    │   │   step.run() / step.sleep() │                                          │
    │   │   Durable execution steps   │                                          │
    │   └─────────────┬───────────────┘                                          │
    │                 │                                                           │
    │          ┌──────┴──────┐                                                   │
    │          ▼             ▼                                                   │
    │   ┌─────────────┐ ┌─────────────┐                                          │
    │   │   Brevo     │ │   Database  │                                          │
    │   │   (Email)   │ │   (Update)  │                                          │
    │   └─────────────┘ └─────────────┘                                          │
    │                                                                              │
    └─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Layer: Drizzle + Turso

### Why This Stack?

- **Drizzle ORM**: Type-safe, lightweight, SQL-like. No magic, just good vibes.
- **Turso**: SQLite at the edge. Fast, cheap, globally distributed.
- **Together**: A match made in serverless heaven.

### Directory Structure

```
src/
├── db/
│   ├── index.ts          # Database client initialization
│   ├── schema/
│   │   ├── index.ts      # Export all schemas
│   │   ├── users.ts      # User table schema (no passwords!)
│   │   ├── magic-tokens.ts  # Magic link tokens for passwordless auth
│   │   ├── products.ts   # Product table schema
│   │   ├── orders.ts     # Order table schema
│   │   ├── payment-methods.ts  # Saved payment methods
│   │   └── addresses.ts  # Shipping addresses
│   └── migrations/       # Auto-generated migration files
├── lib/
│   ├── auth.ts           # Authentication utilities
│   ├── magic-link.ts     # Magic link generation & verification
│   ├── brevo.ts          # Brevo email client
│   └── inngest.ts        # Inngest event functions
├── drizzle.config.ts     # Drizzle Kit configuration
└── ...
```

### Schema Design

```typescript
// src/db/schema/users.ts
// 👤 The identity layer - who's buying all this soap?
// 🪄 Passwordless! We use magic links for auth.

import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { createId } from '@paralleldrive/cuid2';

export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  email: text('email').notNull().unique(),
  role: text('role', { enum: ['admin', 'customer'] }).default('customer'),
  stripeCustomerId: text('stripe_customer_id'),
  firstName: text('first_name'),
  lastName: text('last_name'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// src/db/schema/magic-tokens.ts
// 🪄 Tokens for passwordless magic link authentication

export const magicTokens = sqliteTable('magic_tokens', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  email: text('email').notNull(),
  token: text('token').notNull().unique(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  usedAt: integer('used_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// src/db/schema/products.ts
// 🧼 The soap that pays the bills

export const products = sqliteTable('products', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull(),
  description: text('description'),
  price: real('price').notNull(),        // In cents? No, in dollars. We're fancy.
  category: text('category'),
  imageUrl: text('image_url'),
  stripeProductId: text('stripe_product_id'),
  stripePriceId: text('stripe_price_id'),
  inStock: integer('in_stock', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// src/db/schema/orders.ts
// 📦 Where dreams of clean skin become reality

export const orders = sqliteTable('orders', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').references(() => users.id),
  stripeSessionId: text('stripe_session_id'),
  stripePaymentIntent: text('stripe_payment_intent'),
  status: text('status', { enum: ['pending', 'paid', 'shipped', 'delivered', 'cancelled'] }),
  totalAmount: real('total_amount').notNull(),
  shippingAddress: text('shipping_address'),  // JSON stringified
  trackingNumber: text('tracking_number'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// src/db/schema/payment-methods.ts
// 💳 Customer's saved cards for quick checkout

export const paymentMethods = sqliteTable('payment_methods', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').references(() => users.id).notNull(),
  stripePaymentMethodId: text('stripe_payment_method_id').notNull(),
  type: text('type'),         // 'card', 'bank_account', etc.
  last4: text('last_4'),
  brand: text('brand'),       // 'visa', 'mastercard', etc.
  expiryMonth: integer('expiry_month'),
  expiryYear: integer('expiry_year'),
  isDefault: integer('is_default', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});
```

### Database Client Setup

```typescript
// src/db/index.ts
// 🌊 The wellspring of all data

import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';

// Creating the client - like turning on a faucet of possibilities
const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// The db object - your new best friend
export const db = drizzle(client, { schema });

// Type exports for the discerning developer
export type Database = typeof db;
```

### Migration Workflow

```bash
# 🎭 The Migration Dance

# Step 1: Generate migrations from schema changes
npx drizzle-kit generate

# Step 2: Push migrations to database (development)
npx drizzle-kit push

# Step 3: For production, run migrations programmatically
# (We'll handle this in the app startup)
```

### Drizzle Config

```typescript
// drizzle.config.ts
// 🎛️ The control center for your database dreams

import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema/index.ts',
  out: './src/db/migrations',
  dialect: 'turso',
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
} satisfies Config;
```

---

## 🔐 Turso Setup Instructions

### Getting Your Turso URL

```
┌──────────────────────────────────────────────────────────────┐
│  TURSO SETUP WIZARD                                          │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Step 1: Install Turso CLI                                   │
│  ───────────────────────────────────                         │
│  brew install tursodatabase/tap/turso                        │
│                                                               │
│  Step 2: Authenticate                                        │
│  ───────────────────────────────────                         │
│  turso auth signup     # If you're new                       │
│  turso auth login      # If you have an account              │
│                                                               │
│  Step 3: Create a Database                                   │
│  ───────────────────────────────────                         │
│  turso db create soap-store                                  │
│                                                               │
│  Step 4: Get Your Credentials                                │
│  ───────────────────────────────────                         │
│  turso db show soap-store --url                              │
│  # Output: libsql://soap-store-username.turso.io             │
│                                                               │
│  turso db tokens create soap-store                           │
│  # Output: eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVC...             │
│                                                               │
│  Step 5: Add to Environment                                  │
│  ───────────────────────────────────                         │
│  TURSO_DATABASE_URL=libsql://soap-store-username.turso.io    │
│  TURSO_AUTH_TOKEN=eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVC...      │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### Local Development Option

```
┌──────────────────────────────────────────────────────────────┐
│  LOCAL SQLITE (for offline development)                       │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  For local development without Turso, you can use:           │
│                                                               │
│  TURSO_DATABASE_URL=file:./local.db                          │
│  # No auth token needed for local files                      │
│                                                               │
│  This creates a local SQLite file for testing.               │
│  Switch to Turso URL when deploying!                         │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 💳 Stripe Integration Architecture

### Payment Flow

```
    ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
    │  Cart   │────▶│Checkout │────▶│ Stripe  │────▶│ Webhook │
    │  Page   │     │ Session │     │ Payment │     │ Handler │
    └─────────┘     └─────────┘     └─────────┘     └─────────┘
         │               │               │               │
         │               │               │               ▼
         │               │               │         ┌─────────┐
         │               │               └────────▶│  Order  │
         │               │                         │ Created │
         │               │                         └─────────┘
         │               │                              │
         └───────────────┴──────────────────────────────┘
                            State Updates
```

### API Endpoints

```
/api/
├── stripe/
│   ├── checkout        POST   # Create checkout session
│   ├── webhook         POST   # Handle Stripe webhooks
│   └── verify          GET    # Verify Stripe connection
│
├── inngest             POST   # Inngest function handler
│                              # Handles all async events
│
├── brevo/
│   └── webhook         POST   # Brevo delivery/bounce webhooks
│
└── auth/
    ├── login           POST   # User authentication
    ├── register        POST   # User registration
    ├── logout          POST   # Session termination
    └── me              GET    # Current user info
```

---

## 🔄 Server Functions (TanStack Start)

```typescript
// The patterns we'll use throughout

// 🎯 Pattern 1: Data Fetching
export const getProducts = createServerFn({ method: 'GET' })
  .handler(async () => {
    return db.select().from(products).where(eq(products.inStock, true));
  });

// 🎯 Pattern 2: Mutations with Validation
export const createOrder = createServerFn({ method: 'POST' })
  .validator(orderSchema)
  .handler(async ({ data }) => {
    return db.insert(orders).values(data).returning();
  });

// 🎯 Pattern 3: Protected Actions
export const getDashboardData = createServerFn({ method: 'GET' })
  .handler(async () => {
    await requireStripeConfig();  // Gate check
    return db.select().from(orders).orderBy(desc(orders.createdAt));
  });
```

---

## 🚀 App Startup Sequence

```
┌─────────────────────────────────────────────────────────────┐
│  BOOT SEQUENCE                                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Check environment variables                              │
│     ├── TURSO_*, STRIPE_*, BREVO_*, INNGEST_*, SESSION_*   │
│     ├── If missing: Redirect to /install                    │
│     └── If present: Continue                                │
│                                                              │
│  2. Initialize Turso connection                              │
│     ├── If fails: Show database error                       │
│     └── If success: Run pending migrations                  │
│                                                              │
│  3. Verify Stripe connection                                 │
│     ├── If fails: Block dashboard access                    │
│     └── If success: Continue                                │
│                                                              │
│  4. Initialize Brevo client                                  │
│     ├── If fails: Log warning (non-blocking)               │
│     └── If success: Email ready                             │
│                                                              │
│  5. Register Inngest functions                               │
│     ├── /api/inngest endpoint available                     │
│     └── All event handlers ready                            │
│                                                              │
│  6. Ready to serve! 🧼                                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 💳 Stripe Setup Guide

```
┌──────────────────────────────────────────────────────────────┐
│  STRIPE SETUP                                                  │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Step 1: Create Stripe Account                                │
│  ───────────────────────────────────                         │
│  1. Go to https://dashboard.stripe.com                        │
│  2. Sign up or log in                                         │
│  3. Complete account verification                             │
│                                                               │
│  Step 2: Get API Keys                                         │
│  ───────────────────────────────────                         │
│  1. Go to Developers → API Keys                               │
│  2. Copy "Publishable key" → STRIPE_PUBLIC_KEY               │
│  3. Copy "Secret key" → STRIPE_SECRET_KEY                    │
│  Note: Use test keys (pk_test_, sk_test_) for development    │
│                                                               │
│  Step 3: Set Up Webhooks (Local Development)                  │
│  ───────────────────────────────────                         │
│  1. Install Stripe CLI: brew install stripe/stripe-cli/stripe │
│  2. Login: stripe login                                       │
│  3. Forward webhooks:                                         │
│     stripe listen --forward-to localhost:3000/api/stripe/webhook
│  4. Copy the webhook signing secret → STRIPE_WEBHOOK_SECRET  │
│                                                               │
│  Step 4: Set Up Webhooks (Production)                         │
│  ───────────────────────────────────                         │
│  1. Go to Developers → Webhooks                               │
│  2. Add endpoint: https://yourdomain.com/api/stripe/webhook  │
│  3. Select events: checkout.session.completed,               │
│     payment_intent.succeeded, etc.                           │
│  4. Copy signing secret → STRIPE_WEBHOOK_SECRET              │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 📧 Brevo Setup Guide

```
┌──────────────────────────────────────────────────────────────┐
│  BREVO EMAIL SETUP                                            │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Brevo (formerly Sendinblue) handles transactional emails:   │
│  • Order confirmations                                        │
│  • Shipping notifications                                     │
│  • Welcome sequences                                          │
│                                                               │
│  Step 1: Create Brevo Account                                 │
│  ───────────────────────────────────                         │
│  1. Go to https://www.brevo.com                               │
│  2. Sign up (free tier: 300 emails/day)                       │
│  3. Verify your email address                                 │
│                                                               │
│  Step 2: Get API Key                                          │
│  ───────────────────────────────────                         │
│  1. Go to Settings → API Keys (or SMTP & API)                 │
│  2. Click "Generate a new API key"                            │
│  3. Name it (e.g., "Soap Store")                              │
│  4. Copy immediately → BREVO_API_KEY                         │
│     (Only shown once!)                                        │
│                                                               │
│  Step 3: Configure Sender                                     │
│  ───────────────────────────────────                         │
│  1. Go to Settings → Senders & IP                             │
│  2. Add sender email (e.g., hello@karenssoap.com)            │
│  3. Verify the domain or email address                        │
│                                                               │
│  Step 4: Create Email Templates                               │
│  ───────────────────────────────────                         │
│  Create these templates in Brevo dashboard:                   │
│  • Template 1: Welcome Email                                  │
│  • Template 2: Order Confirmation                             │
│  • Template 3: Shipping Notification                          │
│  • Template 4: Order Delivered                                │
│  • Template 5: Order Cancelled                                │
│  Note template IDs and update src/lib/brevo.ts               │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## ⚡ Inngest Setup Guide

```
┌──────────────────────────────────────────────────────────────┐
│  INNGEST SETUP - Background Jobs & Events                     │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Inngest handles async operations:                            │
│  • Order fulfillment workflows                                │
│  • Email sequences with delays                                │
│  • Webhook processing                                         │
│                                                               │
│  Step 1: Create Inngest Account                               │
│  ───────────────────────────────────                         │
│  1. Go to https://www.inngest.com                             │
│  2. Sign up (generous free tier)                              │
│  3. Create a new app                                          │
│                                                               │
│  Step 2: Get Keys                                             │
│  ───────────────────────────────────                         │
│  1. Go to your app's settings                                 │
│  2. Copy Signing Key → INNGEST_SIGNING_KEY                   │
│  3. Copy Event Key → INNGEST_EVENT_KEY                       │
│                                                               │
│  Step 3: Local Development                                    │
│  ───────────────────────────────────                         │
│  Run the Inngest dev server alongside your app:               │
│                                                               │
│  npx inngest-cli@latest dev                                   │
│                                                               │
│  This opens http://localhost:8288 for testing                 │
│  No signing key needed for local dev!                         │
│                                                               │
│  Step 4: Production                                           │
│  ───────────────────────────────────                         │
│  1. Deploy your app with the /api/inngest endpoint            │
│  2. In Inngest dashboard, add your production URL             │
│  3. Inngest will discover and sync your functions             │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔐 Session Secret

```
┌──────────────────────────────────────────────────────────────┐
│  SESSION_SECRET                                               │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Generate a random 32+ character string:                      │
│                                                               │
│  Option 1: Use OpenSSL                                        │
│  openssl rand -base64 32                                      │
│                                                               │
│  Option 2: Use Node.js                                        │
│  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
│                                                               │
│  Option 3: Use an online generator                            │
│  (Just make sure it's cryptographically secure!)              │
│                                                               │
│  Add to environment:                                          │
│  SESSION_SECRET=your-random-string-here                       │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

*"In my database, there are no records. Only dreams... and users, and orders, and payment methods."* - Ralph, probably
