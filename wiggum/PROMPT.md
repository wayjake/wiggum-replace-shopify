> **EnrollSage** - Wise guidance for enrollment journeys
> "From first inquiry to tuition paid—with wisdom, not chaos."

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

#### Super Admin Dashboard (`/super-admin`)
- [x] Create `/super-admin/schools/new` - School creation form
- [x] Create `/super-admin/schools/$id` - Individual school management page
- [x] Create `/super-admin/settings` - Platform settings page

#### School Admin Dashboard (`/admin`)
- [x] Create `/admin/leads/new` - Add new lead form
- [x] Create `/admin/families/new` - Register new family form
- [x] Create `/admin/leads/$id` - Lead detail page with full CRM functionality
- [x] Create `/admin/applications/$id` - Application detail page with status workflow
- [x] Implement lead stage progression (convert lead to applicant)
- [x] Implement application status workflow (review, accept, deny, waitlist)
- [x] Add student enrollment actions (enroll accepted students)

#### Family Portal (`/portal`)
- [x] Create `/portal/apply` - Start new application flow
- [x] Create `/portal/settings` - Family account settings
- [x] Create `/portal/applications/$id` - Application detail view
- [x] Implement "Pay Now" button (Stripe integration)
- [x] Implement "Add Card" payment method (Stripe Elements)

#### Misc UI Fixes
- [x] Fix emoji in `/portal/billing` header (was 🎓, now 🌿)

### Todo

(All items complete! 🎉)
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
