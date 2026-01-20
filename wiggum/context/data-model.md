# Data Model - Household-First Architecture

> "Families, not just students. Our data model reflects how schools actually think about enrollment."

## Design Philosophy

### Why Household-First?

Traditional SIS platforms are **student-centric** - everything hangs off a student record. This creates problems:

| Problem | Traditional Approach | Our Approach |
|---------|---------------------|--------------|
| Siblings | Duplicate guardian info | One household, multiple students |
| Billing | Bill per student | Bill per household |
| Communications | Multiple emails per family | One household inbox |
| Custody | Complex workarounds | Multi-guardian support |

### Core Principles

1. **Households are the billing unit** - Not students
2. **Guardians belong to households** - Not students
3. **Students belong to households** - Can belong to multiple (divorce)
4. **Users can have multiple roles** - Platform admin, school staff, and/or parent

---

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          PLATFORM LEVEL                                  │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────┐         ┌──────────────┐
│    users     │────────▶│   sessions   │
│              │         │              │
│ id           │         │ id           │
│ email        │         │ userId       │
│ passwordHash │         │ expiresAt    │
│ role         │ (global)│              │
│ ...          │         └──────────────┘
└──────┬───────┘
       │
       │ one user can have multiple school memberships
       ▼
┌──────────────┐         ┌──────────────┐
│school_members│◀───────▶│   schools    │
│              │         │              │
│ id           │         │ id           │
│ userId       │         │ name         │
│ schoolId     │         │ slug         │
│ role         │ (school)│ subdomain    │
│ ...          │         │ ...          │
└──────────────┘         └──────┬───────┘
                                │
┌─────────────────────────────────────────────────────────────────────────┐
│                          SCHOOL LEVEL (Multi-tenant)                    │
└─────────────────────────────────────────────────────────────────────────┘
                                │
       ┌────────────────────────┼────────────────────────┐
       │                        │                        │
       ▼                        ▼                        ▼
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│  households  │         │   students   │         │    leads     │
│              │         │              │         │              │
│ id           │         │ id           │         │ id           │
│ schoolId     │◀───────▶│ schoolId     │         │ schoolId     │
│ name         │         │ householdId  │         │ firstName    │
│ ...          │         │ firstName    │         │ lastName     │
└──────┬───────┘         │ lastName     │         │ email        │
       │                 │ gradeLevel   │         │ stage        │
       │                 │ status       │         │ convertedTo  │────┐
       ▼                 └──────────────┘         └──────────────┘    │
┌──────────────┐                                                       │
│  guardians   │                                                       │
│              │         ┌──────────────┐         ┌──────────────┐    │
│ id           │         │ applications │◀────────│ applied from │    │
│ householdId  │         │              │         │    lead      │◀───┘
│ userId       │─ ─ ─ ─ ▶│ id           │
│ firstName    │ (links  │ schoolId     │
│ lastName     │  to user│ studentId    │
│ relationship │  account│ status       │
│ isPrimary    │  )      │ ...          │
└──────────────┘         └──────────────┘
       │
       │
       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                          BILLING (Household-Level)                       │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   invoices   │────────▶│invoice_items │         │   payments   │
│              │         │              │         │              │
│ id           │         │ id           │         │ id           │
│ householdId  │◀────────│ invoiceId    │         │ householdId  │
│ schoolId     │         │ studentId    │         │ invoiceId    │
│ amount       │         │ description  │         │ amount       │
│ dueDate      │         │ amount       │         │ method       │
│ status       │         │              │         │ stripeId     │
└──────────────┘         └──────────────┘         └──────────────┘
```

---

## Schema Definitions

### Platform Level (Global)

```typescript
// Users - Global identity, can span multiple schools
users {
  id              TEXT PRIMARY KEY
  email           TEXT UNIQUE NOT NULL
  passwordHash    TEXT                    // null if OAuth only
  role            TEXT DEFAULT 'user'     // 'superadmin' | 'user'
  firstName       TEXT
  lastName        TEXT
  emailVerified   BOOLEAN DEFAULT false
  createdAt       TIMESTAMP
  updatedAt       TIMESTAMP
}

// Sessions - User auth sessions
sessions {
  id              TEXT PRIMARY KEY
  userId          TEXT REFERENCES users
  expiresAt       TIMESTAMP NOT NULL
  createdAt       TIMESTAMP
}

// OAuth - External auth providers
oauth_accounts {
  id              TEXT PRIMARY KEY
  userId          TEXT REFERENCES users
  provider        TEXT NOT NULL           // 'google'
  providerAccountId TEXT NOT NULL
  email           TEXT
  accessToken     TEXT
  refreshToken    TEXT
  expiresAt       TIMESTAMP
}
```

### Multi-Tenant (School Level)

```typescript
// Schools - Each school is a tenant
schools {
  id              TEXT PRIMARY KEY
  name            TEXT NOT NULL
  slug            TEXT UNIQUE NOT NULL    // URL-friendly name
  subdomain       TEXT UNIQUE             // optional custom subdomain

  // Settings
  timezone        TEXT DEFAULT 'America/New_York'
  currentSchoolYear TEXT                  // '2025-2026'
  gradesOffered   TEXT                    // JSON array: ['K', '1', '2', ...]

  // Stripe Connect
  stripeAccountId TEXT                    // Connected Stripe account
  stripeAccountStatus TEXT                // 'pending' | 'active'

  // Branding
  logoUrl         TEXT
  primaryColor    TEXT DEFAULT '#2F5D50'

  // Google OAuth for school (optional)
  googleClientId  TEXT
  googleClientSecret TEXT

  status          TEXT DEFAULT 'active'   // 'active' | 'suspended' | 'trial'
  trialEndsAt     TIMESTAMP
  createdAt       TIMESTAMP
  updatedAt       TIMESTAMP
}

// School Members - Links users to schools with roles
school_members {
  id              TEXT PRIMARY KEY
  userId          TEXT REFERENCES users
  schoolId        TEXT REFERENCES schools
  role            TEXT NOT NULL           // 'owner' | 'admin' | 'staff' | 'readonly'
  permissions     TEXT                    // JSON array of specific permissions
  invitedBy       TEXT REFERENCES users
  invitedAt       TIMESTAMP
  acceptedAt      TIMESTAMP
  status          TEXT DEFAULT 'pending'  // 'pending' | 'active' | 'deactivated'
  createdAt       TIMESTAMP

  UNIQUE(userId, schoolId)
}
```

### Household & Family

```typescript
// Households - The billing and family unit
households {
  id              TEXT PRIMARY KEY
  schoolId        TEXT REFERENCES schools NOT NULL
  name            TEXT                    // "The Smith Family"
  primaryEmail    TEXT                    // Main contact email
  primaryPhone    TEXT

  // Address
  addressLine1    TEXT
  addressLine2    TEXT
  city            TEXT
  state           TEXT
  postalCode      TEXT
  country         TEXT DEFAULT 'US'

  // Billing
  stripeCustomerId TEXT                   // Stripe customer for this household
  defaultPaymentMethodId TEXT
  autoPay         BOOLEAN DEFAULT false

  status          TEXT DEFAULT 'active'   // 'active' | 'inactive' | 'prospective'
  createdAt       TIMESTAMP
  updatedAt       TIMESTAMP
}

// Guardians - Adults in a household
guardians {
  id              TEXT PRIMARY KEY
  householdId     TEXT REFERENCES households NOT NULL
  userId          TEXT REFERENCES users   // Links to user account (nullable if no portal access)

  firstName       TEXT NOT NULL
  lastName        TEXT NOT NULL
  email           TEXT
  phone           TEXT

  relationship    TEXT                    // 'mother' | 'father' | 'guardian' | etc
  isPrimary       BOOLEAN DEFAULT false   // Primary contact for household
  hasPortalAccess BOOLEAN DEFAULT true    // Can log in to parent portal
  isBillingContact BOOLEAN DEFAULT false  // Receives billing notifications
  isEmergencyContact BOOLEAN DEFAULT false

  employer        TEXT
  occupation      TEXT

  createdAt       TIMESTAMP
  updatedAt       TIMESTAMP
}

// Students - Children in a household
students {
  id              TEXT PRIMARY KEY
  schoolId        TEXT REFERENCES schools NOT NULL
  householdId     TEXT REFERENCES households NOT NULL

  firstName       TEXT NOT NULL
  lastName        TEXT NOT NULL
  preferredName   TEXT

  dateOfBirth     DATE
  gender          TEXT
  gradeLevel      TEXT                    // Current grade: 'K' | '1' | '2' | ... | '12'

  enrollmentStatus TEXT DEFAULT 'prospective'
  // 'prospective' | 'applicant' | 'accepted' | 'enrolled' | 'withdrawn' | 'graduated'

  enrolledDate    DATE
  withdrawnDate   DATE
  expectedGraduationYear INTEGER

  // Medical/Emergency
  allergies       TEXT
  medicalNotes    TEXT

  previousSchool  TEXT

  createdAt       TIMESTAMP
  updatedAt       TIMESTAMP
}

// Student-Household Links (for split custody)
student_households {
  id              TEXT PRIMARY KEY
  studentId       TEXT REFERENCES students NOT NULL
  householdId     TEXT REFERENCES households NOT NULL
  isPrimary       BOOLEAN DEFAULT true    // Primary household
  custodyNotes    TEXT

  UNIQUE(studentId, householdId)
}
```

### Admissions CRM

```typescript
// Leads - Before they become applicants
leads {
  id              TEXT PRIMARY KEY
  schoolId        TEXT REFERENCES schools NOT NULL

  // Contact info
  firstName       TEXT NOT NULL
  lastName        TEXT NOT NULL
  email           TEXT
  phone           TEXT

  // Lead details
  source          TEXT                    // 'website' | 'referral' | 'event' | etc
  stage           TEXT DEFAULT 'inquiry'
  // 'inquiry' | 'tour_scheduled' | 'tour_complete' | 'applied' | 'lost'

  interestedGrades TEXT                   // JSON array of grades interested in
  interestedYear  TEXT                    // '2025-2026'
  numberOfStudents INTEGER DEFAULT 1

  notes           TEXT

  // Conversion tracking
  convertedToHouseholdId TEXT REFERENCES households
  convertedAt     TIMESTAMP
  lostReason      TEXT
  lostAt          TIMESTAMP

  assignedTo      TEXT REFERENCES users   // Staff member assigned

  lastContactedAt TIMESTAMP
  nextFollowUpAt  TIMESTAMP

  createdAt       TIMESTAMP
  updatedAt       TIMESTAMP
}

// Lead Activity Log
lead_activities {
  id              TEXT PRIMARY KEY
  leadId          TEXT REFERENCES leads NOT NULL

  type            TEXT NOT NULL           // 'email' | 'call' | 'tour' | 'note' | 'stage_change'
  description     TEXT
  performedBy     TEXT REFERENCES users

  metadata        TEXT                    // JSON for extra data
  createdAt       TIMESTAMP
}

// Applications
applications {
  id              TEXT PRIMARY KEY
  schoolId        TEXT REFERENCES schools NOT NULL
  studentId       TEXT REFERENCES students NOT NULL
  householdId     TEXT REFERENCES households NOT NULL

  schoolYear      TEXT NOT NULL           // '2025-2026'
  gradeApplyingFor TEXT NOT NULL
  applicationType TEXT DEFAULT 'new'      // 'new' | 're-enrollment'

  status          TEXT DEFAULT 'draft'
  // 'draft' | 'submitted' | 'under_review' | 'interview_scheduled' |
  // 'accepted' | 'waitlisted' | 'denied' | 'withdrawn' | 'enrolled'

  submittedAt     TIMESTAMP
  decisionAt      TIMESTAMP
  decisionBy      TEXT REFERENCES users
  decisionNotes   TEXT

  // Application fee
  applicationFeeAmount INTEGER            // in cents
  applicationFeePaid BOOLEAN DEFAULT false
  applicationFeePaidAt TIMESTAMP

  createdAt       TIMESTAMP
  updatedAt       TIMESTAMP
}

// Application Form Responses (stores form data as JSON)
application_responses {
  id              TEXT PRIMARY KEY
  applicationId   TEXT REFERENCES applications NOT NULL
  formId          TEXT REFERENCES forms
  responses       TEXT                    // JSON of form responses
  completedAt     TIMESTAMP
}

// Application Documents
application_documents {
  id              TEXT PRIMARY KEY
  applicationId   TEXT REFERENCES applications NOT NULL

  name            TEXT NOT NULL
  type            TEXT                    // 'transcript' | 'recommendation' | etc
  fileUrl         TEXT NOT NULL
  fileSize        INTEGER
  mimeType        TEXT

  uploadedBy      TEXT REFERENCES users
  uploadedAt      TIMESTAMP
}
```

### Billing & Payments

```typescript
// Invoices - Billed to households
invoices {
  id              TEXT PRIMARY KEY
  schoolId        TEXT REFERENCES schools NOT NULL
  householdId     TEXT REFERENCES households NOT NULL

  invoiceNumber   TEXT UNIQUE             // 'INV-2025-001'
  description     TEXT

  subtotal        INTEGER NOT NULL        // in cents
  discounts       INTEGER DEFAULT 0       // in cents
  credits         INTEGER DEFAULT 0       // in cents
  total           INTEGER NOT NULL        // in cents

  dueDate         DATE NOT NULL
  status          TEXT DEFAULT 'draft'
  // 'draft' | 'sent' | 'partially_paid' | 'paid' | 'overdue' | 'void'

  sentAt          TIMESTAMP
  paidAt          TIMESTAMP

  stripeInvoiceId TEXT

  createdAt       TIMESTAMP
  updatedAt       TIMESTAMP
}

// Invoice Line Items
invoice_items {
  id              TEXT PRIMARY KEY
  invoiceId       TEXT REFERENCES invoices NOT NULL
  studentId       TEXT REFERENCES students  // Optional - can be household-level

  description     TEXT NOT NULL
  type            TEXT NOT NULL           // 'tuition' | 'fee' | 'activity' | etc
  quantity        INTEGER DEFAULT 1
  unitAmount      INTEGER NOT NULL        // in cents
  amount          INTEGER NOT NULL        // quantity * unitAmount

  periodStart     DATE                    // For recurring items
  periodEnd       DATE

  createdAt       TIMESTAMP
}

// Payments
payments {
  id              TEXT PRIMARY KEY
  schoolId        TEXT REFERENCES schools NOT NULL
  householdId     TEXT REFERENCES households NOT NULL
  invoiceId       TEXT REFERENCES invoices  // Can be null for credits/deposits

  amount          INTEGER NOT NULL        // in cents
  method          TEXT NOT NULL           // 'card' | 'ach' | 'check' | 'cash' | 'other'
  status          TEXT DEFAULT 'pending'  // 'pending' | 'succeeded' | 'failed' | 'refunded'

  stripePaymentIntentId TEXT
  stripeChargeId  TEXT

  checkNumber     TEXT                    // For manual check payments
  notes           TEXT

  processedAt     TIMESTAMP
  processedBy     TEXT REFERENCES users

  createdAt       TIMESTAMP
}

// Payment Plans
payment_plans {
  id              TEXT PRIMARY KEY
  schoolId        TEXT REFERENCES schools NOT NULL
  householdId     TEXT REFERENCES households NOT NULL
  studentId       TEXT REFERENCES students  // Can be student-specific

  name            TEXT NOT NULL           // 'Monthly Plan - 2025-2026'
  totalAmount     INTEGER NOT NULL        // Total to be paid
  numberOfPayments INTEGER NOT NULL
  paymentAmount   INTEGER NOT NULL        // Each payment amount

  frequency       TEXT NOT NULL           // 'monthly' | 'quarterly' | 'annual'
  startDate       DATE NOT NULL

  status          TEXT DEFAULT 'active'   // 'active' | 'completed' | 'cancelled'

  createdAt       TIMESTAMP
}

// Scheduled Payments (from payment plans)
scheduled_payments {
  id              TEXT PRIMARY KEY
  paymentPlanId   TEXT REFERENCES payment_plans NOT NULL

  amount          INTEGER NOT NULL
  dueDate         DATE NOT NULL
  status          TEXT DEFAULT 'scheduled' // 'scheduled' | 'processing' | 'completed' | 'failed'

  paymentId       TEXT REFERENCES payments  // Links to actual payment when processed

  createdAt       TIMESTAMP
}
```

### Forms & Contracts

```typescript
// Form Templates
forms {
  id              TEXT PRIMARY KEY
  schoolId        TEXT REFERENCES schools NOT NULL

  name            TEXT NOT NULL
  type            TEXT NOT NULL           // 'application' | 'enrollment' | 'survey' | 'contract'
  description     TEXT

  schema          TEXT NOT NULL           // JSON schema for form fields
  settings        TEXT                    // JSON for form settings

  isPublished     BOOLEAN DEFAULT false
  version         INTEGER DEFAULT 1

  createdAt       TIMESTAMP
  updatedAt       TIMESTAMP
}

// Contracts (E-signature)
contracts {
  id              TEXT PRIMARY KEY
  schoolId        TEXT REFERENCES schools NOT NULL
  householdId     TEXT REFERENCES households NOT NULL
  studentId       TEXT REFERENCES students

  name            TEXT NOT NULL           // 'Enrollment Contract 2025-2026'
  documentUrl     TEXT                    // PDF or HTML content

  status          TEXT DEFAULT 'pending'  // 'pending' | 'signed' | 'voided'

  signedAt        TIMESTAMP
  signedBy        TEXT REFERENCES guardians
  signatureData   TEXT                    // Base64 signature image or signature ID
  signedIp        TEXT

  createdAt       TIMESTAMP
}
```

---

## Index Strategy

```sql
-- High-frequency lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_schools_slug ON schools(slug);
CREATE INDEX idx_school_members_user ON school_members(userId);
CREATE INDEX idx_school_members_school ON school_members(schoolId);

-- School-scoped queries (all data queries include schoolId)
CREATE INDEX idx_households_school ON households(schoolId);
CREATE INDEX idx_students_school ON students(schoolId);
CREATE INDEX idx_students_household ON students(householdId);
CREATE INDEX idx_leads_school ON leads(schoolId);
CREATE INDEX idx_leads_stage ON leads(schoolId, stage);
CREATE INDEX idx_applications_school ON applications(schoolId);
CREATE INDEX idx_applications_student ON applications(studentId);
CREATE INDEX idx_invoices_household ON invoices(householdId);
CREATE INDEX idx_payments_household ON payments(householdId);
```

---

## Migration Strategy

Since we're transforming from an e-commerce schema, the migration approach:

1. **Keep existing tables** - Don't break existing functionality
2. **Add new school-specific tables** - All new tables above
3. **Extend users table** - Add `role: 'superadmin'` option
4. **Create school_members** - Bridge between global users and schools

The existing e-commerce tables (products, orders, etc.) can remain for now and be deprecated later.
