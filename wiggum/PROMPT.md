> TanStack Start e-commerce platform for **Karen's Beautiful Soap**

## Where to Find Things

| What | Where |
|------|-------|
| Architecture & Setup Guides | [./context/architecture.md](./context/architecture.md) |
| Security & Access Rules | [./context/constraints.md](./context/constraints.md) |
| Tech Stack Glossary | [./context/glossary.md](./context/glossary.md) |
| Dev Journal & Decisions | [./notes.md](./notes.md) |
| Brand Source | https://karensbeautifulsoap.com/ |
| Product Assets | Fetch from source site's `/shop` and `/gallery` |


## Status

### Next


### Future Ideas

### Completed
- [x] Google OAuth integration with GCP (setup instructions in install wizard, optional env vars)
- [x] Database seeding with products, categories, and test users (npx tsx src/db/seed.ts)
- [x] Database initialization step in install wizard (run migrations + seed with one click)
- [x] Product management in admin dashboard (create, edit, delete, image gallery, stock management)
- [x] Database schema & migrations
- [x] Product catalog with loaders
- [x] Stripe checkout integration (Embedded Checkout - customers stay on site!)
- [x] Auth (login/register/sessions)
- [x] Auth guards (requireAuth, requireAdmin)
- [x] Admin dashboard (products, orders, customers, reviews)
- [x] Customer portal (orders, addresses, payment)
- [x] Cart state (Context + localStorage)
- [x] Inngest email workflows
- [x] Brevo transactional emails
- [x] Order fulfillment actions
- [x] Setup wizard (`/install`) with env var management
- [x] About & Contact pages
- [x] 404 page & error boundaries
- [x] Newsletter signup with welcome email
- [x] Redirect to /install if env vars missing
- [x] Dev mode: Update .env from install wizard UI
- [x] Post-purchase email via Inngest
- [x] Abandoned cart email (with rate limiting)
- [x] Product reviews system with moderation (pending/approved/rejected)
- [x] Database seed with Unsplash product images
- [x] Customer order history (real orders from DB)
- [x] Product image upload in admin (drag & drop, URL input, gallery images)
- [x] Inventory management (low stock alerts, real-time dashboard stats)
- [x] Email order confirmations with tracking links (+ auto USPS tracking URL, resend confirmation)
- [x] Multiple product images in gallery carousel (swipe, arrows, thumbnails, drag-to-reorder in admin)
- [x] Discount codes / coupons (percentage, fixed, free shipping; usage limits, date ranges)
- [x] Admin page for managing discount codes (create, toggle, delete, usage tracking)
- [x] Gift cards (create, validate, redeem at checkout, admin management, balance adjustments)
- [x] Rate limiting on auth routes (sliding window, IP-based, configurable blocks)
- [x] CSRF protection (double-submit cookie, React hooks, form integration)
- [x] Production Stripe webhooks (order creation, Inngest events, stock updates)
- [x] Inngest dev server detection (auto-complete installation step when localhost:8288 is running)


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
for route in "/" "/shop" "/about" "/contact" "/cart" "/login" "/register" "/install"; do \
  code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000$route"); \
  [ "$code" = "200" ] && echo "✓ $route" || echo "✗ $route ($code)"; \
done
```

---

*"Me fail English? That's unpossible!"* - Ralph
