# Muqawil HUB — User Flows

> **Version**: 1.0 | **Date**: March 4, 2026  
> **Source**: `.docs/FEATURES.md`

---

## 1. Registration Flows

### 1.1 Project Owner / Buyer Registration

```mermaid
flowchart TD
    A[Landing Page] --> B[Click Register]
    B --> C[Step 1: Role Selection]
    C --> D[Select Project Owner or Buyer]
    D --> E[Step 2: Account Details]
    E --> |Full name, email, password, phone +966| F{Google OAuth?}
    F --> |No| G[PDPL Consent Checkbox]
    F --> |Yes| G2[Google Auth → Skip password]
    G --> H[Step 3: Profile & Company]
    G2 --> H
    H --> I{Profile Type?}
    I --> |Company| J[Company name AR/EN, CR number, website]
    I --> |Personal| K[Personal info only]
    J --> L[City selection]
    K --> L
    L --> M[PO only: Upload company profile PDF optional]
    M --> N[Step 4-5: SKIPPED for PO/Buyer]
    N --> O[Email Verification Sent]
    O --> P[Click verification link]
    P --> Q[Status: active]
    Q --> R[Dashboard Access]
```

### 1.2 Contractor / Supplier — Starter Tier

```mermaid
flowchart TD
    A[Step 1: Role Selection] --> B[Select Contractor or Supplier]
    B --> C[Step 2: Account Details]
    C --> |Name, email, password, phone, PDPL| D[Step 3: Company Profile]
    D --> |Company name AR/EN, CR, website, city| E[Step 4: Subscription Selection]
    E --> F[Select Starter - Free]
    F --> G[Step 5-6: SKIPPED for Starter]
    G --> H[Email Verification Sent]
    H --> I[Click verification link]
    I --> J[Status: active]
    J --> K[Dashboard with Starter limits]
```

### 1.3 Contractor / Supplier — Pro / Business / Enterprise

```mermaid
flowchart TD
    A[Step 1: Role Selection] --> B[Select Contractor or Supplier]
    B --> C[Step 2: Account Details]
    C --> D[Step 3: Company Profile]
    D --> E[Step 4: Subscription Selection]
    E --> F[Select Pro/Business/Enterprise + Duration]
    F --> G{Apply Coupon?}
    G --> |Yes| H[Validate & Apply Discount]
    G --> |No| I[Step 5: Payment]
    H --> I
    I --> J{Payment Method?}
    J --> |Card| K[Moyasar 3D Secure]
    J --> |Bank Transfer| L[Upload Transfer Receipt]
    K --> M[Auto-verified → Gate 2 passed]
    L --> N[Pending Admin Verification → Gate 2]
    M --> O[Step 6: Document Upload]
    N --> O
    O --> |VAT Certificate + Commercial License| P[Email Verification Sent]
    P --> Q[Click link → Gate 1 passed]
    Q --> R[Admin Reviews Documents → Gate 3]
    R --> S{Approved?}
    S --> |Yes| T[Gate 4 passed → Status: active]
    S --> |No| U[Rejection feedback AR/EN]
    U --> V[User re-uploads → Re-review]
    T --> W[Full Dashboard Access]
```

### 1.4 Google OAuth Registration

```mermaid
flowchart TD
    A[Click Sign up with Google] --> B{Existing email?}
    B --> |Yes with password auth| C[Error: Account exists]
    B --> |No| D[Google OAuth PKCE → Create account]
    D --> E[Redirect to Step 1: Role Selection]
    E --> F[Continue from Step 3 onwards]
    F --> |Email pre-filled, password skipped| G[Same flow as role-specific]
```

---

## 2. Login Flow

```mermaid
flowchart TD
    A[Login Page] --> B{Method?}
    B --> |Email/Password| C[Enter credentials]
    B --> |Google OAuth| D[Google PKCE flow]
    C --> E{Valid?}
    E --> |No| F[Error message + rate limit after 5 attempts]
    E --> |Yes| G{Account status?}
    D --> G
    G --> |active| H[Dashboard]
    G --> |pending_email| I[Resend verification prompt]
    G --> |pending_payment| J[Redirect to payment]
    G --> |pending_documents| K[Redirect to document upload]
    G --> |pending_approval| L[Waiting screen with message]
    G --> |restricted| M[Restriction notice + pay commission prompt]
    G --> |banned| N[Account banned message]
```

---

## 3. Project Lifecycle (Project Owner ↔ Contractor)

```mermaid
flowchart TD
    A[PO: Create Project Post] --> B[Fill: title AR/EN, description AR/EN]
    B --> C[Set budget range, timeline, city, classification]
    C --> D[Upload: BOQ, drawings, specs]
    D --> E[Save as Draft or Submit]
    E --> |Submit| F[Status: Pending]
    F --> G[Admin Reviews]
    G --> H{Decision}
    H --> |Approve| I[Status: Published]
    H --> |Reject| J[Feedback AR/EN → User edits → Re-submit]
    I --> K[Indexed in Typesense]
    K --> L[Contractors Discover via Search]
    L --> M[Contractor: View Project Detail]
    M --> N{Classification eligible?}
    N --> |No| O[Cannot bid - tier too low]
    N --> |Yes| P{Monthly bid limit OK?}
    P --> |No| Q[Upgrade prompt]
    P --> |Yes| R[Submit Bid: amount, timeline, methodology]
    R --> S[PO receives bid_received notification]
    S --> T[PO: Opens Comparison Table]
    T --> U[Side-by-side: price, timeline, rating, tier]
    U --> V{PO Decision}
    V --> |Shortlist| W[bid_shortlisted notification]
    V --> |Award| X[bid_awarded notification]
    V --> |Reject| Y[bid_rejected notification]
    X --> Z[DEAL-PROJECT Created]
    Z --> AA[Both parties notified: deal_created]
    AA --> BB[Deal Workspace Opens]
```

---

## 4. Product Procurement (Supplier ↔ Buyer/PO)

### 4.1 Product Inquiry Flow

```mermaid
flowchart TD
    A[Supplier: Create Product Listing] --> B[Name AR/EN, description, category]
    B --> C{Pricing model?}
    C --> |Fixed| D[Set single price]
    C --> |Variant| E[Add variants with SKU + price each]
    D --> F[Upload images + spec sheets]
    E --> F
    F --> G[Submit for Approval]
    G --> H[Admin Approves → Published]
    H --> I[Buyer/PO browses marketplace]
    I --> J[View product detail]
    J --> K{Action?}
    K --> |Submit Inquiry| L[Quantity, timeline, requirements]
    K --> |Request Quotation button| M[Pre-filled RFQ created]
    L --> N[Supplier receives inquiry_received]
    N --> O[Supplier: Create Quotation Mode A]
    O --> P[Line items, VAT, validity, terms]
    P --> Q[Send quotation]
    Q --> R[Buyer receives quotation_received]
    R --> S{Buyer Decision}
    S --> |Accept| T[DEAL-PRODUCT Created]
    S --> |Reject| U[Quotation rejected]
    S --> |Request Revision| V[Supplier revises max 3 times]
    T --> W[Deal Workspace Opens]
```

### 4.2 Standalone Quotation Flow

```mermaid
flowchart TD
    A[Dashboard > Quotations] --> B[Click Create New]
    B --> C[Mode B: Standalone Quotation]
    C --> D[Enter client name, project ref]
    D --> E[Add line items: desc, qty, unit, price]
    E --> F[Auto-calculate: subtotal, VAT 15%, total]
    F --> G[Set validity, payment/delivery terms]
    G --> H[Apply clause library templates]
    H --> I{Action}
    I --> |Save Draft| J[Status: Draft]
    I --> |Send Email| K[Via Resend → Status: Sent]
    I --> |Download PDF| L[Branded PDF generated]
    I --> |Duplicate| M[Copy as new draft]
    I --> |Convert to Contract| N[Pre-fill contract from quotation]
    K --> O[Recipient views → Status: Viewed]
    O --> P{Recipient response}
    P --> |Accept on platform| Q[Status: Accepted → DEAL-PRODUCT]
    P --> |No response| R[Auto-expiry after validity period]
```

---

## 5. RFQ Flow (Any Role → Supplier)

```mermaid
flowchart TD
    A[User: Create RFQ] --> B[Title AR/EN, description, category]
    B --> C[Quantity, budget range, deadline]
    C --> D{Linked?}
    D --> |Product-linked| E[Pre-filled from product]
    D --> |Project-linked| F[Associate project_id]
    D --> |Standalone| G[No link]
    E --> H[Submit for Admin Approval]
    F --> H
    G --> H
    H --> I[Admin Approves → Published]
    I --> J[Suppliers see RFQ in browse]
    J --> K[Supplier: Submit Response]
    K --> L[Pricing, delivery terms, notes]
    L --> M[rfq_response_received notification]
    M --> N[Poster reviews responses]
    N --> O{Decision}
    O --> |Accept| P[rfq_response_accepted → DEAL-PRODUCT]
    O --> |Reject| Q[rfq_response_rejected notification]
    P --> R[Deal with optional project_id]

    S[Deadline passes] --> T{Responses exist?}
    T --> |Yes| U[Close for new, review existing]
    T --> |No| V[Auto-expire, can re-post]
```

---

## 6. Direct Supplier Hire Flow

```mermaid
flowchart TD
    A[PO/Contractor: Browse Supplier Directory] --> B[View Supplier Profile]
    B --> C[Click Hire for Project]
    C --> D[Select project, describe need, quantity, budget]
    D --> E[Send Hire Request]
    E --> F[Supplier receives hire_request notification]
    F --> G[Supplier reviews request]
    G --> H{Decision}
    H --> |Submit Quotation| I[Quotation Mode A: linked to hire]
    H --> |Decline| J[Request rejected]
    I --> K[Requester receives quotation_received]
    K --> L{Accept?}
    L --> |Yes| M[DEAL-PRODUCT with project_id]
    L --> |No| N[Quotation rejected]
    M --> O[Deal Workspace]
```

---

## 7. Deal Workspace Flow

```mermaid
flowchart TD
    A[Deal Created] --> B[Status: active]
    B --> C{Generate Contract?}
    C --> |Yes| D[Contract auto-filled from deal terms]
    C --> |No| E[Continue without contract]
    D --> F[Both parties sign → Deal: in_progress]
    E --> G[Manual status change or continue]

    F --> H[Create Milestones]
    G --> H
    H --> I[Owner sets milestones: title, due date, payment]
    I --> J{Counterparty suggests changes?}
    J --> |Yes| K[Suggestion awaits approval]
    J --> |No| L[Milestones finalized]
    K --> L

    L --> M[Work Begins]
    M --> N[Seller submits proof]
    N --> |Work/Supply/Payment/Handover| O[Proof with files + percentage claim]
    O --> P{Buyer reviews}
    P --> |Confirm| Q[Progress bar incremented]
    P --> |Reject| R[Rejection reason required]
    R --> S{Rejected 3+ times?}
    S --> |Yes| T[Auto-flag for admin review]
    S --> |No| U[Seller resubmits]

    Q --> V{Both bars at 100%?}
    V --> |No| M
    V --> |Yes| W[Deal Status: completed]
    W --> X[Commission calculated if applicable]
    X --> Y[Review window opens - 30 days]
    Y --> Z[Both parties can leave reviews]
```

### 7.1 Deal Cancellation

```mermaid
flowchart TD
    A[Party requests cancellation] --> B{Both request simultaneously?}
    B --> |Yes| C[Auto-approve immediately]
    B --> |No| D[Counterparty receives request]
    D --> E{Approve?}
    E --> |Yes| F[Deal: cancelled]
    E --> |No| G[Request rejected, deal continues]

    H[Completed deal] --> I[Cannot cancel - dispute via admin only]
```

---

## 8. Kanban & Project Management Flow (Contractor)

```mermaid
flowchart TD
    A[Deal Workspace > Kanban Tab] --> B{Tier?}
    B --> |Starter| C[No Kanban access]
    B --> |Pro| D[Simple Checklist: add, complete, reorder]
    B --> |Business/Enterprise| E[Full Kanban Board]

    E --> F[Default columns: To Do → In Progress → Review → Done]
    F --> G[Create task card: title, description, assignee, due, priority]
    G --> H[Drag card across columns]
    H --> I{Card moved to Done?}
    I --> |Yes| J[Prompt: Submit Work Proof?]
    I --> |No| K[Continue working]
    J --> L[Work proof linked to milestone]

    M[% of Done cards] --> N[Feeds seller progress bar]

    O[PO view: Read-only Kanban] --> P[Can see all tasks and progress]
```

### 8.1 Daily Site Log

```mermaid
flowchart TD
    A[Deal > Daily Log Tab] --> B[Contractor: Create Entry]
    B --> C[Date, weather, workers count]
    C --> D[Description AR/EN, issues, safety notes]
    D --> E[Upload photos]
    E --> F[Save entry - one per day per deal]
    F --> G[Chronological timeline view]
    G --> H[Both parties can view]
```

---

## 9. Contract Generator Flow

```mermaid
flowchart TD
    A{Entry point?}
    A --> |Standalone| B[Dashboard > Contracts > New]
    A --> |From Deal| C[Deal Workspace > Generate Contract]

    B --> D[Select template: Construction/Supply/Custom]
    C --> E[Auto-fill party info + deal terms]

    D --> F[Fill fields: parties, scope, payment, timeline]
    E --> F
    F --> G[Add clauses from library]
    G --> H[Preview bilingual layout]
    H --> I{Action}
    I --> |Save Draft| J[Status: Draft]
    I --> |Send to counterparty| K[Status: Sent]
    K --> L[Party A signs: name, title, date]
    L --> M[Party B signs: name, title, date]
    M --> N[Status: Signed]
    N --> O[QR code generated]
    O --> P[PDF with signatures + QR]
    P --> Q[Stored in deal Document Vault if linked]

    R[/verify/contract/uuid] --> S[Public verification page]
    S --> T[Shows: exists on platform + signing timestamps]
```

---

## 10. Subscription Management Flow

```mermaid
flowchart TD
    A[Dashboard > Subscription] --> B{Current tier}
    B --> C[View: tier, expires, usage stats]

    C --> D{Action?}
    D --> |Upgrade| E[Select higher tier + duration]
    D --> |Downgrade| F[Select lower tier - takes effect at renewal]
    D --> |Renew| G[Same tier, new duration]
    D --> |Apply Coupon| H[Enter code → validate]

    E --> I[Calculate prorated amount]
    I --> J[Moyasar payment]
    J --> K[Immediate access to new tier]

    F --> L{Over-limit content?}
    L --> |Yes| M[Existing preserved, new creation blocked]
    L --> |No| N[Clean downgrade]

    O[7 days before expiry] --> P[subscription_expiring notification]
    P --> Q[1 day before: second warning]
    Q --> R{Renewed?}
    R --> |Yes| S[Continue with tier]
    R --> |No| T[subscription_expired → Starter limits]
    T --> U{Has unpaid commission?}
    U --> |Yes, 30 days overdue| V[Status: restricted]
    U --> |No| W[Normal Starter access]
```

---

## 11. Commission Payment Flow

```mermaid
flowchart TD
    A[Deal completed] --> B{Commission rate?}
    B --> |0% Business/Enterprise| C[No commission - done]
    B --> |1% or 2%| D[Commission record created]
    D --> E[Calculate: deal_value × rate + 15% VAT]
    E --> F[commission_due notification with 14-day deadline]
    F --> G{Payment method?}
    G --> |Card 3D Secure| H[Moyasar auto-verify → Status: paid]
    G --> |Bank Transfer| I[Upload receipt → Admin verifies]
    I --> J{Verified?}
    J --> |Yes| K[Status: paid]
    J --> |No| L[Reject with reason]

    M[Day 14 unpaid] --> N[commission_overdue notification]
    N --> O[Day 21: second reminder]
    O --> P[Day 28: third reminder]
    P --> Q[Day 30: Account restricted]

    R{Dispute within 7 days?} --> S[Seller raises dispute]
    S --> T[Deadline frozen]
    T --> U[Admin reviews deal]
    U --> V{Resolution}
    V --> |Adjust amount| W[New amount set]
    V --> |Confirm original| X[Original amount stands]
    W --> F
    X --> F

    K --> Y[ZATCA invoice generated - bilingual PDF]
    H --> Y
```

---

## 12. Review Flow

```mermaid
flowchart TD
    A[Deal: completed] --> B[30-day review window opens]
    B --> C[Both parties see Review button]
    C --> D[Submit review]
    D --> E[Overall rating 1-5 stars required]
    E --> F[Optional: Quality, Timeliness, Communication]
    F --> G[Would recommend? Yes/No]
    G --> H[Comments AR + EN manually]
    H --> I[Submit]
    I --> J[review_received notification to reviewee]
    J --> K{Edit within 48h?}
    K --> |Yes| L[Modify review]
    K --> |No| M[Review locked]

    N[DB trigger] --> O[Update reviewee average_rating + total_reviews]

    P[30 days pass] --> Q[Review button removed]
    R[Deal not completed] --> S[Review button not shown]
```

---

## 13. Search & Discovery Flow

```mermaid
flowchart TD
    A[User enters search query] --> B[API route /api/search]
    B --> C{Typesense available?}
    C --> |Yes| D[Query Typesense index]
    C --> |No| E[Fallback: PostgreSQL pg_trgm + to_tsvector]

    D --> F[Results with facets]
    E --> F

    F --> G[Display results with filters]
    G --> H{Filters}
    H --> |Category| I[Faceted filter]
    H --> |Price range| J[Range filter]
    H --> |Rating| K[Rating threshold]
    H --> |City| L[Saudi city filter]
    H --> |Sort| M[Recent / Rated / Price / Bids]

    N[Post published] --> O[DB webhook fires]
    O --> P[/api/webhooks/typesense-sync]
    P --> Q[Upsert document in index]

    R[Post unpublished/rejected] --> S[Remove from index]
```

---

## 14. Admin Moderation Flow

```mermaid
flowchart TD
    A[User submits post/registration] --> B[Status: pending]
    B --> C[Admin notification / queue]

    C --> D[Admin opens moderation queue]
    D --> E{Type?}
    E --> |Post| F[Review content: title, description, images, pricing]
    E --> |Registration| G[Review documents: VAT cert, CR license]
    E --> |Commission| H[Verify amount matches deal value]

    F --> I{Decision}
    I --> |Approve| J[Status: published + Typesense index]
    I --> |Reject| K[Rejection feedback AR/EN]

    G --> L{Decision}
    L --> |Approve| M[User status: active]
    L --> |Reject| N[Rejection feedback → user re-uploads]

    H --> O{Decision}
    O --> |Approve| P[Invoice auto-generated]
    O --> |Reject| Q[Reason provided to seller]

    J --> R[post_approved notification]
    K --> S[post_rejected notification]
    M --> T[document_approved notification]
    N --> U[document_rejected notification]
```

---

## 15. Messaging Flow

```mermaid
flowchart TD
    A{Entry point} --> |From project| B[Conversation linked to project]
    A --> |From product| C[Conversation linked to product]
    A --> |From deal| D[Conversation linked to deal]

    B --> E[Open conversation]
    C --> E
    D --> E

    E --> F[Type message]
    F --> G{Attach file?}
    G --> |Yes| H[Upload max 10MB]
    G --> |No| I[Send message]
    H --> I
    I --> J[Supabase Realtime delivery]
    J --> K[Recipient sees message instantly]
    K --> L[Unread count incremented]

    M[Recipient opens conversation] --> N[Mark as read]
    N --> O[Unread count reset]

    P[Soft delete] --> Q[Hidden for deleting user only]
```

---

## 16. Onboarding Flow (Example: Contractor)

```mermaid
flowchart TD
    A[First login] --> B[Onboarding checklist appears in sidebar]
    B --> C[Step 1: ✅ Email verified - auto-complete]
    C --> D[Step 2: Complete company profile]
    D --> |Click| E[Redirects to /dashboard/profile]
    E --> F[Step 3: Upload verification docs Pro+ only]
    F --> |Click| G[Redirects to document upload]
    G --> H[Step 4: Browse available projects]
    H --> |Click| I[Redirects to /projects]
    I --> J[Step 5: Submit first bid]
    J --> |Click| K[Redirects to project detail]
    K --> L[Step 6: Set up CRM]
    L --> |Click| M[Redirects to /dashboard/crm]
    M --> N[Step 7: Explore contracts]
    N --> |Click| O[Redirects to /dashboard/contracts]

    P[Progress: X/7 shown as badge]
    Q[80% complete → checklist dismissible]
    R[Contextual tooltips on first page visit]
```
