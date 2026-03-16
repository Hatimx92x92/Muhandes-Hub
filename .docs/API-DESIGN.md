# Muqawil HUB — API Design (Server Actions & Routes)

> **Version**: 1.0 | **Date**: March 4, 2026  
> **Source**: `.docs/FEATURES.md`

---

## Overview

Muqawil HUB uses **Server Actions** for all mutations and **API Routes** only for external webhooks/callbacks. This document specifies every action signature, input schema, authorization, and side effects.

### Standard Response Type

```typescript
type ActionResult<T = void> =
  | { data: T; error: null }
  | { data: null; error: string; fieldErrors?: Record<string, string[]> };
```

---

## 1. Auth Actions — `src/actions/auth.ts`

### 1.1 `register`

| Property         | Value                                                                                                                                                                                                                                             |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Input**        | `RegisterSchema` — email, password, full_name, phone (+966), role, profile_type, company fields (conditional), tier, PDPL consent                                                                                                                 |
| **Auth**         | None (public)                                                                                                                                                                                                                                     |
| **Rate Limit**   | 3/hour per IP                                                                                                                                                                                                                                     |
| **Steps**        | 1. Validate Zod schema 2. `supabase.auth.signUp()` with metadata (role, full_name, phone) 3. DB trigger `handle_new_user()` creates profile 4. If tier != Starter → create pending subscription record 5. Send verification email (Supabase auto) |
| **Returns**      | `{ data: { userId: string, requiresPayment: boolean } }`                                                                                                                                                                                          |
| **Side Effects** | Verification email auto-sent by Supabase Auth                                                                                                                                                                                                     |

### 1.2 `login`

| Property        | Value                                                                                                                      |
| --------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Input**       | `LoginSchema` — email, password                                                                                            |
| **Auth**        | None (public)                                                                                                              |
| **Rate Limit**  | 5/15min per IP                                                                                                             |
| **Steps**       | 1. Validate 2. `supabase.auth.signInWithPassword()` 3. Check account status (active, restricted, banned) 4. Return session |
| **Returns**     | `{ data: { user, status } }`                                                                                               |
| **Error Cases** | Invalid credentials, rate limited, account banned/restricted                                                               |

### 1.3 `loginWithGoogle`

| Property    | Value                                                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Input**   | None                                                                                                                           |
| **Auth**    | None (public)                                                                                                                  |
| **Steps**   | 1. `supabase.auth.signInWithOAuth({ provider: 'google' })` with PKCE 2. Redirect to Google 3. Callback at `/api/auth/callback` |
| **Returns** | Redirect URL                                                                                                                   |

### 1.4 `logout`

| Property    | Value                                           |
| ----------- | ----------------------------------------------- |
| **Input**   | None                                            |
| **Auth**    | Authenticated                                   |
| **Steps**   | 1. `supabase.auth.signOut()` 2. Redirect to `/` |
| **Returns** | Redirect                                        |

### 1.5 `resetPassword`

| Property       | Value                                      |
| -------------- | ------------------------------------------ |
| **Input**      | `ResetPasswordSchema` — email              |
| **Auth**       | None (public)                              |
| **Rate Limit** | 3/hour per email                           |
| **Steps**      | 1. `supabase.auth.resetPasswordForEmail()` |
| **Returns**    | `{ data: { sent: true } }`                 |

### 1.6 `updatePassword`

| Property    | Value                                                 |
| ----------- | ----------------------------------------------------- |
| **Input**   | `UpdatePasswordSchema` — newPassword, confirmPassword |
| **Auth**    | Authenticated (via reset link session)                |
| **Steps**   | 1. `supabase.auth.updateUser({ password })`           |
| **Returns** | `{ data: { updated: true } }`                         |

### 1.7 `updateProfile`

| Property    | Value                                                                                                     |
| ----------- | --------------------------------------------------------------------------------------------------------- |
| **Input**   | `UpdateProfileSchema` — full_name, phone, bio_ar, bio_en, company fields, avatar, logo                    |
| **Auth**    | Authenticated                                                                                             |
| **Steps**   | 1. Validate 2. Upload files if changed 3. Update `profiles` row 4. `revalidatePath('/dashboard/profile')` |
| **Returns** | `{ data: { profile } }`                                                                                   |

---

## 2. Project Actions — `src/actions/projects.ts`

### 2.1 `createProject`

| Property       | Value                                                                                                                                                                                         |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Input**      | `ProjectSchema` — title_ar, title_en, description_ar, description_en, category_id, city_id, budget_min, budget_max, timeline_start, timeline_end, classification, source, files[]             |
| **Auth**       | Authenticated                                                                                                                                                                                 |
| **Roles**      | `project_owner`, `contractor`                                                                                                                                                                 |
| **Tier Limit** | None (unlimited project posts)                                                                                                                                                                |
| **Steps**      | 1. Auth + role check 2. Validate 3. Upload files to `project-files` bucket 4. Insert `projects` row (status: draft) 5. Insert `project_files` rows 6. `revalidatePath('/dashboard/projects')` |
| **Returns**    | `{ data: { id, status: 'draft' } }`                                                                                                                                                           |

### 2.2 `updateProject`

| Property    | Value                                                                                                             |
| ----------- | ----------------------------------------------------------------------------------------------------------------- |
| **Input**   | `UpdateProjectSchema` — same as create + project_id                                                               |
| **Auth**    | Authenticated, owner only                                                                                         |
| **Roles**   | `project_owner`, `contractor`                                                                                     |
| **Steps**   | 1. Auth + ownership check 2. Status must be 'draft' or 'rejected' 3. Update row 4. Handle file additions/removals |
| **Returns** | `{ data: { id } }`                                                                                                |

### 2.3 `submitProjectForApproval`

| Property         | Value                                                                                   |
| ---------------- | --------------------------------------------------------------------------------------- |
| **Input**        | `{ projectId: string }`                                                                 |
| **Auth**         | Authenticated, owner only                                                               |
| **Steps**        | 1. Check project is 'draft' or 'rejected' 2. Update status → 'pending' 3. Notify admins |
| **Returns**      | `{ data: { status: 'pending' } }`                                                       |
| **Side Effects** | Admin notification                                                                      |

### 2.4 `deleteProject`

| Property       | Value                                                           |
| -------------- | --------------------------------------------------------------- |
| **Input**      | `{ projectId: string }`                                         |
| **Auth**       | Authenticated, owner only                                       |
| **Constraint** | Only if status is 'draft' and no bids                           |
| **Steps**      | 1. Check constraints 2. Delete files from storage 3. Delete row |
| **Returns**    | `{ data: { deleted: true } }`                                   |

---

## 3. Product Actions — `src/actions/products.ts`

### 3.1 `createProduct`

| Property       | Value                                                                                                                                                                                        |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Input**      | `ProductSchema` — name_ar, name_en, description_ar, description_en, category_id, city_id, pricing_model, base_price (if fixed), min_order_qty, lead_time_days, variants[], images[], specs[] |
| **Auth**       | Authenticated                                                                                                                                                                                |
| **Roles**      | `supplier` only                                                                                                                                                                              |
| **Tier Limit** | Starter: 2, Pro: 10, Business: 50, Enterprise: unlimited                                                                                                                                     |
| **Steps**      | 1. Auth + role + tier limit check 2. Validate 3. Upload images to `product-images`, specs to `product-specs` 4. Insert `products` row 5. Insert variants, images, specs                      |
| **Returns**    | `{ data: { id, status: 'draft' } }`                                                                                                                                                          |

### 3.2 `updateProduct`

| Property    | Value                                                                                  |
| ----------- | -------------------------------------------------------------------------------------- |
| **Input**   | `UpdateProductSchema` — same + product_id                                              |
| **Auth**    | Authenticated, owner                                                                   |
| **Roles**   | `supplier`                                                                             |
| **Steps**   | 1. Owner check 2. Status must be 'draft' or 'rejected' 3. Update + handle file changes |
| **Returns** | `{ data: { id } }`                                                                     |

### 3.3 `submitProductForApproval`

| Property    | Value                                    |
| ----------- | ---------------------------------------- |
| **Input**   | `{ productId: string }`                  |
| **Auth**    | Authenticated, owner                     |
| **Steps**   | Update status → 'pending', notify admins |
| **Returns** | `{ data: { status: 'pending' } }`        |

### 3.4 `bulkImportProducts`

| Property       | Value                                                                                                           |
| -------------- | --------------------------------------------------------------------------------------------------------------- |
| **Input**      | CSV file (FormData)                                                                                             |
| **Auth**       | Authenticated                                                                                                   |
| **Roles**      | `supplier`                                                                                                      |
| **Tier Limit** | Business+ only                                                                                                  |
| **Steps**      | 1. Parse CSV 2. Validate each row against ProductSchema 3. Batch insert 4. Return summary of successes/failures |
| **Returns**    | `{ data: { imported: number, failed: { row: number, errors: string[] }[] } }`                                   |

### 3.5 `deleteProduct`

| Property       | Value                          |
| -------------- | ------------------------------ |
| **Input**      | `{ productId: string }`        |
| **Auth**       | Authenticated, owner           |
| **Constraint** | Only if draft, no active deals |
| **Returns**    | `{ data: { deleted: true } }`  |

---

## 4. Bid Actions — `src/actions/bids.ts`

### 4.1 `submitBid`

| Property         | Value                                                                                                              |
| ---------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Input**        | `BidSchema` — project_id, amount, timeline_days, methodology_ar, methodology_en, attachments[]                     |
| **Auth**         | Authenticated                                                                                                      |
| **Roles**        | `contractor` only                                                                                                  |
| **Tier Limit**   | Starter: 10/mo, Pro: 50/mo, Business: 100/mo, Enterprise: unlimited                                                |
| **Rate Limit**   | 3/min                                                                                                              |
| **Constraints**  | Project must be 'published', contractor's classification ≥ project classification, no existing bid on same project |
| **Steps**        | 1. All checks 2. Insert `bids` row 3. Trigger increments `bid_count` on project 4. Notify project owner            |
| **Returns**      | `{ data: { id } }`                                                                                                 |
| **Side Effects** | `bid_received` notification to PO                                                                                  |

### 4.2 `updateBid`

| Property       | Value                                                          |
| -------------- | -------------------------------------------------------------- |
| **Input**      | `UpdateBidSchema` — bid_id, amount, timeline_days, methodology |
| **Auth**       | Authenticated, bid owner                                       |
| **Constraint** | Bid status must be 'pending'                                   |
| **Returns**    | `{ data: { id } }`                                             |

### 4.3 `shortlistBid`

| Property         | Value                                                                                    |
| ---------------- | ---------------------------------------------------------------------------------------- |
| **Input**        | `{ bidId: string }`                                                                      |
| **Auth**         | Authenticated, project owner                                                             |
| **Steps**        | 1. Verify ownership of project 2. Update bid status → 'shortlisted' 3. Notify contractor |
| **Returns**      | `{ data: { status: 'shortlisted' } }`                                                    |
| **Side Effects** | `bid_shortlisted` notification                                                           |

### 4.4 `awardBid`

| Property         | Value                                                                                                                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Input**        | `{ bidId: string }`                                                                                                                                                                         |
| **Auth**         | Authenticated, project owner                                                                                                                                                                |
| **Steps**        | 1. Verify ownership 2. Update bid → 'awarded' 3. Reject all other bids on project 4. **Create DEAL-PROJECT** 5. Calculate commission record (based on contractor tier) 6. Notify contractor |
| **Returns**      | `{ data: { bidId, dealId } }`                                                                                                                                                               |
| **Side Effects** | `bid_awarded` notification, `deal_created` notification, other bids get `bid_rejected`                                                                                                      |

### 4.5 `rejectBid`

| Property         | Value                                                       |
| ---------------- | ----------------------------------------------------------- |
| **Input**        | `{ bidId: string, reason_ar?: string, reason_en?: string }` |
| **Auth**         | Authenticated, project owner                                |
| **Steps**        | 1. Update bid → 'rejected' 2. Notify contractor             |
| **Returns**      | `{ data: { status: 'rejected' } }`                          |
| **Side Effects** | `bid_rejected` notification                                 |

---

## 5. Deal Actions — `src/actions/deals.ts`

### 5.1 `createDeal` (internal — called by awardBid / acceptQuotation)

| Property    | Value                                                                                                                                                                |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Input**   | `{ type, trigger_source, trigger_id, buyer_id, seller_id, total_value, project_id? }`                                                                                |
| **Auth**    | Internal call only (not exposed as public action)                                                                                                                    |
| **Steps**   | 1. Insert `deals` row 2. Calculate commission 3. Insert `commissions` row if applicable 4. Insert initial `activity_log` entry 5. Create conversation linked to deal |
| **Returns** | `{ dealId, commissionId? }`                                                                                                                                          |

### 5.2 `createMilestone`

| Property    | Value                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------ |
| **Input**   | `MilestoneSchema` — deal_id, title_ar, title_en, description, due_date, payment_amount           |
| **Auth**    | Authenticated, deal buyer (milestone owner)                                                      |
| **Steps**   | 1. Verify deal participant 2. Validate total milestones payment ≤ deal value 3. Insert milestone |
| **Returns** | `{ data: { id } }`                                                                               |

### 5.3 `suggestMilestoneChange`

| Property    | Value                                                   |
| ----------- | ------------------------------------------------------- |
| **Input**   | `{ milestoneId, suggestedChanges: Partial<Milestone> }` |
| **Auth**    | Authenticated, deal seller                              |
| **Steps**   | 1. Create suggestion record 2. Notify buyer             |
| **Returns** | `{ data: { suggestionId } }`                            |

### 5.4 `approveMilestoneChange`

| Property    | Value                                            |
| ----------- | ------------------------------------------------ |
| **Input**   | `{ suggestionId }`                               |
| **Auth**    | Authenticated, deal buyer                        |
| **Steps**   | 1. Apply changes to milestone 2. Log in activity |
| **Returns** | `{ data: { milestoneId } }`                      |

### 5.5 `submitProof`

| Property         | Value                                                                                                               |
| ---------------- | ------------------------------------------------------------------------------------------------------------------- |
| **Input**        | `ProofSchema` — deal_id, milestone_id?, type (work/supply/payment/handover), description, files[], percentage_claim |
| **Auth**         | Authenticated, deal participant                                                                                     |
| **Steps**        | 1. Validate participation 2. Upload files to `proof-files` 3. Insert proof 4. Notify counterparty                   |
| **Returns**      | `{ data: { id } }`                                                                                                  |
| **Side Effects** | `proof_submitted` notification                                                                                      |

### 5.6 `confirmProof`

| Property         | Value                                                                                                                         |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Input**        | `{ proofId: string }`                                                                                                         |
| **Auth**         | Authenticated, counterparty                                                                                                   |
| **Steps**        | 1. Update proof → 'confirmed' 2. Update progress percentage 3. Check if both bars at 100% → complete deal 4. Notify submitter |
| **Returns**      | `{ data: { confirmed: true, dealCompleted: boolean } }`                                                                       |
| **Side Effects** | `proof_confirmed` notification, possible `deal_completed` + commission creation                                               |

### 5.7 `rejectProof`

| Property         | Value                                                                                                               |
| ---------------- | ------------------------------------------------------------------------------------------------------------------- |
| **Input**        | `{ proofId: string, reason: string }`                                                                               |
| **Auth**         | Authenticated, counterparty                                                                                         |
| **Steps**        | 1. Update proof → 'rejected' 2. Increment rejection count 3. If ≥ 3 rejections → flag for admin 4. Notify submitter |
| **Returns**      | `{ data: { rejected: true, flaggedForAdmin: boolean } }`                                                            |
| **Side Effects** | `proof_rejected` notification                                                                                       |

### 5.8 `requestCancellation`

| Property       | Value                                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------------ |
| **Input**      | `{ dealId: string, reason: string }`                                                                   |
| **Auth**       | Authenticated, deal participant                                                                        |
| **Constraint** | Deal not completed                                                                                     |
| **Steps**      | 1. Insert cancel request 2. Check if counterparty also requested → auto-approve 3. Notify counterparty |
| **Returns**    | `{ data: { requestId, autoApproved: boolean } }`                                                       |

### 5.9 `approveCancellation`

| Property         | Value                                                                  |
| ---------------- | ---------------------------------------------------------------------- |
| **Input**        | `{ requestId: string }`                                                |
| **Auth**         | Authenticated, counterparty                                            |
| **Steps**        | 1. Approve request 2. Update deal → 'cancelled' 3. Notify both parties |
| **Returns**      | `{ data: { dealStatus: 'cancelled' } }`                                |
| **Side Effects** | `deal_cancelled` notification                                          |

### 5.10 `requestSkipMilestone`

| Property    | Value                                         |
| ----------- | --------------------------------------------- |
| **Input**   | `{ milestoneId: string, reason: string }`     |
| **Auth**    | Authenticated, deal participant               |
| **Steps**   | 1. Create skip request 2. Notify counterparty |
| **Returns** | `{ data: { requestId } }`                     |

---

## 6. Quotation Actions — `src/actions/quotations.ts`

### 6.1 `createQuotation`

| Property       | Value                                                                                                                                                                                                                                                                                          |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Input**      | `QuotationSchema` — mode (inquiry_response/standalone), recipient_id?, inquiry_id?, rfq_response_id?, hire_request_id?, client_name?, project_reference?, items[{ description, quantity, unit, unit_price }], validity_days, payment_terms_ar/en, delivery_terms_ar/en, notes_ar/en, clauses[] |
| **Auth**       | Authenticated                                                                                                                                                                                                                                                                                  |
| **Roles**      | `contractor`, `supplier`                                                                                                                                                                                                                                                                       |
| **Tier Limit** | Starter: 3/mo, Pro: 20/mo, Business+: unlimited                                                                                                                                                                                                                                                |
| **Steps**      | 1. All checks 2. Auto-generate number (QTN-YYYY-NNNN) 3. Calculate subtotal, VAT (15%), total 4. Insert quotation + items + clauses 5. If mode A: link to inquiry/rfq/hire                                                                                                                     |
| **Returns**    | `{ data: { id, quotation_number } }`                                                                                                                                                                                                                                                           |

### 6.2 `sendQuotation`

| Property         | Value                                                                           |
| ---------------- | ------------------------------------------------------------------------------- |
| **Input**        | `{ quotationId: string }`                                                       |
| **Auth**         | Authenticated, quotation owner                                                  |
| **Steps**        | 1. Update status → 'sent' 2. Send email via Resend with PDF 3. Notify recipient |
| **Returns**      | `{ data: { sent: true } }`                                                      |
| **Side Effects** | `quotation_received` notification, email with PDF                               |

### 6.3 `acceptQuotation`

| Property         | Value                                                                                                         |
| ---------------- | ------------------------------------------------------------------------------------------------------------- |
| **Input**        | `{ quotationId: string }`                                                                                     |
| **Auth**         | Authenticated, quotation recipient                                                                            |
| **Steps**        | 1. Update status → 'accepted' 2. **Create DEAL-PRODUCT** (or DEAL-PROJECT if project-linked) 3. Notify sender |
| **Returns**      | `{ data: { quotationId, dealId } }`                                                                           |
| **Side Effects** | `quotation_accepted` notification, `deal_created` notification                                                |

### 6.4 `rejectQuotation`

| Property         | Value                                          |
| ---------------- | ---------------------------------------------- |
| **Input**        | `{ quotationId: string, reason?: string }`     |
| **Auth**         | Authenticated, recipient                       |
| **Steps**        | 1. Update status → 'rejected' 2. Notify sender |
| **Returns**      | `{ data: { rejected: true } }`                 |
| **Side Effects** | `quotation_rejected` notification              |

### 6.5 `duplicateQuotation`

| Property    | Value                                                  |
| ----------- | ------------------------------------------------------ |
| **Input**   | `{ quotationId: string }`                              |
| **Auth**    | Authenticated, owner                                   |
| **Steps**   | 1. Copy quotation + items as new draft with new number |
| **Returns** | `{ data: { newId, newNumber } }`                       |

### 6.6 `generateQuotationPDF`

| Property    | Value                                                                                         |
| ----------- | --------------------------------------------------------------------------------------------- |
| **Input**   | `{ quotationId: string }`                                                                     |
| **Auth**    | Authenticated, owner or recipient                                                             |
| **Steps**   | 1. Fetch quotation data 2. Generate bilingual PDF 3. Upload to `quotation-pdfs` 4. Return URL |
| **Returns** | `{ data: { pdfUrl: string } }`                                                                |

---

## 7. RFQ Actions — `src/actions/rfqs.ts`

### 7.1 `createRFQ`

| Property       | Value                                                                                                                                               |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Input**      | `RFQSchema` — title_ar, title_en, description_ar, description_en, category_id, quantity, budget_min, budget_max, deadline, product_id?, project_id? |
| **Auth**       | Authenticated                                                                                                                                       |
| **Roles**      | All roles (PO, Contractor, Supplier, Buyer)                                                                                                         |
| **Rate Limit** | 10/hour                                                                                                                                             |
| **Steps**      | 1. Validate 2. Insert RFQ (status: draft)                                                                                                           |
| **Returns**    | `{ data: { id } }`                                                                                                                                  |

### 7.2 `submitRFQForApproval`

| Property    | Value                                    |
| ----------- | ---------------------------------------- |
| **Input**   | `{ rfqId: string }`                      |
| **Auth**    | Authenticated, owner                     |
| **Steps**   | Update status → 'pending', notify admins |
| **Returns** | `{ data: { status: 'pending' } }`        |

### 7.3 `respondToRFQ`

| Property         | Value                                                                     |
| ---------------- | ------------------------------------------------------------------------- |
| **Input**        | `RFQResponseSchema` — rfq_id, pricing, delivery_terms, notes_ar, notes_en |
| **Auth**         | Authenticated                                                             |
| **Roles**        | `supplier` only                                                           |
| **Constraint**   | RFQ must be published and before deadline                                 |
| **Steps**        | 1. Validate 2. Insert response 3. Notify RFQ poster                       |
| **Returns**      | `{ data: { id } }`                                                        |
| **Side Effects** | `rfq_response_received` notification                                      |

### 7.4 `acceptRFQResponse`

| Property         | Value                                                                                                |
| ---------------- | ---------------------------------------------------------------------------------------------------- |
| **Input**        | `{ responseId: string }`                                                                             |
| **Auth**         | Authenticated, RFQ poster                                                                            |
| **Steps**        | 1. Accept response 2. Optional: trigger quotation flow or **Create DEAL-PRODUCT** 3. Notify supplier |
| **Returns**      | `{ data: { responseId, dealId? } }`                                                                  |
| **Side Effects** | `rfq_response_accepted` notification                                                                 |

### 7.5 `rejectRFQResponse`

| Property         | Value                                     |
| ---------------- | ----------------------------------------- |
| **Input**        | `{ responseId: string, reason?: string }` |
| **Auth**         | Authenticated, RFQ poster                 |
| **Returns**      | `{ data: { rejected: true } }`            |
| **Side Effects** | `rfq_response_rejected` notification      |

---

## 8. Hire Request Actions — (within `src/actions/rfqs.ts` or dedicated `src/actions/hires.ts`)

### 8.1 `createHireRequest`

| Property         | Value                                                                                    |
| ---------------- | ---------------------------------------------------------------------------------------- |
| **Input**        | `HireRequestSchema` — supplier_id, project_id?, description, quantity?, budget_estimate? |
| **Auth**         | Authenticated                                                                            |
| **Roles**        | `project_owner`, `contractor`                                                            |
| **Steps**        | 1. Insert hire request 2. Notify supplier                                                |
| **Returns**      | `{ data: { id } }`                                                                       |
| **Side Effects** | `hire_request_received` notification                                                     |

### 8.2 `respondToHireRequest`

| Property    | Value                                                                   |
| ----------- | ----------------------------------------------------------------------- | ------------ |
| **Input**   | `{ hireRequestId: string, action: 'accept'                              | 'decline' }` |
| **Auth**    | Authenticated, targeted supplier                                        |
| **Steps**   | If accept → create quotation linked to hire. If decline → update status |
| **Returns** | `{ data: { quotationId? } }`                                            |

---

## 9. Subscription Actions — `src/actions/subscriptions.ts`

### 9.1 `subscribe`

| Property    | Value                                                                                                                                                            |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Input**   | `SubscriptionSchema` — tier, duration_months, coupon_code?                                                                                                       |
| **Auth**    | Authenticated                                                                                                                                                    |
| **Steps**   | 1. Validate tier upgrade path 2. Apply coupon if provided 3. Calculate amount 4. Create Moyasar payment session 5. Insert subscription (status: pending_payment) |
| **Returns** | `{ data: { subscriptionId, paymentUrl } }`                                                                                                                       |

### 9.2 `applyCoupon`

| Property    | Value                                                                                                                                                      |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Input**   | `{ code: string, tier: SubscriptionTier, duration: number }`                                                                                               |
| **Auth**    | Authenticated                                                                                                                                              |
| **Steps**   | 1. Validate coupon exists, active, not expired, within usage limit 2. Check tier/duration restrictions 3. Check per-user usage limit 4. Calculate discount |
| **Returns** | `{ data: { discount_type, discount_value, final_amount } }`                                                                                                |

### 9.3 `upgradeSubscription`

| Property    | Value                                                                                                 |
| ----------- | ----------------------------------------------------------------------------------------------------- |
| **Input**   | `{ newTier: SubscriptionTier }`                                                                       |
| **Auth**    | Authenticated                                                                                         |
| **Steps**   | 1. Calculate prorated amount 2. Create payment session 3. On payment success: update tier immediately |
| **Returns** | `{ data: { paymentUrl, proratedAmount } }`                                                            |

### 9.4 `downgradeSubscription`

| Property    | Value                                                                                                              |
| ----------- | ------------------------------------------------------------------------------------------------------------------ |
| **Input**   | `{ newTier: SubscriptionTier }`                                                                                    |
| **Auth**    | Authenticated                                                                                                      |
| **Steps**   | 1. Schedule downgrade at current period end 2. Existing content preserved but new creation blocked at lower limits |
| **Returns** | `{ data: { effectiveDate } }`                                                                                      |

### 9.5 `renewSubscription`

| Property    | Value                                               |
| ----------- | --------------------------------------------------- |
| **Input**   | `{ duration_months: number, coupon_code?: string }` |
| **Auth**    | Authenticated                                       |
| **Steps**   | 1. Same tier, new duration 2. Payment via Moyasar   |
| **Returns** | `{ data: { paymentUrl } }`                          |

---

## 10. Commission Actions — `src/actions/commissions.ts`

### 10.1 `payCommission`

| Property    | Value                                                                    |
| ----------- | ------------------------------------------------------------------------ | -------------------------------------- |
| **Input**   | `{ commissionId: string, method: 'card'                                  | 'bank_transfer', receiptFile?: File }` |
| **Auth**    | Authenticated, commission debtor (seller)                                |
| **Steps**   | If card: Moyasar payment. If bank: upload receipt for admin verification |
| **Returns** | `{ data: { status, paymentUrl? } }`                                      |

### 10.2 `disputeCommission`

| Property       | Value                                                            |
| -------------- | ---------------------------------------------------------------- |
| **Input**      | `{ commissionId: string, reason: string }`                       |
| **Auth**       | Authenticated, seller                                            |
| **Constraint** | Within 7 days of commission creation                             |
| **Steps**      | 1. Update status → 'disputed' 2. Freeze deadline 3. Notify admin |
| **Returns**    | `{ data: { disputed: true } }`                                   |

---

## 11. Contract Actions — `src/actions/contracts.ts`

### 11.1 `createContract`

| Property       | Value                                                                                                                           |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **Input**      | `ContractSchema` — deal_id?, template_type, title_ar, title_en, party_a/b info, scope_ar/en, payment_terms, timeline, clauses[] |
| **Auth**       | Authenticated                                                                                                                   |
| **Tier Limit** | Starter: 2 basic/mo, Pro: 10 all/mo, Business+: unlimited                                                                       |
| **Steps**      | 1. Check tier limit 2. If deal_id: auto-fill from deal 3. Insert contract + clauses                                             |
| **Returns**    | `{ data: { id } }`                                                                                                              |

### 11.2 `signContract`

| Property    | Value                                                                                                    |
| ----------- | -------------------------------------------------------------------------------------------------------- |
| **Input**   | `{ contractId: string, signatory_name, signatory_title, signature_data }`                                |
| **Auth**    | Authenticated, contract party                                                                            |
| **Steps**   | 1. Insert signature 2. Check if both parties signed → status: signed 3. Generate QR code 4. Generate PDF |
| **Returns** | `{ data: { signed: true, fullyExecuted: boolean } }`                                                     |

### 11.3 `generateContractPDF`

| Property    | Value                                                                   |
| ----------- | ----------------------------------------------------------------------- |
| **Input**   | `{ contractId: string }`                                                |
| **Auth**    | Authenticated, contract party                                           |
| **Steps**   | Generate bilingual PDF with signatures + QR → upload to `contract-pdfs` |
| **Returns** | `{ data: { pdfUrl } }`                                                  |

### 11.4 `verifyContract`

| Property    | Value                                              |
| ----------- | -------------------------------------------------- |
| **Input**   | `{ contractId: string }` (from QR code/public URL) |
| **Auth**    | None (public)                                      |
| **Steps**   | Check contract exists → return signing timestamps  |
| **Returns** | `{ data: { exists, signed_at_a, signed_at_b } }`   |

---

## 12. CRM Actions — `src/actions/crm.ts`

### 12.1 `addClient`

| Property       | Value                                                                                     |
| -------------- | ----------------------------------------------------------------------------------------- |
| **Input**      | `CRMClientSchema` — name, email?, phone?, company?, pipeline_stage, source, tags[], notes |
| **Auth**       | Authenticated                                                                             |
| **Roles**      | `project_owner`, `contractor`, `supplier`                                                 |
| **Tier Limit** | Starter: 20, Pro: 200, Business+: unlimited                                               |
| **Steps**      | Validate + insert client                                                                  |
| **Returns**    | `{ data: { id } }`                                                                        |

### 12.2 `updateClient`

| Property    | Value                             |
| ----------- | --------------------------------- |
| **Input**   | Partial client fields + client_id |
| **Auth**    | Authenticated, client owner       |
| **Returns** | `{ data: { id } }`                |

### 12.3 `moveClientPipeline`

| Property    | Value                                        |
| ----------- | -------------------------------------------- |
| **Input**   | `{ clientId: string, stage: PipelineStage }` |
| **Auth**    | Authenticated, client owner                  |
| **Steps**   | Update pipeline_stage, log interaction       |
| **Returns** | `{ data: { stage } }`                        |

### 12.4 `addClientNote`

| Property    | Value                                   |
| ----------- | --------------------------------------- |
| **Input**   | `{ clientId: string, content: string }` |
| **Auth**    | Authenticated, client owner             |
| **Returns** | `{ data: { noteId } }`                  |

### 12.5 `tagClient`

| Property    | Value                                    |
| ----------- | ---------------------------------------- |
| **Input**   | `{ clientId: string, tagIds: string[] }` |
| **Auth**    | Authenticated, client owner              |
| **Returns** | `{ data: { tagged: true } }`             |

### 12.6 `createTag`

| Property    | Value                             |
| ----------- | --------------------------------- |
| **Input**   | `{ name: string, color: string }` |
| **Auth**    | Authenticated                     |
| **Returns** | `{ data: { id } }`                |

### 12.7 `setReminder`

| Property    | Value                                          |
| ----------- | ---------------------------------------------- |
| **Input**   | `{ clientId: string, title, remind_at: Date }` |
| **Auth**    | Authenticated, client owner                    |
| **Returns** | `{ data: { id } }`                             |

### 12.8 `autoLinkClient`

| Property    | Value                                                       |
| ----------- | ----------------------------------------------------------- |
| **Input**   | `{ dealId: string }`                                        |
| **Auth**    | Internal call — triggered on deal creation                  |
| **Steps**   | Auto-create CRM client from deal counterparty if not exists |
| **Returns** | `{ data: { clientId } }`                                    |

---

## 13. Message Actions — `src/actions/messages.ts`

### 13.1 `sendMessage`

| Property       | Value                                                                                         |
| -------------- | --------------------------------------------------------------------------------------------- |
| **Input**      | `MessageSchema` — conversation_id, content, attachment_file?                                  |
| **Auth**       | Authenticated, conversation participant                                                       |
| **Rate Limit** | 20/min                                                                                        |
| **Steps**      | 1. Validate participation 2. Upload attachment if any 3. Insert message 4. Realtime broadcast |
| **Returns**    | `{ data: { id } }`                                                                            |

### 13.2 `createConversation`

| Property       | Value                                                                                              |
| -------------- | -------------------------------------------------------------------------------------------------- | --------- | ------------------------------ |
| **Input**      | `{ participantIds: string[], context_type?: 'project'                                              | 'product' | 'deal', context_id?: string }` |
| **Auth**       | Authenticated                                                                                      |
| **Constraint** | Max 2 participants per conversation, no duplicate conversations                                    |
| **Steps**      | 1. Check if conversation already exists between participants 2. Create conversation + participants |
| **Returns**    | `{ data: { conversationId } }`                                                                     |

### 13.3 `markAsRead`

| Property    | Value                                    |
| ----------- | ---------------------------------------- |
| **Input**   | `{ conversationId: string }`             |
| **Auth**    | Authenticated, participant               |
| **Steps**   | Update `last_read_at` on participant row |
| **Returns** | `{ data: { read: true } }`               |

### 13.4 `deleteMessage`

| Property    | Value                                                      |
| ----------- | ---------------------------------------------------------- |
| **Input**   | `{ messageId: string }`                                    |
| **Auth**    | Authenticated, message sender                              |
| **Steps**   | Soft delete — `deleted_at = now()`, hidden for sender only |
| **Returns** | `{ data: { deleted: true } }`                              |

### 13.5 `saveQuickReply`

| Property    | Value                               |
| ----------- | ----------------------------------- |
| **Input**   | `{ title, content_ar, content_en }` |
| **Auth**    | Authenticated                       |
| **Returns** | `{ data: { id } }`                  |

---

## 14. Notification Actions — `src/actions/notifications.ts`

### 14.1 `createNotification` (internal)

| Property  | Value                                                                                                                         |
| --------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Input** | `{ user_id, type: NotificationType, title_ar, title_en, body_ar, body_en, link?, metadata? }`                                 |
| **Auth**  | Internal only (called by other actions)                                                                                       |
| **Steps** | 1. Insert notification 2. Check user preferences 3. If email enabled: send via Resend 4. If WhatsApp enabled: send via Twilio |

### 14.2 `markNotificationRead`

| Property    | Value                                           |
| ----------- | ----------------------------------------------- |
| **Input**   | `{ notificationId: string }` or `{ all: true }` |
| **Auth**    | Authenticated                                   |
| **Returns** | `{ data: { read: true } }`                      |

### 14.3 `updateNotificationPreferences`

| Property    | Value                                                                            |
| ----------- | -------------------------------------------------------------------------------- |
| **Input**   | `{ type: NotificationType, in_app: boolean, email: boolean, whatsapp: boolean }` |
| **Auth**    | Authenticated                                                                    |
| **Returns** | `{ data: { updated: true } }`                                                    |

---

## 15. Review Actions — `src/actions/reviews.ts`

### 15.1 `submitReview`

| Property         | Value                                                                                                                                                 |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Input**        | `ReviewSchema` — deal_id, overall_rating (1-5), quality_rating?, timeliness_rating?, communication_rating?, would_recommend, comment_ar?, comment_en? |
| **Auth**         | Authenticated, deal participant                                                                                                                       |
| **Constraints**  | Deal must be 'completed', within 30 days of completion, one review per direction per deal                                                             |
| **Steps**        | 1. All constraint checks 2. Insert review 3. DB trigger updates reviewee's average_rating + total_reviews 4. Notify reviewee                          |
| **Returns**      | `{ data: { id } }`                                                                                                                                    |
| **Side Effects** | `review_received` notification, profile aggregate update                                                                                              |

### 15.2 `editReview`

| Property       | Value                                    |
| -------------- | ---------------------------------------- |
| **Input**      | `{ reviewId: string, ...UpdatedFields }` |
| **Auth**       | Authenticated, review author             |
| **Constraint** | Within 48 hours of submission            |
| **Steps**      | Update review, recalculate aggregates    |
| **Returns**    | `{ data: { id } }`                       |

---

## 16. Kanban Actions — (within `src/actions/deals.ts` or `src/actions/kanban.ts`)

### 16.1 `createKanbanColumn`

| Property    | Value                                                 |
| ----------- | ----------------------------------------------------- |
| **Input**   | `{ dealId: string, title: string, position: number }` |
| **Auth**    | Authenticated, contractor on deal                     |
| **Tier**    | Business+ for full Kanban                             |
| **Returns** | `{ data: { id } }`                                    |

### 16.2 `createKanbanCard`

| Property    | Value                                                                             |
| ----------- | --------------------------------------------------------------------------------- |
| **Input**   | `{ columnId: string, title, description?, assignee_name?, due_date?, priority? }` |
| **Auth**    | Authenticated, contractor on deal                                                 |
| **Returns** | `{ data: { id } }`                                                                |

### 16.3 `moveKanbanCard`

| Property    | Value                                                                                     |
| ----------- | ----------------------------------------------------------------------------------------- |
| **Input**   | `{ cardId: string, targetColumnId: string, position: number }`                            |
| **Auth**    | Authenticated, contractor on deal                                                         |
| **Steps**   | 1. Move card 2. If moved to "Done" column → prompt proof submission 3. Realtime broadcast |
| **Returns** | `{ data: { moved: true } }`                                                               |

### 16.4 `createDailyLog`

| Property       | Value                                                                                                                      |
| -------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Input**      | `DailyLogSchema` — deal_id, date, weather, workers_count, description_ar, description_en, issues?, safety_notes?, photos[] |
| **Auth**       | Authenticated, contractor on deal                                                                                          |
| **Constraint** | One log per day per deal                                                                                                   |
| **Returns**    | `{ data: { id } }`                                                                                                         |

---

## 17. Admin Actions — `src/actions/admin/`

All admin actions use `createAdminClient()` (service role, bypasses RLS).

### 17.1 `src/actions/admin/moderation.ts`

#### `approvePost`

| Property         | Value                                                                 |
| ---------------- | --------------------------------------------------------------------- | --------- | -------- |
| **Input**        | `{ postId: string, postType: 'project'                                | 'product' | 'rfq' }` |
| **Auth**         | Admin (`is_admin = true`)                                             |
| **Steps**        | 1. Update status → 'published' 2. Index in Typesense 3. Notify poster |
| **Side Effects** | `post_approved` notification, Typesense upsert                        |

#### `rejectPost`

| Property         | Value                                                                              |
| ---------------- | ---------------------------------------------------------------------------------- |
| **Input**        | `{ postId: string, postType, reason_ar: string, reason_en: string }`               |
| **Auth**         | Admin                                                                              |
| **Steps**        | 1. Update status → 'rejected' 2. Remove from Typesense if indexed 3. Notify poster |
| **Side Effects** | `post_rejected` notification                                                       |

### 17.2 `src/actions/admin/users.ts`

#### `approveUserDocuments`

| Property         | Value                                                                                                     |
| ---------------- | --------------------------------------------------------------------------------------------------------- |
| **Input**        | `{ userId: string }`                                                                                      |
| **Auth**         | Admin                                                                                                     |
| **Steps**        | 1. Update all pending documents → 'approved' 2. Update user verification_status → 'active' 3. Notify user |
| **Side Effects** | `document_approved` notification                                                                          |

#### `rejectUserDocuments`

| Property         | Value                                      |
| ---------------- | ------------------------------------------ |
| **Input**        | `{ userId: string, reason_ar, reason_en }` |
| **Auth**         | Admin                                      |
| **Side Effects** | `document_rejected` notification           |

#### `banUser` / `unbanUser`

| Property  | Value                                       |
| --------- | ------------------------------------------- |
| **Input** | `{ userId: string, reason?: string }`       |
| **Auth**  | Admin                                       |
| **Steps** | Update profile status → 'banned' / 'active' |

#### `restrictUser` / `unrestrictUser`

| Property  | Value                                           |
| --------- | ----------------------------------------------- |
| **Input** | `{ userId: string, reason?: string }`           |
| **Auth**  | Admin                                           |
| **Steps** | Update profile status → 'restricted' / 'active' |

### 17.3 `src/actions/admin/commissions.ts`

#### `approveCommissionPayment`

| Property    | Value                                                                               |
| ----------- | ----------------------------------------------------------------------------------- |
| **Input**   | `{ commissionId: string }`                                                          |
| **Auth**    | Admin                                                                               |
| **Steps**   | 1. Verify bank transfer receipt 2. Update status → 'paid' 3. Generate ZATCA invoice |
| **Returns** | `{ data: { invoiceId } }`                                                           |

#### `resolveCommissionDispute`

| Property  | Value                                                                            |
| --------- | -------------------------------------------------------------------------------- |
| **Input** | `{ commissionId: string, adjustedAmount?: number, resolution: string }`          |
| **Auth**  | Admin                                                                            |
| **Steps** | 1. If amount adjusted → update 2. Update status → 'pending' 3. Unfreeze deadline |

### 17.4 `src/actions/admin/settings.ts`

#### `updatePlatformSettings`

| Property  | Value                                                               |
| --------- | ------------------------------------------------------------------- |
| **Input** | `{ key: string, value: any, value_ar?: string, value_en?: string }` |
| **Auth**  | Admin                                                               |
| **Steps** | Upsert platform_settings row                                        |

#### `manageCoupon`

| Property  | Value                                                                                                                                             |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Input** | `CouponSchema` — code, discount_type, discount_value, valid_from, valid_until, max_uses, max_per_user, applicable_tiers[], applicable_durations[] |
| **Auth**  | Admin                                                                                                                                             |
| **Steps** | Insert/update coupon                                                                                                                              |

---

## 18. Contact & Misc Actions

### 18.1 `submitContactForm` — `src/actions/contact.ts`

| Property       | Value                                                                       |
| -------------- | --------------------------------------------------------------------------- |
| **Input**      | `ContactSchema` — name, email, phone?, subject, message                     |
| **Auth**       | None (public)                                                               |
| **Rate Limit** | 3/hour per IP                                                               |
| **Steps**      | 1. Validate 2. Insert contact_submissions 3. Send email to admin via Resend |
| **Returns**    | `{ data: { submitted: true } }`                                             |

---

## 19. API Route Handlers — `src/app/api/`

These are **not** Server Actions. They are standard HTTP route handlers for external service callbacks.

### 19.1 `POST /api/auth/callback` — OAuth callback

```typescript
// src/app/api/auth/callback/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    }
  }
  return NextResponse.redirect(new URL("/login?error=auth", request.url));
}
```

### 19.2 `POST /api/webhooks/moyasar` — Payment confirmation

```typescript
// Receives: payment_id, status, amount, metadata (subscription_id or commission_id)
// 1. Verify HMAC signature
// 2. If subscription payment: update subscription status → active, set dates
// 3. If commission payment: update commission status → paid, generate invoice
// 4. Return 200
```

### 19.3 `POST /api/webhooks/typesense-sync` — DB → Typesense sync

```typescript
// Receives: Supabase DB webhook payload (table, type, record, old_record)
// 1. Verify webhook secret
// 2. If INSERT/UPDATE with status='published': upsert in Typesense
// 3. If DELETE or status change away from 'published': delete from Typesense
// 4. Return 200
```

### 19.4 `POST /api/webhooks/supabase` — Generic DB event handler

```typescript
// For events that trigger complex side effects:
// - Commission escalation (30-day overdue → restrict account)
// - Subscription expiry checks
// - Scheduled notifications
```

---

## 20. Zod Schema Summary — `src/schemas/`

| File              | Schemas                                                                                               |
| ----------------- | ----------------------------------------------------------------------------------------------------- |
| `auth.ts`         | `RegisterSchema`, `LoginSchema`, `ResetPasswordSchema`, `UpdatePasswordSchema`, `UpdateProfileSchema` |
| `project.ts`      | `ProjectSchema`, `UpdateProjectSchema`                                                                |
| `product.ts`      | `ProductSchema`, `UpdateProductSchema`, `ProductVariantSchema`, `BulkImportSchema`                    |
| `bid.ts`          | `BidSchema`, `UpdateBidSchema`                                                                        |
| `quotation.ts`    | `QuotationSchema`, `QuotationItemSchema`, `SendQuotationSchema`                                       |
| `rfq.ts`          | `RFQSchema`, `RFQResponseSchema`, `HireRequestSchema`                                                 |
| `deal.ts`         | `MilestoneSchema`, `ProofSchema`, `CancelRequestSchema`, `SkipRequestSchema`                          |
| `contract.ts`     | `ContractSchema`, `SignContractSchema`, `ContractClauseSchema`                                        |
| `subscription.ts` | `SubscriptionSchema`, `CouponApplySchema`                                                             |
| `crm.ts`          | `CRMClientSchema`, `CRMNoteSchema`, `CRMTagSchema`, `ReminderSchema`                                  |
| `message.ts`      | `MessageSchema`, `QuickReplySchema`                                                                   |
| `review.ts`       | `ReviewSchema`, `EditReviewSchema`                                                                    |
| `contact.ts`      | `ContactSchema`                                                                                       |
| `kanban.ts`       | `KanbanColumnSchema`, `KanbanCardSchema`, `DailyLogSchema`                                            |

### Common Validators

```typescript
// src/schemas/common.ts
export const saudiPhone = z
  .string()
  .regex(/^\+966[0-9]{9}$/, "Must be +966 followed by 9 digits");
export const sarAmount = z.number().positive().multipleOf(0.01);
export const bilingualText = z.object({
  ar: z.string().min(1, "Arabic text required"),
  en: z.string().min(1, "English text required"),
});
export const uuid = z.string().uuid();
export const pagination = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().min(1).max(100).default(20),
});
```
