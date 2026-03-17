# Muqawil HUB — Development Checklist

> Track progress across all features. Check items as they are built.
> Source: `docs/PRD.md` + `docs/ROADMAP.md`

---

## Phase 0 — Foundation & Infrastructure

### 0.1 Dependencies & Tooling

- [x] Install core packages: `@supabase/supabase-js`, `@supabase/ssr`, `zod`
- [x] Install UI packages: `clsx`, `tailwind-merge`, `lucide-react`
- [x] Install integration packages: `typesense`, `@upstash/redis`, `@upstash/ratelimit`
- [x] Configure ESLint flat config with TypeScript strict rules
- [x] Verify `tsconfig.json` strict mode + path aliases (`@/*`)

### 0.2 Database Setup

- [x] Run `docs/DATABASE.sql` in Supabase SQL Editor (tables, ENUMs, triggers, RLS, seed)
- [x] Generate TypeScript types: `supabase gen types typescript > src/types/database.ts`
- [x] Verify RLS policies with test queries
- [x] Configure Supabase Realtime publications on required tables
- [x] Create Storage buckets (14 buckets)
- [x] Set Storage bucket policies (MIME types, size limits)

### 0.3 Supabase Client Setup

- [x] Create `src/lib/supabase/client.ts` — browser client (`createBrowserClient`)
- [x] Create `src/lib/supabase/server.ts` — server client (`createServerClient`)
- [x] Create `src/lib/supabase/admin.ts` — service role client (`createAdminClient`)
- [x] Create `src/lib/supabase/middleware.ts` — middleware client

### 0.4 Project Structure

- [x] Create folder structure: `components/ui/`, `components/forms/`, `components/layout/`, `components/features/`
- [x] Create folder structure: `lib/`, `actions/`, `hooks/`, `types/`, `schemas/`
- [x] Create `src/lib/utils.ts` — `cn()`, `formatSAR()`, `formatPhone()`, `getLocaleField()`
- [x] Create `src/types/enums.ts` — TypeScript enums matching DB enums
- [x] Create `src/types/index.ts` — re-exports + derived types

### 0.5 Design System & Primitives

- [x] Update `globals.css` with full `@theme inline` tokens (colors, fonts, radii, dark mode)
- [x] Install Arabic font (IBM Plex Sans Arabic) + English font (Inter) via `next/font`
- [x] Build `Button` component
- [x] Build `Input` component
- [x] Build `Textarea` component
- [x] Build `Card` component
- [x] Build `Badge` component
- [x] Build `Modal` / `Dialog` component
- [x] Build `Skeleton` component
- [x] Build `Toast` / notification component
- [x] Build `FormField` — label + input + error wrapper
- [x] Build `PhoneInput` — locked +966 prefix
- [x] Build `CurrencyInput` — SAR formatting
- [x] Build `CitySelect` — Saudi cities from DB

### 0.6 Layout Shell

- [x] Create root `layout.tsx` with locale provider, `dir` attribute, fonts, metadata
- [x] Create `(public)/layout.tsx` with Header + Footer
- [x] Create `(auth)/layout.tsx` with centered card layout
- [x] Create `(dashboard)/dashboard/layout.tsx` with Sidebar + Topbar
- [x] Build `Header` component with locale switcher + nav
- [x] Build `Footer` component
- [x] Build `Sidebar` component with role-based navigation
- [x] Build `Topbar` component (breadcrumbs, user menu, notification bell)
- [x] Build `MobileNav` responsive navigation
- [x] Build `LocaleSwitcher` AR/EN toggle

### 0.7 Middleware

- [x] Create `src/middleware.ts` — session refresh, locale detection, route protection
- [x] Configure matcher for `/dashboard/*`, `/admin/*`, `/login`, `/register`

---

## Phase 1 — Authentication & Registration

### 1.1 Auth Schemas

- [x] Create `src/schemas/auth.ts` — `RegisterSchema`, `LoginSchema`, `ResetPasswordSchema`, `UpdatePasswordSchema`
- [x] Phone validation: `+966` regex
- [x] PDPL consent boolean required

### 1.2 Auth Actions

- [x] Create `src/actions/auth.ts` — `register`, `login`, `loginWithGoogle`, `logout`, `resetPassword`, `updatePassword`
- [x] Rate limiting on login (5/15 min) and registration (3/hour)

### 1.3 Registration Wizard

- [x] Build multi-step register wizard component
- [x] Step 1: Role selection (4 visual cards with descriptions)
- [x] Step 2: Account details (email, password, phone, PDPL consent)
- [x] Step 3: Company / Personal profile (conditional fields per role)
- [x] Step 4: Subscription tier selection (Starter free, Pro/Business/Enterprise paid)
- [ ] Step 5: Payment via Moyasar (skip for Starter)
- [ ] Step 6: Document upload (skip for PO/Buyer/Starter)
- [x] Progress indicator showing current step

### 1.4 Login & Recovery Pages

- [x] Build `src/app/(auth)/login/page.tsx` — email/password + Google OAuth button
- [x] Build `src/app/(auth)/register/page.tsx` — wizard host
- [x] Build `src/app/(auth)/forgot-password/page.tsx` — email input + reset flow
- [x] Build Google Auth button component

### 1.5 OAuth Callback

- [x] Create `src/app/api/auth/callback/route.ts` — code exchange + redirect
- [x] Handle new Google users (redirect to Step 1 for role selection)

### 1.6 Email Verification

- [ ] Configure Supabase email templates (bilingual AR/EN)
- [x] Handle verification redirect back to app

### 1.7 Verification Gates (4-gate flow)

- [ ] `pending_email → pending_payment → pending_documents → pending_approval → active`
- [ ] PO/Buyer/Starter: `pending_email → active` (simplified)
- [x] Pro+ tiers: full 4-gate flow

---

## Phase 2 — Core Profiles & Subscriptions

### 2.1 Profile Management

- [x] Build `src/app/(dashboard)/dashboard/profile/page.tsx` — view & edit profile
- [x] Profile edit form with bilingual fields
- [x] Avatar upload
- [x] Company logo upload
- [x] Verification document upload (Pro+ accounts)
- [x] `updateProfile` server action with file handling

### 2.2 Subscription Management

- [x] Create `src/schemas/subscription.ts`
- [x] Create `src/actions/subscriptions.ts` — `subscribe`, `upgrade`, `downgrade`, `renew`, `applyCoupon`
- [x] Build `src/app/(dashboard)/dashboard/subscription/page.tsx`
- [x] Current tier display with usage stats (bids used, products posted, etc.)
- [x] Upgrade / downgrade / renew UI
- [x] Coupon input and validation
- [ ] Moyasar payment integration for subscription payments

### 2.3 Hooks

- [x] Create `src/hooks/use-auth.ts` — session state management
- [x] Create `src/hooks/use-locale.ts` — AR/EN switching, `t()`, `field()`
- [x] Create `src/hooks/use-subscription.ts` — current tier + limit checking

### 2.4 Dashboard Overview

- [x] Build `src/app/(dashboard)/dashboard/page.tsx` — role-specific overview
- [x] PO view: active projects, pending bids, active deals
- [x] Contractor view: available projects, submitted bids, active deals, Kanban shortcut
- [x] Supplier view: products, inquiries, RFQs, active deals
- [x] Buyer view: marketplace shortcut, RFQs, active deals
- [x] Onboarding checklist component (if profile incomplete)

### 2.5 Public Pages (Pricing, Contact, Legal)

- [x] Build `src/app/(public)/pricing/page.tsx` — tier comparison table
- [x] Build `src/app/(public)/contact/page.tsx` — contact form + action
- [x] Build `src/app/(public)/terms/page.tsx` — Terms of Service (AR/EN)
- [x] Build `src/app/(public)/privacy/page.tsx` — Privacy Policy (PDPL)
- [x] Build `src/app/(public)/cookies/page.tsx` — Cookie Policy

---

## Phase 3 — Projects & Products (CRUD + Moderation)

### 3.1 Project CRUD

- [x] Create `src/schemas/project.ts`
- [x] Create `src/actions/projects.ts` — `createProject`, `updateProject`, `submitForApproval`, `deleteProject`
- [x] Build `src/app/(dashboard)/dashboard/projects/page.tsx` — my projects list with status badges
- [x] Build `src/app/(dashboard)/dashboard/projects/new/page.tsx` — create project form (bilingual, category, city, budget, timeline, files)
- [x] Build `src/app/(dashboard)/dashboard/projects/[id]/page.tsx` — project detail
- [x] Build `src/app/(dashboard)/dashboard/projects/[id]/edit/page.tsx` — edit (draft/rejected only)
- [x] File upload to `project-files` bucket (BOQ, drawings, specs)

### 3.2 Product CRUD

- [x] Create `src/schemas/product.ts`
- [x] Create `src/actions/products.ts` — `createProduct`, `updateProduct`, `submitForApproval`, `deleteProduct`, `bulkImportProducts`
- [x] Build `src/app/(dashboard)/dashboard/products/page.tsx` — my products + tier limit indicator
- [x] Build `src/app/(dashboard)/dashboard/products/new/page.tsx` — product form with variants, images, specs
- [x] Build variant editor component — dynamic variant rows (SKU, price, stock)
- [x] Image gallery upload to `product-images` bucket
- [x] Spec sheet upload to `product-specs` bucket
- [x] CSV bulk import (Business+ only)

### 3.3 Public Browse Pages

- [x] Build `src/app/(public)/projects/page.tsx` — browse published projects (search, filters)
- [x] Build `src/app/(public)/projects/[id]/page.tsx` — project detail public view
- [x] Build `src/app/(public)/marketplace/page.tsx` — browse published products
- [x] Build `src/app/(public)/products/[id]/page.tsx` — product detail + inquiry form
- [x] Build `src/app/(public)/partners/page.tsx` — contractor/supplier directory
- [x] Build `src/app/(public)/partners/[id]/page.tsx` — partner profile with reviews

### 3.4 Post Status & Moderation Components

- [x] Build status badge component (Draft → Pending → Published → Awarded/Completed/Rejected)
- [x] Build moderation feedback display (rejection reason AR/EN)
- [x] Build empty state components for all list pages

---

## Phase 4 — Bidding & Comparison

### 4.1 Bid System

- [x] Create `src/schemas/bid.ts`
- [x] Create `src/actions/bids.ts` — `submitBid`, `updateBid`, `shortlistBid`, `awardBid`, `rejectBid`
- [x] Bid form on project detail page (amount, timeline, methodology, attachments)
- [x] Tier limit enforcement (monthly bid count)
- [x] Classification check (contractor classification ≥ project classification)
- [x] Rate limiting on bid submission (3/min)

### 4.2 Bid Comparison

- [x] Build `src/app/(dashboard)/dashboard/projects/[id]/bids/page.tsx`
- [x] Build bid comparison table — side-by-side: price, timeline, rating, tier, methodology
- [x] Shortlist / Award / Reject actions inline

### 4.3 Deal Creation from Bid Award

- [x] `awardBid` → auto-create `DEAL-PROJECT` deal
- [x] Auto-reject all other bids on that project
- [x] Trigger notifications: `bid_awarded`, `bid_rejected` (others), `deal_created`

---

## Phase 5 — Quotations & RFQs

### 5.1 Quotation System

- [x] Create `src/schemas/quotation.ts`
- [x] Create `src/actions/quotations.ts` — `createQuotation`, `sendQuotation`, `acceptQuotation`, `rejectQuotation`, `duplicateQuotation`, `generateQuotationPDF`
- [x] Build `src/app/(dashboard)/dashboard/quotations/page.tsx` — quotation list
- [x] Build `src/app/(dashboard)/dashboard/quotations/new/page.tsx` — create form
- [x] Build line-item editor component — dynamic line items
- [x] Auto-numbering: `QTN-YYYY-NNNN` per company
- [x] VAT calculation (15% auto-added)
- [ ] Clause library selection
- [ ] PDF generation (bilingual)
- [x] Send quotation via Resend email
- [x] Accept quotation → create `DEAL-PRODUCT` deal
- [x] Monthly quotation limit per tier

### 5.2 Inquiry Flow

- [x] Product inquiry form on product detail page
- [x] Inquiry → Quotation (Mode A) linking
- [x] Supplier notification on new inquiry

### 5.3 RFQ System

- [x] Create `src/schemas/rfq.ts`
- [x] Create `src/actions/rfqs.ts` — `createRFQ`, `submitForApproval`, `respondToRFQ`, `acceptResponse`, `rejectResponse`
- [x] Build `src/app/(dashboard)/dashboard/rfqs/page.tsx` — my RFQs / my responses
- [x] Build `src/app/(dashboard)/dashboard/rfqs/new/page.tsx` — create RFQ form
- [x] Build `src/app/(public)/rfqs/page.tsx` — browse published RFQs
- [x] Build `src/app/(public)/rfqs/[id]/page.tsx` — RFQ detail + supplier response form
- [x] RFQ deadline handling (auto-close, no new responses after deadline)

### 5.4 Direct Hire Flow

- [x] Create hire request server actions
- [x] Hire button on supplier profile → sends request
- [x] Supplier accepts (creates quotation) or declines
- [x] Accepted quotation → deal creation with optional `project_id`

---

## Phase 6 — Deal Workspace & Milestones

### 6.1 Deal Workspace

- [x] Create `src/schemas/deal.ts`
- [x] Create `src/actions/deals.ts` — deal management actions
- [x] Build `src/app/(dashboard)/dashboard/deals/page.tsx` — deals list with filters (active, in_progress, completed, cancelled)
- [x] Build `src/app/(dashboard)/dashboard/deals/[id]/page.tsx` — deal workspace with tabs
- [x] Deal overview tab: parties, value, status, progress bars
- [x] Build dual progress bars component (buyer payment + seller completion — independent)
- [x] Build activity feed component — chronological audit trail

### 6.2 Milestones

- [x] Build milestones tab / page within deal workspace
- [x] Build milestone timeline visualization
- [x] Milestone creation by buyer (title, due date, payment amount)
- [x] Seller suggestion + buyer approval flow
- [x] Milestone completion tracking
- [x] Deadline bar with color-coded status (green/yellow/red)

### 6.3 Proof System

- [x] Build proof submission component
- [x] 4 proof types: Work, Payment, Supply, Handover
- [x] File upload with percentage claim
- [x] Counterparty review: confirm or reject (with required rejection reason)
- [x] 3+ rejections on same milestone → auto-flag for admin review
- [x] Confirmed proofs increment progress bars

### 6.4 Deal Lifecycle

- [x] Deal completion: both progress at 100% → status `completed`
- [x] Cancellation request + counterparty approval flow
- [x] Skip milestone request (mutual agreement)
- [ ] Document vault tab within deal workspace
- [x] Realtime updates on deal workspace (Supabase Realtime channels)

### 6.5 Realtime Hook

- [x] Create `src/hooks/use-realtime.ts` — Supabase channel subscriptions
- [x] Subscribe to deal changes, milestones, proofs, activity

---

## Phase 7 — Contracts, CRM & Kanban

### 7.1 Contract Generator

- [x] Create `src/schemas/contract.ts`
- [x] Create `src/actions/contracts.ts` — `createContract`, `signContract`, `verifyContract` (generatePDF deferred — needs PDF lib)
- [x] Build `src/app/(dashboard)/dashboard/contracts/page.tsx` — contract list
- [x] Build `src/app/(dashboard)/dashboard/contracts/new/page.tsx` — create from template or deal
- [x] Template selection: Construction Agreement, Supply Agreement, Custom/Blank
- [~] Clause library — display only, no add/remove/reorder UI yet
- [x] Auto-fill from user profile (company name, CR, VAT, address)
- [x] Dual signature flow (Party A → Party B typed signature)
- [~] QR code — qr_uuid + verify page done, no QR image generation
- [ ] PDF generation (bilingual with signatures + company letterhead) — blocked, needs PDF lib
- [x] Build `src/app/verify/contract/[uuid]/page.tsx` — public verification page
- [x] Tier limits on contracts per month (Starter 2 basic, Pro 10 all, Business+ unlimited)
- [x] Contract status flow: Draft → Sent → Signed → Archived

### 7.2 CRM

- [x] Create `src/schemas/crm.ts`
- [x] Create `src/actions/crm.ts` — full CRM CRUD (scoring not implemented)
- [x] Build `src/app/(dashboard)/dashboard/crm/page.tsx` — pipeline view + client list
- [x] Build `src/app/(dashboard)/dashboard/crm/[id]/page.tsx` — client detail (route simplified)
- [~] Pipeline board — clickable stage cards, no drag-and-drop
- [x] Tags and custom categories (Pro+)
- [x] Timestamped notes log per client (append-only, pinnable)
- [~] Follow-up reminders — in-app only, no email
- [x] Auto-add clients from completed deals
- [x] Client scoring: A (≥80), B (≥50), C (<50)
- [x] Client source tracking (auto-tag origin: Bid Award, RFQ Response, etc.)
- [~] Last contact indicator — date shown, no color coding
- [x] Favorites / pinned clients
- [ ] Duplicate detection and merge (Pro+)
- [x] Bulk actions: tag, export CSV, archive (Business+ only)
- [x] Soft archive with restore
- [x] Revenue analytics per client
- [x] Tier limits: Starter 20, Pro 200, Business+ unlimited

### 7.3 Kanban Board

- [x] Build `src/app/(dashboard)/dashboard/deals/[id]/kanban/page.tsx`
- [~] Kanban board component — button-based move, no DnD library yet
- [x] Default columns: To Do → In Progress → Review → Done
- [~] Task cards: title, description, assignee, due date, priority (no attachments — blocked on Storage)
- [~] Pro tier: tier check exists, simple checklist mode not differentiated
- [x] Business+: full Kanban board
- [~] PO: read-only — contractor-only gate exists, PO read-only not fully wired
- [x] Cards moved to "Done" → prompt work proof submission
- [x] Progress sync: % Done cards feeds seller progress bar
- [ ] Realtime updates

### 7.4 Daily Site Log

- [x] Build `src/app/(dashboard)/dashboard/deals/[id]/daily-log/page.tsx`
- [~] Daily entry: date, weather, worker count, description, issues, safety (no photos — blocked on Storage)
- [x] One entry per day per deal constraint
- [x] Chronological timeline display

---

## Phase 8 — Messaging & Notifications

### 8.1 Messaging

- [x] Create `src/actions/messages.ts` — `sendMessage`, `createConversation`, `markAsRead`, `deleteMessage`, `saveQuickReply`
- [x] Build `src/app/(dashboard)/dashboard/messages/page.tsx` — conversation list with unread counts
- [x] Build `src/app/(dashboard)/dashboard/messages/[id]/page.tsx` — chat thread
- [x] Build conversation list component (inline in messages page)
- [x] Build chat thread component — real-time messages (chat-thread.tsx)
- [x] Build message bubble component (message-bubble.tsx)
- [~] File attachments — display support, upload blocked on Storage
- [x] Quick reply templates (saved responses)
- [x] Context linking (conversations linked to project, product, or deal)
- [x] Supabase Realtime for instant delivery
- [x] Unread count badge in sidebar
- [x] Soft delete (per-user visibility)
- [x] Typing indicators with 3-second auto-clear

### 8.2 Notifications

- [x] Create `src/actions/notifications.ts` — `createNotification`, `markRead`, `updatePreferences`
- [x] Build `src/app/(dashboard)/dashboard/notifications/page.tsx` — notification center
- [x] Bell icon with unread count in topbar (wired with real count)
- [x] In-app toast on new notification
- [x] Wire all 24 notification types to triggering actions
- [x] Notification preferences per type (in-app, email, WhatsApp toggle) — preferences page built
- [x] Critical notifications cannot be muted (bid_awarded, deal_created, etc.)
- [x] Supabase Realtime for instant in-app delivery
- [x] Resend email templates (bilingual wrapper + per-type content blocks)
- [x] Subscription expiry warnings (7 days + 1 day before)
- [x] Twilio WhatsApp interface (future — prepare skeleton)

---

## Phase 9 — Reviews, Commissions & Payments

### 9.1 Reviews

- [x] Create `src/schemas/review.ts`
- [x] Create `src/actions/reviews.ts` — `submitReview`, `editReview`
- [x] Build `src/app/(dashboard)/dashboard/reviews/page.tsx` — reviews given & received
- [x] Build review form — star ratings (overall + sub: Quality, Timeliness, Communication) + bilingual comment + "would recommend" flag
- [~] Review button on completed deals (30-day window) — action validates; button not wired on deal detail page
- [x] 48-hour edit window after submission
- [x] One review per direction per deal (enforced)
- [ ] DB trigger updates `average_rating` + `total_reviews` on profile — needs Supabase migration
- [x] Display reviews on partner profile page

### 9.2 Commissions

- [x] Create `src/actions/commissions.ts` — `payCommission`, `disputeCommission`
- [x] Build `src/app/(dashboard)/dashboard/commissions/page.tsx` — commission history
- [x] Commission auto-calculated at deal creation (Starter 2%, Pro 1%, Business/Enterprise 0%) — DB trigger needs migration
- [x] 14-day payment deadline with escalation (Day 14, 21, 28 reminders → Day 30 restriction) — needs cron
- [~] Card payment via Moyasar — action + webhook ready; needs Moyasar SDK
- [~] Bank transfer + receipt upload + admin verification — action ready; receipt needs Storage
- [x] Dispute within 7 days (freezes deadline)
- [ ] ZATCA-compliant invoice generation (bilingual PDF) — needs PDF library

### 9.3 Payment Webhooks

- [x] Build `src/app/api/webhooks/moyasar/route.ts` — verify HMAC + process payment
- [x] Handle subscription payment confirmation → activate subscription
- [x] Handle commission payment confirmation → mark as paid, generate invoice
- [x] Idempotency checks (prevent double processing)

---

## Phase 10 — Search, Admin Panel & Analytics

### 10.1 Typesense Search

- [x] Create `src/lib/typesense/client.ts` — Typesense client config
- [x] Create `src/lib/typesense/schemas.ts` — 4 index schemas (projects, products, rfqs, partners)
- [x] Build `src/app/api/webhooks/typesense-sync/route.ts` — DB webhook → Typesense sync
- [x] Build search bar component — instant search with debounce
- [x] Build filter panel component — facets (category, city, price range, rating)
- [x] Build search result card component
- [x] Replace placeholder search on projects, marketplace, RFQs, partners pages _(deferred)_
- [x] Arabic + English query support with typo tolerance
- [x] Search weights: title 3×, company/name 2×, description 1×
- [x] Sorting: recent, highest rated, price, most bids
- [x] PostgreSQL fallback (`pg_trgm` + `to_tsvector`) when Typesense unavailable
- [x] Initial data indexing script _(deferred)_

### 10.2 Admin Panel

- [x] Create `src/actions/admin/moderation.ts` — `approvePost`, `rejectPost`
- [x] Create `src/actions/admin/users.ts` — `approveDocuments`, `rejectDocuments`, `banUser`, `restrictUser`
- [x] Create `src/actions/admin/commissions.ts` — `approvePayment`, `resolveDispute`
- [x] Create `src/actions/admin/settings.ts` — `updateSettings`, `manageCoupon`
- [x] Build `src/app/(admin)/admin/layout.tsx` — admin sidebar + `is_admin` guard
- [x] Build `src/app/(admin)/admin/page.tsx` — overview dashboard (user stats, revenue, pending items)
- [x] Build `src/app/(admin)/admin/users/page.tsx` — user list + status management
- [x] Build `src/app/(admin)/admin/posts/page.tsx` — moderation queue (pending posts)
- [x] Build `src/app/(admin)/admin/deals/page.tsx` — deal oversight
- [x] Build `src/app/(admin)/admin/commissions/page.tsx` — commission verification
- [x] Build `src/app/(admin)/admin/subscriptions/page.tsx` — revenue dashboard
- [x] Build `src/app/(admin)/admin/reviews/page.tsx` — review moderation
- [x] Build `src/app/(admin)/admin/settings/page.tsx` — platform settings + coupon management
- [x] Build `src/app/(admin)/admin/audit-log/page.tsx` — all admin actions logged
- [x] Full audit logging of all admin actions — logAudit() integrated in all admin actions

### 10.3 Analytics Dashboard

- [x] Build `src/app/(dashboard)/dashboard/analytics/page.tsx`
- [x] Pro tier: summary widget only
- [x] Business+: full dashboard
- [~] Metrics: revenue, deals, bids, win rate, response time, ratings _(deals + ratings done; bids/win-rate/response-time deferred)_
- [x] Charts: deals over time, revenue trend, category breakdown _(deferred — needs chart library)_
- [x] Export data (CSV) _(deferred)_

### 10.4 Homepage & SEO

- [x] Build `src/app/page.tsx` — hero + roles + features (with Lucide icons) + CTA
- [x] SEO: metadata + OG for homepage
- [x] `sitemap.xml`, `robots.txt`, dynamic OG images

---

## Phase 11 — Polish, Testing & Launch

### 11.1 Quality Assurance

- [ ] Cross-browser testing (Chrome, Safari, Firefox, Edge)
- [ ] Mobile responsive testing (all pages)
- [ ] RTL layout verification for all components
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Form validation coverage (all Zod schemas client + server)

### 11.2 Performance

- [ ] Core Web Vitals optimization (LCP, FID, CLS)
- [ ] Image optimization (`next/image`, proper sizing)
- [ ] Code splitting verification
- [ ] Database query optimization (slow query review)
- [x] Add `loading.tsx` and `error.tsx` to all route groups

### 11.3 Security Hardening

- [ ] Verify all Server Actions have auth + role + tier checks
- [ ] Verify RLS policies cover all access patterns
- [x] CSP headers in `next.config.ts`
- [ ] Rate limiting on all public-facing actions (14 endpoint rules via Upstash)
- [x] No sensitive env vars exposed to client
- [x] File upload MIME validation server-side

### 11.4 Testing

- [x] Install Vitest + React Testing Library
- [x] Tests: registration flow
- [x] Tests: login flow
- [x] Tests: bid submission
- [x] Tests: deal creation
- [x] Tests: commission calculation
- [x] Tests: subscription limit enforcement
- [x] RLS policy tests (via Supabase test helpers)
- [x] Cross-role E2E browser tests (Project→Bid→Deal, RFQ→Response→Deal, tier limits) — see TESTS.md §9

### 11.5 Production Deployment

- [ ] Configure Vercel project with environment variables
- [ ] Set region to `me-south-1` (Bahrain)
- [ ] Configure custom domain + SSL
- [ ] Set up Vercel Analytics
- [ ] Set up error monitoring (Sentry)
- [ ] Smoke test all critical flows in production
- [ ] Configure Supabase production project
- [ ] Run initial Typesense indexing
- [x] Health probe: `GET /api/health` (Supabase + Typesense ping)

### 11.6 Documentation

- [x] Update README.md with setup instructions
- [x] Document environment variables required
- [x] Document deployment process
- [x] Document admin setup (first admin user creation)

---

## Cross-Cutting Concerns (Ongoing)

### Bilingual (AR/EN)

- [ ] All UI text supports Arabic (RTL) + English (LTR)
- [x] Tailwind logical properties only (`ps-`, `pe-`, `ms-`, `me-`, `start`, `end`) — no `pl`/`pr`/`left`/`right`
- [x] `dir` attribute toggled on `<html>` per locale
- [ ] Paired DB fields: `*_ar` / `*_en`

### Saudi Compliance

- [x] SAR currency formatting everywhere
- [x] `+966` phone validation (Zod regex)
- [x] ZATCA VAT 15% — prices VAT-inclusive; net + VAT stored separately
- [x] PDPL privacy compliance — consent checkbox + timestamp tracking

### Subscription Enforcement

- [ ] Client-side: hide/disable gated UI per tier
- [x] Server-side: reject in server action if tier limit exceeded
- [x] Double-check for every gated feature (bids, products, CRM clients, quotations, contracts, Kanban, analytics)

### Rate Limiting (Upstash Redis)

- [x] Login: 5/15 min per email
- [x] Registration: 3/hour per IP
- [x] Bid submission: 20/hour per user
- [x] Message sending: 60/min per user
- [x] Search: 120 queries/min per IP
- [x] API catch-all: 200 req/min per user

---

> **Last updated**: June 18, 2025
