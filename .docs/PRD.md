# Muhandes HUB — Product Requirements Document (PRD)

> **Version**: 1.0  
> **Date**: March 4, 2026  
> **Status**: Draft  
> **Source**: `.docs/FEATURES.md` (v March 3, 2026)

---

## 1. Executive Summary

Muhandes HUB is a bilingual (Arabic/English) B2B marketplace purpose-built for the Saudi construction industry. It connects Project Owners, Contractors, Suppliers, and Buyers through a unified digital platform that manages the full project-to-procurement lifecycle: from posting construction projects and sourcing materials, through bidding and quotation, to deal execution, milestone tracking, and payment.

**Key Value Propositions:**

- **For Project Owners**: Post projects, receive competitive bids, compare contractors side-by-side, and manage deals with milestone-based progress tracking
- **For Contractors**: Discover projects, submit bids, manage work via Kanban boards and daily site logs, generate contracts, and build client relationships via CRM
- **For Suppliers**: List product catalogs, respond to RFQs and inquiries, send branded quotations, and track supply deals
- **For Buyers**: Post RFQs, compare supplier quotations, and source construction materials efficiently

**Target Market**: Saudi Arabian construction sector — contractors, suppliers, project owners, and procurement teams operating under Saudi regulations (ZATCA, PDPL).

---

## 2. Problem Statement

The Saudi construction industry suffers from:

1. **Fragmented sourcing**: No unified platform to connect project owners with contractors and suppliers; relies on personal networks, WhatsApp groups, and manual RFPs
2. **Opaque bidding**: No standardized comparison tools — project owners struggle to evaluate bids objectively
3. **Poor deal tracking**: Project execution lacks digital milestone tracking, proof systems, and transparent progress reporting
4. **Manual procurement**: Material sourcing via phone calls and in-person visits; no digital RFQ/quotation workflow
5. **No trust infrastructure**: No centralized review/rating system; no verified company profiles
6. **Compliance burden**: ZATCA VAT invoicing and PDPL privacy requirements add overhead without tooling support

---

## 3. User Personas

### 3.1 Project Owner (مالك المشروع)

- **Profile**: Real estate developer, government entity, or private company commissioning construction work
- **Motivation**: Find reliable contractors at competitive prices with transparent project tracking
- **Pain Points**: Cannot easily compare contractors, no visibility into project progress, manual contract management
- **Success Metric**: Time from project posting to bid award < 14 days; deal completion rate > 85%

### 3.2 Contractor (مقاول)

- **Profile**: Licensed construction company (A/B/C classification) seeking project opportunities
- **Motivation**: Win profitable projects, manage work efficiently, build reputation
- **Pain Points**: Limited project discovery, no portfolio visibility, manual bid processes, no integrated project management
- **Success Metric**: Bid win rate > 15%; monthly project pipeline value growth

### 3.3 Supplier (مورد)

- **Profile**: Construction materials manufacturer or distributor
- **Motivation**: Reach more buyers, manage orders digitally, reduce sales cycle friction
- **Pain Points**: Limited market reach, manual quotation generation, no digital product catalog
- **Success Metric**: Inquiry-to-deal conversion rate > 25%; response time < 4 hours

### 3.4 Buyer (مشتري)

- **Profile**: Procurement manager or small business sourcing construction materials
- **Motivation**: Compare suppliers, get competitive quotations, source materials efficiently
- **Pain Points**: No centralized supplier directory, manual RFQ processes, price opacity
- **Success Metric**: RFQ response rate > 60%; average quotation comparison time < 2 days

---

## 4. Functional Requirements

### FR-AUTH: Authentication & Registration

| ID         | Requirement                                                           | Priority | Role                        |
| ---------- | --------------------------------------------------------------------- | -------- | --------------------------- |
| FR-AUTH-01 | Multi-step registration wizard (6 steps) adapting to selected role    | P0       | All                         |
| FR-AUTH-02 | Role selection via visual cards (immutable after registration)        | P0       | All                         |
| FR-AUTH-03 | Email/password authentication with Supabase Auth                      | P0       | All                         |
| FR-AUTH-04 | Google OAuth registration/login via PKCE flow                         | P1       | All                         |
| FR-AUTH-05 | Phone number validation (`+966XXXXXXXXX`)                             | P0       | All                         |
| FR-AUTH-06 | Profile type selection: Company or Personal (PO, Buyer only)          | P0       | PO, Buyer                   |
| FR-AUTH-07 | Company profile fields: name AR/EN, CR number, website                | P0       | All with company            |
| FR-AUTH-08 | Subscription tier selection during registration (Contractor/Supplier) | P0       | Contractor, Supplier        |
| FR-AUTH-09 | Moyasar payment integration for paid tiers (3D Secure)                | P0       | Contractor, Supplier        |
| FR-AUTH-10 | Document upload: VAT Certificate + Commercial License (Pro+ tiers)    | P0       | Contractor, Supplier        |
| FR-AUTH-11 | 4-gate verification: email → payment → documents → admin approval     | P0       | Contractor, Supplier (Pro+) |
| FR-AUTH-12 | Email verification flow with magic link                               | P0       | All                         |
| FR-AUTH-13 | Password reset via email                                              | P0       | All                         |
| FR-AUTH-14 | PDPL consent checkbox with timestamp tracking                         | P0       | All                         |
| FR-AUTH-15 | Google account linking/unlinking from profile settings                | P2       | All                         |

### FR-POSTS: Content Management

| ID          | Requirement                                                                           | Priority | Role                 |
| ----------- | ------------------------------------------------------------------------------------- | -------- | -------------------- |
| FR-POSTS-01 | Create/edit/delete project posts with bilingual title + description                   | P0       | PO, Contractor       |
| FR-POSTS-02 | Project attributes: budget range, timeline, scope, city, classification, source badge | P0       | PO, Contractor       |
| FR-POSTS-03 | Project file attachments: BOQ, drawings, images, specs (up to 5 GB per file)          | P0       | PO, Contractor       |
| FR-POSTS-04 | Create/edit/delete product posts with bilingual content                               | P0       | Supplier             |
| FR-POSTS-05 | Product pricing model: Fixed Price or Variant-Based (multiple SKUs)                   | P0       | Supplier             |
| FR-POSTS-06 | Product image gallery (max 5 images, 5 MB each) + spec sheets (50 MB PDF)             | P0       | Supplier             |
| FR-POSTS-07 | Optional inventory/stock tracking per product or variant                              | P1       | Supplier             |
| FR-POSTS-08 | CSV bulk import for products (Business+ tiers)                                        | P1       | Supplier             |
| FR-POSTS-09 | Admin approval workflow: Draft → Pending → Published / Rejected                       | P0       | All posters          |
| FR-POSTS-10 | Rejection feedback in AR + EN for re-submission                                       | P0       | Admin                |
| FR-POSTS-11 | Content limits enforcement per subscription tier (server-side)                        | P0       | Contractor, Supplier |
| FR-POSTS-12 | Pre-flight limit check before form display (client-side)                              | P0       | Contractor, Supplier |
| FR-POSTS-13 | Upgrade prompts when limits reached                                                   | P1       | Contractor, Supplier |

### FR-BID: Bidding System

| ID        | Requirement                                                               | Priority | Role                       |
| --------- | ------------------------------------------------------------------------- | -------- | -------------------------- |
| FR-BID-01 | Bid submission: amount, timeline, methodology, attachments                | P0       | Contractor                 |
| FR-BID-02 | Bid review dashboard with bidder profiles                                 | P0       | PO, Contractor (as poster) |
| FR-BID-03 | Side-by-side bid comparison table (sortable, best-in-category highlights) | P0       | PO, Contractor (as poster) |
| FR-BID-04 | Classification eligibility: A/B/C projects restrict bidding by tier       | P1       | System                     |
| FR-BID-05 | Bid status flow: Pending → Shortlisted → Awarded / Rejected               | P0       | System                     |
| FR-BID-06 | Bid award triggers deal creation                                          | P0       | System                     |
| FR-BID-07 | Monthly bid limit enforcement per subscription tier                       | P0       | System                     |
| FR-BID-08 | Race condition protection: bid submission before deadline (DB constraint) | P0       | System                     |

### FR-QUOT: Quotation System

| ID         | Requirement                                                                                 | Priority | Role                 |
| ---------- | ------------------------------------------------------------------------------------------- | -------- | -------------------- |
| FR-QUOT-01 | Mode A — Inquiry response quotation (linked to product inquiry, RFQ, or hire request)       | P0       | Contractor, Supplier |
| FR-QUOT-02 | Mode B — Standalone quotation (created independently at `/dashboard/quotations`)            | P0       | Contractor, Supplier |
| FR-QUOT-03 | Line items: description, quantity, unit, unit price with auto-calculated subtotal/VAT/total | P0       | Contractor, Supplier |
| FR-QUOT-04 | Auto-incrementing quotation number per company (QTN-YYYY-NNNN)                              | P0       | System               |
| FR-QUOT-05 | Company branding auto-applied (logo, letterhead, contact info)                              | P1       | Contractor, Supplier |
| FR-QUOT-06 | PDF export with branding, itemized table, totals, terms                                     | P0       | Contractor, Supplier |
| FR-QUOT-07 | Configurable validity period (48h default) with auto-expiry                                 | P0       | System               |
| FR-QUOT-08 | Revision support: up to 3 revisions before acceptance, history preserved                    | P1       | Contractor, Supplier |
| FR-QUOT-09 | Quotation acceptance triggers deal creation (DEAL-PRODUCT)                                  | P0       | System               |
| FR-QUOT-10 | Multi-quotation on same inquiry; accepting one auto-rejects others                          | P0       | System               |
| FR-QUOT-11 | Reusable clause/terms library for payment and delivery                                      | P1       | Contractor, Supplier |
| FR-QUOT-12 | Monthly quotation limit enforcement per tier                                                | P0       | System               |
| FR-QUOT-13 | Send via email (Resend integration)                                                         | P1       | Contractor, Supplier |

### FR-RFQ: Request for Quotation

| ID        | Requirement                                                                      | Priority | Role           |
| --------- | -------------------------------------------------------------------------------- | -------- | -------------- |
| FR-RFQ-01 | Create RFQ: title AR/EN, description AR/EN, category, quantity, budget, deadline | P0       | All roles      |
| FR-RFQ-02 | Product-linked RFQ (pre-filled from product's "Request Quotation" button)        | P0       | All roles      |
| FR-RFQ-03 | Project-linked RFQ (optional `project_id`)                                       | P1       | PO, Contractor |
| FR-RFQ-04 | Admin approval required before publishing                                        | P0       | System         |
| FR-RFQ-05 | Supplier response submission with quotation                                      | P0       | Supplier       |
| FR-RFQ-06 | Response acceptance triggers DEAL-PRODUCT creation with optional project_id      | P0       | System         |
| FR-RFQ-07 | Auto-close on deadline (no new responses, existing remain reviewable)            | P1       | System         |
| FR-RFQ-08 | Cannot delete RFQ with pending responses                                         | P0       | System         |

### FR-DEAL: Deal Workspace

| ID         | Requirement                                                                                  | Priority | Role              |
| ---------- | -------------------------------------------------------------------------------------------- | -------- | ----------------- |
| FR-DEAL-01 | Deal creation from 4 triggers: bid award, inquiry quotation, RFQ response, direct hire       | P0       | System            |
| FR-DEAL-02 | Human-readable title slug (e.g., `foundation-work-riyadh-tower`)                             | P1       | System            |
| FR-DEAL-03 | Named milestones with progress, due dates, payment amounts, sort order                       | P0       | Deal participants |
| FR-DEAL-04 | Milestone ownership: initiator creates/edits; counterparty suggests changes needing approval | P0       | Deal participants |
| FR-DEAL-05 | Dual progress bars: seller completion (0-100%) and buyer payment (0-100%) — independent      | P0       | System            |
| FR-DEAL-06 | Deadline bar: timeline visualization with color-coded status (green/yellow/red)              | P1       | System            |
| FR-DEAL-07 | Proof system: Payment, Work, Supply, Handover types with file attachments                    | P0       | Deal participants |
| FR-DEAL-08 | Proof confirmation/rejection with required rejection reasons                                 | P0       | Deal participants |
| FR-DEAL-09 | Confirmed proofs increment progress bars                                                     | P0       | System            |
| FR-DEAL-10 | Skip request (mutual agreement to waive progress tracking)                                   | P1       | Deal participants |
| FR-DEAL-11 | Cancellation request with counterparty approval (mutual auto-approve)                        | P0       | Deal participants |
| FR-DEAL-12 | Deal lifecycle: active → in_progress → completed / cancelled / disputed                      | P0       | System            |
| FR-DEAL-13 | Completion when both progress bars reach 100%                                                | P0       | System            |
| FR-DEAL-14 | Activity log (complete audit trail)                                                          | P0       | System            |
| FR-DEAL-15 | PDF export with Muhandes HUB branding, party logos, QR verification                           | P1       | Deal participants |
| FR-DEAL-16 | Auto-commission calculation from seller's tier at deal creation                              | P0       | System            |
| FR-DEAL-17 | Embedded context-aware chat within deal workspace                                            | P0       | Deal participants |
| FR-DEAL-18 | Real-time updates via Supabase Realtime                                                      | P0       | System            |
| FR-DEAL-19 | Proof rejected 3+ times on same milestone → auto-flag for admin review                       | P1       | System            |

### FR-KANBAN: Project Management

| ID           | Requirement                                                                 | Priority | Role              |
| ------------ | --------------------------------------------------------------------------- | -------- | ----------------- |
| FR-KANBAN-01 | Per-deal Kanban board (To Do → In Progress → Review → Done)                 | P0       | Contractor        |
| FR-KANBAN-02 | Task cards: title, description, assignee, due date, priority, attachments   | P0       | Contractor        |
| FR-KANBAN-03 | Drag-and-drop card movement across columns                                  | P0       | Contractor        |
| FR-KANBAN-04 | Cards moved to "Done" prompt work proof submission                          | P1       | System            |
| FR-KANBAN-05 | Progress sync: % of "Done" cards feeds seller progress bar                  | P1       | System            |
| FR-KANBAN-06 | View-only access for project owner; manage access for contractor            | P0       | PO, Contractor    |
| FR-KANBAN-07 | Tier gating: Pro = checklist only, Business+ = full Kanban                  | P0       | System            |
| FR-KANBAN-08 | Daily site log: date, weather, workers, description, issues, safety, photos | P0       | Contractor        |
| FR-KANBAN-09 | Document vault per deal: categorized, versioned, access-controlled          | P1       | Deal participants |
| FR-KANBAN-10 | Photo timeline: chronological visual from proofs, logs, tasks               | P2       | Deal participants |

### FR-CONTRACT: Contract Generator

| ID             | Requirement                                                                                 | Priority | Role                     |
| -------------- | ------------------------------------------------------------------------------------------- | -------- | ------------------------ |
| FR-CONTRACT-01 | Templates: Construction Agreement, Supply Agreement, Custom/Blank                           | P0       | PO, Contractor, Supplier |
| FR-CONTRACT-02 | Auto-fill from user profile (company name, CR, VAT, address)                                | P0       | System                   |
| FR-CONTRACT-03 | Bilingual layout (AR + EN)                                                                  | P0       | System                   |
| FR-CONTRACT-04 | Reusable clause library (warranty, penalty terms, etc.)                                     | P1       | Pro+ tiers               |
| FR-CONTRACT-05 | PDF export with company letterhead, bilingual layout, signature fields                      | P0       | All with access          |
| FR-CONTRACT-06 | Digital signature: acknowledgment fields (name, title, date — typed text, not drawn)        | P0       | Contract parties         |
| FR-CONTRACT-07 | QR verification code linking to `/verify/contract/{uuid}`                                   | P1       | System                   |
| FR-CONTRACT-08 | Audit trail: user ID, timestamp, IP address on "Sign" action                                | P0       | System                   |
| FR-CONTRACT-09 | Deal integration: "Generate Contract" from deal workspace, auto-fill deal terms             | P0       | Deal participants        |
| FR-CONTRACT-10 | Standalone use at `/dashboard/contracts` without deal link                                  | P0       | PO, Contractor, Supplier |
| FR-CONTRACT-11 | Status flow: Draft → Sent → Signed → Archived                                               | P0       | System                   |
| FR-CONTRACT-12 | Tier limits: Starter 2 basic templates, Pro all + 10/mo, Business+ all + custom + unlimited | P0       | System                   |

### FR-CRM: Client Relationship Management

| ID        | Requirement                                                                                            | Priority | Role                     |
| --------- | ------------------------------------------------------------------------------------------------------ | -------- | ------------------------ |
| FR-CRM-01 | Client database: name, phone, email, company, notes, tags                                              | P0       | PO, Contractor, Supplier |
| FR-CRM-02 | Auto-add clients from completed deals; manual addition supported                                       | P0       | System                   |
| FR-CRM-03 | Client scoring: A (≥80), B (≥50), C (<50) based on deal completion, payment timeliness, volume, rating | P1       | System                   |
| FR-CRM-04 | Pipeline/funnel view: Lead → In Negotiation → Active Deal → Completed → Repeat                         | P1       | Pro+ tiers               |
| FR-CRM-05 | Auto-progression based on deal status changes; manual override                                         | P1       | System                   |
| FR-CRM-06 | Timestamped notes log per client (append-only, pinnable)                                               | P0       | PO, Contractor, Supplier |
| FR-CRM-07 | Tags and categories (custom labels)                                                                    | P1       | Pro+ tiers               |
| FR-CRM-08 | Follow-up reminders (date-based, in-app + email)                                                       | P1       | Pro+ tiers               |
| FR-CRM-09 | Client source tracking: auto-tagged origin (Bid Award, RFQ Response, etc.)                             | P0       | System                   |
| FR-CRM-10 | Last contact indicator with color coding (green < 30d, yellow 30-90d, red > 90d)                       | P0       | System                   |
| FR-CRM-11 | Favorites/pinned clients (Starter 3, Pro 10, Business+ 20)                                             | P1       | All with CRM             |
| FR-CRM-12 | Duplicate detection and merge (Pro+ tiers)                                                             | P2       | Pro+ tiers               |
| FR-CRM-13 | Bulk actions: tag, export CSV, archive (Business+ only)                                                | P2       | Business+ tiers          |
| FR-CRM-14 | Soft archive with restore                                                                              | P1       | All with CRM             |
| FR-CRM-15 | Revenue analytics per client: total value, deal count, trend                                           | P1       | Pro+ tiers               |
| FR-CRM-16 | Tier limits: Starter 20 clients, Pro 200, Business+ unlimited                                          | P0       | System                   |
| FR-CRM-17 | Import/Export CSV (Business+ only)                                                                     | P2       | Business+ tiers          |

### FR-MSG: Messaging

| ID        | Requirement                                                        | Priority | Role   |
| --------- | ------------------------------------------------------------------ | -------- | ------ |
| FR-MSG-01 | Context-aware conversations linked to projects, products, or deals | P0       | All    |
| FR-MSG-02 | File attachments up to 10 MB (images, PDFs)                        | P0       | All    |
| FR-MSG-03 | Typing indicators with 3-second auto-clear                         | P1       | System |
| FR-MSG-04 | Per-participant unread count tracking                              | P0       | System |
| FR-MSG-05 | Soft delete (per-user visibility control)                          | P1       | All    |
| FR-MSG-06 | Quick reply templates (saved responses)                            | P2       | All    |
| FR-MSG-07 | Real-time delivery via Supabase Realtime                           | P0       | System |
| FR-MSG-08 | All conversations must be linked to a project, product, or deal    | P0       | System |

### FR-NOTIF: Notifications

| ID          | Requirement                                                              | Priority | Role   |
| ----------- | ------------------------------------------------------------------------ | -------- | ------ |
| FR-NOTIF-01 | 24 notification types across 11 categories                               | P0       | System |
| FR-NOTIF-02 | In-app delivery (dashboard bell) with real-time update                   | P0       | All    |
| FR-NOTIF-03 | Email delivery via Resend (per channel mapping rules)                    | P0       | System |
| FR-NOTIF-04 | Critical notifications (bid_awarded, deal_created, etc.) cannot be muted | P0       | System |
| FR-NOTIF-05 | User preference overrides for non-critical email notifications           | P1       | All    |
| FR-NOTIF-06 | Mark read / mark all read                                                | P0       | All    |
| FR-NOTIF-07 | Generic bilingual email wrapper template with per-type content blocks    | P0       | System |
| FR-NOTIF-08 | Subscription expiry warnings at 7 days and 1 day before                  | P0       | System |

### FR-REVIEW: Reviews & Ratings

| ID           | Requirement                                                                                      | Priority | Role              |
| ------------ | ------------------------------------------------------------------------------------------------ | -------- | ----------------- |
| FR-REVIEW-01 | Only after deal `completed`, by buyer or seller in the deal                                      | P0       | Deal participants |
| FR-REVIEW-02 | Overall rating 1-5 stars (required) + sub-ratings: Quality, Timeliness, Communication (optional) | P0       | Deal participants |
| FR-REVIEW-03 | "Would recommend" boolean flag                                                                   | P0       | Deal participants |
| FR-REVIEW-04 | Bilingual comments (user enters AR + EN manually)                                                | P0       | Deal participants |
| FR-REVIEW-05 | 30-day submission window after deal completion                                                   | P0       | System            |
| FR-REVIEW-06 | One review per direction per deal                                                                | P0       | System            |
| FR-REVIEW-07 | 48-hour edit window after submission                                                             | P0       | System            |
| FR-REVIEW-08 | Auto-update `average_rating` and `total_reviews` on profile via DB trigger                       | P0       | System            |

### FR-SUB: Subscriptions & Payments

| ID        | Requirement                                                                                   | Priority | Role                 |
| --------- | --------------------------------------------------------------------------------------------- | -------- | -------------------- |
| FR-SUB-01 | 4 subscription tiers: Starter (free), Pro (SAR 200), Business (SAR 500), Enterprise (SAR 800) | P0       | Contractor, Supplier |
| FR-SUB-02 | Duration options: 1, 3, 6, 12 months with discounts (5%, 15%, 35%)                            | P0       | Contractor, Supplier |
| FR-SUB-03 | Moyasar payment: card (3D Secure auto-verified) + bank transfer (admin verification)          | P0       | Contractor, Supplier |
| FR-SUB-04 | Subscription lifecycle: Active → Expiring Soon (7d) → Expired → Restricted                    | P0       | System               |
| FR-SUB-05 | Upgrade/downgrade with prorated mid-cycle changes                                             | P1       | Contractor, Supplier |
| FR-SUB-06 | Coupon system: percentage/fixed, usage limits, tier/role restriction, stacking prevention     | P1       | System               |
| FR-SUB-07 | Commission tiers: Starter 2%, Pro 1%, Business/Enterprise 0%                                  | P0       | System               |
| FR-SUB-08 | Commission payment: 14-day deadline, card (auto) or bank transfer (admin verify)              | P0       | Contractor, Supplier |
| FR-SUB-09 | Commission overdue: notifications at day 14/21/28, account restricted after 30 days           | P0       | System               |
| FR-SUB-10 | Commission dispute: 7-day window, admin resolution, deadline freeze                           | P1       | Contractor, Supplier |
| FR-SUB-11 | ZATCA-compliant invoice generation (bilingual PDF)                                            | P0       | System               |
| FR-SUB-12 | Expired subscription: active deals continue, new posts/bids blocked                           | P0       | System               |
| FR-SUB-13 | Downgrade with over-limit content: existing preserved (grandfathered), new creation blocked   | P0       | System               |

### FR-SEARCH: Search & Discovery

| ID           | Requirement                                                                     | Priority | Role   |
| ------------ | ------------------------------------------------------------------------------- | -------- | ------ |
| FR-SEARCH-01 | Typesense full-text search: 4 indexes (projects, products, rfqs, partners)      | P0       | All    |
| FR-SEARCH-02 | Multi-language support (Arabic + English) with typo tolerance                   | P0       | System |
| FR-SEARCH-03 | Faceted search: category, price range, rating, city, tier                       | P0       | System |
| FR-SEARCH-04 | Search weights: title 3×, company/name 2×, description 1×                       | P1       | System |
| FR-SEARCH-05 | Sync via DB webhook → `/api/webhooks/typesense-sync` on publish/unpublish       | P0       | System |
| FR-SEARCH-06 | PostgreSQL fallback (`pg_trgm` + `to_tsvector`) on Typesense connection failure | P1       | System |
| FR-SEARCH-07 | Sorting: recent, highest rated, price, most bids                                | P0       | System |
| FR-SEARCH-08 | Admin batch re-index trigger                                                    | P1       | Admin  |

### FR-ADMIN: Admin Panel

| ID          | Requirement                                                                        | Priority | Role   |
| ----------- | ---------------------------------------------------------------------------------- | -------- | ------ |
| FR-ADMIN-01 | User management: search/filter, bulk ban/promote/adjust tier, user stats           | P0       | Admin  |
| FR-ADMIN-02 | Registration management: pending queue, document review, approve/reject            | P0       | Admin  |
| FR-ADMIN-03 | Posts moderation: review queue, content validation, approve/reject/archive         | P0       | Admin  |
| FR-ADMIN-04 | Deal oversight: view all deals, override status, resolve disputes, audit logs      | P0       | Admin  |
| FR-ADMIN-05 | Commission management: approval queue, invoice auto-generation, payment tracking   | P0       | Admin  |
| FR-ADMIN-06 | Review moderation: flagged/reported queue, hide/flag/approve, edit window override | P1       | Admin  |
| FR-ADMIN-07 | Coupon management: CRUD, activate/deactivate, usage analytics                      | P1       | Admin  |
| FR-ADMIN-08 | Platform settings: Typesense re-index, general config                              | P1       | Admin  |
| FR-ADMIN-09 | Full audit logging of all admin actions                                            | P0       | System |

### FR-PUBLIC: Public Pages

| ID           | Requirement                                                                     | Priority | Role   |
| ------------ | ------------------------------------------------------------------------------- | -------- | ------ |
| FR-PUBLIC-01 | Homepage: animated hero, featured showcase, live stats, trust indicators        | P0       | Public |
| FR-PUBLIC-02 | Pricing page: tier comparison with "Request Demo" CTA for Enterprise            | P0       | Public |
| FR-PUBLIC-03 | Public marketplace: product browsing (Typesense search)                         | P0       | Public |
| FR-PUBLIC-04 | Public projects: listings with owner identity blurred for unauthenticated users | P0       | Public |
| FR-PUBLIC-05 | Partners directory: Contractors + Suppliers with filters                        | P0       | Public |
| FR-PUBLIC-06 | Contact form: name, email, company, message → admin queue + email               | P0       | Public |
| FR-PUBLIC-07 | Legal pages: Terms (bilingual, versioned), Privacy (PDPL), Cookie Policy        | P0       | Public |
| FR-PUBLIC-08 | SEO: sitemap.xml, robots.txt, dynamic OG images, metadata                       | P1       | System |

### FR-ONBOARD: Guided Onboarding

| ID            | Requirement                                                                       | Priority | Role |
| ------------- | --------------------------------------------------------------------------------- | -------- | ---- |
| FR-ONBOARD-01 | Role-specific setup checklist (PO: 6 steps, Contractor: 7, Supplier: 7, Buyer: 4) | P1       | All  |
| FR-ONBOARD-02 | Persistent sidebar checklist until 80% complete; dismissible after                | P1       | All  |
| FR-ONBOARD-03 | Contextual tooltips on first visit per dashboard page                             | P2       | All  |
| FR-ONBOARD-04 | Each step links to relevant page; progress % in sidebar badge                     | P1       | All  |

---

## 5. Non-Functional Requirements

### NFR-PERF: Performance

| Metric                             | Target                              |
| ---------------------------------- | ----------------------------------- |
| Time to First Byte (TTFB)          | < 200ms (Vercel Edge, Saudi region) |
| Largest Contentful Paint (LCP)     | < 2.5s on 4G connection             |
| Server Action response (mutations) | < 500ms p95                         |
| Server Action response (reads)     | < 300ms p95                         |
| Typesense search query             | < 100ms p95                         |
| Realtime message delivery          | < 500ms end-to-end                  |
| File upload start                  | < 1s for files under 10 MB          |
| Concurrent authenticated users     | 500 at launch                       |

### NFR-RATE: Rate Limiting

14 endpoint-specific rules enforced via Upstash Redis — see FEATURES.md §23.2 for full table. Key rules:

- Login: 5 attempts / 15 min per email
- Registration: 3 accounts / 1 hour per IP
- Bid submission: 20 / hour per user
- Message sending: 60 / min per user
- Search: 120 queries / min per IP
- API catch-all: 200 requests / min per user

Rate limit responses: HTTP 429 with bilingual message + `Retry-After` header.

### NFR-SEC: Security

- Supabase RLS on all tables — never bypassed except admin service role actions
- Zod validation on all inputs (client + server)
- CSRF protection via Server Actions (built-in Next.js)
- File upload: MIME type validation server-side, size limits per module
- Sensitive env vars (`SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`) server-only
- Encrypted file storage via Supabase Storage
- Audit trails on all deal and admin actions

### NFR-COMPLY: Compliance

- **ZATCA**: VAT 15% on all prices (VAT-inclusive display, net + VAT stored separately)
- **PDPL**: Registration consent checkbox with timestamp, privacy policy linked
- **Currency**: SAR only
- **Phone**: +966 format validation
- **Cities**: Saudi city reference table

### NFR-I18N: Internationalization

- Bilingual: Arabic (RTL) + English (LTR)
- Cookie-based locale detection with manual toggle
- Tailwind logical properties only (`ps-`, `pe-`, `ms-`, `me-`, `start`, `end`)
- `dir` attribute on `<html>` toggled per locale
- Paired DB fields: `*_ar` / `*_en`
- No auto-translation — manual entry in both languages

### NFR-AVAIL: Availability

- Uptime target: 99.9%
- Supabase daily backups (PITR, 7-day retention)
- Vercel instant rollback
- 24h advance notice for maintenance windows

### NFR-MON: Monitoring

- Sentry: client + server error tracking, source maps, session replay
- Vercel Analytics: Web Vitals, traffic
- Supabase Dashboard: DB performance, RLS analysis, storage
- Health probe: `GET /api/health` (Supabase + Typesense ping)
- Structured JSON logging for server actions (action, user, duration, result)
- Admin audit log in `admin_audit_log` table

---

## 6. Constraints & Assumptions

### Constraints

- Saudi Arabia market only (SAR currency, +966 phones, Saudi cities)
- Single-language profiles (no auto-translation; users must provide both AR and EN)
- Supabase as sole backend (no custom server, no microservices)
- No legally-binding e-signature in v1 (acknowledgment fields only)
- No mobile app in v1 (responsive web only)
- No Twilio WhatsApp integration in v1

### Assumptions

- Supabase project already provisioned with Auth, Storage, and Realtime enabled
- Moyasar merchant account active with 3D Secure enabled
- Resend account with verified sending domain
- Typesense Cloud instance provisioned
- Upstash Redis instance for rate limiting
- Vercel team account for deployment

---

## 7. Out of Scope (v1)

- NAFATH national digital ID integration for legally-binding e-signatures
- Twilio WhatsApp Business API notifications
- Email digest (daily/weekly summary)
- Mobile native apps (iOS/Android)
- Multi-currency support
- AI-powered bid recommendations
- Supplier inventory sync with ERP systems
- Sub-user/team accounts within a company
- Public API for third-party integrations

---

## 8. Success Metrics

| Metric                                 | Target    | Timeframe |
| -------------------------------------- | --------- | --------- |
| Registered companies                   | 500       | 6 months  |
| Monthly active users                   | 200       | 6 months  |
| Projects posted                        | 100       | 3 months  |
| Average bids per project               | 5+        | 3 months  |
| Bid-to-award conversion                | 15%       | 6 months  |
| Time to first deal (new user)          | < 14 days | Ongoing   |
| Deal completion rate                   | 85%       | 6 months  |
| Inquiry-to-deal conversion (suppliers) | 25%       | 6 months  |
| Platform NPS                           | 40+       | 12 months |

---

## 9. Glossary

| Term          | Definition                                                                                |
| ------------- | ----------------------------------------------------------------------------------------- |
| **PO**        | Project Owner                                                                             |
| **RFQ**       | Request for Quotation                                                                     |
| **BOQ**       | Bill of Quantities                                                                        |
| **ZATCA**     | Zakat, Tax and Customs Authority (Saudi tax authority)                                    |
| **PDPL**      | Personal Data Protection Law (Saudi privacy law)                                          |
| **CR**        | Commercial Registration (Saudi business license number)                                   |
| **VAT**       | Value Added Tax (15% in Saudi Arabia)                                                     |
| **SAR**       | Saudi Riyal (currency)                                                                    |
| **3DS**       | 3D Secure (card payment authentication)                                                   |
| **RLS**       | Row Level Security (Supabase/Postgres access control)                                     |
| **PKCE**      | Proof Key for Code Exchange (OAuth flow)                                                  |
| **Deal**      | A tracked transaction between two parties, created from bid award or quotation acceptance |
| **Proof**     | Evidence submitted within a deal (work, payment, supply, or handover)                     |
| **Milestone** | A named stage within a deal with progress tracking and payment amount                     |
