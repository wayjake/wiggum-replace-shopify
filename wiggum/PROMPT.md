> **Enrollsy** - The modern front door for private schools
> "From first inquiry to tuition paid—without spreadsheets, PDFs, or duct tape."

## Where to Find Things

| What | Where |
|------|-------|
| Product Requirements | [./school-cms-prd.md](./school-cms-prd.md) |
| Pricing Strategy | [./school-cms-pricing.md](./school-cms-pricing.md) |
| Design System | [./school-design-document.md](./school-design-document.md) |
| Architecture & Setup Guides | [./context/architecture.md](./context/architecture.md) |
| Security & Access Rules | [./context/constraints.md](./context/constraints.md) |
| Tech Stack Glossary | [./context/glossary.md](./context/glossary.md) |
| Dev Journal & Decisions | [./notes.md](./notes.md) |
| Competitive Analysis | [./context/competitive-teardown.md](./context/competitive-teardown.md) |


## Status

### Completed
- [x] update ./wiggum/notes and ./wiggum/context/* files to match the new ./wiggum/school-cms-prd.md ./wiggum/school-cms-pricing.md ./wiggum/school-design-document.md requirements
- [x] Market research and competitive teardown: "Why we beat FACTS for 500-student school" (see ./context/competitive-teardown.md)
- [x] Refactor marketing pages to match new design style and marketing copy and mission
  - Updated global styles (src/styles.css) with trust-first palette: Navy (#1F2A44), Evergreen (#2F5D50), Off-white (#F7F5F2)
  - Updated root layout with Libre Baskerville + Inter fonts
  - Completely rewrote home page (index.tsx) with school enrollment messaging
  - Completely rewrote about page with Enrollsy mission and values
  - Updated contact page with form that sends email to jake@dubsado.com
  - Newsletter signup has double opt-in via Brevo (sends confirmation email)
- [x] Create terms of service page (/terms) and privacy policy (/privacy) with GDPR specific guidelines
  - Terms of Service covers: acceptable use, data ownership, payment terms, liability
  - Privacy Policy covers: data collection, GDPR rights, CCPA rights, data retention, security, international transfers
- [x] use Playwright MCP and Playwright testing standards to create a suite of tests to cover 80% or more of the student management software user stories
  - Installed Playwright testing framework with Chromium browser
  - Created comprehensive E2E test suite in `/e2e/` directory:
    - `marketing-pages.spec.ts` - Tests for home, about, contact, terms, privacy pages
    - `authentication.spec.ts` - Login, registration, session management tests
    - `demo-pages.spec.ts` - Interactive demo testing for admin and family demos
    - `super-admin.spec.ts` - Platform super admin dashboard tests
    - `school-admin.spec.ts` - School administration dashboard tests
    - `family-portal.spec.ts` - Parent/family portal tests
    - `fixtures.ts` - Reusable test utilities and authentication helpers
  - Added npm scripts: `test:e2e`, `test:e2e:ui`, `test:e2e:headed`, `test:e2e:report`
  - Coverage includes all user journeys: Platform Admin, School Staff, Family
  - Tests validate: navigation, authentication, access control, UI elements
- [x] run the e2e tests in headless mode and fix the tests until they are all passing (and not skipped)

### Todo

- [ ] rebrand to Sage Enroll (come up up updated colors; make messaging feel more sage like)

---

## Quick Commands

```bash
npm run dev                    # Dev server :3000
npm run build                  # Production build
npx drizzle-kit push           # Apply migrations
npx inngest-cli@latest dev     # Inngest dev server :8288
```

### Verify Routes

```bash
for route in "/" "/login" "/about" "/contact"
   "/admin" "/portal"; do code=$(curl -s -o /dev/null
    -w "%{http_code}" "http://localhost:3000$route");
    echo "$route: $code"; done
```

---

*"Me fail English? That's unpossible!"* - Ralph
