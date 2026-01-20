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

### Todo

#### Super Admin Dashboard (`/super-admin`)
- [ ] Create `/super-admin/schools/new` - School creation form
- [ ] Create `/super-admin/schools/$id` - Individual school management page
- [ ] Create `/super-admin/settings` - Platform settings page

#### School Admin Dashboard (`/admin`)
- [ ] Create `/admin/leads/new` - Add new lead form
- [ ] Create `/admin/families/new` - Register new family form
- [ ] Implement lead stage progression (convert lead to applicant)
- [ ] Implement application status workflow (review, accept, deny, waitlist)
- [ ] Add student enrollment actions (enroll accepted students)

#### Family Portal (`/portal`)
- [ ] Create `/portal/apply` - Start new application flow
- [ ] Create `/portal/settings` - Family account settings
- [ ] Create `/portal/applications/$id` - Application detail view
- [ ] Implement "Pay Now" button (Stripe integration)
- [ ] Implement "Add Card" payment method (Stripe Elements)

#### Misc UI Fixes
- [ ] Fix emoji in `/portal/billing` header (shows 🎓 instead of 🌿) 

#### Testing
- [ ] Add tests for each of the newly created features
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
