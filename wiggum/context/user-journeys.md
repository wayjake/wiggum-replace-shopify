# User Journey Maps

> Understanding how each user type interacts with Enrollsy

## Overview

Enrollsy serves three distinct user types with different needs and journeys:
1. **Platform Admins** (Enrollsy staff) - Super-admin level access
2. **School Staff** (Admissions, Business Office) - School-level administration
3. **Families** (Parents/Guardians, Students) - Application and portal access

---

## 1. Platform Admin Journey

Platform admins are Enrollsy employees who manage the multi-tenant SaaS platform.

### Entry Points
- `/super-admin` - Platform administration dashboard

### Key Tasks

```
┌─────────────────────────────────────────────────────────────────┐
│ PLATFORM ADMIN FLOW                                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Login as superadmin                                            │
│       │                                                         │
│       ▼                                                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
│  │ Add School  │───▶│ Configure   │───▶│ Invite      │        │
│  │             │    │ Settings    │    │ School Admin│        │
│  └─────────────┘    └─────────────┘    └─────────────┘        │
│                                                                  │
│  Ongoing tasks:                                                 │
│  • View all schools and their metrics                          │
│  • Manage school billing/subscriptions                         │
│  • Debug issues (impersonate users)                            │
│  • View platform-wide analytics                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Permissions
- CRUD all schools
- CRUD all users
- View all data across tenants
- Manage platform billing
- Impersonate any user (for support)

---

## 2. School Staff Journey

### 2a. Admissions Staff

Primary goal: Convert inquiries to enrolled students

```
┌─────────────────────────────────────────────────────────────────┐
│ ADMISSIONS STAFF FLOW                                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Login (admissions@school.edu)                                  │
│       │                                                         │
│       ▼                                                         │
│  ┌─────────────┐                                                │
│  │ Dashboard   │ ← Today's tasks, follow-ups, recent activity  │
│  └──────┬──────┘                                                │
│         │                                                       │
│    ┌────┴────┬────────────┬────────────┬────────────┐          │
│    ▼         ▼            ▼            ▼            ▼          │
│ ┌──────┐ ┌──────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐     │
│ │Leads │ │Pipeline  │ │Students │ │Families │ │Reports  │     │
│ │List  │ │View      │ │Search   │ │Search   │ │         │     │
│ └──┬───┘ └────┬─────┘ └────┬────┘ └────┬────┘ └─────────┘     │
│    │          │            │           │                        │
│    ▼          ▼            ▼           ▼                        │
│ Add lead   Move stage   View/Edit   View household             │
│ Bulk email  Set tasks   Send email  Add guardian               │
│ Import CSV  Add notes   Update      View billing               │
│                          status                                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2b. Business Office Staff

Primary goal: Ensure tuition is collected accurately and on time

```
┌─────────────────────────────────────────────────────────────────┐
│ BUSINESS OFFICE FLOW                                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Login (business@school.edu)                                    │
│       │                                                         │
│       ▼                                                         │
│  ┌─────────────┐                                                │
│  │ Dashboard   │ ← Outstanding balances, upcoming payments     │
│  └──────┬──────┘                                                │
│         │                                                       │
│    ┌────┴────┬────────────┬────────────┬────────────┐          │
│    ▼         ▼            ▼            ▼            ▼          │
│ ┌──────┐ ┌──────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐     │
│ │Bills │ │Payments  │ │Payment  │ │Families │ │Reports  │     │
│ │Due   │ │History   │ │Plans    │ │Ledgers  │ │         │     │
│ └──┬───┘ └────┬─────┘ └────┬────┘ └────┬────┘ └─────────┘     │
│    │          │            │           │                        │
│    ▼          ▼            ▼           ▼                        │
│ Send       Record        Setup/       View/adjust              │
│ reminders  manual        modify       credits,                  │
│            payment       plans        charges                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2c. School Administrator

Primary goal: Configure school settings and manage staff access

```
┌─────────────────────────────────────────────────────────────────┐
│ SCHOOL ADMIN FLOW                                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Login (admin@school.edu)                                       │
│       │                                                         │
│       ▼                                                         │
│  ┌─────────────┐                                                │
│  │ Settings    │                                                │
│  └──────┬──────┘                                                │
│         │                                                       │
│    ┌────┴────┬────────────┬────────────┬────────────┐          │
│    ▼         ▼            ▼            ▼            ▼          │
│ ┌──────┐ ┌──────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐     │
│ │Staff │ │School    │ │Forms &  │ │Payment  │ │Email    │     │
│ │Users │ │Profile   │ │Apps     │ │Settings │ │Templates│     │
│ └──────┘ └──────────┘ └─────────┘ └─────────┘ └─────────┘     │
│                                                                  │
│ Staff: Invite, deactivate, assign roles                        │
│ Profile: Name, grades, school year                             │
│ Forms: Application builder, enrollment forms                   │
│ Payments: Stripe connect, tuition rates                        │
│ Email: Templates, branding                                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Family Journey

### 3a. New Applicant Journey (Parent/Guardian)

Primary goal: Learn about the school and submit an application

```
┌─────────────────────────────────────────────────────────────────┐
│ NEW APPLICANT FLOW                                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Discovery (external)                                           │
│       │                                                         │
│       ▼                                                         │
│  ┌─────────────────────┐                                       │
│  │ School Landing Page │ ← Embedded inquiry form               │
│  └──────────┬──────────┘                                       │
│             │                                                   │
│             ▼                                                   │
│  ┌─────────────────────┐                                       │
│  │ Submit Inquiry      │ → Added to CRM as lead                │
│  │ (no account needed) │                                       │
│  └──────────┬──────────┘                                       │
│             │                                                   │
│     ┌───────┼───────┐                                          │
│     ▼       │       ▼                                          │
│ [Tour]      │    [Email nurture]                               │
│     │       │       │                                          │
│     └───────┼───────┘                                          │
│             ▼                                                   │
│  ┌─────────────────────┐                                       │
│  │ Invited to Apply    │ ← Email with link                     │
│  └──────────┬──────────┘                                       │
│             │                                                   │
│             ▼                                                   │
│  ┌─────────────────────┐                                       │
│  │ Create Account      │ ← Email + password OR Google OAuth    │
│  └──────────┬──────────┘                                       │
│             │                                                   │
│             ▼                                                   │
│  ┌─────────────────────┐                                       │
│  │ Complete Application│                                       │
│  │  • Student info     │                                       │
│  │  • Parent info      │                                       │
│  │  • Documents        │                                       │
│  │  • Payment (app fee)│                                       │
│  └──────────┬──────────┘                                       │
│             │                                                   │
│             ▼                                                   │
│  ┌─────────────────────┐                                       │
│  │ Await Decision      │ ← Status visible in portal           │
│  └─────────────────────┘                                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3b. Accepted Student Enrollment Journey

Primary goal: Complete enrollment and set up payments

```
┌─────────────────────────────────────────────────────────────────┐
│ ENROLLMENT FLOW (Post-Acceptance)                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Received Acceptance                                            │
│       │                                                         │
│       ▼                                                         │
│  ┌─────────────────────┐                                       │
│  │ Login to Portal     │                                       │
│  └──────────┬──────────┘                                       │
│             │                                                   │
│             ▼                                                   │
│  ┌─────────────────────┐                                       │
│  │ Enrollment Checklist│ ← What's left to complete             │
│  │  □ Sign contract    │                                       │
│  │  □ Upload docs      │                                       │
│  │  □ Setup payment    │                                       │
│  │  □ Complete forms   │                                       │
│  └──────────┬──────────┘                                       │
│             │                                                   │
│    ┌────────┴────────┐                                         │
│    ▼                 ▼                                         │
│ [E-sign          [Payment                                      │
│  contract]        setup]                                       │
│    │                 │                                         │
│    │                 ▼                                         │
│    │        ┌─────────────────┐                               │
│    │        │ Choose Plan     │                               │
│    │        │ • Pay in full   │                               │
│    │        │ • Monthly       │                               │
│    │        │ • Custom        │                               │
│    │        └────────┬────────┘                               │
│    │                 │                                         │
│    │                 ▼                                         │
│    │        ┌─────────────────┐                               │
│    │        │ Add Payment     │                               │
│    │        │ Method (Stripe) │                               │
│    │        └────────┬────────┘                               │
│    │                 │                                         │
│    └────────┬────────┘                                         │
│             │                                                   │
│             ▼                                                   │
│  ┌─────────────────────┐                                       │
│  │ ENROLLED ✓          │                                       │
│  └─────────────────────┘                                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3c. Current Parent Portal Journey

Primary goal: Stay informed and manage payments

```
┌─────────────────────────────────────────────────────────────────┐
│ PARENT PORTAL (Enrolled Family)                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Login                                                          │
│       │                                                         │
│       ▼                                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Family Dashboard                                         │   │
│  │  • Students: [Johnny - 9th] [Susie - 7th]              │   │
│  │  • Balance: $2,400.00 due                               │   │
│  │  • Next payment: Feb 1, 2026                            │   │
│  └────────────────────────┬────────────────────────────────┘   │
│                           │                                     │
│    ┌──────────┬───────────┼───────────┬───────────┐            │
│    ▼          ▼           ▼           ▼           ▼            │
│ ┌──────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐      │
│ │Billing│ │Payment  │ │Documents│ │Profile  │ │Messages │      │
│ │       │ │Methods  │ │         │ │         │ │         │      │
│ └──────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘      │
│                                                                  │
│ Billing: View invoices, make one-time payment                  │
│ Payment Methods: Add/remove cards, set autopay                 │
│ Documents: View contracts, upload requested docs               │
│ Profile: Update contact info, emergency contacts               │
│ Messages: View messages from school                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Route Structure

Based on these journeys, here's the proposed route structure:

```
/                           # Marketing home
/about                      # About page
/contact                    # Contact form
/terms                      # Terms of Service
/privacy                    # Privacy Policy

/login                      # Unified login
/register                   # Account creation (for families)
/forgot-password            # Password reset flow

/super-admin               # Platform admin routes
  /schools                 # List/manage all schools
  /schools/new             # Create new school
  /schools/:id             # School detail/settings
  /schools/:id/billing     # School subscription billing
  /schools/:id/impersonate # Access school as admin
  /analytics               # Platform-wide metrics

/admin                      # School admin routes (requires school context)
  /dashboard               # Overview, tasks, activity
  /leads                   # Admissions CRM
    /:id                   # Lead detail
  /students                # Student directory
    /:id                   # Student profile
  /families                # Family/household directory
    /:id                   # Family profile & ledger
  /applications            # Application management
    /:id                   # Application review
  /enrollment              # Enrollment status
  /billing                 # Payments & billing
    /invoices              # Invoice management
    /payments              # Payment history
    /plans                 # Payment plan setup
  /reports                 # Reporting
  /settings                # School settings
    /profile               # School info
    /staff                 # Staff management
    /forms                 # Form builder
    /email-templates       # Email templates
    /payment-settings      # Stripe, tuition rates

/portal                     # Parent portal routes
  /dashboard               # Family overview
  /students/:id            # Student info
  /applications/:id        # Application status
  /enrollment              # Enrollment checklist
  /billing                 # Family billing
    /invoices              # View invoices
    /payments              # Payment history
    /payment-methods       # Manage payment methods
  /documents               # Document management
  /messages                # School communications
  /profile                 # Family profile

/apply/:schoolSlug          # Public application for a school
  /inquiry                 # Inquiry form (no auth needed)
  /start                   # Start application (creates account)
  /continue                # Continue application (logged in)
```

---

## Access Control Summary

| Route Prefix   | Who Can Access                | Auth Required |
|---------------|-------------------------------|---------------|
| `/`           | Everyone                      | No            |
| `/super-admin`| Platform admins only          | Yes (role)    |
| `/admin`      | School staff                  | Yes (school)  |
| `/portal`     | Parents/Guardians             | Yes           |
| `/apply`      | Prospective families          | Partial       |

---

## Key UX Principles for Each Journey

1. **Platform Admin**: Power user interface, lots of data, quick navigation
2. **Admissions Staff**: Pipeline-focused, action-oriented, minimal clicks
3. **Business Office**: Numbers-focused, clear status, easy adjustments
4. **Parents**: Clean, mobile-first, no jargon, status always visible
5. **Applicants**: Progressive disclosure, save progress, clear next steps
