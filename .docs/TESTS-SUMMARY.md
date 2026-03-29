# Muhandes HUB — Test Plan Summary

> Human-readable overview of the 214 E2E browser simulation tests defined in `TESTS.md`.
> For full step-by-step instructions, see [`TESTS.md`](./TESTS.md).

---

## At a Glance

| Metric        | Value                                               |
| ------------- | --------------------------------------------------- |
| Total tests   | **214**                                             |
| Phases        | **10** (sequential — each builds on previous)       |
| Demo accounts | **7** (from [`DEMO-USERS.md`](./DEMO-USERS.md))     |
| Roles covered | Project Owner, Contractor, Supplier, Buyer, Admin   |
| Seeding       | **None** — every resource is created through the UI |

---

## Demo Accounts

| Business Name          | Role          | Tier           |
| ---------------------- | ------------- | -------------- |
| Al Qahtani Group       | Project Owner | Business       |
| Bunyan                 | Contractor    | Pro            |
| Al Rajhi Contracting   | Contractor    | Enterprise     |
| First Materials        | Supplier      | Pro            |
| Al Shammari Electrical | Supplier      | Starter        |
| يوسف الحربي            | Buyer         | Starter (free) |
| Muhandes HUB (Admin)    | Admin         | Enterprise     |

---

## Phase Overview

| Phase | Name                                | Tests         | Count | Primary Actors                           |
| ----- | ----------------------------------- | ------------- | ----- | ---------------------------------------- |
| 1     | Registration & Authentication       | E2E-001 → 028 | 28    | All 7 users, Admin                       |
| 2     | Profile & Subscription Changes      | E2E-029 → 044 | 16    | All users                                |
| 3     | Content Creation & Admin Moderation | E2E-045 → 066 | 22    | PO, Contractors, Suppliers, Buyer, Admin |
| 4     | Bidding Complete Lifecycle          | E2E-067 → 084 | 18    | PO, Contractors, Buyer (negative)        |
| 5     | RFQ & Quotation Lifecycle           | E2E-085 → 104 | 20    | All roles                                |
| 6     | Deal Workspace Full Experience      | E2E-105 → 132 | 28    | PO ↔ Contractors (both deal parties)     |
| 7     | Reviews, Ratings & Commission       | E2E-133 → 152 | 20    | Deal parties, Admin                      |
| 8     | Cross-Cutting Features              | E2E-153 → 173 | 21    | All users                                |
| 9     | Negative & Edge Cases               | E2E-174 → 193 | 20    | All roles (testing restrictions)         |
| 10    | Admin Panel & Real-World Scenarios  | E2E-194 → 214 | 21    | Admin, all users (lifecycle replays)     |

---

## Phase Dependencies

```
Phase 1  (accounts exist)
   ↓
Phase 2  (profiles updated, tiers set)
   ↓
Phase 3  (projects, products, RFQs published)
   ↓
 ┌─────────────┬────────────────┐
 ↓             ↓                ↓
Phase 4      Phase 5          Phase 8
(bidding)    (RFQ/quotation)  (i18n, search, CRM)
 ↓             ↓
 └──────┬──────┘
        ↓
      Phase 6  (deal workspace — needs deals from 4 & 5)
        ↓
      Phase 7  (reviews & commission — needs completed deals)
        ↓
      Phase 9  (negative tests — needs active accounts)
        ↓
      Phase 10 (admin panel + full lifecycle replays)
```

---

## Phase-by-Phase Breakdown

### Phase 1 — Registration & Authentication (28 tests)

**What it does**: Creates all 7 demo accounts from scratch, walks each through the full verification pipeline, and tests auth edge cases.

| Section                         | Tests         | What's Verified                                                                                      |
| ------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------- |
| 1.1 Email/Password Registration | E2E-001 → 004 | Register all 4 roles (PO, Contractor, Supplier, Buyer)                                               |
| 1.2 Validation & Edge Cases     | E2E-005 → 010 | PDPL consent, weak password, duplicate email, invalid phone, immutable role, required company fields |
| 1.3 Google OAuth                | E2E-011 → 012 | OAuth registration for Al Rajhi, email conflict with existing account                                |
| 1.4 Bank Transfer Payment       | E2E-013 → 016 | Two users pay via bank transfer, admin verifies both receipts                                        |
| 1.5 Four-Gate Verification      | E2E-017 → 022 | Email → Payment → Documents → Admin approval pipeline; rejection + re-upload                         |
| 1.6 Login/Logout/Session        | E2E-023 → 028 | Valid login, wrong password, non-existent email, logout, forgot password, session persistence        |

---

### Phase 2 — Profile & Subscription Changes (16 tests)

**What it does**: Updates user profiles, tests subscription upgrades/downgrades, and validates the coupon system.

| Section                    | Tests         | What's Verified                                                                                        |
| -------------------------- | ------------- | ------------------------------------------------------------------------------------------------------ |
| 2.1 Profile Updates        | E2E-029 → 032 | All 4 roles update their profiles (company info, bio, avatar, logo)                                    |
| 2.2 Subscription Upgrade   | E2E-033 → 036 | Starter → Pro (Al Shammari), Pro → Business (Bunyan), feature unlock verification, 0% commission badge |
| 2.3 Subscription Downgrade | E2E-037 → 040 | Business → Pro, Pro → Starter, end-of-period enforcement, cancel downgrade                             |
| 2.4 Coupon System          | E2E-041 → 044 | Valid coupon, expired coupon, already-used coupon, tier-restricted coupon                              |

---

### Phase 3 — Content Creation & Admin Moderation (22 tests)

**What it does**: PO creates projects, suppliers create products, all roles create RFQs. Admin moderates the approval queue.

| Section                            | Tests         | What's Verified                                                                                                           |
| ---------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------- |
| 3.1 Project Creation               | E2E-045 → 049 | Create 2 projects (Villa + Commercial), submit for approval, subcontract project, no self-publish                         |
| 3.2 Product Creation & Tier Limits | E2E-050 → 055 | Create products (Rebar, Cement, Wires), Starter 2-product cap, server-side bypass blocked, image size limit               |
| 3.3 RFQ Creation                   | E2E-056 → 059 | All 4 roles create RFQs (PO, Contractor, Buyer, Supplier)                                                                 |
| 3.4 Admin Moderation               | E2E-060 → 066 | View queue, approve projects, reject with bilingual feedback, approve products + RFQs, verify search excludes unpublished |

---

### Phase 4 — Bidding Complete Lifecycle (18 tests)

**What it does**: Two contractors bid on two projects. Tests duplicate prevention, comparison, award, and deal creation.

| Section                  | Tests         | What's Verified                                                                                       |
| ------------------------ | ------------- | ----------------------------------------------------------------------------------------------------- |
| 4.1 Multiple Bids        | E2E-067 → 070 | Bunyan + Al Rajhi bid on Villa; bid notifications; Buyer cannot bid                                   |
| 4.2 Duplicate Prevention | E2E-071 → 072 | Same contractor cannot bid twice on same project                                                      |
| 4.3 Comparison & Award   | E2E-073 → 078 | Bid comparison table, shortlist, award → DEAL-PROJECT created, auto-reject losers, irreversible award |
| 4.4 Second Project       | E2E-079 → 082 | Both contractors bid on Commercial Renovation, Bunyan awarded, deal access verified                   |
| 4.5 Bid Limits           | E2E-083 → 084 | Starter 10/mo cap enforced, bid counter display                                                       |

---

### Phase 5 — RFQ & Quotation Lifecycle (20 tests)

**What it does**: Suppliers respond to RFQs, standalone quotations are created, and product inquiries flow through to deal creation.

| Section                    | Tests         | What's Verified                                                                                                                 |
| -------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| 5.1 RFQ Responses          | E2E-085 → 090 | Two suppliers respond, notifications, duplicate response check, accept → DEAL-PRODUCT, reject                                   |
| 5.2 Standalone Quotations  | E2E-091 → 097 | Create quotation with line items + VAT, auto-numbering, send, view, accept → deal, tier limit, duplicate                        |
| 5.3 Product Inquiry → Deal | E2E-098 → 104 | Buyer inquires on product, supplier responds with quotation, revised quote, accept → DEAL-PRODUCT, can't inquire on own product |

---

### Phase 6 — Deal Workspace Full Experience (28 tests)

**What it does**: Both parties navigate the deal workspace through the full lifecycle — milestones, proofs, Kanban, daily logs, messaging, and cancellation.

| Section               | Tests         | What's Verified                                                                                                           |
| --------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------- |
| 6.1 Milestones        | E2E-105 → 112 | Both parties open workspace, create 5 milestones, reorder, suggest/approve/reject changes, total cannot exceed deal value |
| 6.2 Proof Submission  | E2E-113 → 120 | Work proof submit → confirm/reject → re-submit, payment proofs, all milestones completed → deal completed                 |
| 6.3 Kanban Board      | E2E-121 → 124 | Create task cards, drag across columns, Buyer has read-only view                                                          |
| 6.4 Daily Site Log    | E2E-125 → 126 | Structured daily entries (weather, workers, issues, photos), buyer read-only                                              |
| 6.5 In-Deal Messaging | E2E-127 → 130 | Send messages, real-time delivery, file attachments, 10MB limit                                                           |
| 6.6 Deal Cancellation | E2E-131 → 132 | Cancellation request rejected, then approved → deal read-only                                                             |

---

### Phase 7 — Reviews, Ratings & Commission (20 tests)

**What it does**: After deal completion, both parties leave reviews. Commission is calculated, paid, and disputed.

| Section                  | Tests         | What's Verified                                                                                               |
| ------------------------ | ------------- | ------------------------------------------------------------------------------------------------------------- |
| 7.1 Review Submission    | E2E-133 → 135 | Buyer reviews seller (5★), seller reviews buyer (4★), profile rating updated                                  |
| 7.2 Review Constraints   | E2E-136 → 138 | No duplicate reviews, edit within 48h works, edit after 48h blocked                                           |
| 7.3 Timing Restrictions  | E2E-139 → 141 | Can't review cancelled deal, can't review after 30-day window, duplicate blocked                              |
| 7.4 Commission Lifecycle | E2E-142 → 147 | Enterprise = 0%, Pro = 1% auto-created, card payment, bank transfer, admin verification, overdue → restricted |
| 7.5 Commission Dispute   | E2E-148 → 149 | Seller disputes, admin resolves                                                                               |
| 7.6 Rate Verification    | E2E-150 → 152 | Starter = 2%, Pro = 1%, Business/Enterprise = 0%                                                              |

---

### Phase 8 — Cross-Cutting Features (21 tests)

**What it does**: Tests platform-wide features that span all roles — bilingual support, notifications, search, CRM, and contracts.

| Section                 | Tests         | What's Verified                                                                           |
| ----------------------- | ------------- | ----------------------------------------------------------------------------------------- |
| 8.1 Bilingual Switching | E2E-153 → 156 | AR ↔ EN switch, RTL/LTR layout, form data preserved, errors in current locale             |
| 8.2 Notifications       | E2E-157 → 161 | Bell badge count, deep-link navigation, full list page, mark all read, critical unmutable |
| 8.3 Search              | E2E-162 → 165 | Arabic search, English search, typo tolerance, faceted filtering                          |
| 8.4 CRM                 | E2E-166 → 170 | Auto-client from deal, manual add, pipeline stages, client notes, tier limits (20/200/∞)  |
| 8.5 Contracts           | E2E-171 → 173 | Generate from deal, standalone creation, dual sign + PDF + QR verification                |

---

### Phase 9 — Negative & Edge Cases (20 tests)

**What it does**: Verifies that the system correctly blocks unauthorized actions, invalid inputs, and handles banned/restricted users.

| Section                         | Tests         | What's Verified                                                                                                        |
| ------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------- |
| 9.1 Role-Based Access Denial    | E2E-174 → 179 | Buyer can't create projects/products, PO can't create products, Supplier can't bid, Kanban tier gate, Buyer has no CRM |
| 9.2 Auth & Route Protection     | E2E-180 → 183 | Unauthenticated → redirect to login, non-admin blocked from admin panel, admin redirected from dashboard               |
| 9.3 File Upload Edge Cases      | E2E-184 → 187 | >10MB document rejected, >5MB image rejected, fake MIME type rejected, valid file succeeds                             |
| 9.4 Input Validation & Security | E2E-188 → 190 | XSS injection escaped, SQL injection harmless, extremely long text handled                                             |
| 9.5 Banned & Restricted Users   | E2E-191 → 193 | Admin bans user → login blocked, restricted user → limited access, admin unbans → full access restored                 |

---

### Phase 10 — Admin Panel & Real-World Scenarios (21 tests)

**What it does**: Full admin panel workflow plus complete end-to-end lifecycle replays for every role.

| Section                     | Tests         | What's Verified                                                                                                                             |
| --------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 10.1 Admin Panel            | E2E-194 → 201 | Dashboard overview, bulk approvals, user filtering, user detail page, commission processing, coupon creation, analytics, Typesense re-index |
| 10.2 Full Lifecycle Replays | E2E-202 → 205 | PO journey (register → deal → review → CRM), Contractor journey, Supplier journey, Buyer journey                                            |
| 10.3 Multi-Deal Management  | E2E-206 → 208 | 3 concurrent deals (PO), 2 deals (seller), active vs cancelled comparison                                                                   |
| 10.4 Repeat Client Flow     | E2E-209 → 211 | CRM "Repeat" status, follow-up reminders, client scoring badge                                                                              |
| 10.5 Anonymous Browsing     | E2E-212 → 213 | Browse projects/products without login → action button redirects to login                                                                   |
| 10.6 Accessibility          | E2E-214       | Keyboard navigation through registration form                                                                                               |

---

## Coverage Matrix — Who Does What

| Feature Area        | Al Qahtani (PO) | Bunyan (Contractor) | Al Rajhi (Contractor) | First Materials (Supplier) | Al Shammari (Supplier) | يوسف (Buyer) | Admin     |
| ------------------- | --------------- | ------------------- | --------------------- | -------------------------- | ---------------------- | ------------ | --------- |
| Registration        | ✅              | ✅                  | ✅ (OAuth)            | ✅                         | ✅                     | ✅           | ✅        |
| Profile Update      | ✅              | ✅                  | —                     | ✅                         | —                      | ✅           | —         |
| Subscription Change | —               | ✅ ↑↓               | —                     | —                          | ✅ ↑↓                  | —            | —         |
| Project Creation    | ✅ (2)          | ✅ (1)              | —                     | —                          | —                      | —            | —         |
| Product Creation    | —               | —                   | —                     | ✅ (2)                     | ✅ (1)                 | —            | —         |
| RFQ Creation        | ✅              | ✅                  | —                     | ✅                         | —                      | ✅           | —         |
| Bid Submission      | —               | ✅ (2)              | ✅ (2)                | —                          | —                      | ❌ blocked   | —         |
| Bid Award           | ✅ (2)          | —                   | —                     | —                          | —                      | —            | —         |
| RFQ Response        | —               | —                   | —                     | ✅                         | ✅                     | —            | —         |
| Deal Workspace      | ✅ buyer        | ✅ seller           | ✅ seller             | ✅ seller                  | —                      | ✅ buyer     | —         |
| Milestones & Proofs | ✅              | —                   | ✅                    | —                          | —                      | —            | —         |
| Kanban / Daily Log  | —               | —                   | ✅                    | —                          | —                      | —            | —         |
| Reviews             | ✅ gives        | ✅ receives         | ✅ both               | —                          | —                      | —            | —         |
| Commission          | —               | —                   | ✅ (0%)               | ✅ (1%)                    | —                      | —            | ✅ verify |
| CRM                 | ✅              | —                   | —                     | —                          | —                      | ❌ blocked   | —         |
| Contracts           | ✅              | —                   | —                     | —                          | —                      | —            | —         |
| Moderation          | —               | —                   | —                     | —                          | —                      | —            | ✅        |
| User Management     | —               | —                   | —                     | —                          | —                      | —            | ✅        |
| Ban/Restrict        | —               | —                   | —                     | —                          | —                      | ❌ banned    | ✅        |

---

## Business Rules Validated

These critical platform rules are explicitly tested:

1. **Role immutability** — Role cannot be changed after registration (E2E-009)
2. **One bid per project per contractor** — Duplicates blocked client + server (E2E-071, 072)
3. **Admin-only publishing** — Users cannot self-publish content (E2E-049)
4. **Draft → Pending → Published** — Three-step moderation pipeline (E2E-047, 061)
5. **Deal auto-creation** — On bid award (E2E-075) or quotation acceptance (E2E-089, 095, 102)
6. **Tier limits double-enforced** — Client hides UI + server rejects (E2E-053, 054)
7. **Commission rates by tier** — Starter 2%, Pro 1%, Business/Enterprise 0% (E2E-150–152)
8. **Review constraints** — Completed deals only, 30-day window, one per direction, 48h edit (E2E-136–141)
9. **Four-gate verification** — Email → Payment → Documents → Admin approval (E2E-017–022)
10. **File size limits** — Documents ≤10MB, images ≤5MB, server-side MIME check (E2E-184–186)
11. **No email existence leak** — Login errors are generic (E2E-024, 025)
12. **Bilingual everything** — AR/EN switching preserves data, errors in active locale (E2E-153–156)
13. **Commission lifecycle** — Auto-created → paid/disputed → overdue → account restricted (E2E-142–149)
14. **Downgrade at period end** — Features remain until billing cycle ends (E2E-037–039)
15. **ZATCA VAT 15%** — Applied on quotation line items and commissions (E2E-091, 146)

---

## Test Count Verification

| Phase     | Expected | Range             |
| --------- | -------- | ----------------- |
| 1         | 28       | E2E-001 → E2E-028 |
| 2         | 16       | E2E-029 → E2E-044 |
| 3         | 22       | E2E-045 → E2E-066 |
| 4         | 18       | E2E-067 → E2E-084 |
| 5         | 20       | E2E-085 → E2E-104 |
| 6         | 28       | E2E-105 → E2E-132 |
| 7         | 20       | E2E-133 → E2E-152 |
| 8         | 21       | E2E-153 → E2E-173 |
| 9         | 20       | E2E-174 → E2E-193 |
| 10        | 21       | E2E-194 → E2E-214 |
| **Total** | **214**  |                   |
