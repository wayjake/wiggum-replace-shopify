# 📝 Development Notes

```
    ╭─────────────────────────────────────────────────────────────╮
    │                                                              │
    │   "Me fail English? That's unpossible!"                      │
    │                                                              │
    │   These notes lead the way from first inquiry                │
    │   to tuition paid—without spreadsheets or duct tape.         │
    │                                                              │
    ╰─────────────────────────────────────────────────────────────╯
```

---

## 🎯 Product Vision

**"From first inquiry to tuition paid—without spreadsheets, PDFs, or duct tape."**

We're building a modern, admissions-first school management platform that:
- Nails the front door (leads, enrollment, payments)
- Is fast to adopt (weeks, not months)
- Grows into a full SIS without forcing schools to switch later

**Target**: U.S. private high schools (~500 students)
**Price Point**: $55/student/year → ~$27,500 ARR for a 500-student school

---

## 🧭 Project Journey Log

### The Pivot: From Soap to Schools

Started as an e-commerce demo ("Karen's Beautiful Soap") built on TanStack Start. The architecture is solid—now we're transforming it into something schools desperately need: a unified system for admissions, enrollment, and payments.

**Why schools?**
- Fragmented systems everywhere (leads in spreadsheets, enrollment in PDFs, payments in... prayer)
- Legacy SIS platforms are expensive, slow, and hard to use
- Parents hate clunky portals and unclear billing
- One clean system from first inquiry → enrolled → paid = massive value

**Current State:**
- ✅ TanStack Start v1.132.0 working
- ✅ Tailwind CSS configured
- ✅ File-based routing operational
- ✅ Drizzle + Turso database setup
- ✅ Stripe payments foundation
- ✅ Brevo email integration
- ✅ Inngest event system
- ⏳ Schema redesign for household-centric data model
- ⏳ Admissions CRM features
- ⏳ Enrollment workflows
- ⏳ Parent portal

---

## 🏫 Target Customer Profile (ICP)

```
┌─────────────────────────────────────────────────────────────┐
│  WHO WE'RE BUILDING FOR                                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  School Size: 300-800 students (sweet spot: ~500)           │
│                                                              │
│  School Types:                                               │
│  • Independent private high schools                          │
│  • Faith-based schools                                       │
│  • College-prep day schools                                  │
│                                                              │
│  Constraints They Face:                                      │
│  • 1-3 admissions staff (wearing many hats)                 │
│  • 1 business manager (also overwhelmed)                    │
│  • Limited IT support (maybe outsourced)                    │
│  • Budget-sensitive but willing to pay for time savings     │
│                                                              │
│  Primary Buyers:                                             │
│  • Head of School                                            │
│  • Director of Admissions                                    │
│  • Business Manager                                          │
│                                                              │
│  Primary Users:                                              │
│  • Admissions staff                                          │
│  • Business Office                                           │
│  • Parents (the silent majority who must love it)           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗺️ Implementation Breadcrumbs

### Phase 1: Core Data Model (Household-First)

```
TODO:
├── [ ] Design household-centric schema
│   ├── households (billing unit, shared across siblings)
│   ├── guardians (parents/legal guardians linked to households)
│   ├── students (individual children within households)
│   └── enrollment_status (per student, per school year)
├── [ ] Create address schema (shared within household)
├── [ ] Create emergency_contacts schema
├── [ ] Set up school year / term structure
└── [ ] Migrate from e-commerce user model to household model
```

### Phase 2: Admissions & Lead Management

```
TODO:
├── [ ] Create leads schema
│   ├── Lead capture from forms
│   ├── Pipeline stages: Inquiry → Tour → Applied → Accepted → Enrolled → Lost
│   └── Activity history (emails, status changes)
├── [ ] Build embeddable inquiry forms
├── [ ] Create lead pipeline UI
├── [ ] Add notes and tasks per lead/family
├── [ ] Build email templates for admissions
├── [ ] Implement basic bulk messaging
└── [ ] Activity timeline per family
```

### Phase 3: Applications & Enrollment

```
TODO:
├── [ ] Create applications schema
├── [ ] Build configurable form builder
│   ├── Custom fields and sections
│   ├── File uploads
│   ├── Required field validation
│   └── Conditional logic (accepted → contract unlocked)
├── [ ] Enrollment contracts with e-signature
├── [ ] Required documents checklist
├── [ ] Re-enrollment flow (returning students)
└── [ ] Application status tracking for parents
```

### Phase 4: Payments & Billing

```
TODO:
├── [ ] Design household ledger schema
├── [ ] Create tuition plans
│   ├── One-time payment
│   ├── Monthly installments
│   └── Custom schedules
├── [ ] Integrate Stripe for payments
│   ├── ACH bank transfer
│   ├── Credit/debit cards
│   └── Auto-pay enrollment
├── [ ] Build receipts and payment history
├── [ ] Manual adjustments and credits
└── [ ] Payment reminder automation (via Inngest)
```

### Phase 5: Parent Portal

```
TODO:
├── [ ] Design parent login flow
├── [ ] Build application status view
├── [ ] Create enrollment checklist UI
├── [ ] Contract signing interface
├── [ ] Invoice and payment history
├── [ ] Contact info update form
└── [ ] Document upload functionality
```

### Phase 6: Admin Dashboard

```
TODO:
├── [ ] Create admin layout with navigation
├── [ ] Build admissions pipeline dashboard
├── [ ] Student and household management
├── [ ] Billing overview and reporting
├── [ ] Communication center (email templates, bulk send)
└── [ ] School settings and configuration
```

---

## 💡 Key Decisions & Rationale

### Household-First vs Student-First Data Model

*The biggest architectural decision we face.*

**The Problem:**
- Traditional SIS platforms are student-centric
- But parents pay tuition, not students
- Siblings share addresses, emergency contacts, and billing
- Divorced parents = complex custody = multiple households

**Our Decision:** Household-first architecture

```
┌─────────────────────────────────────────────────────────────┐
│  HOUSEHOLD-CENTRIC MODEL                                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Household                                                   │
│  ├── Billing address                                         │
│  ├── Payment methods                                         │
│  ├── Ledger (all charges/payments)                          │
│  │                                                           │
│  ├── Guardians (0-n)                                        │
│  │   ├── Parent 1 (email, phone, relationship)              │
│  │   ├── Parent 2                                           │
│  │   └── Other guardian                                     │
│  │                                                           │
│  └── Students (1-n)                                         │
│      ├── Child 1 (grade, enrollment status)                 │
│      └── Child 2                                            │
│                                                              │
│  Shared Custody Example:                                     │
│  ┌────────────────┐     ┌────────────────┐                  │
│  │ Household A     │     │ Household B     │                  │
│  │ (Mom's house)   │     │ (Dad's house)   │                  │
│  │                 │     │                 │                  │
│  │ Guardian: Mom   │     │ Guardian: Dad   │                  │
│  │ Student: Alex   │◄───►│ Student: Alex   │                  │
│  │ (50% billing)   │     │ (50% billing)   │                  │
│  └────────────────┘     └────────────────┘                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Why this wins:**
- One bill per household (not per student)
- Addresses and contacts don't repeat
- Parents see all their children in one view
- Split billing is a first-class concept

### Authentication: Magic Links for Everyone

**Parents don't need another password.** They barely remember the ones they have.

- Magic link login: Enter email → Get link → Click → Signed in
- Works great for parents who login 2-3 times per year
- School staff can have traditional login (future enhancement)
- Session-based auth with secure cookies

### Payments Should Feel Like Stripe, Not Accounting Software

**The parent experience for payments matters enormously.**

- Clear, simple invoices
- One-click auto-pay enrollment
- Mobile-friendly payment flow
- Instant receipts via email
- No jargon ("ledger" visible to admins, not parents)

### Communication: Transactional First, Marketing Later

**Phase 1 focus:**
- Enrollment accepted notifications
- Payment reminders
- Application status updates
- Contract signing requests

**Not yet:**
- Full newsletter system
- Complex drip campaigns
- SMS (optional add-on later)

---

## 🎨 Design System Notes

### Visual Trust System

Schools buy risk reduction, not software. Our design must signal:
- Stability
- Fairness
- Professionalism
- "We won't surprise you"

### Color Palette

```
Deep Academic Navy (#1F2A44)
├── Use: Headers, nav, anchors
├── Signals: Authority, permanence, competence
└── Feels "school-like" without being childish

Muted Evergreen (#2F5D50)
├── Use: Accents, CTAs, success states
├── Signals: Growth, stewardship, responsibility
└── Feels institutional, not "startup green"

Warm Off-White (#F7F5F2)
├── Use: Primary background
├── Signals: Paper, trust, forms, records
└── Not techy or cold like pure white

Text Colors:
├── Primary: #1E1E1E
├── Secondary: #5F6368
└── Muted: #9AA0A6

Status Colors (Muted):
├── Success: #3A7F6B
├── Warning: #C9A227 (muted gold)
└── Error: #9C2F2F (brick red)
```

### Typography

```
Headings: Libre Baskerville
├── Serif, academic, timeless
├── Signals: "This is not experimental"
└── Use for page headers, section titles, pricing

Body & UI: Inter
├── Clean, neutral, excellent at small sizes
├── Industry standard for serious SaaS
└── Use for body copy, forms, tables, buttons

The pairing says: "Established, but not outdated."
```

### UI Styling Rules

```
Do:
├── Rounded corners: 6-8px max
├── Shadows: subtle, low elevation
├── Line icons with consistent stroke
└── Solid primary buttons, outline secondary

Don't:
├── No glassmorphism
├── No animated gradients
├── No playful illustrations
├── No emoji-style icons
└── No neon hover states
```

---

## 🐛 Known Issues & Gotchas

### TanStack Start Quirks

```
⚠️ Route File Changes
   Sometimes hot reload doesn't pick up new route files.
   Fix: Restart the dev server.

⚠️ routeTree.gen.ts
   This file is auto-generated. Never edit it!
   If it gets weird: delete it, restart dev server.

⚠️ Server Function Import
   Server functions must be imported with their file path.
   import { doThing } from '~/data/myServerFn'  ← correct
   import { doThing } from '~/data'  ← may not work
```

### Drizzle Gotchas

```
⚠️ Schema Type vs Runtime
   schema.students is the TABLE definition
   db.query.students is the QUERY interface
   Don't confuse them!

⚠️ Turso Token Expiry
   Auth tokens can expire. If you get auth errors,
   regenerate with: turso db tokens create <db-name>

⚠️ Local vs Production
   Local: file:./local.db (no token needed)
   Prod: libsql://... (token required)
```

### Stripe Gotchas

```
⚠️ Webhook Timing
   Webhooks can arrive before redirect completes.
   Don't assume user sees success page before webhook fires.

⚠️ Test vs Live Keys
   Test keys only work with test cards (4242 4242 4242 4242)
   Live keys only work with real cards.

⚠️ Tuition Payment Amounts
   ALWAYS calculate server-side from enrollment records.
   NEVER trust client-submitted amounts.
```

### Magic Link Gotchas

```
⚠️ Token Expiry
   Tokens expire in 15 minutes. Parents may check email later.
   Show clear messaging and "resend" option.

⚠️ Same Response for All Emails
   Always show "Check your email" even if email doesn't exist.
   This prevents email enumeration attacks.

⚠️ Multiple Devices
   Magic link creates session on whatever device clicks it.
   Parent might click on phone but wanted to log in on desktop.
```

---

## 📊 Success Metrics

### Product Metrics

```
Time to Onboard:        < 30 days from contract to live
Enrollment Completion:  > 90% of families complete without admin help
Parent Portal Adoption: > 85% of parents actively using portal
Autopay Enrollment:     ≥ 80% of families on autopay
```

### Business Metrics

```
Demo Close Rate:       > 25%
Revenue Retention:     > 100% (via add-ons)
Annual Churn:          < 5%
```

---

## 🔮 Phase 2 Preview (Post-MVP)

- [ ] Attendance tracking
- [ ] Gradebook basics
- [ ] Class scheduling
- [ ] Financial aid workflows
- [ ] Analytics dashboards
- [ ] Mobile app
- [ ] Integrations (Google Workspace, LMS, accounting)
- [ ] SMS messaging (add-on)

---

## 📖 References & Resources

### Documentation Links

- [TanStack Start Docs](https://tanstack.com/start)
- [Drizzle ORM Docs](https://orm.drizzle.team)
- [Turso Docs](https://docs.turso.tech)
- [Stripe Payments Docs](https://stripe.com/docs/payments)
- [Stripe Invoicing](https://stripe.com/docs/invoicing)
- [Brevo API Docs](https://developers.brevo.com)
- [Inngest Docs](https://www.inngest.com/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

### Competitive Landscape

```
┌─────────────────────────────────────────────────────────────┐
│  WHY WE WIN VS INCUMBENTS                                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  vs FACTS / Blackbaud:                                       │
│  • Faster to set up (weeks, not semesters)                  │
│  • No nickel-and-diming for basics                          │
│  • Modern UX that parents actually like                     │
│                                                              │
│  vs PowerSchool / RenWeb:                                   │
│  • Cleaner interface                                         │
│  • Admissions-first design                                   │
│  • Better payments flow                                      │
│                                                              │
│  Our Differentiators:                                        │
│  1. Admissions-first (CRM → enrollment → billing)           │
│  2. Household-centric data model                            │
│  3. Payments feel like Stripe, not accounting software      │
│  4. Parents love it (this matters more than vendors admit)  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

```
    ╭─────────────────────────────────────────────────────────────╮
    │                                                              │
    │   "That's where I'm a Viking!"                               │
    │                                                              │
    │   Future developers: Add your notes here.                    │
    │   We're building the modern front door for private schools.  │
    │   The parents of tomorrow will thank you.                    │
    │                                                              │
    ╰─────────────────────────────────────────────────────────────╯
```

---

*Last updated: The eternal now*
*Next developer to touch this: You're helping schools help kids. Nice.* 🎓
