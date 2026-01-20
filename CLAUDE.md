# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**EnrollSage** is a multi-tenant school enrollment and admissions management SaaS platform. Think "Shopify for school enrollment" - schools subscribe to manage admissions, enrollment, and billing, while families use the portal to apply and manage their children's enrollment.

## Development Commands

```bash
npm run dev      # Start dev server on port 3000
npm run build    # Production build
npm run preview  # Preview production build
npm run test     # Run all tests (vitest)
npm run test -- src/path/to/file.test.ts  # Run single test file

# Database migrations (requires Drizzle ORM setup)
npx drizzle-kit generate   # Generate migrations from schema changes
npx drizzle-kit push       # Apply migrations to database

# Local Inngest dev server (run alongside the app)
npx inngest-cli@latest dev  # Opens http://localhost:8288
```

## Tech Stack

- **TanStack Start** - Full-stack React SSR framework with file-based routing
- **TanStack Router** - Type-safe routing with `createFileRoute()`
- **React 19** - Latest React with modern features
- **Tailwind CSS v4** - Utility-first styling via `@tailwindcss/vite`
- **Drizzle ORM + Turso** - SQLite at the edge
- **Stripe** - Payment processing for tuition and fees
- **Brevo** - Transactional emails and drip campaigns
- **Inngest** - Event-driven async workflows
- **Nitro** - Server framework for API routes
- **Vitest** - Testing framework

## Architecture

### File-Based Routing

Routes live in `src/routes/` and map to URL paths automatically:
- `__root.tsx` - Root layout with HTML shell
- `index.tsx` - Home page
- `$param.tsx` - Dynamic routes
- Files with `.` in name map to nested paths (e.g., `demo/start.server-funcs.tsx` → `/demo/start/server-funcs`)

### Route Pattern

```typescript
export const Route = createFileRoute('/path')({
  component: Component,
  loader: async () => { /* server-side data fetching */ },
  head: () => ({ meta: [...] }),  // ALWAYS include title and description
  ssr: true | 'data-only' | false,
});
```

### Data Patterns

1. **Loaders** - Server-side data fetching, accessed via `Route.useLoaderData()`
2. **Server Functions** - `createServerFn()` for typed client-server communication
3. **API Routes** - Pure HTTP handlers via Nitro in route files

### Authentication Pattern

Session-based auth with cookie parsing in server functions:
```typescript
import { getWebRequest } from '@tanstack/react-start/server';
import { parseSessionCookie, validateSession } from '@/lib/auth';

const session = await validateSession(
  parseSessionCookie(getWebRequest()!.headers.get('cookie') || '')
);
```

### Path Alias

`@/` resolves to `./src/` (e.g., `import { db } from '@/db'`)

## Key Files & Directories

```
src/
├── routes/           # File-based routing (TanStack Start)
│   ├── admin/        # School admin dashboard routes
│   ├── super-admin/  # Platform super-admin routes
│   └── portal/       # Family portal routes
├── db/               # Database schema and client (Drizzle + Turso)
│   ├── schema/       # Table definitions (users, schools, households, etc.)
│   └── migrations/   # Auto-generated migrations (don't edit)
├── lib/              # Utilities (auth, brevo, inngest)
├── router.tsx        # Router configuration
├── routeTree.gen.ts  # AUTO-GENERATED - do not edit
└── styles.css        # Global styles with Tailwind import

wiggum/               # 📖 READ THIS FOR FULL CONTEXT
├── PROMPT.md         # Main transformation protocol - phases, brand, roadmap
├── context/          # Architecture diagrams, constraints, glossary
└── notes.md          # Development journal and decisions

# ⚠️ Before major work, read wiggum/PROMPT.md for the full vision

public/theme/zer/     # Theme assets (.css and .woff font files)
```

## Environment Variables

Required for full functionality:
- `STRIPE_PUBLIC_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`
- `BREVO_API_KEY`
- `INNGEST_SIGNING_KEY`, `INNGEST_EVENT_KEY`
- `SESSION_SECRET`

For local SQLite development (no auth token needed):
```bash
TURSO_DATABASE_URL=file:./local.db
```

## Coding Conventions

### TypeScript
- Use inferred types where possible: `const { data } = useLoaderData<typeof loader>()`
- Avoid `React.FC` - just use functions with Props
- Define Props types at the bottom of files
- Use Zod for runtime validation

### Styling
- Tailwind first, inline styles only when obtuse
- Use utilities from `@/utils`:
  ```typescript
  import { cn, formatPrice, truncate } from '@/utils'

  cn("base-class", conditional && "conditional-class")  // Merge Tailwind classes
  formatPrice(12.99)  // → "$12.99"
  truncate("Long text...", 50)  // Ellipsis after 50 chars
  ```
- Create universal components for primitives (inputs, buttons) and enforce their use

### Components
- Create shared components for repeated patterns
- Universal primitives should be used everywhere they apply

### Route Metadata
Every route MUST include proper metadata:
```typescript
head: () => ({
  meta: [
    { title: 'Page Name | EnrollSage' },
    { name: 'description', content: '150-160 char description' },
    { property: 'og:title', content: 'Page Title' },
  ],
}),
```

### Comments
Comments should be story-driven and creative - sprinkle in emojis, ASCII art, or jokes that lead developers toward discovery. Preserve and continue improving note styles throughout the codebase.

## Security Rules

- Calculate payment amounts server-side, never trust client values
- Verify Stripe webhooks with the signing secret
- Keep secrets in server functions; prefix client-safe vars with `VITE_`
- Multi-tenant isolation: always filter queries by schoolId

## User Roles

- **Superadmin** - Platform-level management, school onboarding, global analytics
- **Admin** - School staff: admissions, business office, teachers (role-based within school)
- **Customer** - Parents/guardians: apply, enroll, view billing, communicate

Gate logic: Missing env vars → `/install`, Not authenticated → `/login`, Not authorized → `/portal` or `/admin`

## Git Commits

Do not include Claude watermarks (no "Generated with Claude Code" or Co-Authored-By lines).
