# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Wiggum** is a full-stack e-commerce platform built as an educational project demonstrating how to build a Shopify alternative. The base example uses "Karen's Beautiful Soap" as the storefront theme.

## Development Commands

```bash
npm run dev      # Start dev server on port 3000
npm run build    # Production build
npm run preview  # Preview production build
npm run test     # Run tests (vitest)

# Database migrations (requires Drizzle ORM setup)
npx drizzle-kit generate   # Generate migrations from schema changes
npx drizzle-kit push       # Apply migrations to database

# Local Inngest dev server (run alongside the app)
npx inngest-cli@latest dev
```

## Tech Stack

- **TanStack Start** - Full-stack React SSR framework with file-based routing
- **TanStack Router** - Type-safe routing with `createFileRoute()`
- **React 19** - Latest React with modern features
- **Tailwind CSS v4** - Utility-first styling via `@tailwindcss/vite`
- **Drizzle ORM + Turso** - SQLite at the edge
- **Stripe** - Payment processing
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

### Path Alias

`@/` resolves to `./src/` (e.g., `import { db } from '@/db'`)

## Key Files & Directories

```
src/
├── routes/           # File-based routing (TanStack Start)
├── db/               # Database schema and client (Drizzle + Turso)
│   ├── schema/       # Table definitions
│   └── migrations/   # Auto-generated migrations (don't edit)
├── lib/              # Utilities (auth, brevo, inngest)
├── router.tsx        # Router configuration
├── routeTree.gen.ts  # AUTO-GENERATED - do not edit
└── styles.css        # Global styles with Tailwind import

wiggum/               # Development notes, prompts, and architecture context
├── PROMPT.md         # Main transformation protocol
├── context/          # Architecture, constraints, glossary
└── notes.md          # Development journal

public/theme/zer/     # Theme assets (.css and .woff font files)
```

## Environment Variables

Required for full functionality:
- `STRIPE_PUBLIC_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`
- `BREVO_API_KEY`
- `INNGEST_SIGNING_KEY`, `INNGEST_EVENT_KEY`
- `SESSION_SECRET`

For local SQLite development: `TURSO_DATABASE_URL=file:./local.db`

## Coding Conventions

### TypeScript
- Use inferred types where possible: `const { data } = useLoaderData<typeof loader>()`
- Avoid `React.FC` - just use functions with Props
- Define Props types at the bottom of files
- Use Zod for runtime validation

### Styling
- Tailwind first, inline styles only when obtuse
- Use the `cn()` utility from `@/utils` for combining classes:
  ```typescript
  import { cn } from '@/utils'
  cn("base-class", conditional && "conditional-class")
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
    { title: 'Page Name | Store Name' },
    { name: 'description', content: '150-160 char description' },
    { property: 'og:title', content: 'Page Title' },
  ],
}),
```

### Comments
Comments should be story-driven and creative - sprinkle in emojis, ASCII art, or jokes that lead developers toward discovery. Preserve and continue improving note styles throughout the codebase.

## Security Rules

- NEVER hardcode API keys or commit `.env` files
- NEVER expose secret keys to the client/browser
- NEVER trust client-side payment amounts - calculate server-side
- ALWAYS verify Stripe webhooks with the signing secret
- Use server-only functions for secret access
- Prefix client-safe vars with `VITE_` or `PUBLIC_`

## User Roles

- **Admin** - Full store management, product CRUD, order fulfillment, analytics
- **Customer** - Browse, purchase, view order history, manage payment methods

Gate logic: Missing env vars → `/install`, Not authenticated → `/login`, Non-admin → `/account`

## Git Commits

Do not include Claude watermarks (no "Generated with Claude Code" or Co-Authored-By lines).
