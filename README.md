# EnrollSage: School Enrollment Made Simple

```
    ╭─────────────────────────────────────────────────────────╮
    │                                                          │
    │   🎓 "Shopify for school enrollment"                     │
    │                                                          │
    │   A multi-tenant SaaS platform for schools to manage     │
    │   admissions, enrollment, and billing in one place.      │
    │                                                          │
    ╰─────────────────────────────────────────────────────────╯
```

## What is EnrollSage?

EnrollSage is a **modern school enrollment management platform** built as an educational project. Schools subscribe to manage their admissions pipeline, student enrollment, and tuition billing, while families use a self-service portal to apply and manage their children's enrollment.

## The Stack

- **[TanStack Start](https://tanstack.com/start)** - Full-stack React framework with SSR, server functions, and type-safe routing
- **[Drizzle ORM](https://orm.drizzle.team)** + **[Turso](https://turso.tech)** - SQLite at the edge with multi-tenant isolation
- **[Stripe](https://stripe.com)** - Payment processing for tuition and fees
- **[Brevo](https://brevo.com)** - Transactional emails and notification workflows
- **[Inngest](https://inngest.com)** - Event-driven async workflows
- **[Tailwind CSS](https://tailwindcss.com)** - Utility-first styling for rapid UI development

## Key Features

### For Schools (Admin Dashboard)
- 📋 Lead tracking and CRM
- 📝 Application management
- 👨‍👩‍👧‍👦 Family and student records
- 💰 Tuition billing and payment plans
- 📊 Analytics and reporting

### For Families (Portal)
- 🎯 Online application submission
- 📄 Document upload and management
- 💳 Tuition payment processing
- 📱 Application status tracking
- 📬 Communication with school

### For Platform (Super Admin)
- 🏫 School onboarding and management
- 👥 User administration
- 📈 Platform-wide analytics

## Getting Started

```bash
npm install
npm run dev
```

Visit [http://localhost:3000/install](http://localhost:3000/install) to configure your environment.

## Project Structure

```
├── src/routes/           # File-based routing (TanStack Start)
│   ├── admin/            # School admin dashboard
│   ├── super-admin/      # Platform super-admin
│   └── portal/           # Family portal
├── src/db/schema/        # Database schema (Drizzle ORM)
├── wiggum/               # Development notes, prompts, and context
├── public/               # Static assets and theme files
└── ...                   # Standard React/Vite project files
```

## Test Credentials

After seeding the database (`npx tsx src/db/seed.ts`):

| Role | Email | Password |
|------|-------|----------|
| Superadmin | superadmin@enrollsage.com | superadmin123 |
| School Staff | admissions@example.com | admissions123 |
| Parent | student@example.com | student123 |

---

*Built as an educational project demonstrating multi-tenant SaaS architecture.* 🎓
