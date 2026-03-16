# Muqawil HUB — Test Checklist

> Track test implementation and pass/fail status. Mark `[ ]` → `[x]` when a test is implemented and passing.
> **Run**: `npm run test` (watch) · `npm run test:run` (CI single run)

---

## 1. Authentication & Registration

### 1.1 Email/Password Registration

- [ ] T-001 · Multi-step wizard completes for each role (PO, Contractor, Supplier, Buyer)
- [ ] T-002 · Role is immutable after registration — no way to change in dashboard or via server action
- [ ] T-003 · PDPL consent checkbox required — form blocked without it
- [ ] T-004 · Phone `+966` validation — invalid formats rejected, valid `+966XXXXXXXXX` accepted
- [ ] T-005 · Duplicate email rejected with user-friendly error
- [ ] T-006 · Password minimum length (8 chars) enforced
- [ ] T-007 · Email verification gate — link click moves status to `active` (free roles) or next gate (paid)
- [ ] T-008 · Profile type selection (Company vs Personal) works for PO and Buyer
- [ ] T-009 · Company fields required for Contractor & Supplier (company name AR/EN, CR number)
- [ ] T-010 · Subscription step shown only for Contractor & Supplier — skipped for PO & Buyer

### 1.2 Google OAuth

- [ ] T-011 · New Google user → auto-create account → redirect to role selection → continue from Step 3
- [ ] T-012 · Existing email conflict → error: "An account with this email already exists"

### 1.3 Login

- [ ] T-013 · Valid email + password → redirect to `/dashboard`
- [ ] T-014 · Invalid credentials → generic error (no email existence leak)
- [ ] T-015 · Forgot password → reset email received → new password set → login works
- [ ] T-016 · Session persistence — close/reopen browser → still authenticated (middleware refresh)
- [ ] T-017 · Logout → session cleared → redirect to login

### 1.4 Four-Gate Verification (Contractor/Supplier Pro+)

- [ ] T-018 · Gate 1: Email verified → status moves from `pending_email` to `pending_payment`
- [ ] T-019 · Gate 2: Card payment (3DS) auto-verified → moves to `pending_documents`
- [ ] T-020 · Gate 2 alt: Bank transfer uploaded → stays `pending_payment` until admin verifies
- [ ] T-021 · Gate 3: Document upload (VAT cert + CR license, ≤10MB, PDF/JPEG/PNG) → moves to `pending_approval`
- [ ] T-022 · Gate 4: Admin approves docs → status → `active` → full dashboard access
- [ ] T-023 · Gate 4: Admin rejects docs → bilingual feedback shown → user can re-upload
- [ ] T-024 · Restricted user cannot access dashboard features until gates are cleared

---

## 2. Project Owner Tests

### 2.1 Projects

- [ ] T-025 · Create project with bilingual title + description, budget, timeline, city, attachments → status = `draft`
- [ ] T-026 · Submit project → status moves to `pending`
- [ ] T-027 · Project stays `pending` until admin publishes — cannot self-publish
- [ ] T-028 · Edit draft project — all fields editable
- [ ] T-029 · Cannot edit published project (or only allowed fields)
- [ ] T-030 · Project source badge shows "Direct from Owner" (من المالك)
- [ ] T-031 · File attachments (BOQ, drawings, specs) upload during creation and display on detail page

### 2.2 Bid Management

- [ ] T-032 · View received bids on own project with comparison table (price, timeline, rating, tier)
- [ ] T-033 · Award bid → `DEAL-PROJECT` auto-created → both parties notified (`deal_created`)
- [ ] T-034 · Reject bid → bidder notified (`bid_rejected`)
- [ ] T-035 · Shortlist bid → bidder notified (`bid_shortlisted`)
- [ ] T-036 · Cannot submit bids — server action rejects with role error

### 2.3 RFQs

- [ ] T-037 · Create RFQ (standalone or project-linked) → submit → `pending` → admin approves
- [ ] T-038 · View supplier responses on RFQ
- [ ] T-039 · Accept RFQ response → `DEAL-PRODUCT` created with `project_id`
- [ ] T-040 · Reject RFQ response → supplier notified (`rfq_response_rejected`)

### 2.4 Supplier Hire

- [ ] T-041 · Browse supplier profile → send hire request for a project
- [ ] T-042 · Supplier responds with quotation → PO accepts → deal created

### 2.5 Inquiries

- [ ] T-043 · Submit inquiry on a product → supplier notified (`inquiry_received`)

### 2.6 Deal Workspace

- [ ] T-044 · Access deal workspace — view milestones, proofs, chat, document vault
- [ ] T-045 · Create/edit/reorder/delete milestones with due dates
- [ ] T-046 · Confirm proof → seller progress bar increments
- [ ] T-047 · Reject proof with required reason (dropdown + free text)
- [ ] T-048 · View Kanban board (read-only — cannot edit contractor's board)
- [ ] T-049 · View daily site logs posted by contractor
- [ ] T-050 · Embedded chat — send/receive messages in deal context

### 2.7 Contracts

- [ ] T-051 · Generate contract from deal → auto-fills both parties' info, terms, milestones
- [ ] T-052 · Create standalone contract at `/dashboard/contracts`
- [ ] T-053 · Fill contract fields → sign (acknowledgment) → PDF export with QR code
- [ ] T-054 · QR verification page (`/verify/contract/{uuid}`) shows signing timestamps
- [ ] T-055 · Contract status lifecycle: `Draft → Sent → Signed → Archived`

### 2.8 CRM

- [ ] T-056 · Clients auto-added from completed deals
- [ ] T-057 · Manual client add
- [ ] T-058 · Client notes log (timestamped, append-only)
- [ ] T-059 · Tags & categories on clients
- [ ] T-060 · Pipeline view (Lead → In Negotiation → Active Deal → Completed → Repeat)
- [ ] T-061 · Client scoring badge (A/B/C) displayed
- [ ] T-062 · Last contact indicator (green/yellow/red)
- [ ] T-063 · Client source tracking badge (Bid Award, RFQ Response, Direct Hire, etc.)
- [ ] T-064 · Unlimited clients and full analytics (free role — no tier limits)

### 2.9 Analytics

- [ ] T-065 · Full analytics dashboard accessible (profile views, deal metrics, response time)

### 2.10 Reviews

- [ ] T-066 · Submit review after deal `completed` — within 30-day window
- [ ] T-067 · Cannot review non-completed deal
- [ ] T-068 · Cannot review after 30-day window
- [ ] T-069 · Cannot submit duplicate review (one per direction per deal)
- [ ] T-070 · Edit review within 48h → accepted
- [ ] T-071 · Edit review after 48h → blocked

### 2.11 Company Profile

- [ ] T-072 · Upload company profile PDF (brochure) → displayed and downloadable on public profile

### 2.12 Negative Tests (PO)

- [ ] T-073 · Cannot list products — no product management UI or server action access
- [ ] T-074 · Cannot manage Kanban — only view
- [ ] T-075 · Cannot bulk upload CSV

---

## 3. Contractor Tests

### 3.1 Projects

- [ ] T-076 · Create project (subcontract) → badge shows "Subcontract" (بالباطن)
- [ ] T-077 · Submit project → `pending` → admin approves → `published`
- [ ] T-078 · As poster of subcontract project, can receive and award bids from other contractors

### 3.2 Bidding

- [ ] T-079 · Find published project → submit bid (amount, timeline, methodology, attachments)
- [ ] T-080 · Bid awarded → notification received → deal created → deal workspace accessible
- [ ] T-081 · Bid rejected → notification received
- [ ] T-082 · Bid shortlisted → notification received
- [ ] T-083 · Classification eligibility — A/B/C project classes restrict bidding by tier

### 3.3 Quotations

- [ ] T-084 · Respond to inquiry with quotation (Mode A — linked)
- [ ] T-085 · Create standalone quotation (Mode B) at `/dashboard/quotations`
- [ ] T-086 · Auto-incrementing number `QTN-YYYY-NNNN`
- [ ] T-087 · PDF export with company branding, bilingual layout, itemized table
- [ ] T-088 · Quotation status lifecycle: `Draft → Sent → Viewed → Accepted → Rejected → Expired`

### 3.4 RFQs

- [ ] T-089 · Create RFQ → admin approval → published → suppliers respond

### 3.5 Supplier Hire

- [ ] T-090 · Send hire request to supplier for a project

### 3.6 Deal Workspace

- [ ] T-091 · Manage milestones (create/edit as counterparty — suggest changes requiring approval)
- [ ] T-092 · Submit work proof (description, percentage, file attachments)
- [ ] T-093 · Submit payment proof / supply proof / handover proof
- [ ] T-094 · Embedded chat in deal context
- [ ] T-095 · Request cancellation → counterparty must approve

### 3.7 Kanban Board

- [ ] T-096 · Create task cards (title, description, assignee, due date, priority)
- [ ] T-097 · Drag-and-drop cards across columns (To Do → In Progress → Review → Done)
- [ ] T-098 · Card moved to "Done" → prompt to submit work proof
- [ ] T-099 · Progress sync — % of cards in "Done" feeds deal's seller progress bar
- [ ] T-100 · Real-time updates — both parties see changes live

### 3.8 Daily Site Log

- [ ] T-101 · Create structured entry: date, weather, workers, work description, issues, safety notes, photos
- [ ] T-102 · Chronological diary viewable by both parties
- [ ] T-103 · Accessible from deal workspace and project management view

### 3.9 Contracts

- [ ] T-104 · Generate contract from deal workspace → auto-fills info
- [ ] T-105 · Standalone contract creation
- [ ] T-106 · Clause library access (Pro+ only)

### 3.10 CRM

- [ ] T-107 · Access CRM with tier-appropriate limits
- [ ] T-108 · Follow-up reminders (Pro+ only)
- [ ] T-109 · Duplicate detection & merge (Pro+ only)

### 3.11 Analytics

- [ ] T-110 · Bid win rate, average bid-to-award time, bids per category (Business+ full dashboard)

### 3.12 Reviews

- [ ] T-111 · Submit and edit reviews (same rules as PO — T-066 to T-071)

### 3.13 Tier Limit Enforcement — Starter

- [ ] T-112 · Bids/month: 10 max → 11th blocked with upgrade prompt
- [ ] T-113 · Quotations/month: 3 max
- [ ] T-114 · Kanban: no access
- [ ] T-115 · Contracts: 2 basic templates only
- [ ] T-116 · Clause library: no access
- [ ] T-117 · CRM: 20 clients max → 21st blocked
- [ ] T-118 · Analytics: no dashboard
- [ ] T-119 · Commission: 2% on deal completion

### 3.14 Tier Limit Enforcement — Pro

- [ ] T-120 · Bids/month: 50
- [ ] T-121 · Quotations/month: 20
- [ ] T-122 · Kanban: checklist only (no full board)
- [ ] T-123 · Contracts/month: 10, all templates
- [ ] T-124 · Clause library: accessible
- [ ] T-125 · CRM: 200 clients
- [ ] T-126 · Analytics: summary widget
- [ ] T-127 · Commission: 1%

### 3.15 Tier Limit Enforcement — Business

- [ ] T-128 · Bids/month: 100
- [ ] T-129 · Quotations/month: unlimited
- [ ] T-130 · Kanban: full board with drag-drop, custom columns
- [ ] T-131 · Contracts/month: unlimited, all + custom templates
- [ ] T-132 · CRM: unlimited clients, bulk actions
- [ ] T-133 · Analytics: full dashboard
- [ ] T-134 · Commission: 0% — no commission record created

### 3.16 Tier Limit Enforcement — Enterprise

- [ ] T-135 · Bids/month: unlimited
- [ ] T-136 · All Business features + dedicated support
- [ ] T-137 · Commission: 0%

### 3.17 Double Enforcement

- [ ] T-138 · Client-side: bid button disabled/hidden when limit reached + upgrade prompt shown
- [ ] T-139 · Server-side: direct server action call over limit → returns error (cannot bypass)

### 3.18 Negative Tests (Contractor)

- [ ] T-140 · Cannot list products — server action rejects
- [ ] T-141 · Cannot respond to RFQs — only suppliers can
- [ ] T-142 · Cannot bulk upload CSV

---

## 4. Supplier Tests

### 4.1 Products

- [ ] T-143 · Create product (name AR/EN, description AR/EN, category, images ≤5MB)
- [ ] T-144 · Fixed price product — single unit price
- [ ] T-145 · Variant-based product — multiple variants (size/color/grade) each with own price, SKU, stock
- [ ] T-146 · Product status workflow: `Draft → Pending → Published → ...`
- [ ] T-147 · Admin approval required before product is visible
- [ ] T-148 · "Request Quotation" button on product → creates pre-filled RFQ

### 4.2 RFQ Response

- [ ] T-149 · View published RFQs relevant to supplier
- [ ] T-150 · Submit RFQ response (quotation with pricing, delivery terms)
- [ ] T-151 · Response accepted → `DEAL-PRODUCT` created
- [ ] T-152 · Response rejected → notification received

### 4.3 Inquiries

- [ ] T-153 · Receive product inquiry → view in seller dashboard
- [ ] T-154 · Respond with quotation (Mode A — linked to inquiry)
- [ ] T-155 · Can submit inquiry on OTHER supplier's products
- [ ] T-156 · Cannot submit inquiry on OWN products — blocked

### 4.4 Quotations

- [ ] T-157 · Standalone quotation creation (Mode B)
- [ ] T-158 · Multi-quotation: send multiple quotes per inquiry
- [ ] T-159 · Quotation acceptance → `DEAL-PRODUCT` created
- [ ] T-160 · PDF export with branding

### 4.5 Post RFQ

- [ ] T-161 · Supplier can post RFQ to source from other suppliers → admin approval → published

### 4.6 Deal Workspace

- [ ] T-162 · Access deal workspace — milestones, proofs, chat, document vault
- [ ] T-163 · Submit supply proof / delivery proof
- [ ] T-164 · Dual progress bars (seller completion + buyer payment)

### 4.7 Contracts

- [ ] T-165 · Generate supply agreement from deal or standalone
- [ ] T-166 · Tier-based template access (same as contractor)

### 4.8 CRM

- [ ] T-167 · CRM access with tier-appropriate limits

### 4.9 Analytics

- [ ] T-168 · Inquiry conversion rate, average quotation-to-deal time, top products (Business+)

### 4.10 Tier Limit Enforcement — Starter

- [ ] T-169 · Product posts: 2 max → 3rd blocked
- [ ] T-170 · Quotations/month: 3
- [ ] T-171 · CRM: 20 clients
- [ ] T-172 · Bulk CSV upload: blocked
- [ ] T-173 · Analytics: none
- [ ] T-174 · Commission: 2%

### 4.11 Tier Limit Enforcement — Pro

- [ ] T-175 · Product posts: 10
- [ ] T-176 · Quotations/month: 20
- [ ] T-177 · CRM: 200 clients
- [ ] T-178 · Bulk CSV upload: blocked
- [ ] T-179 · Analytics: summary widget
- [ ] T-180 · Commission: 1%

### 4.12 Tier Limit Enforcement — Business

- [ ] T-181 · Product posts: 50
- [ ] T-182 · Quotations/month: unlimited
- [ ] T-183 · CRM: unlimited
- [ ] T-184 · Bulk CSV upload: ✅ functional
- [ ] T-185 · Analytics: full dashboard
- [ ] T-186 · Commission: 0%

### 4.13 Tier Limit Enforcement — Enterprise

- [ ] T-187 · Product posts: unlimited
- [ ] T-188 · All Business features
- [ ] T-189 · Commission: 0%

### 4.14 Double Enforcement

- [ ] T-190 · Client-side: product creation disabled when limit reached + upgrade prompt
- [ ] T-191 · Server-side: direct server action over limit → returns error

### 4.15 Negative Tests (Supplier)

- [ ] T-192 · Cannot submit bids — no bidding functionality
- [ ] T-193 · Cannot post projects — server action rejects
- [ ] T-194 · Cannot manage Kanban

---

## 5. Buyer Tests

### 5.1 RFQs

- [ ] T-195 · Create RFQ → admin approval → published → suppliers respond
- [ ] T-196 · View supplier responses
- [ ] T-197 · Accept response → `DEAL-PRODUCT` created
- [ ] T-198 · Reject response → supplier notified

### 5.2 Inquiries

- [ ] T-199 · Submit inquiry on any product
- [ ] T-200 · Receive quotation from supplier → accept → deal created

### 5.3 Deal Workspace

- [ ] T-201 · Access deal workspace — milestones, proofs, chat
- [ ] T-202 · Confirm/reject proofs
- [ ] T-203 · Submit payment proof

### 5.4 Messaging

- [ ] T-204 · Real-time messaging within deal context
- [ ] T-205 · File attachments in messages (≤10MB)

### 5.5 Reviews

- [ ] T-206 · Submit review after deal completed (same rules — 30-day window, 48h edit)

### 5.6 Negative Tests (Buyer)

- [ ] T-207 · Cannot post projects — blocked
- [ ] T-208 · Cannot submit bids — blocked
- [ ] T-209 · Cannot list products — blocked
- [ ] T-210 · No CRM access — section not accessible
- [ ] T-211 · No Kanban access
- [ ] T-212 · No contract generator access
- [ ] T-213 · No analytics dashboard

---

## 6. Admin Panel

### 6.1 Access Control

- [ ] T-214 · Only `is_admin = true` users can access `/admin/*` routes
- [ ] T-215 · Non-admin accessing `/admin` → redirected to `/dashboard`
- [ ] T-216 · `is_admin` flag cannot be set from client-side — only via service role key

### 6.2 Post Moderation

- [ ] T-217 · View all `pending` posts (projects, products, RFQs) in approval queue
- [ ] T-218 · Approve post → status `published` → indexed in Typesense
- [ ] T-219 · Reject post with bilingual feedback → user sees reason → can resubmit
- [ ] T-220 · Only `published` posts appear in search — drafts/pending/rejected excluded

### 6.3 User Management

- [ ] T-221 · List all users with filters (role, status, tier, search)
- [ ] T-222 · View user details (profile, subscription, documents, deals)
- [ ] T-223 · Verify uploaded documents (VAT cert, CR license) — approve or reject with reason
- [ ] T-224 · Verify bank transfer receipts (subscriptions + commissions)
- [ ] T-225 · Ban user → status `banned` → loses all access
- [ ] T-226 · Restrict user → status `restricted` → limited access
- [ ] T-227 · Unban/unrestrict user → status restored

### 6.4 Commission Management

- [ ] T-228 · View commission approval queue (pending commissions from completed deals)
- [ ] T-229 · Approve commission → ZATCA-compliant invoice auto-generated (bilingual PDF)
- [ ] T-230 · Verify bank transfer commission payment → mark `paid`
- [ ] T-231 · Handle commission dispute → adjust amount or confirm original
- [ ] T-232 · Overdue commission (30 days) → user account auto-restricted
- [ ] T-233 · Commission 0% for Business/Enterprise → no commission record created

### 6.5 Subscription & Coupon Management

- [ ] T-234 · Create coupon — percentage or fixed amount
- [ ] T-235 · Set usage limits (total uses + per-user)
- [ ] T-236 · Set validity period (date range)
- [ ] T-237 · Set tier restriction (specific tiers only)
- [ ] T-238 · Set role restriction (specific roles only)
- [ ] T-239 · "First purchase only" flag — rejected on renewal
- [ ] T-240 · Renewal-eligible toggle
- [ ] T-241 · Max discount cap on percentage coupons
- [ ] T-242 · Coupon stacking blocked — only one per transaction
- [ ] T-243 · Duration discount applied FIRST, then coupon on remainder
- [ ] T-244 · Minimum amount checked against post-duration-discount price
- [ ] T-245 · Expired coupon → bilingual error: "This coupon has expired"
- [ ] T-246 · Exhausted coupon → "This coupon has reached its usage limit"
- [ ] T-247 · Already-used coupon → "You have already used this coupon"
- [ ] T-248 · Activate/deactivate coupons

### 6.6 Settings & System

- [ ] T-249 · Typesense batch re-index trigger
- [ ] T-250 · System settings management
- [ ] T-251 · Sync lag monitoring (last_synced_at timestamps)

---

## 7. Cross-Cutting (All Roles)

### 7.1 Bilingual (AR/EN)

- [ ] T-252 · Switch locale → entire UI flips direction (RTL ↔ LTR)
- [ ] T-253 · `dir` attribute on `<html>` toggles correctly
- [ ] T-254 · All forms accept and display paired AR + EN fields
- [ ] T-255 · Error messages rendered in current locale
- [ ] T-256 · PDFs (quotations, contracts, invoices) render bilingual content
- [ ] T-257 · Tailwind logical properties used (no `left`/`right` — only `start`/`end`)

### 7.2 Notifications

- [ ] T-258 · In-app bell shows unread count
- [ ] T-259 · Real-time notification delivery (no page refresh needed)
- [ ] T-260 · Email notifications sent for all types marked ✅ in channel mapping
- [ ] T-261 · Critical notifications cannot be muted: `bid_awarded`, `quotation_accepted`, `deal_created`, `deal_completed`, `payment_confirmed`, `commission_due`
- [ ] T-262 · Notification preferences page — toggle email for non-critical types
- [ ] T-263 · `subscription_expiring` sent at 7 days and 1 day before expiry
- [ ] T-264 · `subscription_expired` always sent

### 7.3 Real-Time (Supabase Realtime)

- [ ] T-265 · Messaging: send → appears instantly for recipient (no refresh)
- [ ] T-266 · Deal workspace: proof submitted → counterparty sees notification in real-time
- [ ] T-267 · Kanban: card moved → both parties see update live
- [ ] T-268 · Notification bell count increments in real-time
- [ ] T-269 · Typing indicators in chat (3-second auto-clear)

### 7.4 Search (Typesense)

- [ ] T-270 · Search projects in Arabic → correct results
- [ ] T-271 · Search products in English → correct results
- [ ] T-272 · Typo tolerance → misspelled query still returns relevant results
- [ ] T-273 · Faceted filtering: category, city, price range, rating
- [ ] T-274 · Only `published` posts appear in search results
- [ ] T-275 · Fallback to PostgreSQL full-text search when Typesense unavailable
- [ ] T-276 · Search weights: title 3×, name/company 2×, description 1×

### 7.5 Security

- [ ] T-277 · Route protection: unauthenticated → `/dashboard/*` redirects to login
- [ ] T-278 · Route protection: unauthenticated → `/admin/*` redirects to login
- [ ] T-279 · RLS enforcement: user A cannot read user B's drafts
- [ ] T-280 · RLS enforcement: user A cannot read user B's deals (not a participant)
- [ ] T-281 · RLS enforcement: user A cannot read user B's CRM data
- [ ] T-282 · RLS enforcement: user A cannot read user B's messages
- [ ] T-283 · File upload: reject > 10MB documents, > 5MB images
- [ ] T-284 · File upload: validate MIME type server-side (not just extension)
- [ ] T-285 · Server action auth: call without session → returns auth error
- [ ] T-286 · Server action role check: wrong role → rejected
- [ ] T-287 · Server action tier check: over limit → rejected with upgrade prompt
- [ ] T-288 · Rate limiting: rapid submissions → rate-limited after threshold
- [ ] T-289 · `SUPABASE_SERVICE_ROLE_KEY` never exposed in client bundle
- [ ] T-290 · `RESEND_API_KEY` never exposed in client bundle
- [ ] T-291 · Admin client (`createAdminClient`) only imported in `src/actions/admin/`

### 7.6 Deal Lifecycle (End-to-End)

- [ ] T-292 · Deal created from bid award → type `DEAL-PROJECT`
- [ ] T-293 · Deal created from inquiry quotation acceptance → type `DEAL-PRODUCT`
- [ ] T-294 · Deal created from RFQ response acceptance → type `DEAL-PRODUCT` with `project_id`
- [ ] T-295 · Deal created from direct hire quotation acceptance → type `DEAL-PRODUCT` with `project_id`
- [ ] T-296 · `active → in_progress` transition when work begins
- [ ] T-297 · `in_progress → completed` when both progress bars at 100%
- [ ] T-298 · Cancellation request requires counterparty approval
- [ ] T-299 · Skip request requires mutual agreement
- [ ] T-300 · Completed deal → commission auto-calculated (Starter/Pro) → `commission_due` notification
- [ ] T-301 · Commission overdue 14 days → `commission_overdue` notification
- [ ] T-302 · Commission overdue 30 days → account enters `restricted` state
- [ ] T-303 · Commission 0% (Business/Enterprise) → no commission record created
- [ ] T-304 · Commission dispute raised within 7 days → freezes payment deadline
- [ ] T-305 · Deal PDF export with branding, party logos, QR verification code
- [ ] T-306 · `completed` is a terminal state — no further transitions
- [ ] T-307 · `cancelled` is a terminal state — no further transitions

### 7.7 Payments (Moyasar)

- [ ] T-308 · Subscription card payment (3DS) → auto-verified → subscription active
- [ ] T-309 · Subscription bank transfer → pending until admin verifies
- [ ] T-310 · Subscription renewal before expiry
- [ ] T-311 · Subscription renewal after expiry (no late fee)
- [ ] T-312 · Upgrade mid-cycle → prorated calculation
- [ ] T-313 · Downgrade mid-cycle → prorated calculation
- [ ] T-314 · Duration discounts applied: 5% (3mo), 15% (6mo), 35% (12mo)

### 7.8 VAT & ZATCA Compliance

- [ ] T-315 · All displayed prices are VAT-inclusive (15%)
- [ ] T-316 · Net + VAT stored separately in DB
- [ ] T-317 · Commission invoices are ZATCA-compliant (bilingual, itemized, Tax ID)
- [ ] T-318 · Subscription invoices are ZATCA-compliant

### 7.9 Public Pages

- [ ] T-319 · Homepage loads correctly in AR and EN
- [ ] T-320 · Pricing page shows all tiers with correct limits and prices
- [ ] T-321 · Marketplace (projects) page — search and filter published projects
- [ ] T-322 · Products page — search and filter published products
- [ ] T-323 · Partners directory — search contractors/suppliers
- [ ] T-324 · Contact page — form submission works
- [ ] T-325 · Terms, Privacy, Cookies pages render correctly
- [ ] T-326 · Public profile pages for contractors/suppliers (rating, reviews, company info)

---

## 8. Existing Automated Tests (Schema & Logic)

> Already implemented in `src/__tests__/`. Verify they pass with `npm run test:run`.

- [ ] T-327 · `auth/login.test.ts` — LoginSchema, ResetPasswordSchema validation
- [ ] T-328 · `auth/registration.test.ts` — RegisterSchema validation for all roles
- [ ] T-329 · `bids/bid-submission.test.ts` — BidSchema validation (UUID, amount, timeline)
- [ ] T-330 · `deals/deal-creation.test.ts` — Deal lifecycle states, transitions, creation triggers
- [ ] T-331 · `finance/commission.test.ts` — Commission rates by tier, calculation logic
- [ ] T-332 · `rls/policies.test.ts` — Permission matrix, enum integrity, RLS rules, review rules
- [ ] T-333 · `subscriptions/limits.test.ts` — TIER_LIMITS structure, all limit values per tier

---

## Summary

| Section                | Tests         | Description                                        |
| ---------------------- | ------------- | -------------------------------------------------- |
| 1. Auth & Registration | T-001 – T-024 | Signup, login, OAuth, verification gates           |
| 2. Project Owner       | T-025 – T-075 | Projects, bids, RFQs, deals, contracts, CRM        |
| 3. Contractor          | T-076 – T-142 | Bidding, Kanban, daily log, tier limits            |
| 4. Supplier            | T-143 – T-194 | Products, RFQ response, inquiries, tier limits     |
| 5. Buyer               | T-195 – T-213 | RFQs, inquiries, deals, negative tests             |
| 6. Admin               | T-214 – T-251 | Moderation, users, commissions, coupons            |
| 7. Cross-Cutting       | T-252 – T-326 | i18n, notifications, real-time, security, payments |
| 8. Existing Tests      | T-327 – T-333 | Schema & business logic (already in codebase)      |

**Total: 333 test cases**

### Priority Order

1. **T-327–T-333** — Run existing tests first (`npm run test:run`)
2. **T-001–T-024** — Auth & Registration (nothing works without this)
3. **T-214–T-251** — Admin (controls the approval pipeline)
4. **T-025–T-036, T-076–T-082** — Core bidding loop (PO + Contractor)
5. **T-143–T-152, T-195–T-200** — Product/RFQ loop (Supplier + Buyer)
6. **T-044–T-050, T-091–T-103, T-292–T-307** — Deal workspace & lifecycle
7. **T-112–T-139, T-169–T-191** — Tier limit enforcement
8. **T-252–T-326** — Cross-cutting concerns
