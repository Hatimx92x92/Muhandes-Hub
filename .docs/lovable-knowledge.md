# Muqawil HUB — Lovable Custom Knowledge

## Project Overview

Muqawil HUB is a bilingual (Arabic/English) B2B marketplace for the Saudi construction industry. It connects Project Owners, Contractors, Suppliers, and Buyers through project bidding, product procurement, RFQs, deal workspaces, and subscription-based services.

- **Production URL**: https://www.muqawilhub.com
- **Domain**: Saudi construction B2B marketplace
- **Languages**: Arabic (RTL) primary, English (LTR) secondary — full bilingual support, no machine translation
- **Currency**: SAR (Saudi Riyal) — all prices VAT-inclusive (15% ZATCA)

---

## User Personas & Roles

Four immutable roles — one per account, chosen at registration, cannot change.

### Project Owner (Free)

- Posts construction projects, compares contractor bids, manages deals
- Profile type: Company or Personal
- Can post RFQs to source materials from Suppliers
- Can hire Suppliers directly for project needs
- Can upload a company profile PDF (brochure/capability statement)
- Unlimited projects, RFQs, contracts, CRM, and full analytics

### Contractor (Paid — Starter/Pro/Business/Enterprise)

- Browses projects, submits bids, tracks work via Kanban and daily site logs
- Profile type: Company (required)
- Can also post subcontract projects and receive bids
- Can post RFQs, send quotations, and hire Suppliers
- Subscription limits: bids/month (10/50/100/∞), CRM clients (20/200/∞/∞)
- Commission on deals: Starter 2%, Pro 1%, Business/Enterprise 0%

### Supplier (Paid — Starter/Pro/Business/Enterprise)

- Lists products, responds to inquiries and RFQs, ships orders
- Profile type: Company (required)
- Can post RFQs to source from other Suppliers
- Subscription limits: product posts (2/10/50/∞), CRM clients (20/200/∞/∞)
- Business+ tiers: CSV bulk product upload
- Commission on deals: same as Contractor

### Buyer (Free)

- Posts RFQs, compares quotations from Suppliers, sources materials
- Profile type: Company or Personal
- Limited dashboard: RFQs, deals, messages only
- No CRM, no contracts, no analytics

---

## Design Guidelines

### Visual Direction

- Premium, professional, construction-industry aesthetic
- Inspired by Procore/Fieldwire — clean, modern, trustworthy
- Dark mode support via `prefers-color-scheme`

### Bilingual & RTL Layout Rules

- Every page, component, and text string must support Arabic (RTL) and English (LTR)
- Use CSS logical properties only: `padding-inline-start/end`, `margin-inline-start/end`, `inset-inline-start/end`
- NEVER use `left`, `right`, `padding-left`, `padding-right`, `margin-left`, `margin-right` for layout
- Tailwind equivalents: use `ps-`, `pe-`, `ms-`, `me-`, `start-`, `end-` — never `pl-`/`pr-`/`ml-`/`mr-`
- The `dir` attribute on `<html>` switches between `rtl` and `ltr`
- Paired DB fields for all user-facing text: `title_ar`/`title_en`, `description_ar`/`description_en`
- All user-entered bilingual content is entered manually — never auto-translate

### Typography

- Primary Latin font: Geist Sans
- Monospace font: Geist Mono
- Arabic font: should complement Geist (consider IBM Plex Arabic or Noto Sans Arabic)

### Color System

- Light: white background (#ffffff), dark foreground (#171717)
- Dark: near-black background (#0a0a0a), light foreground (#ededed)
- Use CSS custom properties via Tailwind v4 `@theme inline` for all design tokens
- Role-specific accent colors recommended for dashboard differentiation

### Component Patterns

- Cards for content display (project cards, product cards, bid cards, deal cards)
- Modals for confirmations, quick actions, and form overlays
- Badges for status indicators (post status, deal status, subscription tier, CRM client score)
- Tables with sorting and filtering for data-heavy views (bids comparison, CRM client list)
- Kanban board (drag-and-drop) for Contractor task management
- Pipeline/funnel board (drag-and-drop) for CRM client stages
- Timeline views for deal milestones, activity logs, and photo timelines
- Multi-step wizard for registration flow (6 steps)
- Tab-based navigation for deal workspace sections

---

## Page Structure & Routing

### Public Pages (No auth required)

- `/` — Homepage: animated hero, live platform stats, featured showcase carousel, trust indicators
- `/pricing` — Subscription tier comparison with duration selector and coupon input
- `/marketplace` — Product catalog with Typesense search, filters (category, price, rating, city)
- `/projects` — Project listings with search/filters (owner identity blurred for unauthenticated users)
- `/partners` — Contractor + Supplier directory with search and filters
- `/contact` — Contact form (name, email, company, message, role interest)
- `/terms` — Terms of Service (bilingual, versioned)
- `/privacy` — Privacy Policy (bilingual, PDPL-compliant)
- `/cookies` — Cookie Policy

### Auth Pages

- `/login` — Email/password login + Google OAuth button
- `/register` — Multi-step wizard: Role → Account → Profile → Subscription → Payment → Documents
- `/forgot-password` — Password reset via email

### Dashboard Pages (Authenticated, role-gated)

The sidebar and available pages change based on the user's role:

**All roles**: `/dashboard` (overview), `/dashboard/deals`, `/dashboard/messages`, `/dashboard/profile`, `/dashboard/subscription`, `/dashboard/notifications`, `/dashboard/reviews`

**Project Owner adds**: `/dashboard/projects`, `/dashboard/rfqs`, `/dashboard/contracts`, `/dashboard/crm`, `/dashboard/analytics`

**Contractor adds**: `/dashboard/bids`, `/dashboard/projects` (subcontracts), `/dashboard/rfqs`, `/dashboard/deals/[id]/kanban`, `/dashboard/deals/[id]/daily-log`, `/dashboard/contracts`, `/dashboard/crm`, `/dashboard/analytics`, `/dashboard/quotations`

**Supplier adds**: `/dashboard/products`, `/dashboard/inquiries`, `/dashboard/rfqs`, `/dashboard/hire-requests`, `/dashboard/contracts`, `/dashboard/crm`, `/dashboard/analytics`, `/dashboard/quotations`, `/dashboard/bulk-upload` (Business+)

**Buyer adds**: `/dashboard/rfqs`

### Admin Panel (is_admin guard)

- `/admin` — Overview stats
- `/admin/users` — User management and verification
- `/admin/posts` — Post moderation queue (approve/reject with bilingual feedback)
- `/admin/deals` — Deal oversight
- `/admin/commissions` — Commission verification and payment tracking
- `/admin/subscriptions` — Revenue dashboard
- `/admin/reviews` — Review moderation
- `/admin/settings` — Platform settings, Typesense re-index
- `/admin/audit-log` — Audit trail

---

## Core Feature Specifications

### Registration & Verification

- Multi-step wizard adapts to selected role
- Google OAuth via PKCE flow (Supabase Auth) — email pre-filled, still requires phone + role steps
- Phone validation: `+966` Saudi format (regex: `^\+966[0-9]{9}$`)
- PDPL consent checkbox required at registration
- Four-gate verification for Pro+ tiers: Email → Payment → Documents → Admin Approval
- PO/Buyer/Starter: Email verification → instant access
- Verification states: `pending_email → pending_payment → pending_documents → pending_approval → active`

### Post Status Workflow (All post types)

```
Draft → Pending → Published → Awarded / Completed / Rejected
```

- All posts require admin approval before publishing
- Only `published` posts appear in search results
- Admin rejection includes bilingual feedback reason

### Project Bidding (Contractors)

- Bid fields: proposed amount, timeline, methodology, attachments
- Comparison table: side-by-side matrix (bidder, price, timeline, rating, past projects, tier) — sortable
- A/B/C classification can restrict bidding eligibility
- Award flow: owner awards bid → Deal created automatically
- Project source badge: "Direct from Owner" or "Subcontract"

### Product Listings (Suppliers)

- Pricing model: Fixed Price or Variant-Based (size, color, grade — each with own price/SKU/stock)
- Media: image galleries (max 5 MB/image), specification sheets
- Each product shows "Request Quotation" button → creates pre-filled RFQ
- CSV bulk import for Business+ tiers

### RFQ System (All roles can post)

- Lifecycle: `Draft → Pending Approval → Published → Responses Open → Awarded → Closed`
- Can be standalone or linked to a project or product
- Suppliers respond with quotations including pricing and delivery terms
- Poster reviews responses → accepts one → Deal created

### Quotation System

- Two modes: Inquiry Response (linked to inquiry/RFQ/hire-request) and Standalone
- Fields: client name, line items (description, qty, unit, unit price), subtotal, VAT 15%, total, validity period, payment terms, delivery terms
- Auto-incrementing number per company: `QTN-YYYY-NNNN`
- Professional PDF export with company branding, bilingual layout
- Reusable clause/terms library
- Status: `Draft → Sent → Viewed → Accepted → Rejected → Expired`
- Tier limits: Starter 3/mo, Pro 20/mo, Business+ unlimited

### Deal Workspace

- Created ONLY when a bid is awarded or quotation is accepted — no other trigger
- Deal types: `DEAL-PROJECT` (from bid award) and `DEAL-PRODUCT` (from quotation/RFQ/hire)
- Statuses: `active → in_progress → completed | cancelled | disputed`
- Milestone timeline with named milestones, due dates, and progress tracking
- Dual progress bars: seller (work/supply completion 0–100%) and buyer (payment completion 0–100%)
- Proof system: Payment/Work/Supply/Handover proofs with file attachments and confirm/reject workflow
- Embedded chat per deal with auto-tagged messages
- Document vault with version control
- PDF export of completed deals with QR verification code

### Kanban Board (Contractor — per deal)

- Columns: To Do → In Progress → Review → Done (customizable names)
- Task cards: title, description, assignee, due date, priority (Low/Medium/High/Critical), attachments
- Cards moved to "Done" trigger Work Proof submission prompt
- Progress syncs to deal's seller progress bar
- Pro tier: simplified checklist only; Business+: full Kanban

### Daily Site Log (Contractor)

- Structured entries: date, weather, workers on site, work description, issues/blockers, safety notes, photos
- Chronological diary viewable by both contractor and project owner

### Contract Generator

- Templates: Construction Agreement, Supply Agreement, Custom/Blank
- Auto-fill from user profile (company name, CR number, VAT number)
- Reusable clause library for payment/penalty/warranty terms
- Bilingual PDF export with company letterhead
- Typed acknowledgment fields (not legally-binding e-signature in v1)
- QR verification code on signed PDFs → `/verify/contract/{uuid}`
- Can be standalone or linked to a deal (auto-fills both parties and deal terms)
- Status: `Draft → Sent → Signed → Archived`

### CRM — Client Management

- Client database with name, phone, email, company, notes, tags
- Auto-added from completed deals; manual entry supported
- Pipeline/funnel Kanban: Lead → In Negotiation → Active Deal → Completed → Repeat
- Client scoring: A/B/C based on deal completion rate (30%), payment timeliness (25%), deal volume (25%), review rating (20%)
- Source tracking: Bid Award, RFQ Response, Direct Hire, Product Inquiry, Manual Entry
- Last contact health indicator: Green (<30d), Yellow (30–90d), Red (>90d)
- Timestamped notes log per client with pin support
- Follow-up reminders, favorites/pinning, duplicate detection/merge, bulk actions, archiving
- Revenue analytics: per-client summary, top clients leaderboard, revenue trends
- Tier limits: Starter 20 clients, Pro 200, Business+ unlimited

### Performance Analytics

- Available: Business+ full dashboard, Pro summary widget only
- Metrics: profile views, bid win rate, inquiry conversion rate, deal stats (completed vs cancelled, avg value, revenue), response time trends, rating breakdown
- CSV export

### Review & Rating System

- Eligible after deal `completed`, 30-day window, one per direction per deal
- Components: 1–5 stars overall (required), sub-ratings (Quality, Timeliness, Communication), "Would recommend" boolean, bilingual written comments
- 48-hour edit window after submission
- Database trigger updates `average_rating` and `total_reviews` on profiles

### Notification System (20+ types)

- Categories: Bidding, Inquiries, Quotations, Deals, Payments, Reviews, Subscriptions, Documents, Posts, RFQs, Supplier Hire
- Delivery: in-app bell (real-time via Supabase Realtime), email (via Resend), dashboard
- Some notifications are always-on (bid_awarded, deal_created, deal_completed, payment_confirmed, commission_due)
- Users can customize email preferences for non-critical notifications

### Real-Time Messaging

- Context-aware conversations linked to projects, products, or deals
- File attachments (10 MB max), typing indicators (3s auto-clear), unread tracking
- Quick reply templates for common inquiries
- Powered by Supabase Realtime

### Search & Discovery (Typesense)

- Four indexes: projects, products, rfqs, partners
- Multi-language (Arabic + English), typo tolerance, faceted search
- Search weights: titles 3×, company/product names 2×, descriptions 1×
- Filters: category, price range, rating, city/region, supplier tier, availability
- Fallback: PostgreSQL `pg_trgm` + `to_tsvector` if Typesense unavailable

---

## Subscription & Payment

### Tiers

| Tier       | Price/mo | Commission | Key limits                                                                            |
| ---------- | -------- | ---------- | ------------------------------------------------------------------------------------- |
| Starter    | Free     | 2%         | 10 bids, 2 products, 3 quotations, 20 CRM clients, no Kanban/analytics                |
| Pro        | SAR 200  | 1%         | 50 bids, 10 products, 20 quotations, 200 CRM clients, checklist + summary analytics   |
| Business   | SAR 500  | 0%         | 100 bids, 50 products, unlimited quotations/CRM, full Kanban + analytics, bulk upload |
| Enterprise | SAR 800  | 0%         | Unlimited everything, dedicated support                                               |

- All prices VAT-inclusive (15%)
- Duration discounts: 5% (3 months), 15% (6 months), 35% (12 months)
- Coupon system: percentage or fixed, no stacking, applied after duration discount
- Coupon rules: first-purchase-only flag, renewal eligibility, tier/role restrictions, max SAR cap, usage limits
- Limits enforced both client-side (hide/disable UI) AND server-side (reject in action)

### Commission Workflow

- Auto-calculated at deal creation from seller's tier rate
- Triggered when deal status → `completed`
- 14-day payment deadline; 30-day overdue → account restricted
- Dispute window: 7 days after notification
- Payment via Moyasar (card auto-verified, bank transfer manual admin verification)
- ZATCA-compliant invoice generated on completion

### Payment Gateway (Moyasar)

- Card: Visa/MasterCard with 3D Secure — auto-verified
- Bank transfer: manual admin verification
- Used for subscriptions and commission payments

---

## Security & Compliance

### Authentication

- Supabase Auth: email/password + Google OAuth (PKCE flow)
- Session refresh via middleware on every request
- Route protection: `/dashboard/*` requires auth, `/admin/*` requires `is_admin`
- `is_admin` flag only settable via service role key

### Data Protection

- Row Level Security (RLS) on all Supabase tables — never bypass except admin actions
- Service role key (`SUPABASE_SERVICE_ROLE_KEY`) is server-only, never exposed to client
- File upload limits: 10 MB documents, 5 MB images, MIME type validation server-side
- Rate limiting on bid submission, RFQ creation, message sending
- CRM client data is private to each user

### Regulatory Compliance

- ZATCA VAT 15% — all displayed prices VAT-inclusive; stored net + VAT separately in DB
- PDPL (Saudi Personal Data Protection Law) — registration consent checkbox required, consent tracking
- Bilingual Terms of Service and Privacy Policy with version history

---

## Coding Conventions

### Stack

- Next.js 16 (App Router), React 19, TypeScript strict mode
- Tailwind CSS v4 via `@tailwindcss/postcss` — no CSS modules
- Supabase (Postgres + Auth + Storage + Realtime) — no custom backend server
- Typesense for search, Moyasar for payments, Resend for email

### Architecture Rules

- Server Components by default — `'use client'` only for interactivity, hooks, browser APIs
- Mutations via Server Actions (in `src/actions/`), not API routes
- API routes only for webhooks and OAuth callbacks
- Path alias: `@/*` maps to `./src/*`

### Code Style

- No `any` in TypeScript — use Zod for runtime validation on both client and server
- Default exports for `page.tsx`/`layout.tsx`; named exports for reusable components
- Zod schemas in `src/schemas/` shared between client forms and server actions
- Use `cn()` utility (clsx + twMerge) for conditional Tailwind class composition
- SAR currency formatting, `+966` phone validation everywhere

### File Structure

```
src/
├── app/           # App Router pages & API routes
│   ├── (public)/  # Unauthenticated pages
│   ├── (auth)/    # Login, register, forgot-password
│   ├── (dashboard)/dashboard/  # Role-gated dashboard
│   ├── (admin)/admin/          # Admin panel (is_admin)
│   └── api/       # Webhooks only
├── components/    # Shared UI (ui/, forms/, layout/, features/)
├── lib/           # Supabase clients, Typesense, Moyasar, Resend, utils
├── actions/       # Server Actions by domain
├── hooks/         # Client-side React hooks
├── types/         # TypeScript types + Supabase generated types
├── schemas/       # Zod validation schemas
└── middleware.ts   # Auth + locale + route protection
```

---

## Key Database Enums (Reference)

- **Roles**: `project_owner`, `contractor`, `supplier`, `buyer`
- **Profile types**: `company`, `personal`
- **Verification states**: `pending_email`, `pending_payment`, `pending_documents`, `pending_approval`, `active`, `restricted`, `banned`
- **Subscription tiers**: `starter`, `pro`, `business`, `enterprise`
- **Post statuses**: `draft`, `pending`, `published`, `rejected`, `awarded`, `completed`, `expired`, `closed`
- **Deal types**: `deal_project`, `deal_product`
- **Deal statuses**: `active`, `in_progress`, `completed`, `cancelled`, `disputed`
- **Deal triggers**: `bid_award`, `inquiry_quotation`, `rfq_response`, `direct_hire`
- **Proof types**: `payment`, `work`, `supply`, `handover`
- **Proof statuses**: `pending`, `confirmed`, `rejected`, `disputed`
- **Quotation modes**: `inquiry_response`, `standalone`
- **Quotation statuses**: `draft`, `sent`, `viewed`, `accepted`, `rejected`, `expired`
- **Contract statuses**: `draft`, `sent`, `signed`, `archived`
- **Commission statuses**: `pending`, `approved`, `paid`, `disputed`, `overdue`
- **Bid statuses**: `pending`, `shortlisted`, `awarded`, `rejected`
- **Kanban priorities**: `low`, `medium`, `high`, `critical`
- **CRM pipeline stages**: `lead`, `in_negotiation`, `active_deal`, `completed`, `repeat`
- **Client sources**: `bid_award`, `rfq_response`, `direct_hire`, `product_inquiry`, `manual_entry`
- **Pricing models**: `fixed`, `variant`
- **Project sources**: `owner`, `subcontract`
- **Project classifications**: `a`, `b`, `c`

---

## Immutable Business Rules

These are enforced at the database level — never violate in application code:

1. Roles are immutable — one per account, set at registration, cannot change
2. Deals are created ONLY on bid award or quotation acceptance — no other trigger
3. All posts require admin approval before publishing
4. Subscription limits are double-enforced: client-side (UX) AND server-side (security)
5. `is_admin` flag only settable via service role key
6. Reviews only after deal `completed`, one per direction per deal, 30-day window, 48h edit window
7. Commission rates: Starter 2%, Pro 1%, Business/Enterprise 0% — auto-calculated at deal creation
