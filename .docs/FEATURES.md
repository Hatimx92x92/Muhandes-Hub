# Muhandes HUB — Feature Specification

> **Production**: https://www.muqawilhub.com
> **Stack**: Next.js 16 (App Router), React 19, TypeScript, Supabase, Tailwind CSS v4
> **Domain**: Bilingual (AR/EN) B2B marketplace for the Saudi construction industry
> **Last Updated**: March 3, 2026

---

## 1. Platform Overview

**EN** — Muhandes HUB is a specialized B2B ecosystem designed to streamline the Saudi construction sector by bridging the gap between project execution and resource procurement.

**AR** — تُعد منصة مقاول هب (Muhandes HUB) منظومة رقمية متكاملة (B2B) صُممت خصيصاً لتمكين قطاع الإنشاءات في المملكة العربية السعودية، من خلال الربط الذكي بين أطراف العمل الرئيسية لضمان تنفيذ المشاريع بكفاءة وموثوقية عالية.

---

## 2. Multi-Role User System

Four platform roles — immutable after registration, one per account.

| Role          | Subscription | Profile Type            | Description                                        |
| ------------- | ------------ | ----------------------- | -------------------------------------------------- |
| Project Owner | Free         | Company **or** Personal | Post projects → Compare bids → Manage deals        |
| Contractor    | Paid         | Company (required)      | Find projects → Submit bids → Track work           |
| Supplier      | Paid         | Company (required)      | List products → Respond to inquiries → Ship orders |
| Buyer         | Free         | Company **or** Personal | Post RFQs → Compare quotations → Source materials  |

- **Phone number**: required for all users during registration (`+966` Saudi validation)
- **Profile type selection**: Project Owner and Buyer choose between **Company Profile** or **Personal Profile** during registration (Step 3)
  - **Company Profile**: company name (AR + EN), CR number, VAT number, logo, address
  - **Personal Profile**: full name, national ID (optional), personal address — no company fields
- **Company profile document** (Project Owner only): can upload a company profile PDF (brochure, capability statement) — displayed and downloadable on their public profile page
- Role-specific dashboards with tailored interfaces
- Guided onboarding wizard with setup checklist and contextual tooltips

### 2.1 Permission Matrix

| Action                 | Project Owner | Contractor |   Supplier   | Buyer |
| ---------------------- | :-----------: | :--------: | :----------: | :---: |
| Post projects          |      ✅       |     ✅     |      —       |   —   |
| Submit bids            |       —       |     ✅     |      —       |   —   |
| Award bids             |      ✅       |     ✅     |      —       |   —   |
| List products          |       —       |     —      |      ✅      |   —   |
| Post RFQs              |      ✅       |     ✅     |      ✅      |  ✅   |
| Respond to RFQs        |       —       |     —      |      ✅      |   —   |
| Send hire requests     |      ✅       |     ✅     |      —       |   —   |
| Submit inquiries       |      ✅       |     ✅     | ✅ (not own) |  ✅   |
| Send quotations        |       —       |     ✅     |      ✅      |   —   |
| Access Deal Workspace  |      ✅       |     ✅     |      ✅      |  ✅   |
| Manage Kanban          |       —       |     ✅     |      —       |   —   |
| View Kanban            |      ✅       |     ✅     |      —       |   —   |
| Create contracts       |      ✅       |     ✅     |      ✅      |   —   |
| Access CRM             |      ✅       |     ✅     |      ✅      |   —   |
| Access analytics       |      ✅       |     ✅     |      ✅      |   —   |
| Bulk upload (CSV)      |       —       |     —      |      ✅      |   —   |
| Daily site log         |   ✅ (view)   | ✅ (edit)  |      —       |   —   |
| Upload company profile |      ✅       |     —      |      —       |   —   |
| Review counterparty    |      ✅       |     ✅     |      ✅      |  ✅   |

> **Award bids — Contractor as poster**: When a Contractor posts a project (subcontract), they act as the project owner and can receive and award bids from other Contractors.
> **Submit inquiries — Supplier**: Suppliers can submit inquiries on other Suppliers' products, but not on their own.
> **Post RFQs — Supplier**: Suppliers can post RFQs to source materials/services from other Suppliers.

### 2.2 Features by Role & Tier

**Contractor**:

| Feature            | Starter    | Pro            | Business       | Enterprise     |
| ------------------ | ---------- | -------------- | -------------- | -------------- |
| Bids/month         | 10         | 50             | 100            | Unlimited      |
| Deal Workspace     | ✅         | ✅             | ✅             | ✅             |
| Task management    | —          | Checklist      | Full Kanban    | Full Kanban    |
| Daily site log     | ✅         | ✅             | ✅             | ✅             |
| Contract generator | 2 basic    | All            | All + custom   | All + custom   |
| Clause library     | —          | ✅             | ✅             | ✅             |
| CRM                | 20 clients | 200 clients    | Unlimited      | Unlimited      |
| Analytics          | —          | Summary widget | Full dashboard | Full dashboard |
| Bulk upload        | —          | —              | —              | —              |
| Commission rate    | 2%         | 1%             | 0%             | 0%             |

**Supplier**:

| Feature            | Starter    | Pro            | Business       | Enterprise     |
| ------------------ | ---------- | -------------- | -------------- | -------------- |
| Product posts      | 2          | 10             | 50             | Unlimited      |
| Deal Workspace     | ✅         | ✅             | ✅             | ✅             |
| Contract generator | 2 basic    | All            | All + custom   | All + custom   |
| Clause library     | —          | ✅             | ✅             | ✅             |
| CRM                | 20 clients | 200 clients    | Unlimited      | Unlimited      |
| Analytics          | —          | Summary widget | Full dashboard | Full dashboard |
| Bulk upload (CSV)  | —          | —              | ✅             | ✅             |
| Commission rate    | 2%         | 1%             | 0%             | 0%             |

**Project Owner** (free — no tiers):

| Feature            | Access    |
| ------------------ | --------- |
| Post projects      | Unlimited |
| Post RFQs          | Unlimited |
| Deal Workspace     | ✅        |
| Contract generator | All       |
| CRM                | Unlimited |
| Analytics          | Full      |

**Buyer** (free — no tiers):

| Feature        | Access    |
| -------------- | --------- |
| Post RFQs      | Unlimited |
| Deal Workspace | ✅        |
| Messages       | ✅        |

---

## 3. Subscription Tiers

| Tier       | Price/mo | Bids/mo (Contractor) | Products (Supplier) | Commission | Highlights                         |
| ---------- | -------- | -------------------- | ------------------- | ---------- | ---------------------------------- |
| Starter    | Free     | 10                   | 2                   | 2%         | Basic profile, limited access      |
| Pro        | SAR 200  | 50                   | 10                  | 1%         | Enhanced profile, priority listing |
| Business   | SAR 500  | 100                  | 50                  | 0%         | Analytics, bulk upload             |
| Enterprise | SAR 800  | Unlimited            | Unlimited           | 0%         | Full access, dedicated support     |

- All prices **VAT-inclusive** (15%)
- **Duration discounts** (paid tiers): 5% (3 mo) · 15% (6 mo) · 35% (12 mo)
- **Coupon system** for promotional discounts
- **Starter**: No Kanban, no analytics, no bulk upload; basic contract templates only

---

## 4. Posts Management

### 4.1 Project Posts (Contractors / Project Owners)

- **Bilingual content**: title + description in Arabic & English
- **Attributes**: budget range, timeline, scope, location
- **Project source badge**: "Direct from Owner" (من المالك) or "Subcontract" (بالباطن)
- **City/Region**: Saudi city selection for filtering and matching
- **Classification**: A/B/C tier restriction (admin-controlled)
- **File attachments**: BOQ (bill of quantities), drawings, images, specification sheets, and other project documents — uploaded during post creation and displayed on the project detail page
- **Status workflow**: `Draft → Pending → Published → Awarded / Completed`

### 4.2 Product Posts (Suppliers)

- **Product catalog**: name, description, category, pricing
- **Media**: image galleries (max 5 MB per image), specification sheets
- **Bulk import**: CSV upload (Business+ tiers)
- **Inventory tracking**: optional stock management
- **Pricing model**: each product is either **Fixed Price** or **Variant-Based**
  - **Fixed price**: single unit price for the product
  - **Variant-based**: multiple variants (e.g., size, color, grade) each with its own price, SKU, and optional stock level
- **RFQ button**: each listing shows "Request Quotation" (طلب عرض سعر) — creates a pre-filled RFQ linked to the product

### 4.3 Content Limits Enforcement

| Limit Type               | Starter | Pro | Business | Enterprise |
| ------------------------ | ------- | --- | -------- | ---------- |
| Bids/month (Contractor)  | 10      | 50  | 100      | Unlimited  |
| Product posts (Supplier) | 2       | 10  | 50       | Unlimited  |
| RFQ posting (all roles)  | ∞       | ∞   | ∞        | ∞          |

- **Pre-flight validation**: check limits before form display
- **Server-side enforcement**: API validation prevents client-side bypass
- **Upgrade prompts**: clear messaging when limits reached

### 4.4 Approval Workflow

All posts require **admin approval** before publishing:

- **Status tracking**: Pending → Published → Rejected
- **Rejection feedback**: admin provides reason for re-submission
- **Search indexing**: only `published` posts are indexed in Typesense

---

## 5. Bidding & Quotation System

### 5.1 Project Bidding (Contractors)

- **Submission**: proposed amount, timeline, methodology, attachments
- **Bid review**: project owner views all bids with bidder profiles
- **Comparison table**: side-by-side matrix (bidder, price, timeline, rating, past projects, tier) — sortable, highlights best-in-category
- **Classification eligibility**: A/B/C project classes restrict bidding by tier
- **Award flow**: owner awards bid → Deal created
- **Notifications**: `bid_received`, `bid_awarded`, `bid_shortlisted`, `bid_rejected`

### 5.2 Product Inquiries

- **Submission**: quantity, timeline, requirements, attachments
- **Context-aware**: linked to a specific product listing
- **Seller dashboard**: view and respond to all received inquiries
- **Conversation integration**: direct messaging support

### 5.3 Quotation System (عروض أسعار)

A unified quotation engine operating in two modes:

**Quotation Fields**:

- Client name (auto-filled from inquiry/RFQ sender when applicable)
- Project reference (optional)
- Line items: description, quantity, unit, unit price
- Subtotal, VAT (15%), total
- Validity period (48-hour default, configurable)
- Payment terms, delivery terms, notes

**Professional Features**:

- Bilingual layout (Arabic + English side-by-side or toggle)
- Company branding auto-applied (logo, letterhead, contact info)
- Auto-incrementing number per company (`QTN-YYYY-NNNN`)
- PDF export with branding, itemized table, totals, terms
- Reusable clause/terms library for payment and delivery clauses

#### Mode A — Inquiry Response

Linked to a product inquiry, RFQ response, or hire request.

- Multi-quotation support: multiple quotes per inquiry
- Fields auto-filled from inquiry context (product, quantity, buyer info)
- **Actions**: Accept → Deal created (`DEAL-PRODUCT`) · Reject · Request revision

#### Mode B — Standalone (`/dashboard/quotations`)

Create quotations independently, sent to any client (on- or off-platform).

- **Actions**: Save draft · Send via email (Resend) · Download PDF · Duplicate · Convert to Contract
- **Status tracking**: Draft → Sent → Viewed → Accepted → Rejected → Expired

**Tier Limits**:

| Tier                | Quotations/mo | Template       |
| ------------------- | ------------- | -------------- |
| Starter             | 3             | Basic          |
| Pro                 | 20            | Branded        |
| Business/Enterprise | Unlimited     | Custom + batch |

---

## 6. Deal Workspace

### 6.1 Deal Creation

> **Rule**: A deal is created **only** when a bid is awarded or a quotation is accepted — no other trigger.

**Trigger sources**:

| Trigger                              | Deal Type      | Notes             |
| ------------------------------------ | -------------- | ----------------- |
| Bid awarded (project)                | `DEAL-PROJECT` | —                 |
| Inquiry quotation accepted (product) | `DEAL-PRODUCT` | —                 |
| RFQ response accepted                | `DEAL-PRODUCT` | with `project_id` |
| Direct Hire quotation accepted       | `DEAL-PRODUCT` | with `project_id` |

- **Identification**: human-readable title slug (e.g., `foundation-work-riyadh-tower`); internal auto-increment ID for backend only
- **Auto-commission**: calculated from seller's subscription tier at creation
- **Both parties notified**: `deal_created` notification
- **Embedded chat**: in-context chat panel with auto-tagged messages

### 6.2 Milestone Timeline & Progress Tracking

- **Named milestones**: Foundation → Structure → MEP → Finishing → Handover (each with progress, due date, status)
- **Milestone ownership**: the **project owner** (or deal initiator) can create, edit, reorder, and delete milestones. The counterparty can **suggest** milestone changes (add, edit, remove) which require approval from the owner before taking effect.
- **Payment schedule**: structured payment plans tied to milestones
- **Deadline bar**: timeline showing contract start, milestone due dates, current marker, projected completion — color-coded (green / yellow / red)
- **Dual progress bars**:
  - Seller: work/supply completion (0–100%)
  - Buyer: payment completion (0–100%)
  - Independent — can complete in any order
- **Real-time updates**: Supabase Realtime

### 6.3 Proof System

**Proof types**: Payment · Work · Supply · Handover

- **Smart templates**: pre-built per deal type with contextual fields
- **Submission**: description, percentage claim, file attachments
- **Quick-action**: one-click confirm/reject from notification or deal feed; batch confirmation
- **Rejection reasons**: required dropdown (Incomplete work · Poor quality · Wrong scope · Missing documentation) + free text
- **Status**: `Pending → Confirmed / Rejected / Disputed`
- **Progress impact**: confirmed proofs increment progress bars

### 6.4 Deal Actions & Lifecycle

- **Skip requests**: waive progress tracking (requires mutual agreement)
- **Cancellation requests**: end deal (requires counterparty approval)
- **Activity log**: complete audit trail of all deal events
- **Completion**: both bars at 100% → status `completed`
- **PDF export**: professional PDF with Muhandes HUB branding, party logos, QR verification code

**Deal statuses**:

```
active → in_progress → completed
                     → cancelled
                     → disputed
```

---

## 7. Review & Rating System

### 7.1 Eligibility

- Deal must be `completed`
- Reviewer must be buyer or seller in the deal
- 30-day review window after completion
- One review per direction per deal

### 7.2 Components

- **Overall rating**: 1–5 stars (required)
- **Sub-ratings**: Quality, Timeliness, Communication (optional)
- **Would recommend**: boolean flag
- **Written comments**: bilingual (user enters both AR + EN manually — no machine translation)
- **Edit window**: 48 hours after submission

### 7.3 Aggregation

- Database trigger auto-updates `average_rating` and `total_reviews`
- Displayed on profiles, search results, and bid responses

---

## 8. Communication System

### 8.1 Notifications (20+ Types)

| Category      | Types                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------ |
| Bidding       | `bid_received`, `bid_awarded`, `bid_shortlisted`, `bid_rejected`                           |
| Inquiries     | `inquiry_received`                                                                         |
| Quotations    | `quotation_received`, `quotation_accepted`                                                 |
| Deals         | `deal_created`, `deal_status_changed`, `deal_completed`                                    |
| Payments      | `payment_confirmed`, `commission_due`                                                      |
| Reviews       | `review_received`                                                                          |
| Subscriptions | `subscription_expiring`, `subscription_expired`                                            |
| Documents     | `document_approved`, `document_rejected`                                                   |
| Posts         | `post_approved`, `post_rejected`                                                           |
| Supplier RFQ  | `rfq_published`, `rfq_response_received`, `rfq_response_accepted`, `rfq_response_rejected` |
| Supplier Hire | `supplier_hire_request_received`, `supplier_hire_quotation_received`                       |

**Delivery channels**: In-app (real-time) · Email (Resend) · Dashboard bell

### 8.1.1 Notification Channel Mapping

Each notification type routes to specific channels. Users can override email preferences for non-critical types from `/dashboard/profile` → Notification Settings.

| Type                               | In-App (Bell) | Email | Notes                                  |
| ---------------------------------- | :-----------: | :---: | -------------------------------------- |
| `bid_received`                     |      ✅       |  ✅   | —                                      |
| `bid_awarded`                      |      ✅       |  ✅   | Always sent — cannot mute              |
| `bid_shortlisted`                  |      ✅       |  ✅   | —                                      |
| `bid_rejected`                     |      ✅       |  ✅   | —                                      |
| `inquiry_received`                 |      ✅       |  ✅   | —                                      |
| `quotation_received`               |      ✅       |  ✅   | —                                      |
| `quotation_accepted`               |      ✅       |  ✅   | Always sent — cannot mute              |
| `deal_created`                     |      ✅       |  ✅   | Always sent — cannot mute              |
| `deal_status_changed`              |      ✅       |  ❌   | In-app only by default; email opt-in   |
| `deal_completed`                   |      ✅       |  ✅   | Always sent — cannot mute              |
| `payment_confirmed`                |      ✅       |  ✅   | Always sent — cannot mute              |
| `commission_due`                   |      ✅       |  ✅   | Always sent — cannot mute              |
| `review_received`                  |      ✅       |  ❌   | In-app only by default; email opt-in   |
| `subscription_expiring`            |      ✅       |  ✅   | Sent at 7 days and 1 day before expiry |
| `subscription_expired`             |      ✅       |  ✅   | Always sent — cannot mute              |
| `document_approved`                |      ✅       |  ✅   | —                                      |
| `document_rejected`                |      ✅       |  ✅   | —                                      |
| `post_approved`                    |      ✅       |  ✅   | —                                      |
| `post_rejected`                    |      ✅       |  ✅   | —                                      |
| `rfq_published`                    |      ✅       |  ❌   | In-app only — high volume              |
| `rfq_response_received`            |      ✅       |  ✅   | —                                      |
| `rfq_response_accepted`            |      ✅       |  ✅   | Always sent — cannot mute              |
| `rfq_response_rejected`            |      ✅       |  ❌   | In-app only by default; email opt-in   |
| `supplier_hire_request_received`   |      ✅       |  ✅   | —                                      |
| `supplier_hire_quotation_received` |      ✅       |  ✅   | —                                      |

**Email template strategy**:

- **Generic wrapper**: single responsive HTML template (Muhandes HUB header, bilingual body slot, footer with unsubscribe link)
- **Per-type content block**: each notification type defines a subject line (AR + EN), body paragraph, and CTA button linking to the relevant dashboard page
- **Digest option** (future): users can opt into a daily digest instead of individual emails for non-critical notifications

### 8.2 Real-Time Messaging

- **Context-aware**: conversations linked to projects, products, or deals
- **File attachments**: 10 MB max (images, PDFs)
- **Typing indicators**: 3-second auto-clear
- **Unread tracking**: per-participant counts
- **Soft delete**: per-user visibility control
- **Quick reply templates**: saved responses for common inquiries, one-click send
- **Real-time**: Supabase Realtime subscriptions

---

## 9. Project Management (Contractor)

### 9.1 Kanban Board (Per-Deal)

Each `DEAL-PROJECT` has its own Kanban board in the Deal Workspace.

- **Columns**: To Do → In Progress → Review → Done (customizable names)
- **Task cards**: title, description, assignee, due date, priority (Low / Medium / High / Critical), file attachments
- **Drag-and-drop**: move cards across columns; order preserved
- **Auto-proof trigger**: cards moved to "Done" prompt contractor to submit a Work Proof
- **Progress sync**: % of cards in "Done" feeds the deal's seller progress bar
- **Visibility**: both contractor and project owner can view; only contractor manages
- **Real-time**: Supabase Realtime

**Tier access**:

| Tier                | Feature                                                       |
| ------------------- | ------------------------------------------------------------- |
| Pro                 | Simple task checklist (add, complete, reorder, notes, photos) |
| Business/Enterprise | Full Kanban board with all features                           |

### 9.2 Daily Site Log

- **Structured entry**: date, weather, workers on site, work description, issues/blockers, safety notes, photo gallery
- **Chronological diary**: project timeline viewable by both parties
- **Accessible from**: deal workspace and project management view

### 9.3 Document Vault

- **Shared space**: per-deal storage organized by category (contracts, drawings, specs, permits, invoices, correspondence)
- **Version control**: track document revisions
- **Access control**: per-document permissions
- **Both parties** can upload

### 9.4 Photo Timeline

- **Auto-generated**: chronological visual timeline from proofs, daily logs, and tasks
- **Filtering**: by phase/milestone
- **Export**: PDF report

---

## 10. Business Tools

### 10.1 Contract Generator (`/dashboard/contracts`)

Usable **standalone** or **integrated with deals**.

**Templates**: Construction Agreement (عقد مقاولة) · Supply Agreement (عقد توريد) · Custom/Blank

**Fields**: Party A/B details · scope of work (ar/en) · payment terms · timeline · penalties · warranty clauses · governing law

**Features**:

- Auto-fill from user profile (company name, CR number, VAT number, address)
- Reusable clause library (warranty, penalty terms, etc.)
- PDF export with company letterhead, bilingual layout, digital signature fields
- **Status**: `Draft → Sent → Signed → Archived`
- Stored in Supabase Storage; linked to deal's Document Vault when deal-integrated

**Digital Signature Scope**:

- **Not legally-binding e-signature** (no integration with Absher, NAFATH, or third-party e-signature providers in v1)
- **Acknowledgment fields**: each party fills in their name, title, and date — rendered as typed text on the PDF (not a drawn/image signature)
- **QR verification code**: each signed contract PDF includes a QR code linking to a verification page (`/verify/contract/{uuid}`) that confirms the contract exists on the platform and shows signing timestamps
- **Audit trail**: system records who clicked "Sign" (user ID, timestamp, IP address) — stored in `contract_signatures` table
- **Future roadmap**: integration with Saudi NAFATH national digital ID for legally-binding e-signatures (post-v1)

**Deal Integration**:

- **Create from Deal Workspace**: "Generate Contract" action inside any active deal — auto-fills both parties' info, deal terms, milestones, and payment schedule
- **Attached to deal**: contract appears in the deal's Document Vault and is accessible by both parties
- **Status synced**: signing a deal-linked contract can optionally trigger the deal to move from `active` to `in_progress`
- **Standalone use**: contracts can also be created independently at `/dashboard/contracts` without linking to any deal

**Tier access**:

| Tier                | Templates    | Clause Library | Contracts/mo |
| ------------------- | ------------ | -------------- | ------------ |
| Starter             | 2 basic      | No             | Unlimited    |
| Pro                 | All          | Yes            | 10           |
| Business/Enterprise | All + custom | Yes            | Unlimited    |

### 10.2 CRM — Client Management (`/dashboard/crm`)

- **Client database**: name, phone, email, company, notes, tags
- **Deal linkage**: clients auto-added from completed deals; manual addition supported
- **Activity timeline**: per-client history (deals, messages, contracts, quotations)
- **Tags & categories**: custom labels (e.g., "Repeat client", "VIP", "Residential")
- **Follow-up reminders**: date-based with in-app + email notifications
- **Quick actions**: from client card — create contract, start deal, send message
- **Import/Export**: CSV
- **Search & filter**: by name, company, tag, last activity date
- **Privacy**: client data is private to the user

#### Client Scoring System

Auto-calculated score per client displayed as a badge (A / B / C) on the client card.

| Factor               | Weight | Source                                |
| -------------------- | ------ | ------------------------------------- |
| Deal completion rate | 30%    | Completed vs. cancelled deals         |
| Payment timeliness   | 25%    | On-time milestone payments            |
| Total deal volume    | 25%    | Cumulative deal value (SAR)           |
| Review rating        | 20%    | Average star rating from counterparty |

- **Score thresholds**: A ≥ 80 · B ≥ 50 · C < 50
- **Recalculated**: on deal completion, review submission, or payment event
- Starter tier: view score only · Pro/Business+: full score with breakdown

#### Pipeline / Funnel View

Visual Kanban-style board with drag-and-drop client cards across stages:

`Lead → In Negotiation → Active Deal → Completed → Repeat`

- **Auto-progression**: clients move stages based on deal status changes
- **Manual override**: drag to any stage
- **Stage counts**: header shows client count and total deal value per stage
- **Filters**: by tag, score, source, last activity

#### Revenue Analytics per Client

- **Per-client summary**: total deal value, number of deals, average deal size, last deal date
- **Top Clients leaderboard**: sorted by total revenue, filterable by time period (30d / 90d / 12mo / all-time)
- **Revenue trend**: sparkline chart per client showing deal value over time
- Integrates with §10.3 Performance Analytics

#### Client Source Tracking

Auto-tagged origin for every client entry:

| Source Tag        | Trigger                                     |
| ----------------- | ------------------------------------------- |
| `Bid Award`       | Deal created from bid award                 |
| `RFQ Response`    | Deal created from RFQ response acceptance   |
| `Direct Hire`     | Deal created from hire request acceptance   |
| `Product Inquiry` | Deal created from product inquiry quotation |
| `Manual Entry`    | User manually added the client              |

- Source displayed as a badge on the client card
- Filterable in client list and pipeline view

#### Last Contact Indicator

- **Health metric**: "Days since last interaction" per client
- **Color coding**: 🟢 Green (< 30 days) · 🟡 Yellow (30–90 days) · 🔴 Red (> 90 days)
- **Interaction types**: deal activity, message sent/received, contract action, quotation, review
- Displayed on client card and sortable in list view
- Clients turning yellow/red can trigger follow-up reminder suggestions

#### Client Notes Log

- **Timestamped entries**: append-only notes per client (not a single notes field)
- **Each note**: date, content (bilingual), optional linked entity (deal, contract, project)
- **Pinned notes**: mark important notes to appear first
- Limits: Starter — 5 notes/client · Pro — 50 notes/client · Business+ — Unlimited

#### Favorites & Pinned Clients

- **Star/pin clients** for quick access at the top of the CRM list
- Pinned clients appear in a dedicated "Favorites" section above the main list
- Limits: Starter — 3 · Pro — 10 · Business+ — 20

#### Duplicate Detection & Merge

- **Auto-check**: when adding a client (manually or auto from deal), match against phone, email, or company name
- **Merge prompt**: if duplicate found, prompt to merge with existing client record
- **Merge behavior**: combines activity timelines, notes, tags; keeps the most recent contact info
- Available on Pro+ tiers only

#### Bulk Actions

- **Multi-select**: checkbox selection in list view
- **Available actions**: bulk tag assignment, bulk export (CSV), bulk archive
- Available on Business+ tiers only

#### Archived Clients

- **Soft archive**: hide inactive clients from the default list without deleting history
- **"Show archived" toggle**: reveals archived clients with visual indicator
- **Restore**: one-click un-archive back to active list
- Available on all tiers

**Tier access**:

| Feature                  | Starter   | Pro           | Business/Enterprise |
| ------------------------ | --------- | ------------- | ------------------- |
| Max clients              | 20        | 200           | Unlimited           |
| Tags & categories        | No        | Yes           | Yes                 |
| Follow-up reminders      | No        | Yes           | Yes                 |
| Import/Export (CSV)      | No        | No            | Yes                 |
| Client scoring           | View only | Full          | Full                |
| Pipeline view            | —         | ✅            | ✅                  |
| Revenue analytics/client | —         | Summary       | Full                |
| Client source tracking   | Auto only | Auto + filter | Auto + filter       |
| Last contact indicator   | ✅        | ✅            | ✅                  |
| Client notes log         | 5/client  | 50/client     | Unlimited           |
| Favorites / pin          | 3         | 10            | 20                  |
| Duplicate detection      | —         | ✅            | ✅                  |
| Bulk actions             | —         | —             | ✅                  |
| Archived clients         | ✅        | ✅            | ✅                  |

### 10.3 Performance Analytics (`/dashboard/analytics`)

**Availability**: Business+ → full dashboard · Pro → summary widget on main dashboard

| Category             | Metrics                                                                  |
| -------------------- | ------------------------------------------------------------------------ |
| Profile              | Views over time, view sources, visitor breakdown by role                 |
| Bids (Contractor)    | Win rate, average bid-to-award time, bids per category                   |
| Inquiries (Supplier) | Conversion rate, average quotation-to-deal time, top products            |
| Deals                | Completed vs. cancelled, average value, average completion time, revenue |
| Response             | Average response time, trend (improving / declining)                     |
| Ratings              | Average over time, sub-rating breakdown                                  |

- **Export**: CSV

---

## 11. Supplier Procurement

### 11.1 RFQ (Request for Quotation)

- **Who can create**: Project Owner, Contractor, Supplier, Buyer (all roles)
- **Scope**: material/service sourcing from Suppliers — project-linked (`project_id`) or standalone
- **Fields**: title (ar/en), description (ar/en), category, quantity, budget range, deadline, linked `project_id` (optional)
- **Product-linked RFQ**: initiated from product's "Request Quotation" button — pre-filled with product details
- **Admin approval**: required before publishing
- **Visibility**: published RFQs visible to all eligible Suppliers (active subscription)
- **Supplier response**: quotation with pricing, delivery terms, notes
- **Selection**: poster reviews responses → accepts one → `DEAL-PRODUCT` with `project_id`
- **Limits**: **unlimited** for all roles
- **Lifecycle**: `Draft → Pending Approval → Published → Responses Open → Awarded → Closed`

### 11.2 Direct Supplier Hire

- **Who can initiate**: Project Owner, Contractor
- **Mechanism**: browse Supplier profiles/products → send Hire Request for a specific project
- **Fields**: project reference, description of need (ar/en), quantity, budget
- **Supplier response**: reviews request and submits a quotation
- **Acceptance**: poster accepts → `DEAL-PRODUCT` with `project_id`

### 11.3 Project-Linked Deals (Supplier)

- **Deal type**: `DEAL-PRODUCT` with nullable `project_id`
- When `project_id` is set → deal visible in project's Supplier Procurement tab
- Same dual-progress model (seller-completion + buyer-payment)
- Project dashboard aggregates all linked supplier deals

---

## 12. Commission & Payment System

### 12.1 Commission Calculation

- **Tier-based rates**: Starter 2% · Pro 1% · Business/Enterprise 0%
- **VAT**: 15% added to commission amount
- **Auto-calculated** at deal creation based on seller's tier
- **Notification**: `commission_due` on deal completion

### 12.2 Commission Approval

- Admin review queue → Approve / Reject (with reason)
- **Invoice generation**: ZATCA-compliant on approval
- **Status**: `pending → approved → paid → disputed`

### 12.5 Commission Payment Workflow (End-to-End)

**When commission is owed** (Starter 2%, Pro 1%):

1. **Trigger**: deal status moves to `completed` (both progress bars at 100%)
2. **Auto-calculation**: system calculates commission = `deal_value × tier_rate`, then adds 15% VAT → total commission payable
3. **Notification**: `commission_due` sent to seller with amount breakdown and 14-day payment deadline
4. **Payment options**: seller pays via the same Moyasar integration used for subscriptions:
   - **Card (Visa/MC)**: 3D Secure — auto-verified, commission status → `paid` immediately
   - **Bank transfer**: seller uploads transfer receipt → admin manually verifies at `/admin/commissions` → marks `paid`
5. **Admin approval**: admin reviews commission in approval queue, verifies amount matches deal value, and approves the invoice
6. **Invoice issued**: ZATCA-compliant invoice auto-generated (bilingual PDF) and stored in `invoices` bucket; visible to seller at `/dashboard/subscription` → Commission History
7. **Overdue handling**: if unpaid after 14 days → `commission_overdue` notification at day 14, 21, and 28. After 30 days overdue → account enters `restricted` state (cannot create new posts or bids until paid). Admin can override.
8. **Dispute flow**: seller can raise a dispute within 7 days of `commission_due` notification → admin reviews deal details → resolves by adjusting amount or confirming original. Dispute freezes the payment deadline until resolved.

**Commission = 0% (Business/Enterprise)**: no commission record created; deal completes without payment step.

### 12.3 Payment Gateway (Moyasar)

- **Card payments**: Visa, MasterCard with 3D Secure — auto-verified
- **Bank transfer**: manual admin verification
- **Check payment**: manual deposit verification
- **Tokenization**: secure encrypted processing

### 12.4 Invoice Generation

- **Types**: commission invoices, subscription invoices
- **ZATCA compliance**: VAT registration, Tax ID validation
- **Bilingual format**: Arabic + English
- **Itemized breakdown**: subtotal, tax, total, payment terms

---

## 13. Subscription Management

### 13.1 Lifecycle

```
Active → Expiring Soon (7 days) → Expired → Restricted
```

### 13.2 Features

- **Duration options**: 1, 3, 6, or 12 months
- **Duration discounts**: 5% (3 mo) · 15% (6 mo) · 35% (12 mo)
- **Upgrade/Downgrade**: prorated mid-cycle changes
- **Renewal**: before or after expiry (no late fee)

### 13.3 Coupon System

- Admin create/edit/activate/deactivate
- **Discount types**: percentage or fixed amount
- **Usage limits**: total uses + per-user limits
- **Validity period**: date range restrictions
- **Minimum amount**: minimum subscription price requirement

#### 13.3.1 Coupon Validation Rules

| Rule                    | Behavior                                                                                                        |
| ----------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Stacking**            | Coupons do **not** stack — only one coupon per transaction                                                      |
| **Duration discounts**  | Coupon discount applied **after** duration discount (e.g., 35% annual discount first, then coupon on remainder) |
| **First purchase only** | Admin can flag a coupon as "first purchase only" — system checks if user has any prior paid subscription        |
| **Renewal eligible**    | Admin toggles per coupon: applies to new subscriptions only, renewals only, or both                             |
| **Minimum amount**      | Checked against the **post-duration-discount** price (not the base monthly price)                               |
| **Tier restriction**    | Admin can restrict a coupon to specific tiers (e.g., Pro only, Business only, or all paid tiers)                |
| **Role restriction**    | Admin can restrict a coupon to specific roles (e.g., Contractor only)                                           |
| **Max discount cap**    | Percentage coupons can have an optional max SAR cap (e.g., 50% off up to SAR 200 max)                           |
| **Expired coupon**      | Returns user-friendly error: "This coupon has expired" (AR + EN)                                                |
| **Exhausted coupon**    | Returns: "This coupon has reached its usage limit"                                                              |
| **Already used**        | Returns: "You have already used this coupon" (per-user limit check)                                             |

---

## 14. Registration & Verification

### 14.1 Registration Flow

A multi-step wizard adapting to the selected role. Supports email/password and Google OAuth.

**Step 1 — Role Selection**
Four visual role cards (not a dropdown). Role is immutable after selection.

**Step 2 — Account Details**
Full name · Email · Password (min 8 chars) · Phone (`+966` validation)
Required checkbox: "I agree to the Terms of Service, Privacy Policy, and consent to data processing." (PDPL compliance)

**Step 3 — Profile & Company Details** _(all roles)_

- **Profile type** (Project Owner & Buyer only): choose **Company Profile** or **Personal Profile**
  - Company Profile: company name (AR + EN), CR number, website (optional)
  - Personal Profile: full name display only — no company fields
- **Company fields** (Contractor & Supplier — always company): company name (AR + EN), CR number, website (optional)
- **City/Region**: Saudi city selection (all roles)
- **Company profile document** (Project Owner with Company Profile): optional PDF upload (brochure, capability statement) — downloadable from public profile

**Step 4 — Subscription Selection** _(Contractor, Supplier only — PO & Buyer skip)_
Four tier cards with duration selector · Coupon code entry · Starter proceeds without payment

**Step 5 — Payment** _(Paid tiers only — Starter, PO & Buyer skip)_
Moyasar payment form: card (3D Secure, auto-verified) or bank transfer (manual admin verification)

**Step 6 — Document Upload** _(Contractor/Supplier with paid tiers only)_
VAT Certificate + Commercial License (PDF/image, max 10 MB each)

### 14.2 Google OAuth Registration

- "Sign up with Google" available on Step 2
- Google OAuth via Supabase Auth PKCE flow
- New email → auto-create account → redirect to Step 1 → continue from Step 3 (email pre-filled, skip password)
- Existing email with password auth → error: "An account with this email already exists."
- Phone number and role-specific steps still required

### 14.3 Post-Registration Flow

| Role                          | After Registration                                                 |
| ----------------------------- | ------------------------------------------------------------------ |
| Project Owner                 | Email verification → instant dashboard access                      |
| Buyer                         | Email verification → instant dashboard (RFQs only)                 |
| Contractor/Supplier (Starter) | Email verification → basic dashboard access with Starter limits    |
| Contractor/Supplier (Pro+)    | Email verification → Payment → Documents → Admin approval (4-gate) |

### 14.4 Four-Gate Verification (Pro / Business / Enterprise)

| Gate | Requirement                    | Applies To               |
| ---- | ------------------------------ | ------------------------ |
| 1    | Email verification             | All roles                |
| 2    | Subscription payment (Moyasar) | Contractor/Supplier Pro+ |
| 3    | Document upload (VAT + CR)     | Contractor/Supplier Pro+ |
| 4    | Admin approval of documents    | Contractor/Supplier Pro+ |

All four gates pass sequentially. Bank transfers require manual admin verification at Gate 2.

**Verification states**:

```
pending_email → pending_payment → pending_documents → pending_approval → active
```

- PO / Buyer / Starter: `pending_email → active`
- Pro+ tiers: full 4-gate flow

### 14.5 Document Verification

- **Required**: VAT Certificate, Commercial License
- **File limits**: 10 MB each (PDF, JPEG, PNG)
- **Admin review**: download, verify, approve/reject
- **Rejection feedback**: bilingual (AR + EN) for re-submission

---

## 15. Search & Discovery

### 15.1 Full-Text Search (Typesense)

- **Indexed**: titles, descriptions, categories, company names, RFQs
- **Multi-language**: Arabic + English
- **Typo tolerance**: fuzzy matching
- **Faceted search**: category, price, rating filters
- **Fallback**: PostgreSQL full-text search if Typesense unavailable

#### 15.1.1 Typesense Index Schemas

**Index: `projects`**

| Field            | Type   | Facet | Sort | Notes                           |
| ---------------- | ------ | :---: | :--: | ------------------------------- |
| `id`             | string |   —   |  —   | Primary key                     |
| `title_ar`       | string |   —   |  —   | Arabic full-text                |
| `title_en`       | string |   —   |  —   | English full-text               |
| `description_ar` | string |   —   |  —   | Arabic full-text                |
| `description_en` | string |   —   |  —   | English full-text               |
| `category`       | string |  ✅   |  —   | Facet filter                    |
| `city`           | string |  ✅   |  —   | Saudi city facet                |
| `budget_min`     | float  |   —   |  ✅  | Range filter + sort             |
| `budget_max`     | float  |   —   |  ✅  | Range filter + sort             |
| `classification` | string |  ✅   |  —   | A / B / C                       |
| `source`         | string |  ✅   |  —   | `owner` / `subcontract`         |
| `owner_rating`   | float  |   —   |  ✅  | Sort by rating                  |
| `created_at`     | int64  |   —   |  ✅  | Unix timestamp — sort by recent |
| `status`         | string |   —   |  —   | Always `published`              |

**Index: `products`**

| Field              | Type   | Facet | Sort | Notes               |
| ------------------ | ------ | :---: | :--: | ------------------- |
| `id`               | string |   —   |  —   | Primary key         |
| `name_ar`          | string |   —   |  —   | Arabic full-text    |
| `name_en`          | string |   —   |  —   | English full-text   |
| `description_ar`   | string |   —   |  —   | Arabic full-text    |
| `description_en`   | string |   —   |  —   | English full-text   |
| `category`         | string |  ✅   |  —   | Facet filter        |
| `price`            | float  |   —   |  ✅  | Sort / range filter |
| `supplier_name_ar` | string |   —   |  —   | Searchable          |
| `supplier_name_en` | string |   —   |  —   | Searchable          |
| `supplier_rating`  | float  |   —   |  ✅  | Sort by rating      |
| `supplier_tier`    | string |  ✅   |  —   | Facet filter        |
| `in_stock`         | bool   |  ✅   |  —   | Availability filter |
| `created_at`       | int64  |   —   |  ✅  | Unix timestamp      |

**Index: `rfqs`**

| Field            | Type   | Facet | Sort | Notes             |
| ---------------- | ------ | :---: | :--: | ----------------- |
| `id`             | string |   —   |  —   | Primary key       |
| `title_ar`       | string |   —   |  —   | Arabic full-text  |
| `title_en`       | string |   —   |  —   | English full-text |
| `description_ar` | string |   —   |  —   | Arabic full-text  |
| `description_en` | string |   —   |  —   | English full-text |
| `category`       | string |  ✅   |  —   | Facet filter      |
| `budget_min`     | float  |   —   |  ✅  | Range filter      |
| `budget_max`     | float  |   —   |  ✅  | Range filter      |
| `deadline`       | int64  |   —   |  ✅  | Sort by deadline  |
| `created_at`     | int64  |   —   |  ✅  | Unix timestamp    |

**Index: `partners`** (Company Directory)

| Field           | Type   | Facet | Sort | Notes                     |
| --------------- | ------ | :---: | :--: | ------------------------- |
| `id`            | string |   —   |  —   | Primary key               |
| `company_ar`    | string |   —   |  —   | Arabic full-text          |
| `company_en`    | string |   —   |  —   | English full-text         |
| `role`          | string |  ✅   |  —   | `contractor` / `supplier` |
| `city`          | string |  ✅   |  —   | Saudi city facet          |
| `tier`          | string |  ✅   |  —   | Subscription tier         |
| `rating`        | float  |   —   |  ✅  | Average rating sort       |
| `total_reviews` | int32  |   —   |  ✅  | Sort by review count      |
| `total_deals`   | int32  |   —   |  ✅  | Sort by deal count        |

**Search weights**: `title_*` fields weighted 3× · `description_*` weighted 1× · `company_*` / `name_*` weighted 2×

#### 15.1.2 Sync Strategy

- **Trigger**: Supabase Database Webhook (on `INSERT`/`UPDATE` of `status = 'published'`) → Next.js API Route `/api/webhooks/typesense-sync`
- **Operations**: publish → upsert document · unpublish/reject/delete → remove document
- **Batch re-index**: admin action at `/admin/settings` triggers full re-index from Postgres (runs as background job)
- **Consistency**: each sync writes `last_synced_at` timestamp on the DB row; admin dashboard shows sync lag
- **Fallback detection**: search API route catches Typesense connection errors → falls back to `pg_trgm` + `to_tsvector` PostgreSQL full-text search on the same query. Fallback is transparent to the user (slightly slower, no typo tolerance)

### 15.2 Browsing & Filtering

- **Filters**: category · price range (min/max) · rating (3+, 4+) · Saudi region
- **Sorting**: recent · highest rated · price · most bids

---

## 16. Homepage & Public Experience

### 16.1 Dynamic Homepage

- **Animated hero**: full-viewport with parallax scroll, animated stat counters, bilingual CTA (Framer Motion or GSAP)
- **Featured showcase carousel**: products, company profiles, projects (admin-curated / promoted)
- **Live platform stats**: "X Active Projects · Y Verified Companies · Z Completed Deals"
- **Trust indicators**: client logos, role-specific testimonial tabs
- **Design**: Procore/Fieldwire-inspired — clean, modern, premium

### 16.2 Static & Legal Pages

- **Contact Us**: form (name, email, company, message, role interest) → admin queue + Resend notification
- **Request Demo**: enterprise CTA on pricing page
- **Terms of Service**: bilingual with version history
- **Privacy Policy**: bilingual, Saudi PDPL compliance, consent tracking
- **Cookie Policy**: consent management

### 16.3 Content Visibility & Access Control

| Visibility        | Pages                                                                                                                  |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Public**        | Homepage, pricing, marketplace, project listings (owner blurred), company directory (preview), contact, terms, privacy |
| **Authenticated** | Full project owner identity, bidding, deal workspace, dashboards                                                       |

- `/projects` is publicly browsable — owner identity returned as `null` server-side → blurred placeholders for unauthenticated users
- Public pages indexed for SEO; gated pages drive conversion

### 16.4 Guided Onboarding

- **Role-specific wizard**: setup checklist (see below)
- **Persistent checklist**: remains in dashboard sidebar until all steps complete; dismissible after 80% completion
- **Contextual tooltips**: first-visit on each dashboard page, with "Don't show again" per tooltip
- **Reduces time-to-first-value**: days → minutes

#### Onboarding Checklist by Role

**Project Owner** (6 steps):

1. ✅ Verify your email
2. Complete your profile (company/personal info, logo)
3. Upload company profile document (optional — shown as "Recommended")
4. Post your first project
5. Browse the contractor directory
6. Review your first bid and award a deal

**Contractor** (7 steps):

1. ✅ Verify your email
2. Complete your company profile (logo, description AR + EN)
3. Upload verification documents (VAT cert + CR license) — _Pro+ only_
4. Browse available projects
5. Submit your first bid
6. Set up your CRM (add first client or tag)
7. Explore the contract generator

**Supplier** (7 steps):

1. ✅ Verify your email
2. Complete your company profile (logo, description AR + EN)
3. Upload verification documents (VAT cert + CR license) — _Pro+ only_
4. List your first product
5. Browse active RFQs
6. Send your first quotation
7. Set up your CRM (add first client or tag)

**Buyer** (4 steps):

1. ✅ Verify your email
2. Complete your profile (company/personal info)
3. Post your first RFQ
4. Browse the product marketplace

**Step 1 auto-completes** for all roles upon email verification. Each step links directly to the relevant page. Progress percentage shown in sidebar badge.

---

## 17. Pages Structure

### Public Pages

| Path           | Description                                      |
| -------------- | ------------------------------------------------ |
| `/`            | Homepage — hero, stats, featured showcase        |
| `/pricing`     | Subscription tiers and comparison                |
| `/marketplace` | Public product marketplace (Suppliers)           |
| `/projects`    | Public project listings (owner identity blurred) |
| `/partners`    | Partners directory — Contractors + Suppliers     |
| `/contact`     | Contact form                                     |
| `/terms`       | Terms of Service (bilingual)                     |
| `/privacy`     | Privacy Policy (bilingual)                       |
| `/cookies`     | Cookie Policy                                    |

### Auth Pages

| Path               | Description                             |
| ------------------ | --------------------------------------- |
| `/login`           | Email/password + Google OAuth           |
| `/register`        | Role selection + company info + payment |
| `/register/verify` | Document upload after payment           |
| `/forgot-password` | Password reset flow                     |

### Project Owner Dashboard

| Path                                  | Description                                                  |
| ------------------------------------- | ------------------------------------------------------------ |
| `/dashboard`                          | Overview stats                                               |
| `/dashboard/projects`                 | My posted projects                                           |
| `/dashboard/projects/new`             | Create new project post                                      |
| `/dashboard/projects/[project-title]` | Project detail — bids, comparison                            |
| `/dashboard/rfqs`                     | My RFQs                                                      |
| `/dashboard/rfqs/new`                 | Create new RFQ                                               |
| `/dashboard/deals`                    | All deals                                                    |
| `/dashboard/deals/[deal-title]`       | Deal Workspace                                               |
| `/dashboard/contracts`                | Contract generator                                           |
| `/dashboard/crm`                      | Client management                                            |
| `/dashboard/analytics`                | Performance analytics                                        |
| `/dashboard/messages`                 | Conversations                                                |
| `/dashboard/reviews`                  | Received reviews                                             |
| `/dashboard/profile`                  | Company/personal info, documents, company profile PDF upload |
| `/dashboard/subscription`             | Tier, renewal, upgrade                                       |

### Contractor Dashboard

| Path                                      | Description                |
| ----------------------------------------- | -------------------------- |
| `/dashboard`                              | Overview stats             |
| `/dashboard/bids`                         | Submitted bids and status  |
| `/dashboard/deals`                        | All deals                  |
| `/dashboard/deals/[deal-title]`           | Deal Workspace             |
| `/dashboard/deals/[deal-title]/kanban`    | Kanban board               |
| `/dashboard/deals/[deal-title]/daily-log` | Daily site log             |
| `/dashboard/deals/[deal-title]/documents` | Document vault             |
| `/dashboard/deals/[deal-title]/photos`    | Photo timeline             |
| `/dashboard/rfqs`                         | Browse and respond to RFQs |
| `/dashboard/supplier-hire`                | Direct hire requests       |
| `/dashboard/contracts`                    | Contract generator         |
| `/dashboard/crm`                          | Client management          |
| `/dashboard/analytics`                    | Performance analytics      |
| `/dashboard/messages`                     | Conversations              |
| `/dashboard/reviews`                      | Received reviews           |
| `/dashboard/profile`                      | Company info, documents    |
| `/dashboard/subscription`                 | Tier, renewal, upgrade     |

### Supplier Dashboard

| Path                                  | Description                |
| ------------------------------------- | -------------------------- |
| `/dashboard`                          | Overview stats             |
| `/dashboard/products`                 | Product catalog            |
| `/dashboard/products/new`             | Create new product         |
| `/dashboard/products/[product-title]` | Product detail and edit    |
| `/dashboard/inquiries`                | Customer inquiries         |
| `/dashboard/rfqs`                     | Browse RFQs, submit quotes |
| `/dashboard/hire-requests`            | Direct hire requests       |
| `/dashboard/deals`                    | All deals                  |
| `/dashboard/deals/[deal-title]`       | Deal Workspace             |
| `/dashboard/contracts`                | Contract generator         |
| `/dashboard/crm`                      | Client management          |
| `/dashboard/analytics`                | Performance analytics      |
| `/dashboard/messages`                 | Conversations              |
| `/dashboard/reviews`                  | Received reviews           |
| `/dashboard/profile`                  | Company info, documents    |
| `/dashboard/subscription`             | Tier, renewal, upgrade     |
| `/dashboard/bulk-upload`              | CSV import (Business+)     |

### Buyer Dashboard

| Path                            | Description                |
| ------------------------------- | -------------------------- |
| `/dashboard`                    | Overview stats             |
| `/dashboard/rfqs`               | My RFQs and status         |
| `/dashboard/rfqs/new`           | Create new RFQ             |
| `/dashboard/deals`              | Deals from accepted quotes |
| `/dashboard/deals/[deal-title]` | Deal Workspace             |
| `/dashboard/messages`           | Conversations              |
| `/dashboard/profile`            | Company/personal info      |

### Admin Panel

| Path                   | Description            |
| ---------------------- | ---------------------- |
| `/admin`               | Admin overview         |
| `/admin/users`         | User management        |
| `/admin/registrations` | Pending registrations  |
| `/admin/posts`         | Posts moderation queue |
| `/admin/deals`         | Deal oversight         |
| `/admin/commissions`   | Commission management  |
| `/admin/reviews`       | Review moderation      |
| `/admin/coupons`       | Coupon management      |
| `/admin/settings`      | Platform settings      |

---

## 18. Admin Panel Features

### 18.1 User Management

- Search/filter by email, company, tier, status
- Bulk actions: ban, promote, adjust tier
- User statistics: posts, deals, reviews
- Manual override: subscription status
- Verification status tracking

### 18.2 Registration Management

- Pending queue with document review
- Download and verify documents
- Approve/reject with notes and feedback
- Payment status check (Moyasar / bank transfer)

### 18.3 Posts Moderation

- Review queue for pending projects, products, RFQs
- Content validation: title, description, images, pricing
- Status control: approve, reject, archive
- Rejection feedback for re-submission

### 18.4 Deal Oversight

- View all deals with status
- Admin actions: override status, resolve disputes
- Complete activity audit logs
- Linked commission tracking

### 18.5 Commission Management

- Approval queue → approve / reject with reason
- Invoice auto-generation on approval
- Payment status and history

### 18.6 Review Moderation

- Flagged/reported review queue
- Actions: hide, flag, approve
- Edit window override
- Direct impact on `average_rating`

### 18.7 Coupon Management

- CRUD (no hard delete — deactivate only)
- Active/inactive toggle
- Usage analytics and redemption tracking
- Configurable validation rules

---

## 19. Security & Data Protection

### 19.1 Authentication & Authorization

- **Supabase Auth**: email/password, phone verification, Google OAuth (PKCE)
- **Row-Level Security**: database-level access control on all tables
- **Role-based access**: admin, user, guest
- **Session management**: secure cookie-based sessions
- **Account linking**: link/unlink Google account from profile settings

### 19.2 Data Protection

- ZATCA-compliant VAT handling
- Admin manual document verification
- Encrypted file storage
- Audit trails for deals and admin actions

### 19.3 Saudi Compliance

- **Currency**: SAR only
- **Phone**: `+966` validation (`/^\+966[0-9]{9}$/`)
- **VAT**: ZATCA 15%, all prices VAT-inclusive
- **Privacy**: PDPL consent with timestamp
- **Cities**: Saudi city reference table

---

## 20. Technical Infrastructure

### 20.1 Bilingual Support

- **RTL/LTR**: automatic layout switching via `dir` attribute
- **Locale detection**: cookie-based with manual override (no URL prefix)
- **Content pattern**: `*_en` / `*_ar` field pairs
- **No auto-translation**: manual entry in both languages

### 20.2 Real-Time Updates (Supabase Realtime)

- Live notifications, message delivery, deal progress, Kanban card moves

### 20.3 File Management (Supabase Storage)

**Module-based upload limits**:

| Module                 | Max File Size | Accepted Formats    |
| ---------------------- | ------------- | ------------------- |
| Project BOQ / drawings | 5 GB          | PDF, DWG, DXF, XLSX |
| Project images         | 10 MB         | JPEG, PNG           |
| Product images         | 5 MB          | JPEG, PNG, WebP     |
| Product spec sheets    | 50 MB         | PDF                 |
| Company profile (PO)   | 50 MB         | PDF                 |
| Chat attachments       | 10 MB         | Images, PDFs        |
| Verification documents | 10 MB         | PDF, JPEG, PNG      |
| Deal proofs            | 50 MB         | Images, PDFs        |
| Contract PDFs          | 20 MB         | PDF                 |
| Daily site log photos  | 10 MB         | JPEG, PNG           |
| CSV bulk import        | 50 MB         | CSV                 |

- RLS-protected file access
- Large uploads (> 50 MB) use Supabase resumable uploads

#### 20.3.1 Storage Bucket Structure

| Bucket              | Access  | Path Pattern                                   | Purpose                        |
| ------------------- | ------- | ---------------------------------------------- | ------------------------------ |
| `avatars`           | Public  | `{user_id}/avatar.{ext}`                       | Profile photos                 |
| `company-logos`     | Public  | `{user_id}/logo.{ext}`                         | Company logos (shown publicly) |
| `company-profiles`  | Public  | `{user_id}/{uuid}.pdf`                         | Company profile PDFs (PO)      |
| `project-files`     | Private | `{project_id}/{category}/{uuid}.{ext}`         | BOQ, drawings, specs, images   |
| `product-images`    | Public  | `{product_id}/{uuid}.{ext}`                    | Product gallery images         |
| `product-specs`     | Public  | `{product_id}/specs/{uuid}.pdf`                | Product spec sheets            |
| `verification-docs` | Private | `{user_id}/{doc_type}/{uuid}.{ext}`            | VAT cert, CR license           |
| `deal-proofs`       | Private | `{deal_id}/proofs/{proof_id}/{uuid}.{ext}`     | Work, payment, supply proofs   |
| `deal-documents`    | Private | `{deal_id}/documents/{category}/{uuid}.{ext}`  | Document vault files           |
| `deal-daily-logs`   | Private | `{deal_id}/daily-logs/{date}/{uuid}.{ext}`     | Site log photos                |
| `contracts`         | Private | `{user_id}/contracts/{contract_id}/{uuid}.pdf` | Generated contract PDFs        |
| `chat-attachments`  | Private | `{conversation_id}/{message_id}/{uuid}.{ext}`  | Message file attachments       |
| `bulk-imports`      | Private | `{user_id}/imports/{uuid}.csv`                 | CSV bulk upload files          |
| `invoices`          | Private | `{user_id}/invoices/{invoice_id}.pdf`          | Commission & subscription PDFs |

**File naming**: all user-uploaded files renamed to `{uuid}.{original_ext}` to prevent collisions and path traversal.

**Public vs. Private**:

- **Public buckets**: served via Supabase CDN, no auth required (avatars, logos, product images)
- **Private buckets**: RLS policies enforce that only deal participants, file owners, or admins can access

**Orphan cleanup**: scheduled Supabase Edge Function (weekly cron) scans for files not referenced by any active DB row (e.g., deleted drafts, rejected posts) and moves them to a `_trash/` prefix. Admin can review and purge from `/admin/settings`.

### 20.4 API Architecture

- Next.js API Routes (RESTful)
- RLS enforcement via Supabase
- Admin bypass: `createAdminClient()` for privileged operations
- Zod validation on all inputs

### 20.5 SEO & Performance

- React Server Components for SSR
- Static generation for homepage and pricing
- Dynamic Open Graph images
- Auto-generated sitemap.xml and robots.txt

---

## 21. External Integrations

| Service   | Purpose                           |
| --------- | --------------------------------- |
| Supabase  | Database, Auth, Storage, Realtime |
| Google    | OAuth (Google Identity Services)  |
| Moyasar   | Payment processing                |
| Resend    | Transactional email               |
| Typesense | Full-text search                  |
| Upstash   | Rate limiting (Redis)             |
| Vercel    | Hosting & deployment              |

---

## 22. Edge Cases & Error Handling

This section defines system behavior for non-happy-path scenarios that must be handled consistently.

### 22.1 Subscription Lifecycle Edge Cases

| Scenario                                        | Behavior                                                                                                                                  |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Subscription expires with **active deals**      | Deals remain active — seller can still submit proofs, update progress, and communicate. Cannot create **new** bids/posts until renewed.   |
| Subscription expires with **pending bids**      | Existing pending bids remain visible to project owners. Contractor cannot submit **new** bids.                                            |
| Subscription expires with **pending posts**     | Posts in `pending` status stay in queue. If approved while expired, they publish normally. No new posts until renewed.                    |
| Bid awarded but contractor subscription expired | Deal still created — subscription was valid at bid time. Contractor can work the deal but cannot bid on new projects.                     |
| Downgrade mid-cycle with over-limit content     | Existing content preserved (grandfathered). Cannot create new posts/bids beyond new tier limits. CRM clients over limit become read-only. |
| Payment fails during subscription purchase      | Transaction rolled back. User stays on current tier (or Starter if new). Retry prompt shown. No partial subscription states.              |
| Bank transfer pending for > 14 days             | Auto-cancelled. `subscription_payment_expired` notification sent. User must re-initiate payment.                                          |

### 22.2 Deal & Bidding Edge Cases

| Scenario                                          | Behavior                                                                                                                  |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Both parties request cancellation simultaneously  | System detects mutual cancellation → auto-approve immediately, skip counterparty approval step.                           |
| Cancellation requested on a completed deal        | Not allowed — completed deals cannot be cancelled. Disputes are handled via admin.                                        |
| Proof rejected 3+ times on same milestone         | System flags deal for admin review. `deal_flagged_review` notification to admin.                                          |
| Bid submitted just before project deadline closes | Bid accepted if server timestamp is before deadline. Race condition handled by DB constraint (`submitted_at < deadline`). |
| Project deleted/archived with active bids         | Not allowed — projects with bids in `pending` or `shortlisted` status cannot be deleted. Must reject all bids first.      |
| Deal value disputed (commission calculation)      | Seller raises dispute → deal commission enters `disputed` status → admin reviews and resolves (see §12.5).                |

### 22.3 Quotation Edge Cases

| Scenario                                             | Behavior                                                                                                       |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Quotation validity period expires                    | Status auto-updates to `expired` via scheduled job. Recipient sees "This quotation has expired."               |
| Multiple quotations on same inquiry — one accepted   | Other quotations on the same inquiry auto-transition to `rejected` with reason "Another quotation accepted."   |
| Quotation revision after sending                     | Sender can revise up to **3 times** before acceptance. Each revision resets the validity period. History kept. |
| Quotation accepted but sender's subscription expired | Deal still created — quotation was valid at acceptance time.                                                   |

### 22.4 Product & Inventory Edge Cases

| Scenario                                | Behavior                                                                                                      |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Stock reaches 0 (inventory tracking on) | Product remains listed with "Out of Stock" (نفذت الكمية) badge. Inquiry button stays active. RFQ still works. |
| Stock tracking disabled                 | Product always shows as available — no stock badge shown.                                                     |
| Bulk CSV import with invalid rows       | Valid rows imported; invalid rows returned in error report CSV with row number + error description.           |
| Product deleted with active inquiries   | Not allowed — must respond to or close all pending inquiries first.                                           |

### 22.5 RFQ Edge Cases

| Scenario                             | Behavior                                                                                          |
| ------------------------------------ | ------------------------------------------------------------------------------------------------- |
| RFQ deadline passes with 0 responses | Auto-close with status `expired`. Poster notified: "Your RFQ received no responses." Can re-post. |
| RFQ deadline passes with responses   | Auto-close for new responses. Poster can still review and accept existing responses.              |
| Poster deletes RFQ with responses    | Not allowed — must close or award first.                                                          |

### 22.6 Review Edge Cases

| Scenario                                   | Behavior                                                           |
| ------------------------------------------ | ------------------------------------------------------------------ |
| 30-day review window expires               | Review option removed from UI. Cannot submit late reviews.         |
| User tries to review before deal completes | Blocked — review button not shown until deal status = `completed`. |
| Counterparty disputes a review             | Report to admin → admin can hide review pending investigation.     |

### 22.7 Messaging Edge Cases

| Scenario                               | Behavior                                                                       |
| -------------------------------------- | ------------------------------------------------------------------------------ |
| Message sent to banned/restricted user | Delivered to DB but recipient cannot respond until restriction lifted.         |
| File attachment exceeds limit          | Client-side validation blocks upload. Server-side rejects with 413 status.     |
| Conversation with no deal/project      | Not allowed — all conversations must be linked to a project, product, or deal. |

---

## 23. Non-Functional Requirements

### 23.1 Performance Targets

| Metric                        | Target                                               |
| ----------------------------- | ---------------------------------------------------- |
| Time to First Byte (TTFB)     | < 200ms (Vercel Edge, Saudi region)                  |
| Largest Contentful Paint      | < 2.5s on 4G connection                              |
| API response (server actions) | < 500ms p95 for mutations; < 300ms p95 for reads     |
| Search query (Typesense)      | < 100ms p95                                          |
| Realtime message delivery     | < 500ms end-to-end                                   |
| File upload start             | < 1s for files under 10 MB                           |
| Concurrent users              | Support 500 concurrent authenticated users at launch |

### 23.2 Rate Limiting (Upstash Redis)

| Endpoint / Action       | Limit          | Window | Notes                               |
| ----------------------- | -------------- | ------ | ----------------------------------- |
| Login attempts          | 5 attempts     | 15 min | Per email — prevents brute force    |
| Password reset requests | 3 requests     | 1 hour | Per email                           |
| Registration            | 3 accounts     | 1 hour | Per IP                              |
| Bid submission          | 20 submissions | 1 hour | Per user (on top of monthly limits) |
| RFQ creation            | 10 RFQs        | 1 hour | Per user                            |
| Message sending         | 60 messages    | 1 min  | Per user — anti-spam                |
| File upload             | 50 uploads     | 1 hour | Per user                            |
| Search queries          | 120 queries    | 1 min  | Per IP                              |
| Contact form            | 3 submissions  | 1 hour | Per IP                              |
| Quotation creation      | 30 quotations  | 1 hour | Per user                            |
| API catch-all           | 200 requests   | 1 min  | Per authenticated user              |

Rate limit responses return HTTP 429 with bilingual message and `Retry-After` header.

### 23.3 Availability & Recovery

- **Uptime target**: 99.9% (Vercel + Supabase managed infrastructure)
- **Database backups**: Supabase daily automated backups (PITR on Pro plan) — 7-day retention
- **Disaster recovery**: Supabase project restore from backup; Vercel instant rollback to previous deployment
- **Maintenance windows**: scheduled via Supabase dashboard; users notified 24h in advance via banner

### 23.4 Monitoring & Error Tracking

| Tool                 | Purpose                                                                                               |
| -------------------- | ----------------------------------------------------------------------------------------------------- |
| Sentry               | Client + server error tracking, source maps, session replay                                           |
| Vercel Analytics     | Web Vitals, page load performance, traffic                                                            |
| Supabase Dashboard   | DB performance, RLS query analysis, storage usage                                                     |
| Upstash Console      | Rate limit hit rates, Redis key usage                                                                 |
| Custom `/api/health` | Liveness probe: checks Supabase connection + Typesense ping — used by Vercel cron or external monitor |

### 23.5 Logging

- **Server actions**: log action name, user ID, duration, success/failure to Vercel Logs (structured JSON)
- **Admin actions**: full audit trail in `admin_audit_log` table (action, target, admin user, timestamp, details)
- **Auth events**: Supabase Auth logs (login, logout, password reset, OAuth) — retained 90 days
- **Sensitive data**: never log passwords, tokens, full credit card numbers, or file contents
