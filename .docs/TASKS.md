# Muqawil HUB — Master Task List

> **Generated from**: `ROADMAP.md`, `CHECKLIST.md`, `FEATURES.md`, `API-DESIGN.md`, `ARCHITECTURE.md`, `DATABASE.sql`  
> **Total Phases**: 12 (0–11) | **Estimated Duration**: 16 weeks  
> **Legend**: 🔴 Critical · 🟡 Important · 🟢 Nice-to-have | **Effort**: S (< 2h) · M (2–6h) · L (6h–2d) · XL (2d+)

---

## Phase 0 — Foundation & Infrastructure (Week 1)

### 0.1 Dependencies & Tooling

| #   | Task                                                                              | Priority | Effort | Status |
| --- | --------------------------------------------------------------------------------- | -------- | ------ | ------ |
| 1   | Install core packages: `@supabase/supabase-js`, `@supabase/ssr`, `zod`            | 🔴       | S      | [x]    |
| 2   | Install UI packages: `clsx`, `tailwind-merge`, `lucide-react`                     | 🔴       | S      | [x]    |
| 3   | Install integration packages: `typesense`, `@upstash/redis`, `@upstash/ratelimit` | 🟡       | S      | [x]    |
| 4   | Configure ESLint flat config with TypeScript strict rules                         | 🟡       | S      | [x]    |
| 5   | Verify `tsconfig.json` strict mode + path aliases (`@/*` → `./src/*`)             | 🔴       | S      | [x]    |

### 0.2 Database Setup

| #   | Task                                                                                    | Priority | Effort | Status |
| --- | --------------------------------------------------------------------------------------- | -------- | ------ | ------ |
| 6   | Run `DATABASE.sql` in Supabase SQL Editor (all tables, ENUMs, triggers, RLS, seed data) | 🔴       | M      | [x]    |
| 7   | Generate TypeScript types: `supabase gen types typescript > src/types/database.ts`      | 🔴       | S      | [x]    |
| 8   | Verify RLS policies with test queries for all tables                                    | 🔴       | M      | [x]    |
| 9   | Configure Supabase Realtime publications on required tables                             | 🟡       | S      | [x]    |
| 10  | Create Storage buckets (14 buckets as documented)                                       | 🔴       | M      | [x]    |
| 11  | Set Storage bucket policies (MIME type restrictions, size limits)                       | 🔴       | M      | [x]    |

### 0.3 Supabase Client Setup

| #   | Task                                                                                | Priority | Effort | Status |
| --- | ----------------------------------------------------------------------------------- | -------- | ------ | ------ |
| 12  | Create `src/lib/supabase/client.ts` — `createBrowserClient<Database>()`             | 🔴       | S      | [x]    |
| 13  | Create `src/lib/supabase/server.ts` — `createServerClient<Database>(cookies())`     | 🔴       | S      | [x]    |
| 14  | Create `src/lib/supabase/admin.ts` — `createAdminClient<Database>()` (service role) | 🔴       | S      | [x]    |
| 15  | Create `src/lib/supabase/middleware.ts` — middleware client for session refresh     | 🔴       | S      | [x]    |

### 0.4 Project Structure & Types

| #   | Task                                                                                                         | Priority | Effort | Status |
| --- | ------------------------------------------------------------------------------------------------------------ | -------- | ------ | ------ |
| 16  | Create folder structure: `components/ui/`, `components/forms/`, `components/layout/`, `components/features/` | 🔴       | S      | [x]    |
| 17  | Create folder structure: `lib/`, `actions/`, `hooks/`, `types/`, `schemas/`                                  | 🔴       | S      | [x]    |
| 18  | Create `src/lib/utils.ts` — `cn()`, `formatSAR()`, `formatPhone()`, `getLocaleField()`                       | 🔴       | M      | [x]    |
| 19  | Create `src/types/enums.ts` — TypeScript enums matching DB enums                                             | 🔴       | M      | [x]    |
| 20  | Create `src/types/index.ts` — re-exports + derived application types                                         | 🟡       | S      | [x]    |

### 0.5 Design System & Primitives

| #   | Task                                                                                        | Priority | Effort | Status |
| --- | ------------------------------------------------------------------------------------------- | -------- | ------ | ------ |
| 21  | Update `globals.css` with full `@theme inline` tokens (colors, fonts, radii, dark mode)     | 🔴       | M      | [x]    |
| 22  | Install Arabic font (IBM Plex Sans Arabic) + English font (Inter) via `next/font`           | 🔴       | S      | [x]    |
| 23  | Build `Button` component (variants: primary, secondary, outline, ghost, destructive; sizes) | 🔴       | M      | [x]    |
| 24  | Build `Input` component (text input with label, error, RTL support)                         | 🔴       | M      | [x]    |
| 25  | Build `Textarea` component                                                                  | 🔴       | S      | [x]    |
| 26  | Build `Card` component (container with header, body, footer slots)                          | 🔴       | S      | [x]    |
| 27  | Build `Badge` component (status, tier, role badges)                                         | 🔴       | S      | [x]    |
| 28  | Build `Modal` / `Dialog` component                                                          | 🔴       | M      | [x]    |
| 29  | Build `Skeleton` component (loading placeholders)                                           | 🟡       | S      | [x]    |
| 30  | Build `Toast` / notification component                                                      | 🟡       | M      | [x]    |
| 31  | Build `FormField` — label + input + error message wrapper                                   | 🔴       | S      | [x]    |
| 32  | Build `PhoneInput` — locked `+966` prefix with 9-digit validation                           | 🔴       | M      | [x]    |
| 33  | Build `CurrencyInput` — SAR formatting with VAT display                                     | 🟡       | M      | [x]    |
| 34  | Build `CitySelect` — Saudi cities dropdown from DB                                          | 🟡       | M      | [x]    |

### 0.6 Layout Shell

| #   | Task                                                                         | Priority | Effort | Status |
| --- | ---------------------------------------------------------------------------- | -------- | ------ | ------ |
| 35  | Create root `layout.tsx` — locale provider, `dir` attribute, fonts, metadata | 🔴       | M      | [x]    |
| 36  | Create `(public)/layout.tsx` — Header + Footer                               | 🔴       | M      | [x]    |
| 37  | Create `(auth)/layout.tsx` — centered card layout                            | 🔴       | S      | [x]    |
| 38  | Create `(dashboard)/dashboard/layout.tsx` — Sidebar + Topbar                 | 🔴       | L      | [x]    |
| 39  | Build `Header` component — logo, nav links, locale switcher, auth buttons    | 🔴       | M      | [x]    |
| 40  | Build `Footer` component — links, copyright, social                          | 🟡       | M      | [x]    |
| 41  | Build `Sidebar` component — role-based navigation items, collapsible         | 🔴       | L      | [x]    |
| 42  | Build `Topbar` component — breadcrumbs, user menu, notification bell         | 🔴       | M      | [x]    |
| 43  | Build `MobileNav` — responsive hamburger navigation                          | 🟡       | M      | [x]    |
| 44  | Build `LocaleSwitcher` — AR/EN toggle component                              | 🔴       | S      | [x]    |

### 0.7 Middleware

| #   | Task                                                                             | Priority | Effort | Status |
| --- | -------------------------------------------------------------------------------- | -------- | ------ | ------ |
| 45  | Create `src/middleware.ts` — session refresh, locale detection, route protection | 🔴       | L      | [x]    |
| 46  | Configure matcher for `/dashboard/*`, `/admin/*`, `/login`, `/register`          | 🔴       | S      | [x]    |

---

## Phase 1 — Authentication & Registration (Week 2)

### 1.1 Auth Schemas

| #   | Task                                                                                                          | Priority | Effort | Status |
| --- | ------------------------------------------------------------------------------------------------------------- | -------- | ------ | ------ |
| 47  | Create `src/schemas/auth.ts` — `RegisterSchema`, `LoginSchema`, `ResetPasswordSchema`, `UpdatePasswordSchema` | 🔴       | M      | [x]    |
| 48  | Phone validation: `+966` regex pattern (`/^\+966[0-9]{9}$/`)                                                  | 🔴       | S      | [x]    |
| 49  | PDPL consent boolean required field                                                                           | 🔴       | S      | [x]    |

### 1.2 Auth Server Actions

| #   | Task                                                                         | Priority | Effort | Status |
| --- | ---------------------------------------------------------------------------- | -------- | ------ | ------ |
| 50  | Create `src/actions/auth.ts` — `register` action (7-step pipeline)           | 🔴       | L      | [x]    |
| 51  | Create `login` action with email/password                                    | 🔴       | M      | [x]    |
| 52  | Create `loginWithGoogle` action (OAuth PKCE flow)                            | 🔴       | M      | [x]    |
| 53  | Create `logout` action                                                       | 🔴       | S      | [x]    |
| 54  | Create `resetPassword` action                                                | 🔴       | M      | [x]    |
| 55  | Create `updatePassword` action                                               | 🟡       | S      | [x]    |
| 56  | Rate limiting on login (5/15 min per email) and registration (3/hour per IP) | 🔴       | M      | [x]    |

### 1.3 Registration Wizard

| #   | Task                                                                                        | Priority | Effort | Status |
| --- | ------------------------------------------------------------------------------------------- | -------- | ------ | ------ |
| 57  | Build `register-wizard.tsx` — multi-step form container with state management               | 🔴       | L      | [x]    |
| 58  | Step 1: Role selection — 4 visual cards (PO, Contractor, Supplier, Buyer) with descriptions | 🔴       | M      | [x]    |
| 59  | Step 2: Account details — email, password, phone (+966), PDPL consent                       | 🔴       | M      | [x]    |
| 60  | Step 3: Company/Personal profile — conditional fields per role and profile type             | 🔴       | L      | [x]    |
| 61  | Step 4: Subscription tier selection — Starter (free), Pro, Business, Enterprise             | 🔴       | M      | [x]    |
| 62  | Step 5: Payment via Moyasar — skip for Starter tier                                         | 🟡       | L      | [ ]    |
| 63  | Step 6: Document upload — skip for PO/Buyer/Starter                                         | 🟡       | M      | [ ]    |
| 64  | Progress indicator component showing current step                                           | 🔴       | S      | [x]    |

### 1.4 Login & Recovery Pages

| #   | Task                                                                              | Priority | Effort | Status |
| --- | --------------------------------------------------------------------------------- | -------- | ------ | ------ |
| 65  | Build `src/app/(auth)/login/page.tsx` — email/password form + Google OAuth button | 🔴       | M      | [x]    |
| 66  | Build `src/app/(auth)/register/page.tsx` — wizard host page                       | 🔴       | S      | [x]    |
| 67  | Build `src/app/(auth)/forgot-password/page.tsx` — email input + reset flow        | 🔴       | M      | [x]    |
| 68  | Build `GoogleAuthButton` component                                                | 🔴       | S      | [x]    |

### 1.5 OAuth & Verification

| #   | Task                                                                   | Priority | Effort | Status |
| --- | ---------------------------------------------------------------------- | -------- | ------ | ------ |
| 69  | Create `src/app/api/auth/callback/route.ts` — code exchange + redirect | 🔴       | M      | [x]    |
| 70  | Handle new Google users — redirect to Step 1 for role selection        | 🔴       | M      | [x]    |
| 71  | Configure Supabase email templates (bilingual AR/EN)                   | 🔴       | M      | [ ]    |
| 72  | Handle email verification redirect back to app                         | 🔴       | S      | [x]    |

### 1.6 Verification Gates (4-gate flow)

| #   | Task                                                                                        | Priority | Effort | Status |
| --- | ------------------------------------------------------------------------------------------- | -------- | ------ | ------ |
| 73  | Implement `pending_email → pending_payment → pending_documents → pending_approval → active` | 🔴       | L      | [x]    |
| 74  | Simplified flow for PO/Buyer/Starter: `pending_email → active`                              | 🔴       | M      | [x]    |
| 75  | Pro+ tiers: full 4-gate verification flow                                                   | 🟡       | M      | [x]    |

---

## Phase 2 — Core Profiles & Subscriptions (Week 3)

### 2.1 Profile Management

| #   | Task                                                                         | Priority | Effort | Status |
| --- | ---------------------------------------------------------------------------- | -------- | ------ | ------ |
| 76  | Create `src/schemas/subscription.ts`                                         | 🔴       | M      | [x]    |
| 77  | Build `src/app/(dashboard)/dashboard/profile/page.tsx` — view & edit profile | 🔴       | L      | [x]    |
| 78  | Profile edit form with bilingual fields (AR/EN)                              | 🔴       | M      | [x]    |
| 79  | Avatar upload functionality                                                  | 🔴       | M      | [x]    |
| 80  | Company logo upload                                                          | 🔴       | S      | [x]    |
| 81  | Verification document upload (Pro+ accounts)                                 | 🟡       | M      | [x]    |
| 82  | `updateProfile` server action with file handling                             | 🔴       | L      | [x]    |

### 2.2 Subscription Management

| #   | Task                                                                                                                                    | Priority | Effort | Status |
| --- | --------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------ | ------ |
| 83  | Create `src/actions/subscriptions.ts` — `subscribe`, `upgradeSubscription`, `downgradeSubscription`, `renewSubscription`, `applyCoupon` | 🔴       | XL     | [x]    |
| 84  | Build `src/app/(dashboard)/dashboard/subscription/page.tsx`                                                                             | 🔴       | L      | [x]    |
| 85  | Current tier display with usage stats (bids used, products posted, etc.)                                                                | 🔴       | M      | [x]    |
| 86  | Upgrade / downgrade / renew UI                                                                                                          | 🔴       | L      | [x]    |
| 87  | Coupon input and validation system                                                                                                      | 🟡       | M      | [x]    |
| 88  | Moyasar payment integration for subscription payments                                                                                   | 🔴       | XL     | [ ]    |

### 2.3 Custom Hooks

| #   | Task                                                                         | Priority | Effort | Status |
| --- | ---------------------------------------------------------------------------- | -------- | ------ | ------ |
| 89  | Create `src/hooks/use-auth.ts` — session state management                    | 🔴       | M      | [x]    |
| 90  | Create `src/hooks/use-locale.ts` — AR/EN switching, `t()`, `field()` helpers | 🔴       | L      | [x]    |
| 91  | Create `src/hooks/use-subscription.ts` — current tier + limit checking       | 🔴       | M      | [x]    |

### 2.4 Dashboard Overview

| #   | Task                                                                               | Priority | Effort | Status |
| --- | ---------------------------------------------------------------------------------- | -------- | ------ | ------ |
| 92  | Build `src/app/(dashboard)/dashboard/page.tsx` — role-specific overview            | 🔴       | L      | [x]    |
| 93  | PO view: active projects, pending bids, active deals                               | 🔴       | M      | [x]    |
| 94  | Contractor view: available projects, submitted bids, active deals, Kanban shortcut | 🔴       | M      | [x]    |
| 95  | Supplier view: products, inquiries, RFQs, active deals                             | 🔴       | M      | [x]    |
| 96  | Buyer view: marketplace shortcut, RFQs, active deals                               | 🔴       | M      | [x]    |
| 97  | Onboarding checklist component (if profile incomplete)                             | 🟡       | M      | [x]    |

### 2.5 Public Pages

| #   | Task                                                                                  | Priority | Effort | Status |
| --- | ------------------------------------------------------------------------------------- | -------- | ------ | ------ |
| 98  | Build `src/app/(public)/pricing/page.tsx` — tier comparison table                     | 🔴       | M      | [x]    |
| 99  | Build `src/app/(public)/contact/page.tsx` — contact form + `submitContactForm` action | 🟡       | M      | [x]    |
| 100 | Build `src/app/(public)/terms/page.tsx` — Terms of Service (AR/EN)                    | 🟡       | S      | [x]    |
| 101 | Build `src/app/(public)/privacy/page.tsx` — Privacy Policy (PDPL compliant)           | 🟡       | S      | [x]    |
| 102 | Build `src/app/(public)/cookies/page.tsx` — Cookie Policy                             | 🟢       | S      | [x]    |

---

## Phase 3 — Projects & Products (Weeks 4–5)

### 3.1 Project CRUD

| #   | Task                                                                                                                            | Priority | Effort | Status |
| --- | ------------------------------------------------------------------------------------------------------------------------------- | -------- | ------ | ------ |
| 103 | Create `src/schemas/project.ts`                                                                                                 | 🔴       | M      | [x]    |
| 104 | Create `src/actions/projects.ts` — `createProject`, `updateProject`, `submitForApproval`, `deleteProject`                       | 🔴       | L      | [x]    |
| 105 | Build `src/app/(dashboard)/dashboard/projects/page.tsx` — my projects list with status badges                                   | 🔴       | L      | [x]    |
| 106 | Build `src/app/(dashboard)/dashboard/projects/new/page.tsx` — project form (bilingual, category, city, budget, timeline, files) | 🔴       | L      | [x]    |
| 107 | Build `src/app/(dashboard)/dashboard/projects/[id]/page.tsx` — project detail                                                   | 🔴       | L      | [x]    |
| 108 | Build `src/app/(dashboard)/dashboard/projects/[id]/edit/page.tsx` — edit form (draft/rejected only)                             | 🔴       | M      | [x]    |
| 109 | File upload to `project-files` bucket (BOQ, drawings, specs)                                                                    | 🔴       | M      | [x]    |

### 3.2 Product CRUD

| #   | Task                                                                                                                            | Priority | Effort | Status |
| --- | ------------------------------------------------------------------------------------------------------------------------------- | -------- | ------ | ------ |
| 110 | Create `src/schemas/product.ts`                                                                                                 | 🔴       | M      | [x]    |
| 111 | Create `src/actions/products.ts` — `createProduct`, `updateProduct`, `submitForApproval`, `deleteProduct`, `bulkImportProducts` | 🔴       | L      | [x]    |
| 112 | Build `src/app/(dashboard)/dashboard/products/page.tsx` — my products + tier limit indicator                                    | 🔴       | L      | [x]    |
| 113 | Build `src/app/(dashboard)/dashboard/products/new/page.tsx` — product form with variants, images, specs                         | 🔴       | L      | [x]    |
| 114 | Build variant editor component — dynamic variant rows (SKU, price, stock)                                                       | 🔴       | L      | [x]    |
| 115 | Image gallery upload to `product-images` bucket                                                                                 | 🔴       | M      | [x]    |
| 116 | Spec sheet upload to `product-specs` bucket                                                                                     | 🟡       | S      | [x]    |
| 117 | CSV bulk import (Business+ tier only)                                                                                           | 🟡       | L      | [x]    |

### 3.3 Public Browse Pages

| #   | Task                                                                                     | Priority | Effort | Status |
| --- | ---------------------------------------------------------------------------------------- | -------- | ------ | ------ |
| 118 | Build `src/app/(public)/projects/page.tsx` — browse published projects (search, filters) | 🔴       | L      | [x]    |
| 119 | Build `src/app/(public)/projects/[id]/page.tsx` — project detail public view             | 🔴       | M      | [x]    |
| 120 | Build `src/app/(public)/marketplace/page.tsx` — browse published products                | 🔴       | L      | [x]    |
| 121 | Build `src/app/(public)/products/[id]/page.tsx` — product detail + inquiry form          | 🔴       | L      | [x]    |
| 122 | Build `src/app/(public)/partners/page.tsx` — contractor/supplier directory               | 🔴       | L      | [x]    |
| 123 | Build `src/app/(public)/partners/[id]/page.tsx` — partner profile with reviews           | 🔴       | M      | [x]    |

### 3.4 Post Status Components

| #   | Task                                                                                    | Priority | Effort | Status |
| --- | --------------------------------------------------------------------------------------- | -------- | ------ | ------ |
| 124 | Build status badge component (Draft → Pending → Published → Awarded/Completed/Rejected) | 🔴       | S      | [x]    |
| 125 | Build moderation feedback display (rejection reason AR/EN)                              | 🔴       | S      | [x]    |
| 126 | Build empty state components for all list pages                                         | 🟡       | M      | [x]    |

---

## Phase 4 — Bidding & Comparison (Week 6)

### 4.1 Bid System

| #   | Task                                                                                             | Priority | Effort | Status |
| --- | ------------------------------------------------------------------------------------------------ | -------- | ------ | ------ |
| 127 | Create `src/schemas/bid.ts`                                                                      | 🔴       | M      | [x]    |
| 128 | Create `src/actions/bids.ts` — `submitBid`, `updateBid`, `shortlistBid`, `awardBid`, `rejectBid` | 🔴       | L      | [x]    |
| 129 | Bid form on project detail page (amount, timeline, methodology, attachments)                     | 🔴       | L      | [x]    |
| 130 | Tier limit enforcement (monthly bid count: Starter 10, Pro 50, Business 100, Enterprise ∞)       | 🔴       | M      | [x]    |
| 131 | Classification check (contractor classification ≥ project classification)                        | 🔴       | M      | [x]    |
| 132 | Rate limiting on bid submission (3/min)                                                          | 🟡       | S      | [x]    |

### 4.2 Bid Comparison

| #   | Task                                                                                  | Priority | Effort | Status |
| --- | ------------------------------------------------------------------------------------- | -------- | ------ | ------ |
| 133 | Build `src/app/(dashboard)/dashboard/projects/[id]/bids/page.tsx`                     | 🔴       | L      | [x]    |
| 134 | Build bid comparison table — side-by-side: price, timeline, rating, tier, methodology | 🔴       | L      | [x]    |
| 135 | Shortlist / Award / Reject actions inline                                             | 🔴       | M      | [x]    |

### 4.3 Deal Creation from Bid Award

| #   | Task                                                                          | Priority | Effort | Status |
| --- | ----------------------------------------------------------------------------- | -------- | ------ | ------ |
| 136 | `awardBid` → auto-create `DEAL-PROJECT` deal                                  | 🔴       | M      | [x]    |
| 137 | Auto-reject all other bids on that project                                    | 🔴       | S      | [x]    |
| 138 | Trigger notifications: `bid_awarded`, `bid_rejected` (others), `deal_created` | 🔴       | M      | [x]    |

---

## Phase 5 — Quotations & RFQs (Weeks 7–8)

### 5.1 Quotation System

| #   | Task                                                                                                                                                        | Priority | Effort | Status                               |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------ | ------------------------------------ |
| 139 | Create `src/schemas/quotation.ts`                                                                                                                           | 🔴       | M      | [x]                                  |
| 140 | Create `src/actions/quotations.ts` — `createQuotation`, `sendQuotation`, `acceptQuotation`, `rejectQuotation`, `duplicateQuotation`, `generateQuotationPDF` | 🔴       | XL     | [~] duplicateQuotation + PDF pending |
| 141 | Build `src/app/(dashboard)/dashboard/quotations/page.tsx` — quotation list                                                                                  | 🔴       | L      | [x]                                  |
| 142 | Build `src/app/(dashboard)/dashboard/quotations/new/page.tsx` — create form                                                                                 | 🔴       | L      | [x]                                  |
| 143 | Build line-item editor component — dynamic add/remove line items                                                                                            | 🔴       | L      | [x]                                  |
| 144 | Auto-numbering: `QTN-YYYY-NNNN` per company                                                                                                                 | 🔴       | M      | [x]                                  |
| 145 | VAT calculation (15% auto-added, net + VAT stored separately)                                                                                               | 🔴       | M      | [x]                                  |
| 146 | Clause library selection (Pro+ tiers)                                                                                                                       | 🟡       | M      | [ ]                                  |
| 147 | PDF generation — bilingual quotation document                                                                                                               | 🔴       | L      | [ ]                                  |
| 148 | Send quotation via Resend email                                                                                                                             | 🔴       | M      | [x]                                  |
| 149 | Accept quotation → create `DEAL-PRODUCT` deal                                                                                                               | 🔴       | M      | [x]                                  |
| 150 | Monthly quotation limit per tier (Starter 3, Pro 20, Business+ ∞)                                                                                           | 🔴       | S      | [x]                                  |

### 5.2 Inquiry Flow

| #   | Task                                        | Priority | Effort | Status |
| --- | ------------------------------------------- | -------- | ------ | ------ |
| 151 | Product inquiry form on product detail page | 🔴       | M      | [x]    |
| 152 | Inquiry → Quotation (Mode A) linking        | 🔴       | M      | [x]    |
| 153 | Supplier notification on new inquiry        | 🔴       | S      | [x]    |

### 5.3 RFQ System

| #   | Task                                                                                                                | Priority | Effort | Status |
| --- | ------------------------------------------------------------------------------------------------------------------- | -------- | ------ | ------ |
| 154 | Create `src/schemas/rfq.ts`                                                                                         | 🔴       | M      | [x]    |
| 155 | Create `src/actions/rfqs.ts` — `createRFQ`, `submitForApproval`, `respondToRFQ`, `acceptResponse`, `rejectResponse` | 🔴       | L      | [x]    |
| 156 | Build `src/app/(dashboard)/dashboard/rfqs/page.tsx` — my RFQs / my responses                                        | 🔴       | L      | [x]    |
| 157 | Build `src/app/(dashboard)/dashboard/rfqs/new/page.tsx` — create RFQ form                                           | 🔴       | M      | [x]    |
| 158 | Build `src/app/(public)/rfqs/page.tsx` — browse published RFQs                                                      | 🔴       | L      | [x]    |
| 159 | Build `src/app/(public)/rfqs/[id]/page.tsx` — RFQ detail + supplier response form                                   | 🔴       | L      | [x]    |
| 160 | RFQ deadline handling (auto-close, no new responses after deadline)                                                 | 🔴       | M      | [x]    |

### 5.4 Direct Hire Flow

| #   | Task                                                          | Priority | Effort | Status |
| --- | ------------------------------------------------------------- | -------- | ------ | ------ |
| 161 | Create hire request server actions                            | 🔴       | M      | [x]    |
| 162 | Hire button on supplier profile → sends request               | 🔴       | S      | [x]    |
| 163 | Supplier accepts (creates quotation) or declines              | 🔴       | M      | [x]    |
| 164 | Accepted quotation → deal creation with optional `project_id` | 🔴       | M      | [x]    |

---

## Phase 6 — Deal Workspace & Milestones (Weeks 9–10)

### 6.1 Deal Workspace

| #   | Task                                                                                 | Priority | Effort | Status |
| --- | ------------------------------------------------------------------------------------ | -------- | ------ | ------ |
| 165 | Create `src/schemas/deal.ts`                                                         | 🔴       | M      | [x]    |
| 166 | Create `src/actions/deals.ts` — deal management actions                              | 🔴       | XL     | [x]    |
| 167 | Build `src/app/(dashboard)/dashboard/deals/page.tsx` — deals list with filters       | 🔴       | L      | [x]    |
| 168 | Build `src/app/(dashboard)/dashboard/deals/[id]/page.tsx` — deal workspace with tabs | 🔴       | XL     | [x]    |
| 169 | Deal overview tab: parties, value, status, progress bars                             | 🔴       | L      | [x]    |
| 170 | Build dual progress bars component (buyer payment + seller completion — independent) | 🔴       | M      | [x]    |
| 171 | Build activity feed component — chronological audit trail                            | 🔴       | L      | [x]    |

### 6.2 Milestones

| #   | Task                                                          | Priority | Effort | Status |
| --- | ------------------------------------------------------------- | -------- | ------ | ------ |
| 172 | Build milestones tab / page within deal workspace             | 🔴       | L      | [x]    |
| 173 | Build milestone timeline visualization component              | 🔴       | L      | [x]    |
| 174 | Milestone creation by buyer (title, due date, payment amount) | 🔴       | M      | [x]    |
| 175 | Seller suggestion + buyer approval flow                       | 🔴       | M      | [x]    |
| 176 | Milestone completion tracking                                 | 🔴       | M      | [x]    |
| 177 | Deadline bar with color-coded status (green/yellow/red)       | 🟡       | S      | [x]    |

### 6.3 Proof System

| #   | Task                                                                    | Priority | Effort | Status |
| --- | ----------------------------------------------------------------------- | -------- | ------ | ------ |
| 178 | Build proof submission component                                        | 🔴       | L      | [x]    |
| 179 | 4 proof types: Work, Payment, Supply, Handover                          | 🔴       | M      | [x]    |
| 180 | File upload with percentage claim                                       | 🔴       | M      | [x]    |
| 181 | Counterparty review: confirm or reject (with required rejection reason) | 🔴       | M      | [x]    |
| 182 | 3+ rejections on same milestone → auto-flag for admin review            | 🔴       | M      | [x]    |
| 183 | Confirmed proofs increment progress bars                                | 🔴       | M      | [x]    |

### 6.4 Deal Lifecycle

| #   | Task                                                             | Priority | Effort | Status                                                   |
| --- | ---------------------------------------------------------------- | -------- | ------ | -------------------------------------------------------- |
| 184 | Deal completion: both progress bars at 100% → status `completed` | 🔴       | M      | [x]                                                      |
| 185 | Cancellation request + counterparty approval flow                | 🔴       | L      | [x]                                                      |
| 186 | Skip milestone request (mutual agreement)                        | 🟡       | M      | [x]                                                      |
| 187 | Document vault tab within deal workspace                         | 🟡       | M      | Partial — placeholder UI, file upload blocked on Storage |
| 188 | Realtime updates on deal workspace (Supabase Realtime channels)  | 🔴       | L      | [x]                                                      |

### 6.5 Realtime Hook

| #   | Task                                                                | Priority | Effort | Status |
| --- | ------------------------------------------------------------------- | -------- | ------ | ------ |
| 189 | Create `src/hooks/use-realtime.ts` — Supabase channel subscriptions | 🔴       | L      | [x]    |
| 190 | Subscribe to deal changes, milestones, proofs, activity             | 🔴       | M      | [x]    |

---

## Phase 7 — Contracts, CRM & Kanban (Week 11)

### 7.1 Contract Generator

| #   | Task                                                                                                          | Priority | Effort | Status |
| --- | ------------------------------------------------------------------------------------------------------------- | -------- | ------ | ------ | ------------------------------------------------------------- |
| 191 | Create `src/schemas/contract.ts`                                                                              | 🔴       | M      | [x]    |
| 192 | Create `src/actions/contracts.ts` — `createContract`, `signContract`, `generateContractPDF`, `verifyContract` | 🔴       | XL     | [~]    | Partial — generateContractPDF not implemented (needs PDF lib) |
| 193 | Build `src/app/(dashboard)/dashboard/contracts/page.tsx` — contract list                                      | 🔴       | L      | [x]    |
| 194 | Build `src/app/(dashboard)/dashboard/contracts/new/page.tsx` — create from template or deal                   | 🔴       | L      | [x]    |
| 195 | Template selection: Construction Agreement, Supply Agreement, Custom/Blank                                    | 🔴       | M      | [x]    |
| 196 | Clause library (add/remove/reorder clauses)                                                                   | 🟡       | L      | [~]    | Partial — display only, no reorder UI                         |
| 197 | Auto-fill from user profile (company name, CR, VAT, address)                                                  | 🔴       | M      | [x]    |
| 198 | Dual signature flow (Party A → Party B typed signature)                                                       | 🔴       | L      | [x]    |
| 199 | QR code generation for contract verification                                                                  | 🟡       | M      | [~]    | Partial — qr_uuid + verify page done, no QR image generation  |
| 200 | PDF generation (bilingual with signatures + company letterhead)                                               | 🔴       | L      | [ ]    | Blocked — needs PDF generation library                        |
| 201 | Build `src/app/verify/contract/[id]/page.tsx` — public verification page                                      | 🟡       | M      | [x]    | Route: /verify/contract/[uuid]                                |
| 202 | Tier limits on contracts per month (Starter 2 basic, Pro 10 all, Business+ unlimited)                         | 🔴       | S      | [x]    |

### 7.2 CRM

| #   | Task                                                                                       | Priority | Effort | Status |
| --- | ------------------------------------------------------------------------------------------ | -------- | ------ | ------ | --------------------------------------- |
| 203 | Create `src/schemas/crm.ts`                                                                | 🔴       | M      | [x]    |
| 204 | Create `src/actions/crm.ts` — full CRM CRUD (clients, notes, tags, pipeline, scoring)      | 🔴       | XL     | [x]    | Scoring not implemented                 |
| 205 | Build `src/app/(dashboard)/dashboard/crm/page.tsx` — pipeline view + client list           | 🔴       | L      | [x]    |
| 206 | Build `src/app/(dashboard)/dashboard/crm/clients/[id]/page.tsx` — client detail            | 🔴       | L      | [x]    | Route: /dashboard/crm/[id]              |
| 207 | Build drag-and-drop pipeline board (Lead → Negotiation → Active Deal → Completed → Repeat) | 🔴       | XL     | [~]    | Partial — clickable stage cards, no DnD |
| 208 | Tags and custom categories (Pro+ tiers)                                                    | 🟡       | M      | [x]    |
| 209 | Timestamped notes log per client (append-only, pinnable)                                   | 🔴       | M      | [x]    |
| 210 | Follow-up reminders (date-based, in-app + email) (Pro+ tiers)                              | 🟡       | L      | [~]    | Partial — in-app only, no email         |
| 211 | Auto-add clients from completed deals                                                      | 🔴       | M      | [x]    |
| 212 | Client scoring: A (≥80), B (≥50), C (<50)                                                  | 🟡       | M      | [x]    |
| 213 | Client source tracking (auto-tag origin: Bid Award, RFQ Response, etc.)                    | 🟡       | M      | [x]    |
| 214 | Last contact indicator with color coding (green < 30d, yellow 30–90d, red > 90d)           | 🟡       | S      | [~]    | Partial — date shown, no color coding   |
| 215 | Favorites / pinned clients                                                                 | 🟢       | S      | [x]    |
| 216 | Duplicate detection and merge (Pro+ tiers)                                                 | 🟢       | L      | [ ]    |
| 217 | Bulk actions: tag, export CSV, archive (Business+ only)                                    | 🟡       | L      | [x]    |
| 218 | Soft archive with restore                                                                  | 🟢       | M      | [x]    |
| 219 | Revenue analytics per client                                                               | 🟡       | M      | [x]    |
| 220 | Tier limits: Starter 20, Pro 200, Business+ unlimited                                      | 🔴       | S      | [x]    |

### 7.3 Kanban Board

| #   | Task                                                                      | Priority | Effort | Status |
| --- | ------------------------------------------------------------------------- | -------- | ------ | ------ | -------------------------------------------------------------- |
| 221 | Build `src/app/(dashboard)/dashboard/deals/[id]/kanban/page.tsx`          | 🔴       | L      | [x]    |
| 222 | Build drag-and-drop Kanban board component                                | 🔴       | XL     | [~]    | Partial — button-based move, no DnD library                    |
| 223 | Default columns: To Do → In Progress → Review → Done                      | 🔴       | M      | [x]    |
| 224 | Task cards: title, description, assignee, due date, priority, attachments | 🔴       | L      | [~]    | Partial — no attachments (blocked on Storage)                  |
| 225 | Pro tier: simple checklist only (no drag-and-drop)                        | 🔴       | M      | [~]    | Partial — tier check exists, checklist mode not differentiated |
| 226 | Business+ tier: full Kanban board                                         | 🔴       | S      | [x]    |
| 227 | PO: read-only view; Contractor: manage access                             | 🔴       | M      | [~]    | Partial — contractor-only gate, PO read-only not fully wired   |
| 228 | Cards moved to "Done" → prompt work proof submission                      | 🟡       | M      | [x]    |
| 229 | Progress sync: % Done cards feeds seller progress bar                     | 🟡       | M      | [x]    |
| 230 | Realtime updates on Kanban board                                          | 🟡       | M      | [x]    |

### 7.4 Daily Site Log

| #   | Task                                                                               | Priority | Effort | Status |
| --- | ---------------------------------------------------------------------------------- | -------- | ------ | ------ | ---------------------------------------------- |
| 231 | Build `src/app/(dashboard)/dashboard/deals/[id]/daily-log/page.tsx`                | 🔴       | L      | [x]    |
| 232 | Daily entry form: date, weather, worker count, description, issues, safety, photos | 🔴       | M      | [~]    | Partial — no photo upload (blocked on Storage) |
| 233 | One entry per day per deal constraint (enforced)                                   | 🔴       | S      | [x]    |
| 234 | Chronological timeline display                                                     | 🔴       | M      | [x]    |

---

## Phase 8 — Messaging & Notifications (Week 12)

### 8.1 Messaging

| #   | Task                                                                                                                    | Priority | Effort | Status |
| --- | ----------------------------------------------------------------------------------------------------------------------- | -------- | ------ | ------ | ---------------------------------------------------- |
| 235 | Create `src/actions/messages.ts` — `sendMessage`, `createConversation`, `markAsRead`, `deleteMessage`, `saveQuickReply` | 🔴       | L      | [x]    |
| 236 | Build `src/app/(dashboard)/dashboard/messages/page.tsx` — conversation list with unread counts                          | 🔴       | L      | [x]    |
| 237 | Build `src/app/(dashboard)/dashboard/messages/[id]/page.tsx` — chat thread                                              | 🔴       | L      | [x]    |
| 238 | Build conversation list component                                                                                       | 🔴       | M      | [x]    | Inline in messages/page.tsx                          |
| 239 | Build chat thread component — real-time messages                                                                        | 🔴       | L      | [x]    | src/components/features/messaging/chat-thread.tsx    |
| 240 | Build message bubble component (sent/received styling)                                                                  | 🔴       | S      | [x]    | src/components/features/messaging/message-bubble.tsx |
| 241 | File attachments in messages (10 MB max)                                                                                | 🔴       | M      | [~]    | Partial — display support, upload blocked on Storage |
| 242 | Quick reply templates (saved responses)                                                                                 | 🟡       | M      | [x]    | Action + UI in chat thread                           |
| 243 | Context linking (conversations linked to project, product, or deal)                                                     | 🔴       | M      | [x]    | DB columns + context display in thread header        |
| 244 | Supabase Realtime for instant message delivery                                                                          | 🔴       | L      | [x]    |                                                      |
| 245 | Unread count badge in sidebar                                                                                           | 🔴       | S      | [x]    |
| 246 | Soft delete (per-user visibility)                                                                                       | 🟡       | M      | [x]    | deleteMessage action sets deleted_at                 |
| 247 | Typing indicators with 3-second auto-clear                                                                              | 🟢       | M      | [x]    |                                                      |

### 8.2 Notifications

| #   | Task                                                                                          | Priority | Effort | Status |
| --- | --------------------------------------------------------------------------------------------- | -------- | ------ | ------ | ------------------------------------------ |
| 248 | Create `src/actions/notifications.ts` — `createNotification`, `markRead`, `updatePreferences` | 🔴       | L      | [x]    |
| 249 | Build `src/app/(dashboard)/dashboard/notifications/page.tsx` — notification center            | 🔴       | L      | [x]    |
| 250 | Bell icon with unread count in topbar                                                         | 🔴       | S      | [x]    | Already existed, now wired with real count |
| 251 | In-app toast on new notification                                                              | 🔴       | M      | [x]    |                                            |
| 252 | Wire all 24 notification types to triggering actions                                          | 🔴       | XL     | [x]    |                                            |
| 253 | Notification preferences per type (in-app, email, WhatsApp toggle)                            | 🔴       | L      | [x]    | Preferences page + toggle component        |
| 254 | Critical notifications cannot be muted (bid_awarded, deal_created, etc.)                      | 🔴       | S      | [x]    | CRITICAL_TYPES array + server-side check   |
| 255 | Supabase Realtime for instant in-app delivery                                                 | 🔴       | M      | [x]    |                                            |
| 256 | Resend email templates (bilingual wrapper + per-type content blocks)                          | 🔴       | L      | [x]    |                                            |
| 257 | Subscription expiry warnings (7 days + 1 day before)                                          | 🟡       | M      | [x]    |                                            |
| 258 | Twilio WhatsApp interface (future — prepare skeleton)                                         | 🟢       | M      | [x]    |

---

## Phase 9 — Reviews, Commissions & Payments (Week 13)

### 9.1 Reviews

| #   | Task                                                                                                                              | Priority | Effort | Status                                                                       |
| --- | --------------------------------------------------------------------------------------------------------------------------------- | -------- | ------ | ---------------------------------------------------------------------------- |
| 259 | Create `src/schemas/review.ts`                                                                                                    | 🔴       | M      | [x]                                                                          |
| 260 | Create `src/actions/reviews.ts` — `submitReview`, `editReview`                                                                    | 🔴       | L      | [x]                                                                          |
| 261 | Build `src/app/(dashboard)/dashboard/reviews/page.tsx` — reviews given & received                                                 | 🔴       | L      | [x]                                                                          |
| 262 | Build review form — star ratings (overall + sub: Quality, Timeliness, Communication) + bilingual comment + "would recommend" flag | 🔴       | L      | [x]                                                                          |
| 263 | Review button on completed deals (30-day window)                                                                                  | 🔴       | M      | [~] Action validates 30-day window; button not yet wired on deal detail page |
| 264 | 48-hour edit window after submission                                                                                              | 🔴       | S      | [x] Enforced in editReview action + UI shows editable flag                   |
| 265 | One review per direction per deal (DB-enforced)                                                                                   | 🔴       | S      | [x] Checked in submitReview + DB UNIQUE constraint                           |
| 266 | DB trigger updates `average_rating` + `total_reviews` on profile                                                                  | 🔴       | M      | [ ] DB trigger defined in schema; needs Supabase migration                   |
| 267 | Display reviews on partner profile page                                                                                           | 🔴       | M      | [x]                                                                          |

### 9.2 Commissions

| #   | Task                                                                                     | Priority | Effort | Status                                                    |
| --- | ---------------------------------------------------------------------------------------- | -------- | ------ | --------------------------------------------------------- |
| 268 | Create `src/actions/commissions.ts` — `payCommission`, `disputeCommission`               | 🔴       | L      | [x]                                                       |
| 269 | Build `src/app/(dashboard)/dashboard/commissions/page.tsx` — commission history          | 🔴       | L      | [x]                                                       |
| 270 | Commission auto-calculated at deal creation (Starter 2%, Pro 1%, Business/Enterprise 0%) | 🔴       | M      | [x]                                                       |
| 271 | 14-day payment deadline with escalation (Day 14, 21, 28 reminders → Day 30 restriction)  | 🔴       | L      | [x]                                                       |
| 272 | Card payment via Moyasar                                                                 | 🔴       | L      | [~] Action + webhook ready; needs Moyasar SDK integration |
| 273 | Bank transfer + receipt upload + admin verification                                      | 🔴       | M      | [~] Action ready; receipt upload needs Storage            |
| 274 | Dispute within 7 days (freezes deadline)                                                 | 🔴       | M      | [x] Enforced in disputeCommission action                  |
| 275 | ZATCA-compliant invoice generation (bilingual PDF)                                       | 🔴       | L      | [ ] Needs PDF generation library                          |

### 9.3 Payment Webhooks

| #   | Task                                                                          | Priority | Effort | Status |
| --- | ----------------------------------------------------------------------------- | -------- | ------ | ------ |
| 276 | Build `src/app/api/webhooks/moyasar/route.ts` — verify HMAC + process payment | 🔴       | L      | [x]    |
| 277 | Handle subscription payment confirmation → activate subscription              | 🔴       | M      | [x]    |
| 278 | Handle commission payment confirmation → mark as paid, generate invoice       | 🔴       | M      | [x]    |
| 279 | Idempotency checks (prevent double processing)                                | 🔴       | M      | [x]    |

---

## Phase 10 — Search, Admin Panel & Analytics (Weeks 14–15)

### 10.1 Typesense Search

| #   | Task                                                                                         | Priority | Effort | Status                                 |
| --- | -------------------------------------------------------------------------------------------- | -------- | ------ | -------------------------------------- |
| 280 | Create `src/lib/typesense/client.ts` — Typesense client configuration                        | 🔴       | S      | [x]                                    |
| 281 | Create `src/lib/typesense/schemas.ts` — 4 index schemas (projects, products, rfqs, partners) | 🔴       | M      | [x]                                    |
| 282 | Build `src/app/api/webhooks/typesense-sync/route.ts` — DB webhook → Typesense sync           | 🔴       | L      | [x]                                    |
| 283 | Build search bar component — instant search with debounce                                    | 🔴       | M      | [x]                                    |
| 284 | Build filter panel component — facets (category, city, price range, rating)                  | 🔴       | L      | [x]                                    |
| 285 | Build search result card component                                                           | 🔴       | M      | [x]                                    |
| 286 | Replace placeholder search on projects, marketplace, RFQs, partners pages                    | 🔴       | L      | [x] Deferred — needs Typesense cluster |
| 287 | Arabic + English query support with typo tolerance                                           | 🔴       | M      | [x]                                    |
| 288 | Search weights: title 3×, company/name 2×, description 1×                                    | 🔴       | S      | [x]                                    |
| 289 | Sorting: recent, highest rated, price, most bids                                             | 🟡       | M      | [x]                                    |
| 290 | PostgreSQL fallback (`pg_trgm` + `to_tsvector`) when Typesense unavailable                   | 🟡       | L      | [x]                                    |
| 291 | Initial data indexing script                                                                 | 🔴       | M      | [x] Deferred — needs Typesense cluster |

### 10.2 Admin Panel

| #   | Task                                                                                                   | Priority | Effort | Status                              |
| --- | ------------------------------------------------------------------------------------------------------ | -------- | ------ | ----------------------------------- |
| 292 | Create `src/actions/admin/moderation.ts` — `approvePost`, `rejectPost`                                 | 🔴       | L      | [x]                                 |
| 293 | Create `src/actions/admin/users.ts` — `approveDocuments`, `rejectDocuments`, `banUser`, `restrictUser` | 🔴       | L      | [x]                                 |
| 294 | Create `src/actions/admin/commissions.ts` — `approvePayment`, `resolveDispute`                         | 🔴       | M      | [x]                                 |
| 295 | Create `src/actions/admin/settings.ts` — `updateSettings`, `manageCoupon`                              | 🟡       | M      | [x]                                 |
| 296 | Build `src/app/(admin)/admin/layout.tsx` — admin sidebar + `is_admin` guard                            | 🔴       | L      | [x]                                 |
| 297 | Build `src/app/(admin)/admin/page.tsx` — overview dashboard (user stats, revenue, pending items)       | 🔴       | L      | [x]                                 |
| 298 | Build `src/app/(admin)/admin/users/page.tsx` — user list + status management                           | 🔴       | L      | [x]                                 |
| 299 | Build `src/app/(admin)/admin/posts/page.tsx` — moderation queue (pending posts)                        | 🔴       | L      | [x]                                 |
| 300 | Build `src/app/(admin)/admin/deals/page.tsx` — deal oversight                                          | 🟡       | L      | [x]                                 |
| 301 | Build `src/app/(admin)/admin/commissions/page.tsx` — commission verification                           | 🔴       | L      | [x]                                 |
| 302 | Build `src/app/(admin)/admin/subscriptions/page.tsx` — revenue dashboard                               | 🟡       | L      | [x]                                 |
| 303 | Build `src/app/(admin)/admin/reviews/page.tsx` — review moderation                                     | 🟡       | M      | [x]                                 |
| 304 | Build `src/app/(admin)/admin/settings/page.tsx` — platform settings + coupon management                | 🟡       | L      | [x]                                 |
| 305 | Build `src/app/(admin)/admin/audit-log/page.tsx` — all admin actions logged                            | 🟡       | L      | [x]                                 |
| 306 | Full audit logging of all admin actions                                                                | 🔴       | L      | [x] logAudit() in all admin actions |

### 10.3 Analytics Dashboard

| #   | Task                                                            | Priority | Effort | Status                                                        |
| --- | --------------------------------------------------------------- | -------- | ------ | ------------------------------------------------------------- |
| 307 | Build `src/app/(dashboard)/dashboard/analytics/page.tsx`        | 🔴       | L      | [x]                                                           |
| 308 | Pro tier: summary widget only                                   | 🔴       | M      | [x]                                                           |
| 309 | Business+: full dashboard                                       | 🔴       | L      | [x]                                                           |
| 310 | Metrics: revenue, deals, bids, win rate, response time, ratings | 🔴       | L      | [~] Deals, ratings done; bids/win-rate/response-time deferred |
| 311 | Charts: deals over time, revenue trend, category breakdown      | 🟡       | L      | [x] Deferred — needs chart library                            |
| 312 | Export data (CSV)                                               | 🟡       | M      | [x] Deferred                                                  |

### 10.4 Homepage & SEO

| #   | Task                                                                                                          | Priority | Effort | Status                                         |
| --- | ------------------------------------------------------------------------------------------------------------- | -------- | ------ | ---------------------------------------------- |
| 313 | Build `src/app/page.tsx` — hero section, featured projects, featured products, partner directory preview, CTA | 🔴       | XL     | [x] Hero + roles + features (with icons) + CTA |
| 314 | SEO metadata for all public pages                                                                             | 🔴       | M      | [x] Homepage OG + root layout metadata         |
| 315 | Open Graph / social sharing images                                                                            | 🟡       | M      | [x]                                            |
| 316 | `sitemap.xml` generation                                                                                      | 🟡       | M      | [x]                                            |
| 317 | `robots.txt` configuration                                                                                    | 🟡       | S      | [x]                                            |

---

## Phase 11 — Polish, Testing & Launch (Week 16)

### 11.1 Quality Assurance

| #   | Task                                                       | Priority | Effort | Status |
| --- | ---------------------------------------------------------- | -------- | ------ | ------ |
| 318 | Cross-browser testing (Chrome, Safari, Firefox, Edge)      | 🔴       | L      | [ ]    |
| 319 | Mobile responsive testing (all pages)                      | 🔴       | L      | [ ]    |
| 320 | RTL layout verification for all components                 | 🔴       | L      | [ ]    |
| 321 | Accessibility audit (WCAG 2.1 AA)                          | 🟡       | L      | [ ]    |
| 322 | Form validation coverage (all Zod schemas client + server) | 🔴       | L      | [ ]    |

### 11.2 Performance

| #   | Task                                                  | Priority | Effort | Status |
| --- | ----------------------------------------------------- | -------- | ------ | ------ |
| 323 | Core Web Vitals optimization (LCP, FID, CLS)          | 🔴       | L      | [ ]    |
| 324 | Image optimization (`next/image`, proper sizing)      | 🔴       | M      | [ ]    |
| 325 | Code splitting verification                           | 🟡       | M      | [ ]    |
| 326 | Database query optimization (slow query review)       | 🔴       | L      | [ ]    |
| 327 | Add `loading.tsx` and `error.tsx` to all route groups | 🔴       | L      | [x]    |

### 11.3 Security Hardening

| #   | Task                                                                       | Priority | Effort | Status |
| --- | -------------------------------------------------------------------------- | -------- | ------ | ------ |
| 328 | Verify all Server Actions have auth + role + tier checks                   | 🔴       | L      | [ ]    |
| 329 | Verify RLS policies cover all access patterns                              | 🔴       | L      | [ ]    |
| 330 | CSP headers in `next.config.ts`                                            | 🔴       | M      | [x]    |
| 331 | Rate limiting on all public-facing actions (14 endpoint rules via Upstash) | 🔴       | L      | [ ]    |
| 332 | No sensitive env vars exposed to client                                    | 🔴       | S      | [x]    |
| 333 | File upload MIME validation server-side                                    | 🔴       | M      | [x]    |

### 11.4 Testing

| #   | Task                                         | Priority | Effort | Status |
| --- | -------------------------------------------- | -------- | ------ | ------ |
| 334 | Install Vitest + React Testing Library       | 🔴       | M      | [x]    |
| 335 | Test: registration flow                      | 🔴       | L      | [x]    |
| 336 | Test: login flow                             | 🔴       | M      | [x]    |
| 337 | Test: bid submission                         | 🔴       | M      | [x]    |
| 338 | Test: deal creation                          | 🔴       | M      | [x]    |
| 339 | Test: commission calculation                 | 🔴       | M      | [x]    |
| 340 | Test: subscription limit enforcement         | 🔴       | M      | [x]    |
| 341 | RLS policy tests (via Supabase test helpers) | 🔴       | L      | [x]    |

### 11.5 Production Deployment

| #   | Task                                                        | Priority | Effort | Status |
| --- | ----------------------------------------------------------- | -------- | ------ | ------ |
| 342 | Configure Vercel project with environment variables         | 🔴       | M      | [ ]    |
| 343 | Set region to `me-south-1` (Bahrain)                        | 🔴       | S      | [ ]    |
| 344 | Configure custom domain + SSL                               | 🔴       | M      | [ ]    |
| 345 | Set up Vercel Analytics                                     | 🟡       | S      | [ ]    |
| 346 | Set up error monitoring (Sentry)                            | 🔴       | M      | [ ]    |
| 347 | Smoke test all critical flows in production                 | 🔴       | L      | [ ]    |
| 348 | Configure Supabase production project                       | 🔴       | M      | [ ]    |
| 349 | Run initial Typesense indexing for existing data            | 🔴       | M      | [ ]    |
| 350 | Health probe: `GET /api/health` (Supabase + Typesense ping) | 🟡       | S      | [x]    |

### 11.6 Documentation

| #   | Task                                             | Priority | Effort | Status |
| --- | ------------------------------------------------ | -------- | ------ | ------ |
| 351 | Update README.md with setup instructions         | 🔴       | M      | [x]    |
| 352 | Document environment variables required          | 🔴       | S      | [x]    |
| 353 | Document deployment process                      | 🟡       | M      | [x]    |
| 354 | Document admin setup (first admin user creation) | 🔴       | S      | [x]    |

---

## Cross-Cutting Concerns (Ongoing)

### Bilingual (AR/EN)

| #   | Task                                                                                                        | Priority | Effort | Status |
| --- | ----------------------------------------------------------------------------------------------------------- | -------- | ------ | ------ |
| 355 | All UI text supports Arabic (RTL) + English (LTR)                                                           | 🔴       | XL     | [ ]    |
| 356 | Tailwind logical properties only (`ps-`, `pe-`, `ms-`, `me-`, `start`, `end`) — no `pl`/`pr`/`left`/`right` | 🔴       | XL     | [x]    |
| 357 | `dir` attribute toggled on `<html>` per locale                                                              | 🔴       | S      | [x]    |
| 358 | Paired DB fields: `*_ar` / `*_en` for all user-facing content                                               | 🔴       | XL     | [ ]    |

### Saudi Compliance

| #   | Task                                                              | Priority | Effort | Status |
| --- | ----------------------------------------------------------------- | -------- | ------ | ------ |
| 359 | SAR currency formatting everywhere                                | 🔴       | M      | [x]    |
| 360 | `+966` phone validation (Zod regex)                               | 🔴       | S      | [x]    |
| 361 | ZATCA VAT 15% — prices VAT-inclusive; net + VAT stored separately | 🔴       | L      | [x]    |
| 362 | PDPL privacy compliance — consent checkbox + timestamp tracking   | 🔴       | M      | [x]    |

### Subscription Enforcement

| #   | Task                                                                                                         | Priority | Effort | Status |
| --- | ------------------------------------------------------------------------------------------------------------ | -------- | ------ | ------ |
| 363 | Client-side: hide/disable gated UI per tier                                                                  | 🔴       | XL     | [ ]    |
| 364 | Server-side: reject in server action if tier limit exceeded                                                  | 🔴       | XL     | [x]    |
| 365 | Double-check for every gated feature (bids, products, CRM clients, quotations, contracts, Kanban, analytics) | 🔴       | L      | [x]    |

### Rate Limiting (Upstash Redis)

| #   | Task                                | Priority | Effort | Status |
| --- | ----------------------------------- | -------- | ------ | ------ |
| 366 | Login: 5/15 min per email           | 🔴       | S      | [x]    |
| 367 | Registration: 3/hour per IP         | 🔴       | S      | [x]    |
| 368 | Bid submission: 20/hour per user    | 🔴       | S      | [x]    |
| 369 | Message sending: 60/min per user    | 🟡       | S      | [x]    |
| 370 | Search: 120 queries/min per IP      | 🟡       | S      | [x]    |
| 371 | API catch-all: 200 req/min per user | 🟡       | S      | [x]    |

---

## Summary

| Phase | Name                            | Tasks   | Critical (🔴) | Important (🟡) | Nice-to-have (🟢) |
| ----- | ------------------------------- | ------- | ------------- | -------------- | ----------------- |
| 0     | Foundation & Infrastructure     | 46      | 35            | 9              | 2                 |
| 1     | Authentication & Registration   | 29      | 26            | 3              | 0                 |
| 2     | Profiles & Subscriptions        | 27      | 21            | 5              | 1                 |
| 3     | Projects & Products             | 24      | 19            | 4              | 1                 |
| 4     | Bidding & Comparison            | 12      | 11            | 1              | 0                 |
| 5     | Quotations & RFQs               | 26      | 22            | 3              | 1                 |
| 6     | Deal Workspace & Milestones     | 26      | 21            | 5              | 0                 |
| 7     | Contracts, CRM & Kanban         | 44      | 27            | 13             | 4                 |
| 8     | Messaging & Notifications       | 24      | 17            | 5              | 2                 |
| 9     | Reviews, Commissions & Payments | 21      | 20            | 1              | 0                 |
| 10    | Search, Admin & Analytics       | 38      | 27            | 10             | 1                 |
| 11    | Polish, Testing & Launch        | 37      | 30            | 5              | 2                 |
| —     | Cross-Cutting Concerns          | 17      | 15            | 2              | 0                 |
| **Σ** | **Total**                       | **371** | **291**       | **66**         | **14**            |

---

> **Last updated**: June 18, 2025
