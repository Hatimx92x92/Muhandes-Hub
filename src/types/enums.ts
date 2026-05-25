// =============================================================================
// Muhandes HUB — TypeScript Enums (mirrors DATABASE.sql ENUM types)
// =============================================================================

/** User roles — immutable after registration, one per account */
export const UserRole = {
  PROJECT_OWNER: 'project_owner',
  CONTRACTOR: 'contractor',
  SUPPLIER: 'supplier',
  BUYER: 'buyer',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

/** Profile type — company or personal */
export const ProfileType = {
  COMPANY: 'company',
  PERSONAL: 'personal',
} as const;
export type ProfileType = (typeof ProfileType)[keyof typeof ProfileType];

/** Verification status — registration gate flow */
export const VerificationStatus = {
  PENDING_EMAIL: 'pending_email',
  PENDING_PAYMENT: 'pending_payment',
  PENDING_DOCUMENTS: 'pending_documents',
  PENDING_APPROVAL: 'pending_approval',
  ACTIVE: 'active',
  RESTRICTED: 'restricted',
  BANNED: 'banned',
} as const;
export type VerificationStatus = (typeof VerificationStatus)[keyof typeof VerificationStatus];

/** Subscription tiers */
export const SubscriptionTier = {
  STARTER: 'starter',
  PRO: 'pro',
  BUSINESS: 'business',
  ENTERPRISE: 'enterprise',
} as const;
export type SubscriptionTier = (typeof SubscriptionTier)[keyof typeof SubscriptionTier];

/** Post status workflow: Draft → Pending → Published → ... */
export const PostStatus = {
  DRAFT: 'draft',
  PENDING: 'pending',
  PUBLISHED: 'published',
  REJECTED: 'rejected',
  AWARDED: 'awarded',
  COMPLETED: 'completed',
  EXPIRED: 'expired',
  CLOSED: 'closed',
} as const;
export type PostStatus = (typeof PostStatus)[keyof typeof PostStatus];

/** Deal types */
export const DealType = {
  DEAL_PROJECT: 'deal_project',
  DEAL_PRODUCT: 'deal_product',
} as const;
export type DealType = (typeof DealType)[keyof typeof DealType];

/** Deal status lifecycle */
export const DealStatus = {
  ACTIVE: 'active',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  DISPUTED: 'disputed',
} as const;
export type DealStatus = (typeof DealStatus)[keyof typeof DealStatus];

/** Deal trigger source — what created the deal */
export const DealTriggerSource = {
  BID_AWARD: 'bid_award',
  INQUIRY_QUOTATION: 'inquiry_quotation',
  RFQ_RESPONSE: 'rfq_response',
  DIRECT_HIRE: 'direct_hire',
} as const;
export type DealTriggerSource = (typeof DealTriggerSource)[keyof typeof DealTriggerSource];

/** Proof types for deal milestones */
export const ProofType = {
  PAYMENT: 'payment',
  WORK: 'work',
  SUPPLY: 'supply',
  HANDOVER: 'handover',
} as const;
export type ProofType = (typeof ProofType)[keyof typeof ProofType];

/** Proof status */
export const ProofStatus = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  REJECTED: 'rejected',
  DISPUTED: 'disputed',
} as const;
export type ProofStatus = (typeof ProofStatus)[keyof typeof ProofStatus];

/** Quotation modes */
export const QuotationMode = {
  INQUIRY_RESPONSE: 'inquiry_response',
  STANDALONE: 'standalone',
} as const;
export type QuotationMode = (typeof QuotationMode)[keyof typeof QuotationMode];

/** Quotation status */
export const QuotationStatus = {
  DRAFT: 'draft',
  SENT: 'sent',
  VIEWED: 'viewed',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
} as const;
export type QuotationStatus = (typeof QuotationStatus)[keyof typeof QuotationStatus];

/** Contract status */
export const ContractStatus = {
  DRAFT: 'draft',
  SENT: 'sent',
  SIGNED: 'signed',
  ARCHIVED: 'archived',
} as const;
export type ContractStatus = (typeof ContractStatus)[keyof typeof ContractStatus];

/** Commission status */
export const CommissionStatus = {
  PENDING: 'pending',
  APPROVED: 'approved',
  PAID: 'paid',
  DISPUTED: 'disputed',
  OVERDUE: 'overdue',
} as const;
export type CommissionStatus = (typeof CommissionStatus)[keyof typeof CommissionStatus];

/** Notification types */
export const NotificationType = {
  BID_RECEIVED: 'bid_received',
  BID_AWARDED: 'bid_awarded',
  BID_SHORTLISTED: 'bid_shortlisted',
  BID_REJECTED: 'bid_rejected',
  INQUIRY_RECEIVED: 'inquiry_received',
  QUOTATION_RECEIVED: 'quotation_received',
  QUOTATION_ACCEPTED: 'quotation_accepted',
  DEAL_CREATED: 'deal_created',
  DEAL_STATUS_CHANGED: 'deal_status_changed',
  DEAL_COMPLETED: 'deal_completed',
  PAYMENT_CONFIRMED: 'payment_confirmed',
  COMMISSION_DUE: 'commission_due',
  COMMISSION_OVERDUE: 'commission_overdue',
  REVIEW_RECEIVED: 'review_received',
  SUBSCRIPTION_EXPIRING: 'subscription_expiring',
  SUBSCRIPTION_EXPIRED: 'subscription_expired',
  DOCUMENT_APPROVED: 'document_approved',
  DOCUMENT_REJECTED: 'document_rejected',
  POST_APPROVED: 'post_approved',
  POST_REJECTED: 'post_rejected',
  RFQ_PUBLISHED: 'rfq_published',
  RFQ_RESPONSE_RECEIVED: 'rfq_response_received',
  RFQ_RESPONSE_ACCEPTED: 'rfq_response_accepted',
  RFQ_RESPONSE_REJECTED: 'rfq_response_rejected',
  SUPPLIER_HIRE_REQUEST_RECEIVED: 'supplier_hire_request_received',
  SUPPLIER_HIRE_QUOTATION_RECEIVED: 'supplier_hire_quotation_received',
  DEAL_FLAGGED_REVIEW: 'deal_flagged_review',
  SUBSCRIPTION_UPGRADED: 'subscription_upgraded',
  SUBSCRIPTION_RENEWED: 'subscription_renewed',
  SUBSCRIPTION_PAYMENT_APPROVED: 'subscription_payment_approved',
  SUBSCRIPTION_PAYMENT_REJECTED: 'subscription_payment_rejected',
} as const;
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

/** Kanban priority levels */
export const KanbanPriority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;
export type KanbanPriority = (typeof KanbanPriority)[keyof typeof KanbanPriority];

/** CRM pipeline stages */
export const CrmPipelineStage = {
  LEAD: 'lead',
  IN_NEGOTIATION: 'in_negotiation',
  ACTIVE_DEAL: 'active_deal',
  COMPLETED: 'completed',
  REPEAT: 'repeat',
} as const;
export type CrmPipelineStage = (typeof CrmPipelineStage)[keyof typeof CrmPipelineStage];

/** CRM client source */
export const ClientSource = {
  BID_AWARD: 'bid_award',
  RFQ_RESPONSE: 'rfq_response',
  DIRECT_HIRE: 'direct_hire',
  PRODUCT_INQUIRY: 'product_inquiry',
  MANUAL_ENTRY: 'manual_entry',
} as const;
export type ClientSource = (typeof ClientSource)[keyof typeof ClientSource];

/** Coupon discount type */
export const CouponDiscountType = {
  PERCENTAGE: 'percentage',
  FIXED: 'fixed',
} as const;
export type CouponDiscountType = (typeof CouponDiscountType)[keyof typeof CouponDiscountType];

/** Auth provider */
export const AuthProvider = {
  EMAIL: 'email',
  GOOGLE: 'google',
} as const;
export type AuthProvider = (typeof AuthProvider)[keyof typeof AuthProvider];

/** Payment method */
export const PaymentMethod = {
  CARD: 'card',
  BANK_TRANSFER: 'bank_transfer',
  CHECK: 'check',
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

/** Bid status */
export const BidStatus = {
  PENDING: 'pending',
  SHORTLISTED: 'shortlisted',
  AWARDED: 'awarded',
  REJECTED: 'rejected',
} as const;
export type BidStatus = (typeof BidStatus)[keyof typeof BidStatus];

/** Product inquiry status */
export const InquiryStatus = {
  PENDING: 'pending',
  RESPONDED: 'responded',
  CLOSED: 'closed',
} as const;
export type InquiryStatus = (typeof InquiryStatus)[keyof typeof InquiryStatus];

/** Hire request status */
export const HireRequestStatus = {
  PENDING: 'pending',
  QUOTATION_SENT: 'quotation_sent',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
} as const;
export type HireRequestStatus = (typeof HireRequestStatus)[keyof typeof HireRequestStatus];

/** RFQ response status */
export const RfqResponseStatus = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
} as const;
export type RfqResponseStatus = (typeof RfqResponseStatus)[keyof typeof RfqResponseStatus];

/** Pricing model for products */
export const PricingModel = {
  FIXED: 'fixed',
  VARIANT: 'variant',
} as const;
export type PricingModel = (typeof PricingModel)[keyof typeof PricingModel];

/** Project source */
export const ProjectSource = {
  OWNER: 'owner',
  SUBCONTRACT: 'subcontract',
} as const;
export type ProjectSource = (typeof ProjectSource)[keyof typeof ProjectSource];

/** Project classification tiers */
export const ProjectClassification = {
  A: 'a',
  B: 'b',
  C: 'c',
} as const;
export type ProjectClassification = (typeof ProjectClassification)[keyof typeof ProjectClassification];

/** Document type for verification */
export const DocumentType = {
  VAT_CERTIFICATE: 'vat_certificate',
  COMMERCIAL_LICENSE: 'commercial_license',
} as const;
export type DocumentType = (typeof DocumentType)[keyof typeof DocumentType];

/** Document review status */
export const DocumentReviewStatus = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;
export type DocumentReviewStatus = (typeof DocumentReviewStatus)[keyof typeof DocumentReviewStatus];

/** Payment status */
export const PaymentStatus = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

/** Deal cancellation request status */
export const DealCancelStatus = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;
export type DealCancelStatus = (typeof DealCancelStatus)[keyof typeof DealCancelStatus];

/** Deal skip request status */
export const DealSkipStatus = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;
export type DealSkipStatus = (typeof DealSkipStatus)[keyof typeof DealSkipStatus];

/** Milestone status */
export const MilestoneStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  SKIPPED: 'skipped',
} as const;
export type MilestoneStatus = (typeof MilestoneStatus)[keyof typeof MilestoneStatus];

/** Document vault categories */
export const DocumentCategory = {
  CONTRACTS: 'contracts',
  DRAWINGS: 'drawings',
  SPECS: 'specs',
  PERMITS: 'permits',
  INVOICES: 'invoices',
  CORRESPONDENCE: 'correspondence',
  GENERAL: 'general',
} as const;
export type DocumentCategory = (typeof DocumentCategory)[keyof typeof DocumentCategory];

/** Contract template type */
export const TemplateType = {
  CONSTRUCTION_AGREEMENT: 'construction_agreement',
  SUPPLY_AGREEMENT: 'supply_agreement',
  CUSTOM: 'custom',
} as const;
export type TemplateType = (typeof TemplateType)[keyof typeof TemplateType];

/** Contract clause category */
export const ClauseCategory = {
  WARRANTY: 'warranty',
  PENALTY: 'penalty',
  PAYMENT: 'payment',
  DELIVERY: 'delivery',
  GENERAL: 'general',
} as const;
export type ClauseCategory = (typeof ClauseCategory)[keyof typeof ClauseCategory];
