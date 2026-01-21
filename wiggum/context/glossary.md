# 📚 Glossary of Terms

```
     ╔═══════════════════════════════════════════════════════╗
     ║  "What's a battle?"                                    ║
     ║                        - Ralph, asking the real questions
     ║                                                         ║
     ║  This glossary helps you understand school systems.    ║
     ╚═══════════════════════════════════════════════════════╝
```

---

## 🏫 School & Education Terms

### Admissions & Enrollment

| Term | Definition |
|------|------------|
| **Admissions** | The process of accepting new students to the school. Includes inquiry, application, review, and acceptance. |
| **Lead** | A prospective family that has expressed interest but hasn't applied yet. |
| **Inquiry** | First contact from a prospective family. Usually captured via a web form. |
| **Pipeline** | The stages a lead moves through: Inquiry → Tour → Applied → Accepted → Enrolled → Lost |
| **Application** | Formal request to enroll, including student info, essays, documents, and references. |
| **Acceptance** | School's decision to offer enrollment to an applicant. |
| **Waitlist** | Qualified applicants held pending space availability. |
| **Enrollment** | Confirmed registration for a school year. Includes signed contract and deposit. |
| **Re-enrollment** | Annual process for returning students to confirm attendance for next year. |
| **Enrollment Contract** | Legal agreement between school and family outlining terms, tuition, and policies. |
| **Enrollment Deposit** | Non-refundable payment to secure a student's spot. |

### School Structure

| Term | Definition |
|------|------------|
| **School Year** | Academic calendar period, formatted as "2024-2025". Runs August to May for most schools. |
| **Grade Level** | Student's academic year (9th, 10th, 11th, 12th for high school). |
| **Term** | Division of school year (semester, trimester, quarter). |
| **SIS** | Student Information System. Software managing student records, grades, attendance. We're building one. |
| **FERPA** | Federal law protecting student education records. We must comply. |

### People & Roles

| Term | Definition |
|------|------------|
| **Student** | A child enrolled or applying to the school. |
| **Guardian** | Parent or legal guardian responsible for a student. Has login access. |
| **Household** | A billing unit containing guardians and students. One household = one bill. |
| **Head of School** | Chief administrator. Key decision-maker for software purchases. |
| **Director of Admissions** | Leads the admissions process. Primary user of lead/application features. |
| **Business Manager** | Handles finances including tuition. Primary user of billing features. |
| **Registrar** | Manages student records and enrollment documentation. |

### Custody & Family Structure

| Term | Definition |
|------|------------|
| **Primary Household** | The main household for a student (receives most communications). |
| **Split Custody** | When divorced/separated parents share a child. Student belongs to multiple households. |
| **Billing Percentage** | Each household's share of tuition (must sum to 100% per student). |
| **Court Order** | Legal document that may restrict a guardian's access to student info. |

---

## 💰 Financial Terms

### Tuition & Billing

| Term | Definition |
|------|------------|
| **Tuition** | Annual fee for attending the school. Our platform's core billing item. |
| **Tuition Plan** | Payment schedule: annual (1 payment), semester (2), or monthly (10). |
| **Ledger** | Complete record of charges and payments for a household. |
| **Invoice** | Bill sent to household showing amount due. |
| **Statement** | Summary of account activity over a period. |
| **Balance** | Amount currently owed by a household. |
| **Credit** | Negative charge applied to reduce balance (refund, discount, adjustment). |
| **Adjustment** | Manual change to ledger (correction, write-off). Requires reason. |
| **Sibling Discount** | Tuition reduction for families with multiple enrolled children. |
| **Financial Aid** | Tuition assistance based on family need. (Phase 2 feature) |

### Payments

| Term | Definition |
|------|------------|
| **Payment Method** | Saved card or bank account for making payments. |
| **ACH** | Automated Clearing House. Bank transfer payment, lower fees than cards. |
| **Auto-pay** | Automatic charging of saved payment method on due dates. |
| **Payment Due Date** | When a payment must be made. Varies by tuition plan. |
| **Late Fee** | Additional charge for missed payment deadline. |
| **Payment Receipt** | Confirmation of payment sent to guardian. |

---

## 🛠️ Technology Terms

### TanStack Start

| Term | Definition |
|------|------------|
| **TanStack Start** | A full-stack React framework combining Vite, React SSR, and file-based routing. |
| **Server Function** | A function created with `createServerFn()` that runs only on the server but can be called from the client. |
| **Route Loader** | A function that fetches data before a route renders. Runs on server, data available instantly on client. |
| **File-based Routing** | Routes are defined by file structure. `/routes/admin/index.tsx` = `/admin` URL. |
| **SSR (Server-Side Rendering)** | HTML is generated on the server, sent to browser, then hydrated with React. |
| **Hydration** | The process where React "takes over" server-rendered HTML and makes it interactive. |

### Drizzle ORM

| Term | Definition |
|------|------------|
| **Drizzle** | A TypeScript ORM that's thin, type-safe, and SQL-like. |
| **Schema** | TypeScript files defining your database tables. Source of truth for your data model. |
| **Migration** | SQL files that track changes to your database structure over time. |
| **drizzle-kit** | CLI tool for generating migrations, pushing schema changes. |
| **Query Builder** | Drizzle's way of writing queries: `db.select().from(students).where(...)` |

### Turso

| Term | Definition |
|------|------------|
| **Turso** | A SQLite-at-the-edge database service. Global replication, low latency, serverless-friendly. |
| **libSQL** | The open-source fork of SQLite that Turso is built on. |
| **Database URL** | Connection string format: `libsql://your-db-name.turso.io` |
| **Auth Token** | JWT token for authenticating with your Turso database. |

### Stripe

| Term | Definition |
|------|------------|
| **Stripe** | Payment processing platform. Handles all tuition payments. |
| **Publishable Key** | Client-side key (starts with `pk_`). Safe to expose in browser. |
| **Secret Key** | Server-only key (starts with `sk_`). Never expose to client. |
| **Checkout Session** | A Stripe-hosted payment page. Redirect parents there for payments. |
| **Webhook** | HTTP callback from Stripe when events happen (payment succeeded, failed, etc.). |
| **Payment Intent** | Represents a customer's intent to pay. Tracks the lifecycle of a payment. |
| **Payment Method** | A saved card or bank account attached to a Stripe Customer. |
| **Stripe Customer** | A record in Stripe representing a household. Links to payment methods. |
| **Idempotency Key** | A unique string to prevent duplicate charges. Same key = same result. |

### Brevo (Email)

| Term | Definition |
|------|------------|
| **Brevo** | Email service (formerly Sendinblue). Handles all school communications. |
| **Transactional Email** | One-to-one emails triggered by actions (acceptance letters, receipts). Not marketing. |
| **Template ID** | Numeric identifier for a Brevo email template. |
| **Contact** | A person in your Brevo database (guardian's email). |
| **Sender** | The email address emails appear to come from. Must be verified. |

### Inngest (Event System)

| Term | Definition |
|------|------------|
| **Inngest** | Event-driven background job system. Handles async operations. |
| **Event** | A named occurrence that triggers functions. Format: `school/application.accepted` |
| **Function** | Code that runs in response to an event. |
| **Step** | A durable operation within a function. `step.run()` for code, `step.sleep()` for delays. |
| **Signing Key** | Secret key for verifying Inngest webhook authenticity. |
| **Dev Server** | Local Inngest server (`npx inngest-cli dev`) for testing. |

---

## 👥 User Roles & Authentication

### Roles

| Term | Definition |
|------|------------|
| **Guardian** | A parent/guardian who logs in to view students and pay tuition. |
| **Admin** | School staff with full access to admissions, billing, and student records. |
| **Super Admin** | Platform owner. Can manage multiple schools. |
| **Role** | Permission level stored in database, checked on protected routes. |

### Authentication

| Term | Definition |
|------|------------|
| **Magic Link** | A unique, time-limited URL sent via email that logs in when clicked. No password. |
| **Magic Token** | The secure random token in a magic link. Expires in 15 minutes. |
| **Session** | Server-side record linking a browser cookie to a guardian/admin. |
| **Auth Gate** | Middleware that checks authentication/role before allowing route access. |

---

## 📁 File & Route Conventions

### Route Patterns

```
┌──────────────────────────────────────────────────────────────┐
│  ROUTE PATTERNS                                               │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Public Routes:                                               │
│  ─────────────────────────────────────                       │
│  /               → Marketing landing page                    │
│  /pricing        → Pricing information                       │
│  /login          → Guardian/admin login                      │
│  /apply          → Public inquiry form                       │
│                                                               │
│  Guardian Portal (/portal/*):                                │
│  ─────────────────────────────────────                       │
│  /portal         → Dashboard (students, balances)            │
│  /portal/students/:id    → Student detail                    │
│  /portal/billing         → Invoices and payments             │
│  /portal/billing/pay     → Make a payment                    │
│  /portal/applications    → Track applications                │
│  /portal/settings        → Contact info, payment methods     │
│                                                               │
│  Admin Dashboard (/admin/*):                                 │
│  ─────────────────────────────────────                       │
│  /admin          → Admin dashboard                           │
│  /admin/leads    → Admissions pipeline                       │
│  /admin/applications     → Review applications               │
│  /admin/students         → All enrolled students             │
│  /admin/households       → Household management              │
│  /admin/billing          → Billing overview                  │
│  /admin/communications   → Email templates, bulk send        │
│  /admin/settings         → School configuration              │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### File Naming

```
┌──────────────────────────────────────────────────────────────┐
│  FILENAME PATTERNS                                            │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Routes:                                                      │
│  ─────────────────────────────────────                       │
│  index.tsx         → Index route for directory               │
│  __root.tsx        → Root layout (double underscore)         │
│  $studentId.tsx    → Dynamic segment ($ prefix)              │
│  layout.tsx        → Layout wrapper                          │
│                                                               │
│  Components:                                                  │
│  ─────────────────────────────────────                       │
│  Button.tsx        → PascalCase for components               │
│  StudentCard.tsx   → Descriptive component names             │
│  HouseholdBilling.tsx                                        │
│                                                               │
│  Database Schema:                                             │
│  ─────────────────────────────────────                       │
│  schema/households.ts    → Table definition files            │
│  schema/students.ts                                          │
│  schema/guardians.ts                                         │
│  schema/ledger.ts                                            │
│  migrations/*.sql        → Auto-generated, don't edit        │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 🎭 Code Patterns

### Common Patterns We Use

```typescript
// 🔥 Server Function Pattern
export const getHouseholdStudents = createServerFn({ method: 'GET' })
  .handler(async () => {
    const guardian = await requireGuardian();
    return db.query.students.findMany({
      where: inArray(students.householdId, guardian.householdIds),
    });
  });

// 🎣 Loader Pattern
export const Route = createFileRoute('/portal/students/$studentId')({
  loader: async ({ params }) => {
    await verifyStudentAccess(params.studentId);
    return getStudent(params.studentId);
  },
  component: () => {
    const student = Route.useLoaderData();
    return <StudentDetail student={student} />;
  },
});

// 🧩 Component Pattern
export function StudentCard({ student, showBalance }: Props) {
  return (
    <div className="rounded-lg border p-4">
      <h3>{student.firstName} {student.lastName}</h3>
      <p>Grade {student.currentGrade}</p>
      {showBalance && <Balance householdId={student.householdId} />}
    </div>
  );
}

type Props = {
  student: Student;
  showBalance?: boolean;
};
```

---

## 🆘 Common Error Messages

| Error | Meaning | Solution |
|-------|---------|----------|
| `GUARDIAN_NOT_AUTHORIZED` | Guardian tried to access data they don't own | Verify household relationship |
| `STUDENT_NOT_IN_HOUSEHOLD` | Student doesn't belong to guardian's household | Check custody setup |
| `TURSO_DATABASE_URL is not defined` | Missing database URL | Add to .env |
| `stripe.errors.AuthenticationError` | Invalid Stripe key | Check secret key |
| `SQLITE_CANTOPEN` | Can't open database | Check Turso URL/token |
| `Webhook signature verification failed` | Wrong webhook secret | Regenerate in Stripe dashboard |
| `hydration mismatch` | Server/client HTML differ | Check for client-only code in SSR |
| `PAYMENT_AMOUNT_MISMATCH` | Client amount doesn't match server calculation | Never trust client amounts |

---

## 📊 Event Names

| Event | When It Fires |
|-------|---------------|
| `school/inquiry.received` | New lead submitted inquiry form |
| `school/application.submitted` | Guardian submitted application |
| `school/application.accepted` | Admin accepted an application |
| `school/application.declined` | Admin declined an application |
| `school/enrollment.completed` | Contract signed + deposit paid |
| `school/payment.due` | Payment due date approaching (triggers reminder) |
| `school/payment.received` | Successful payment recorded |
| `school/payment.failed` | Payment attempt failed |
| `school/reenrollment.opened` | Re-enrollment window opened for returning families |

---

## 🎨 Design System Reference

### Colors

| Name | Hex | Use |
|------|-----|-----|
| Academic Navy | `#1F2A44` | Headers, navigation, primary text |
| Muted Evergreen | `#2F5D50` | CTAs, success states, accents |
| Warm Off-White | `#F7F5F2` | Page backgrounds |
| White | `#FFFFFF` | Card backgrounds, inputs |
| Primary Text | `#1E1E1E` | Body text |
| Secondary Text | `#5F6368` | Labels, hints |
| Muted Text | `#9AA0A6` | Disabled states |
| Success | `#3A7F6B` | Success messages |
| Warning | `#C9A227` | Warnings (muted gold) |
| Error | `#9C2F2F` | Errors (brick red) |

### Typography

| Purpose | Font | Weight |
|---------|------|--------|
| Headings | Libre Baskerville | 400, 700 |
| Body & UI | Inter | 400, 500, 600 |

---

## 🏆 Competitive Landscape

| Competitor | Weakness We Exploit |
|------------|---------------------|
| **FACTS** | Slow setup, nickel-and-diming, dated UX |
| **Blackbaud** | Enterprise pricing, complex, long implementation |
| **PowerSchool** | Cluttered interface, not admissions-focused |
| **RenWeb** | Aging platform, poor parent experience |

**Our positioning**: "The modern front door for private schools."

---

*"I'm a unitard!"* - Ralph (but he meant "unified school platform")
