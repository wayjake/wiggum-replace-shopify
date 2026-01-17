# 📝 Development Notes

```
    ╭─────────────────────────────────────────────────────────╮
    │                                                          │
    │   "I eated the purple berries..."                        │
    │                                                          │
    │   These notes taste better. They're knowledge berries.   │
    │                                                          │
    ╰─────────────────────────────────────────────────────────╯
```

---

## 🧭 Project Journey Log

### Day 0: The Beginning

Started with a fresh TanStack Start template. It came with demo routes showing off SSR, server functions, and API endpoints. The bones are good - now we build the body.

**Current State:**
- ✅ TanStack Start v1.132.0 working
- ✅ Tailwind CSS configured
- ✅ Lucide icons available
- ✅ File-based routing operational
- ⏳ Demo routes need cleanup
- ⏳ No database yet
- ⏳ No payment system
- ⏳ No user authentication
- ⏳ No email system
- ⏳ No background jobs

---

## 🗺️ Implementation Breadcrumbs

### Phase 1: Foundation

```
TODO:
├── [ ] Create cn() utility in utils.ts
├── [ ] Install Drizzle + Turso dependencies
├── [ ] Set up database schema files (users, products, orders, payment_methods)
├── [ ] Configure drizzle.config.ts
├── [ ] Create env detection utility
├── [ ] Set up favicon and site metadata infrastructure
└── [ ] Build installation wizard route
```

### Phase 2: Stripe Integration

```
TODO:
├── [ ] Install Stripe SDK
├── [ ] Create Stripe verification utility
├── [ ] Build /api/stripe/verify endpoint
├── [ ] Create Stripe gate middleware
└── [ ] Design blocked-by-stripe UI component
```

### Phase 3: Brevo Email Integration

```
TODO:
├── [ ] Install @sendinblue/client package
├── [ ] Create Brevo client utility (src/lib/brevo.ts)
├── [ ] Define email template IDs as constants
├── [ ] Build sendTransactionalEmail helper
├── [ ] Build addContactToList helper
└── [ ] Create Brevo webhook handler for delivery status
```

### Phase 4: Inngest Event System

```
TODO:
├── [ ] Install inngest package
├── [ ] Create Inngest client (src/lib/inngest.ts)
├── [ ] Define event types (shop/order.completed, etc.)
├── [ ] Build orderCompleted function
├── [ ] Build welcomeDripCampaign function
├── [ ] Build fulfillmentWorkflow function
├── [ ] Create /api/inngest endpoint
└── [ ] Test with Inngest dev server locally
```

### Phase 5: User Authentication (Magic Link / Passwordless)

```
TODO:
├── [ ] Create users schema with role field (no password!)
├── [ ] Create magic_tokens schema for magic link tokens
├── [ ] Create payment_methods schema
├── [ ] Build session management utilities
├── [ ] Create requireAuth middleware
├── [ ] Create requireAdmin middleware
├── [ ] Build /login route (email input only)
├── [ ] Build /auth/verify route (handles magic link tokens)
├── [ ] Create sendMagicLink utility (generates token + sends via Brevo)
├── [ ] Create verifyMagicToken utility (validates + creates session)
├── [ ] Add MAGIC_LINK email template to Brevo
├── [ ] Add rate limiting for magic link requests
└── [ ] Build logout functionality
```

### Phase 6: Storefront UI

```
TODO:
├── [ ] Design landing page (with proper meta tags!)
├── [ ] Build product catalog components
├── [ ] Create product detail page
├── [ ] Implement shopping cart state
├── [ ] Build checkout flow
└── [ ] Style with soap brand aesthetics
```

### Phase 7: Admin Dashboard

```
TODO:
├── [ ] Create admin layout with sidebar navigation
├── [ ] Build dashboard home with stats/charts
├── [ ] Create product management CRUD views
├── [ ] Build order management with fulfillment actions
├── [ ] Add "Mark as Shipped" (triggers Inngest event)
├── [ ] Create customer overview page
└── [ ] Build store settings page
```

### Phase 8: Customer Portal

```
TODO:
├── [ ] Create customer portal layout
├── [ ] Build order history view
├── [ ] Add order detail with tracking
├── [ ] Create payment method management (Stripe integration)
├── [ ] Build address management
├── [ ] Add profile settings
└── [ ] Implement reorder functionality
```

---

## 💡 Ideas & Considerations

### Cart State Management

*Where should cart state live?*

**Options considered:**
1. **URL params** - Shareable but ugly for multiple items
2. **localStorage** - Persists across sessions, client-only
3. **Server session** - Syncs across devices, requires auth
4. **Hybrid** - localStorage + sync on checkout

**Decision:** Start with localStorage for simplicity. Can upgrade to server sessions later if needed.

### Product Images

*Where to store product images?*

**Options:**
1. **Turso** - Base64 in database (bad idea, too slow)
2. **Vercel Blob** - Good for Vercel deployments
3. **Cloudflare R2** - Cheap, S3-compatible
4. **External URLs** - Simple, reference existing images

**Decision:** Use external URLs for MVP. Can migrate to blob storage later.

### Migration Strategy

*How to run migrations in production?*

```typescript
// Option A: Run at startup
// In app entry point:
await migrate(db, { migrationsFolder: './migrations' });

// Option B: Separate deploy step
// In package.json:
"deploy": "drizzle-kit push && vercel deploy"

// Option C: Turso automatic
// Use drizzle-kit push in CI/CD
```

**Decision:** Option C - let drizzle-kit push handle it in deployment.

### User Authentication Strategy

*How to handle user auth?*

**Options considered:**
1. **Password-based** - Traditional, but users forget passwords
2. **OAuth only** - Good UX but requires third-party setup
3. **Magic links** - Passwordless, email-based, simple and secure
4. **Passkeys** - Future-proof but browser support varies

**Decision:** Magic links (passwordless email authentication).
- Users enter email → receive a login link → click to sign in
- No passwords to remember, forget, or reset
- Works perfectly with our Brevo email integration
- Simple database schema (just users + magic_tokens tables)
- Session-based auth with cookies after verification
- Great UX: "Check your email for a sign-in link"

### Email Template Management

*Where to manage email content?*

**Options:**
1. **Brevo Dashboard** - Visual editor, non-developers can edit
2. **Code templates** - Full control, version controlled
3. **Hybrid** - Structure in Brevo, dynamic content from code

**Decision:** Use Brevo templates with dynamic params. Store template IDs in constants.
This lets the store owner customize emails without code changes.

### Drip Campaign Timing

*How aggressive should the welcome sequence be?*

**Timing:**
- Day 0: Welcome email (immediate)
- Day 3: Soap care tips
- Day 7: Review request

**Considerations:**
- Don't overwhelm new customers
- Respect inbox fatigue
- Always include unsubscribe

### Site Metadata Strategy

*How to ensure consistent metadata?*

**Approach:**
- Create a `createMeta()` utility function
- Enforce title format: "{Page} | Karen's Beautiful Soap"
- Default description with override capability
- Include og:image for all product pages

**Reminder:** Every new route MUST have proper meta tags!

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
   schema.products is the TABLE definition
   db.query.products is the QUERY interface
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
   Double-check which mode you're in!

⚠️ Webhook Secret per Environment
   Each environment needs its own webhook endpoint.
   Each endpoint has its own secret. Don't mix them!

⚠️ Payment Method Sync
   When customer saves a card, sync to our payment_methods table.
   Use Stripe webhooks to stay updated on changes.
```

### Brevo Gotchas

```
⚠️ Daily Sending Limits
   Free tier: 300 emails/day
   Don't trigger mass emails that exceed limits.
   Queue if necessary.

⚠️ Template ID Changes
   If you delete and recreate a template in Brevo,
   the ID changes! Update your constants.

⚠️ Sender Verification
   Emails from unverified senders get blocked.
   Verify your domain or sender email first.

⚠️ Variable Syntax
   Brevo uses {{ params.VARIABLE_NAME }} syntax.
   Must match exactly what you send in the API call.
```

### Inngest Gotchas

```
⚠️ Local Dev Server Required
   Run: npx inngest-cli@latest dev
   Opens http://localhost:8288 for testing.
   Without it, events just disappear locally.

⚠️ Step Durability
   Anything outside step.run() might run multiple times.
   Put all side effects inside step.run() calls.

⚠️ Sleep Limitations
   step.sleep() max duration varies by plan.
   For very long waits, consider scheduled events.

⚠️ Event Ordering
   Events are processed independently.
   Don't rely on event order - make operations idempotent.
```

### Magic Link Gotchas

```
⚠️ Token Expiry
   Tokens expire in 15 minutes. Users may not check email immediately.
   Show clear messaging about expiry and offer "resend" option.

⚠️ Email Deliverability
   Magic links depend on email arriving. If Brevo has issues,
   users can't log in. Monitor email delivery rates.

⚠️ Same Response for All Emails
   Always show "Check your email" even if email doesn't exist.
   This prevents email enumeration attacks.

⚠️ Multiple Devices
   Magic link creates session on whatever device clicks it.
   User might click on phone but wanted to log in on desktop.
   Consider showing "Sign in on this device?" confirmation.

⚠️ Token Cleanup
   Old tokens accumulate. Run periodic cleanup job to delete
   expired/used tokens (Inngest scheduled function is perfect).
```

---

## 🎨 Design Notes

### Color Palette Rationale

```
Forest Green (#2D5A4A)
├── Represents: Nature, organic, growth
├── Use: Primary buttons, headers, accents
└── Accessibility: Works on light backgrounds

Cream (#F5EBE0)
├── Represents: Purity, softness, natural
├── Use: Backgrounds, card surfaces
└── Note: Not pure white - warmer, more organic

Warm Honey (#D4A574)
├── Represents: Handcrafted, warmth, natural ingredients
├── Use: Accents, hover states, highlights
└── Pairs well: With forest green for contrast

Charcoal (#1A1A1A)
├── Represents: Sophistication, elegance
├── Use: Text, dark mode backgrounds
└── Note: Softer than pure black
```

### Typography Choices

```
Playfair Display (Headings)
├── Style: Serif, elegant, editorial
├── Weights: 400, 600, 700
└── Feeling: Luxurious, artisanal

Karla (Body Text)
├── Style: Sans-serif, clean, readable
├── Weights: 400, 500, 600
└── Feeling: Modern, approachable
```

---

## 📊 Metrics to Track

```
User Journey Metrics:
├── Installation completion rate
├── Time from start to Stripe configured
├── Cart abandonment rate
└── Checkout completion rate

Technical Metrics:
├── Page load times (FCP, LCP)
├── Database query latency
├── Stripe API response times
└── Error rates by type
```

---

## 🔮 Future Considerations

### Nice to Have (Post-MVP)

- [ ] Product variants (size, scent intensity)
- [ ] Subscription boxes (monthly soap delivery) - Use Stripe Subscriptions
- [ ] Advanced inventory management with low stock alerts
- [ ] Reviews and ratings system
- [ ] Gift cards and store credit
- [ ] Discount codes and promotions
- [ ] Abandoned cart recovery emails (via Inngest)
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Customer referral program
- [ ] Social login (Google, Apple) - optional alongside magic links

### Email Enhancement Ideas

- [ ] Birthday discount emails (requires DOB in profile)
- [ ] Re-engagement campaigns for dormant customers
- [ ] Product restock notifications
- [ ] Personalized recommendations based on purchase history
- [ ] Post-review thank you emails

### Technical Debt Watch

- Monitor bundle size as features grow
- Consider server-side cart if localStorage becomes limiting
- May need image optimization pipeline (Vercel Blob or Cloudflare R2)
- Watch for N+1 query patterns in product listings
- Session cleanup job for expired sessions
- Brevo rate limit handling
- Inngest function monitoring and alerting

---

## 📖 References & Resources

### Documentation Links

- [TanStack Start Docs](https://tanstack.com/start)
- [Drizzle ORM Docs](https://orm.drizzle.team)
- [Turso Docs](https://docs.turso.tech)
- [Stripe Checkout Docs](https://stripe.com/docs/checkout)
- [Stripe Payment Methods](https://stripe.com/docs/payments/save-and-reuse)
- [Brevo API Docs](https://developers.brevo.com)
- [Inngest Docs](https://www.inngest.com/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

### Inspiration

- Karen's Beautiful Soap (karensbeautifulsoap.com)
- Lush Cosmetics (brand aesthetic)
- Glossier (clean e-commerce UX)

---

```
    ╭─────────────────────────────────────────────────────────╮
    │                                                          │
    │   "That's where I'm a Viking!"                           │
    │                                                          │
    │   Future developers: Add your notes here.                │
    │   This section is for the adventurers who come after.    │
    │                                                          │
    ╰─────────────────────────────────────────────────────────╯
```

---

*Last updated: The eternal now*
*Next developer to touch this: You're doing great, champ.* 🧼
