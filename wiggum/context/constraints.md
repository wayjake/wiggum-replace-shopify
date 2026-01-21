# 🚧 Constraints & Guardrails

```
     ┌───────────────────────────────────────────────────────┐
     │  "The leprechaun tells me to burn things..."          │
     │                                                        │
     │  Ralph, these are the things you CANNOT burn.         │
     │  Especially when dealing with children's data.        │
     └───────────────────────────────────────────────────────┘
```

---

## 🔴 Hard Rules (Non-Negotiable)

### 1. Student Data Protection (FERPA Compliance)

```
┌──────────────────────────────────────────────────────────────┐
│  STUDENT DATA IS SACRED                                       │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ❌ NEVER log student PII (names, DOB, grades)               │
│  ❌ NEVER expose student data to unauthorized guardians      │
│  ❌ NEVER share student records across schools               │
│  ❌ NEVER retain data longer than required                   │
│  ❌ NEVER store student data in client-side storage          │
│                                                               │
│  ✅ ALWAYS verify guardian-student relationship              │
│  ✅ ALWAYS use role-based access control                     │
│  ✅ ALWAYS encrypt data at rest and in transit               │
│  ✅ ALWAYS audit access to student records                   │
│  ✅ ALWAYS allow data export for parent requests             │
│                                                               │
│  CUSTODY AWARENESS:                                          │
│  ─────────────────────────────────────                       │
│  • Parents may have restricted access rights                 │
│  • Court orders may limit data visibility                    │
│  • Split custody means split data access                     │
│  • Schools define who can view what for each student         │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 2. Environment Variable Security

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

### 3. Payment Security (PCI Compliance)

```typescript
// 🚨 THE TUITION PAYMENT COMMANDMENTS 🚨

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
// ✅ Calculate tuition from enrollment records server-side

// 4. ALWAYS use idempotency keys for payments
await stripe.paymentIntents.create({
  ...paymentData,
}, {
  idempotencyKey: `${householdId}-${schoolYear}-${paymentDue}`,
});

// 5. NEVER charge a household without verification
// ✅ Verify the guardian belongs to the household
// ✅ Verify the household owes the amount
// ✅ Verify payment method belongs to the household
```

### 4. Database Constraints

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
│  • ALWAYS filter by school_id for multi-tenant safety        │
│                                                               │
│  Schema Changes:                                              │
│  ─────────────────────────────────────                       │
│  • Prefer additive changes over destructive                  │
│  • Soft delete (is_deleted flag) > hard delete               │
│  • Version your schema exports for breaking changes          │
│  • School data isolation is mandatory                        │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 🟡 Soft Rules (Strong Preferences)

### UI/UX Constraints (School-Appropriate)

```
┌──────────────────────────────────────────────────────────────┐
│  DESIGN SYSTEM RULES                                          │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Visual Trust Principles:                                    │
│  ─────────────────────────────────────                       │
│  • No playful illustrations (this is school money)           │
│  • No animated gradients or glassmorphism                    │
│  • No neon colors or "startup vibes"                         │
│  • Muted status colors (not alarm red/neon green)            │
│  • Academic serif headings (Libre Baskerville)               │
│  • Clean sans-serif body (Inter)                             │
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
│  • Stick to the trust color palette                          │
│  • Mobile-first responsive design                            │
│  • Parents access on phones 60%+ of the time                 │
│                                                               │
│  Accessibility:                                               │
│  ─────────────────────────────────────                       │
│  • All images need alt text                                  │
│  • Interactive elements need focus states                    │
│  • Color alone should not convey information                 │
│  • Parents may have accessibility needs                      │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### TypeScript Preferences

```typescript
// ✅ DO: Infer types where possible
const { students } = useLoaderData<typeof loader>();

// ❌ DON'T: Over-type with React.FC
const StudentCard: React.FC<Props> = ...

// ✅ DO: Define Props at bottom of file
export function StudentCard({ name, grade, status }: Props) { ... }

type Props = {
  name: string;
  grade: number;
  status: EnrollmentStatus;
};

// ✅ DO: Use Zod for runtime validation
const applicationSchema = z.object({
  studentId: z.string().cuid2(),
  guardianId: z.string().cuid2(),
  schoolYear: z.string().regex(/^\d{4}-\d{4}$/),
});

// ✅ DO: Validate household relationships
const guardianHouseholdSchema = z.object({
  guardianId: z.string().cuid2(),
  householdId: z.string().cuid2(),
}).refine(
  async (data) => await verifyGuardianBelongsToHousehold(data),
  'Guardian does not belong to this household'
);
```

---

## 🔐 Access Control Matrix

```
┌─────────────────────────────────────────────────────────────┐
│  ROUTE ACCESS CONTROL                                        │
├──────────────────┬──────────────────────────────────────────┤
│  Route           │  Access Requirements                     │
├──────────────────┼──────────────────────────────────────────┤
│  /               │  Public (marketing landing page)         │
│  /pricing        │  Public                                  │
│  /about          │  Public                                  │
│  /login          │  Public (redirect if logged in)          │
│  /install        │  Show only when env vars missing         │
│  /apply          │  Public (embeddable inquiry form)        │
│  /portal/*       │  🔒 Authenticated guardian only          │
│  /admin/*        │  🔒 School admin role only               │
│  /admin/billing  │  🔒 Admin + Stripe configured            │
├──────────────────┴──────────────────────────────────────────┤
│                                                              │
│  Gate Logic (order matters!):                               │
│  ─────────────────────────────────────                      │
│  1. if (!envVarsPresent)      → /install                    │
│  2. if (!authenticated)       → /login (protected routes)   │
│  3. if (role === 'guardian')  → /portal/* only              │
│  4. if (role === 'admin')     → /admin/* + /portal/*        │
│  5. if (!stripeConfigured)    → block billing features      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### User Role Permissions

```
┌──────────────────────────────────────────────────────────────┐
│  ROLE-BASED PERMISSIONS                                       │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  👤 GUARDIAN PERMISSIONS                                     │
│  ─────────────────────────────────────                       │
│  ✅ View own household's students                            │
│  ✅ View and pay household invoices                          │
│  ✅ Submit and track applications                            │
│  ✅ Sign enrollment contracts                                │
│  ✅ Update own contact information                           │
│  ✅ Manage household payment methods                         │
│  ✅ Download receipts and statements                         │
│  ❌ Cannot access /admin/* routes                            │
│  ❌ Cannot view other households' data                       │
│  ❌ Cannot view students outside their household             │
│                                                               │
│  🔑 ADMIN PERMISSIONS                                        │
│  ─────────────────────────────────────                       │
│  ✅ View all leads, applications, enrollments                │
│  ✅ Update application status (accept/decline)               │
│  ✅ Manage all students and households                       │
│  ✅ View and manage all billing/payments                     │
│  ✅ Create and send communications                           │
│  ✅ Configure school settings                                │
│  ✅ Access analytics and reports                             │
│  ✅ Export data (CSV, reports)                               │
│  ❌ Cannot delete student records (soft delete only)         │
│  ❌ Cannot modify env vars via UI                            │
│  ❌ Cannot access other schools' data (multi-tenant)         │
│                                                               │
│  🎓 SUPER ADMIN (Platform Owner)                             │
│  ─────────────────────────────────────                       │
│  ✅ All admin permissions                                    │
│  ✅ Create new schools                                       │
│  ✅ Manage platform settings                                 │
│  ✅ View cross-school analytics                              │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 🏠 Household & Guardian Rules

```
┌──────────────────────────────────────────────────────────────┐
│  HOUSEHOLD DATA ACCESS RULES                                  │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Guardian → Household Verification:                          │
│  ─────────────────────────────────────                       │
│  • Guardian can only view households they belong to          │
│  • Guardian can only pay invoices for their households       │
│  • Guardian can only view students in their households       │
│                                                               │
│  Household → Student Verification:                           │
│  ─────────────────────────────────────                       │
│  • Household can only see students linked to it              │
│  • Billing percentage must sum to 100% across households     │
│  • Primary household determines primary contact              │
│                                                               │
│  Split Custody Rules:                                        │
│  ─────────────────────────────────────                       │
│  • Each household sees only their portion of billing         │
│  • Student data visible to both (unless restricted)          │
│  • Admins can set access restrictions per guardian           │
│  • Court-ordered restrictions must be honored                │
│                                                               │
│  Verification Pattern:                                       │
│  ─────────────────────────────────────                       │
│  async function verifyGuardianAccess(                        │
│    guardianId: string,                                       │
│    resourceType: 'student' | 'household' | 'invoice',        │
│    resourceId: string                                        │
│  ) {                                                         │
│    // ALWAYS verify before returning data                    │
│    const hasAccess = await checkRelationship(...)            │
│    if (!hasAccess) throw new ForbiddenError()               │
│  }                                                           │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 🪄 Magic Link Authentication Rules

```
┌──────────────────────────────────────────────────────────────┐
│  MAGIC LINK SECURITY RULES                                    │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Token Generation:                                            │
│  ─────────────────────────────────────                       │
│  • Use crypto.randomBytes(32) for secure tokens              │
│  • Tokens expire after 15 minutes (configurable)             │
│  • One token per email request (invalidate old tokens)       │
│  • Store tokens hashed if extra paranoid (optional)          │
│                                                               │
│  Token Verification:                                          │
│  ─────────────────────────────────────                       │
│  • Check expiry BEFORE checking validity                     │
│  • Mark token as used immediately after verification         │
│  • Tokens are single-use (usedAt timestamp)                  │
│  • Delete or expire old tokens periodically (cleanup job)    │
│                                                               │
│  Rate Limiting:                                               │
│  ─────────────────────────────────────                       │
│  • Max 5 magic link requests per email per hour              │
│  • Add delay between requests to prevent timing attacks      │
│  • Log failed verification attempts                          │
│                                                               │
│  UX Considerations:                                           │
│  ─────────────────────────────────────                       │
│  • Clear messaging: "Check your email for a sign-in link"   │
│  • Same message whether email exists or not (security)       │
│  • Link works on any device (creates new session)            │
│  • Show "resend" option after 60 seconds                     │
│  • Parents may not check email immediately—be patient        │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 📧 Email & Communication Rules

```
┌──────────────────────────────────────────────────────────────┐
│  BREVO EMAIL RULES                                            │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ✅ DO THESE THINGS                                          │
│  ─────────────────────────────────────                       │
│  • Use transactional templates for school communications     │
│  • Validate email addresses before sending                   │
│  • Log all email send attempts and results                   │
│  • Use template IDs from constants, never hardcode           │
│  • Rate limit email sending (Brevo has daily limits)         │
│  • Include school name in sender                             │
│                                                               │
│  ❌ NEVER DO THESE THINGS                                    │
│  ─────────────────────────────────────                       │
│  • Send marketing without explicit consent                   │
│  • Expose Brevo API key to client                            │
│  • Send emails synchronously in request handlers             │
│  • Include sensitive student data in email logs              │
│  • CC both divorced parents on same email (use BCC or split) │
│                                                               │
│  CUSTODY-AWARE COMMUNICATION:                                │
│  ─────────────────────────────────────                       │
│  • Check communication preferences per guardian              │
│  • Honor "do not contact" flags                              │
│  • Billing emails go to household, not student               │
│  • Academic emails may need to go to both households         │
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
│  • Name events: 'school/application.accepted'                │
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
│  💡 PAYMENT REMINDER LIMITS                                  │
│  ─────────────────────────────────────                       │
│  • Max 3 payment reminders per due date                      │
│  • First reminder: 7 days before due                         │
│  • Second reminder: 1 day before due                         │
│  • Third reminder: Day after due (if still unpaid)           │
│  • After 30 days late: Admin notification only               │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 💰 Billing & Financial Rules

```
┌──────────────────────────────────────────────────────────────┐
│  TUITION BILLING RULES                                        │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Amount Calculation:                                          │
│  ─────────────────────────────────────                       │
│  • ALWAYS calculate from enrollment records                  │
│  • NEVER trust client-submitted amounts                      │
│  • Apply discounts server-side only                          │
│  • Split billing respects custody percentages exactly        │
│  • Round to nearest cent (banker's rounding)                 │
│                                                               │
│  Payment Processing:                                          │
│  ─────────────────────────────────────                       │
│  • Verify household owns the payment method                  │
│  • Verify amount matches outstanding balance                 │
│  • Record payment immediately after Stripe confirms          │
│  • Use webhooks, not redirect callbacks, for recording       │
│  • Handle partial payments (apply to oldest balance first)   │
│                                                               │
│  Refunds & Adjustments:                                       │
│  ─────────────────────────────────────                       │
│  • Refunds require admin approval                            │
│  • All adjustments must have a reason logged                 │
│  • Credits appear as negative charges in ledger              │
│  • Large refunds (>$1000) need super-admin approval          │
│                                                               │
│  Audit Trail:                                                 │
│  ─────────────────────────────────────                       │
│  • Every ledger entry is immutable                           │
│  • Corrections are new entries, not edits                    │
│  • Log who made each change and when                         │
│  • Keep records for 7 years minimum                          │
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
│  ❌ No jQuery (it's 2024+, come on)                          │
│  ❌ No localStorage for sensitive data                       │
│  ❌ No localStorage for student/guardian data                │
│  ❌ No client-side only routing (SSR is enabled)             │
│  ❌ No playful animations (this handles tuition)             │
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
│  Page Load (Parents on Mobile):                              │
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
│  Critical Paths:                                              │
│  ─────────────────────────────────────                       │
│  • Payment page load: < 2s                                   │
│  • Invoice display: < 1s                                     │
│  • Application form: Progressive loading                     │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔍 Error Handling Standards

```typescript
// ✅ Proper error handling pattern for schools

// 1. Define domain-specific error types
class GuardianNotAuthorizedError extends Error {
  code = 'GUARDIAN_NOT_AUTHORIZED';
}

class StudentNotInHouseholdError extends Error {
  code = 'STUDENT_NOT_IN_HOUSEHOLD';
}

class PaymentAmountMismatchError extends Error {
  code = 'PAYMENT_AMOUNT_MISMATCH';
}

// 2. Handle gracefully with audit logging
try {
  await verifyGuardianAccess(guardianId, 'student', studentId);
} catch (error) {
  if (error instanceof GuardianNotAuthorizedError) {
    // Log the attempt (security audit)
    await logSecurityEvent({
      type: 'unauthorized_access_attempt',
      guardianId,
      targetResource: `student:${studentId}`,
      timestamp: new Date(),
    });
    throw new ForbiddenError('You do not have access to this student');
  }
  throw error;
}

// 3. Show user-friendly messages
// ❌ "Error: GUARDIAN_NOT_AUTHORIZED for student clxxxxxxx"
// ✅ "You don't have permission to view this student's information."

// ❌ "Error: PAYMENT_INTENT_FAILED with code insufficient_funds"
// ✅ "This payment couldn't be processed. Please try a different payment method."
```

---

## 🏫 School-Year Boundaries

```
┌──────────────────────────────────────────────────────────────┐
│  SCHOOL YEAR RULES                                            │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Data Isolation by School Year:                              │
│  ─────────────────────────────────────                       │
│  • Enrollments are per school year                           │
│  • Tuition charges are per school year                       │
│  • Applications are per school year                          │
│  • Students may have different status each year              │
│                                                               │
│  Year Format:                                                 │
│  ─────────────────────────────────────                       │
│  • Use "2024-2025" format (not "2024" or "2024/25")          │
│  • Store as string, not date                                 │
│  • Current year determined by school settings                │
│                                                               │
│  Re-enrollment Window:                                       │
│  ─────────────────────────────────────                       │
│  • Schools set their own re-enrollment dates                 │
│  • Returning families get priority window                    │
│  • Don't auto-create next year's enrollment                  │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

*"Me fail constraints? That's unpossible!"*
