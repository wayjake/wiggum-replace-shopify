# 🚧 Constraints & Guardrails

```
     ┌───────────────────────────────────────────────────────┐
     │  "The leprechaun tells me to burn things..."          │
     │                                                        │
     │  Ralph, these are the things you CANNOT burn.         │
     └───────────────────────────────────────────────────────┘
```

---

## 🔴 Hard Rules (Non-Negotiable)

### 1. Environment Variable Security

```
┌──────────────────────────────────────────────────────────────┐
│  NEVER DO THESE THINGS                                        │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ❌ Hardcode API keys in source code                         │
│  ❌ Commit .env files to version control                     │
│  ❌ Expose secret keys to the client/browser                 │
│  ❌ Log sensitive values in console                          │
│  ❌ Include secrets in error messages                        │
│                                                               │
│  ALWAYS DO THESE THINGS                                       │
│  ─────────────────────────────────────                       │
│  ✅ Use server-only functions for secret access              │
│  ✅ Prefix client-safe vars with VITE_ or PUBLIC_            │
│  ✅ Validate env vars exist before using them                │
│  ✅ Use .env.example for documentation (no real values)      │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 2. Stripe Integration Rules

```typescript
// 🚨 THE STRIPE COMMANDMENTS 🚨

// 1. NEVER store raw card data
// ❌ const card = { number: '4242...', cvv: '123' }
// ✅ Use Stripe Elements or Checkout Sessions

// 2. ALWAYS verify webhooks
const event = stripe.webhooks.constructEvent(
  payload,
  sig,
  process.env.STRIPE_WEBHOOK_SECRET!  // ← This is required
);

// 3. NEVER trust client-side payment amounts
// ❌ await stripe.checkout({ amount: req.body.amount })
// ✅ Calculate totals server-side from cart contents

// 4. ALWAYS use idempotency keys for mutations
await stripe.charges.create({
  ...chargeData,
}, {
  idempotencyKey: orderId,  // ← Prevents duplicate charges
});
```

### 3. Database Constraints

```
┌──────────────────────────────────────────────────────────────┐
│  DRIZZLE + TURSO RULES                                        │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Migrations:                                                  │
│  ─────────────────────────────────────                       │
│  • ALWAYS generate migrations, never write by hand           │
│  • NEVER edit generated migration files                      │
│  • Run migrations at app startup in production               │
│  • Test migrations locally before deploying                  │
│                                                               │
│  Queries:                                                     │
│  ─────────────────────────────────────                       │
│  • Use Drizzle's query builder, not raw SQL                  │
│  • Use transactions for multi-table operations               │
│  • Index columns used in WHERE clauses                       │
│                                                               │
│  Schema Changes:                                              │
│  ─────────────────────────────────────                       │
│  • Prefer additive changes over destructive                  │
│  • Soft delete (isDeleted flag) > hard delete                │
│  • Version your schema exports for breaking changes          │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 🟡 Soft Rules (Strong Preferences)

### UI/UX Constraints

```
┌──────────────────────────────────────────────────────────────┐
│  DESIGN SYSTEM RULES                                          │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Components:                                                  │
│  ─────────────────────────────────────                       │
│  • Create shared components for repeated patterns            │
│  • Buttons, inputs, cards → all should be components         │
│  • Use the cn() utility for conditional classes              │
│                                                               │
│  Styling:                                                     │
│  ─────────────────────────────────────                       │
│  • Tailwind first, inline styles only when necessary         │
│  • Stick to the brand color palette (soap.* tokens)          │
│  • Mobile-first responsive design                            │
│                                                               │
│  Accessibility:                                               │
│  ─────────────────────────────────────                       │
│  • All images need alt text                                  │
│  • Interactive elements need focus states                    │
│  • Color alone should not convey information                 │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### TypeScript Preferences

```typescript
// ✅ DO: Infer types where possible
const { products } = useLoaderData<typeof loader>();

// ❌ DON'T: Over-type with React.FC
const ProductCard: React.FC<Props> = ...

// ✅ DO: Define Props at bottom of file
export function ProductCard({ name, price, image }: Props) { ... }

type Props = {
  name: string;
  price: number;
  image: string;
};

// ✅ DO: Use Zod for runtime validation
const productSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
});
```

---

## 🔐 Access Control Matrix

```
┌─────────────────────────────────────────────────────────────┐
│  ROUTE ACCESS CONTROL                                        │
├──────────────────┬──────────────────────────────────────────┤
│  Route           │  Access Requirements                     │
├──────────────────┼──────────────────────────────────────────┤
│  /               │  Public                                  │
│  /shop           │  Public                                  │
│  /shop/:id       │  Public                                  │
│  /cart           │  Public                                  │
│  /checkout       │  Requires Stripe config                  │
│  /install        │  Show only when env vars missing         │
│  /login          │  Public (redirect if logged in)          │
│  /register       │  Public (redirect if logged in)          │
│  /account/*      │  🔒 Authenticated (customer or admin)    │
│  /admin/*        │  🔒 Admin role only                      │
├──────────────────┴──────────────────────────────────────────┤
│                                                              │
│  Gate Logic (order matters!):                               │
│  ─────────────────────────────────────                      │
│  1. if (!envVarsPresent)   → /install                       │
│  2. if (!authenticated)    → /login (for protected routes)  │
│  3. if (role !== 'admin')  → /account (for /admin/* routes) │
│  4. if (stripeVerified)    → full access to role's portal   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### User Role Permissions

```
┌──────────────────────────────────────────────────────────────┐
│  ROLE-BASED PERMISSIONS                                       │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  👤 CUSTOMER PERMISSIONS                                     │
│  ─────────────────────────────────────                       │
│  ✅ Browse and purchase products                             │
│  ✅ View own order history                                   │
│  ✅ Manage own payment methods                               │
│  ✅ Update own shipping addresses                            │
│  ✅ Update own profile                                       │
│  ❌ Cannot access /admin/* routes                            │
│  ❌ Cannot view other users' data                            │
│  ❌ Cannot modify products or settings                       │
│                                                               │
│  🔑 ADMIN PERMISSIONS                                        │
│  ─────────────────────────────────────                       │
│  ✅ All customer permissions                                 │
│  ✅ Full product CRUD (create, read, update, delete)         │
│  ✅ View and manage all orders                               │
│  ✅ Mark orders as shipped (triggers Inngest)                │
│  ✅ View customer list and details                           │
│  ✅ Modify store settings                                    │
│  ✅ Access analytics and reporting                           │
│  ❌ Cannot delete customer accounts (soft delete only)       │
│  ❌ Cannot modify Stripe/Brevo/Inngest keys via UI           │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 📧 Email & Async Event Rules

```
┌──────────────────────────────────────────────────────────────┐
│  BREVO EMAIL RULES                                            │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ✅ DO THESE THINGS                                          │
│  ─────────────────────────────────────                       │
│  • Use transactional templates for order-related emails      │
│  • Include unsubscribe links in marketing emails             │
│  • Validate email addresses before sending                   │
│  • Log all email send attempts and results                   │
│  • Use template IDs from constants, never hardcode           │
│  • Rate limit email sending (Brevo has daily limits)         │
│                                                               │
│  ❌ NEVER DO THESE THINGS                                    │
│  ─────────────────────────────────────                       │
│  • Send marketing emails without explicit consent            │
│  • Expose Brevo API key to client                            │
│  • Send emails synchronously in request handlers             │
│  • Include sensitive data in email logs                      │
│  • Ignore Brevo webhook delivery failures                    │
│                                                               │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  INNGEST EVENT RULES                                          │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ✅ DO THESE THINGS                                          │
│  ─────────────────────────────────────                       │
│  • Use step.run() for operations that should be retried      │
│  • Use step.sleep() for scheduled delays (not setTimeout)    │
│  • Include all necessary data in event payload               │
│  • Use idempotent operations (safe to retry)                 │
│  • Name events with namespace: 'shop/order.completed'        │
│  • Log function start/completion for debugging               │
│                                                               │
│  ❌ NEVER DO THESE THINGS                                    │
│  ─────────────────────────────────────                       │
│  • Rely on external state that might change between steps    │
│  • Use step.run() for non-idempotent operations              │
│  • Expose Inngest keys to client                             │
│  • Trigger infinite event loops                              │
│  • Block on synchronous operations in handlers               │
│                                                               │
│  💡 DRIP CAMPAIGN LIMITS                                     │
│  ─────────────────────────────────────                       │
│  • Max 10 emails per drip sequence                           │
│  • Minimum 1 day between emails (respect inbox)              │
│  • Always check if user has unsubscribed before sending      │
│  • Include easy unsubscribe in every drip email              │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 📦 Dependency Constraints

### Required Packages

```json
{
  "dependencies": {
    "drizzle-orm": "^0.35.x",
    "@libsql/client": "^0.14.x",
    "stripe": "^17.x",
    "zod": "^3.x",
    "@sendinblue/client": "^3.x",
    "inngest": "^3.x"
  },
  "devDependencies": {
    "drizzle-kit": "^0.28.x"
  }
}
```

### Forbidden Patterns

```
┌──────────────────────────────────────────────────────────────┐
│  THINGS WE DON'T DO HERE                                      │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ❌ No Redux (TanStack Start has its own state patterns)     │
│  ❌ No Prisma (we're using Drizzle)                          │
│  ❌ No traditional ORMs with heavy abstraction               │
│  ❌ No CSS-in-JS libraries (Tailwind only)                   │
│  ❌ No jQuery (it's 2024, come on)                           │
│  ❌ No localStorage for sensitive data                       │
│  ❌ No client-side only routing (SSR is enabled)             │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## ⏱️ Performance Budgets

```
┌──────────────────────────────────────────────────────────────┐
│  PERFORMANCE TARGETS                                          │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Page Load:                                                   │
│  ─────────────────────────────────────                       │
│  • First Contentful Paint: < 1.5s                            │
│  • Largest Contentful Paint: < 2.5s                          │
│  • Time to Interactive: < 3s                                 │
│                                                               │
│  Bundle Size:                                                 │
│  ─────────────────────────────────────                       │
│  • Initial JS bundle: < 150kb gzipped                        │
│  • CSS: < 30kb gzipped                                       │
│                                                               │
│  Database:                                                    │
│  ─────────────────────────────────────                       │
│  • Query response time: < 100ms (p95)                        │
│  • Connection pool: Use connection pooling                   │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔍 Error Handling Standards

```typescript
// ✅ Proper error handling pattern

// 1. Define error types
class StripeNotConfiguredError extends Error {
  code = 'STRIPE_NOT_CONFIGURED';
}

class DatabaseConnectionError extends Error {
  code = 'DATABASE_CONNECTION_FAILED';
}

// 2. Handle gracefully
try {
  await db.select().from(products);
} catch (error) {
  if (error instanceof LibsqlError) {
    throw new DatabaseConnectionError('Could not connect to Turso');
  }
  throw error;  // Re-throw unknown errors
}

// 3. Show user-friendly messages
// ❌ "Error: SQLITE_CANTOPEN: unable to open database file"
// ✅ "We're having trouble connecting to our database. Please try again."
```

---

*"Me fail constraints? That's unpossible!"*
