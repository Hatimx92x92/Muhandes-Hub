// =============================================================================
// Muhandes HUB — Notification Trigger Helpers
// Wire all 24 notification types to their triggering events
// Import and call these from server actions after the primary operation.
// =============================================================================

'use server';

import { createNotification } from '@/actions/notifications';

// ---------------------------------------------------------------------------
// BID NOTIFICATIONS
// ---------------------------------------------------------------------------

/** Notify project owner when a new bid is received on their project */
export async function notifyBidReceived(params: {
  ownerId: string;
  projectTitle: { ar: string; en: string };
  bidderName: string;
  projectId: string;
  bidId: string;
}) {
  await createNotification({
    user_id: params.ownerId,
    type: 'bid_received',
    title_ar: `عرض جديد على "${params.projectTitle.ar}"`,
    title_en: `New bid on "${params.projectTitle.en}"`,
    body_ar: `قدّم ${params.bidderName} عرضاً على مشروعك`,
    body_en: `${params.bidderName} submitted a bid on your project`,
    link: `/dashboard/projects/${params.projectId}/bids`,
    entity_type: 'bid',
    entity_id: params.bidId,
  });
}

/** Notify contractor when their bid is awarded */
export async function notifyBidAwarded(params: {
  contractorId: string;
  projectTitle: { ar: string; en: string };
  projectId: string;
  bidId: string;
}) {
  await createNotification({
    user_id: params.contractorId,
    type: 'bid_awarded',
    title_ar: `تم ترسية عرضك على "${params.projectTitle.ar}"`,
    title_en: `Your bid was awarded on "${params.projectTitle.en}"`,
    body_ar: 'تهانينا! تم قبول عرضك وإنشاء صفقة جديدة',
    body_en: 'Congratulations! Your bid was accepted and a new deal was created',
    link: `/dashboard/projects/${params.projectId}`,
    entity_type: 'bid',
    entity_id: params.bidId,
  });
}

/** Notify contractor when their bid is shortlisted */
export async function notifyBidShortlisted(params: {
  contractorId: string;
  projectTitle: { ar: string; en: string };
  projectId: string;
  bidId: string;
}) {
  await createNotification({
    user_id: params.contractorId,
    type: 'bid_shortlisted',
    title_ar: `تم إضافة عرضك للقائمة المختصرة "${params.projectTitle.ar}"`,
    title_en: `Your bid was shortlisted for "${params.projectTitle.en}"`,
    link: `/dashboard/bids`,
    entity_type: 'bid',
    entity_id: params.bidId,
  });
}

/** Notify contractor when their bid is rejected */
export async function notifyBidRejected(params: {
  contractorId: string;
  projectTitle: { ar: string; en: string };
  bidId: string;
}) {
  await createNotification({
    user_id: params.contractorId,
    type: 'bid_rejected',
    title_ar: `لم يتم قبول عرضك على "${params.projectTitle.ar}"`,
    title_en: `Your bid was not accepted for "${params.projectTitle.en}"`,
    link: `/dashboard/bids`,
    entity_type: 'bid',
    entity_id: params.bidId,
  });
}

// ---------------------------------------------------------------------------
// INQUIRY & QUOTATION NOTIFICATIONS
// ---------------------------------------------------------------------------

/** Notify supplier when they receive a product inquiry */
export async function notifyInquiryReceived(params: {
  supplierId: string;
  productTitle: { ar: string; en: string };
  inquirerName: string;
  productId: string;
  inquiryId: string;
}) {
  await createNotification({
    user_id: params.supplierId,
    type: 'inquiry_received',
    title_ar: `استفسار جديد عن "${params.productTitle.ar}"`,
    title_en: `New inquiry about "${params.productTitle.en}"`,
    body_ar: `أرسل ${params.inquirerName} استفساراً عن منتجك`,
    body_en: `${params.inquirerName} sent an inquiry about your product`,
    link: `/dashboard/inquiries`,
    entity_type: 'inquiry',
    entity_id: params.inquiryId,
  });
}

/** Notify buyer when they receive a quotation */
export async function notifyQuotationReceived(params: {
  buyerId: string;
  supplierName: string;
  quotationNumber: string;
  quotationId: string;
}) {
  await createNotification({
    user_id: params.buyerId,
    type: 'quotation_received',
    title_ar: `عرض سعر جديد من ${params.supplierName}`,
    title_en: `New quotation from ${params.supplierName}`,
    body_ar: `رقم عرض السعر: ${params.quotationNumber}`,
    body_en: `Quotation number: ${params.quotationNumber}`,
    link: `/dashboard/quotations/${params.quotationId}`,
    entity_type: 'quotation',
    entity_id: params.quotationId,
  });
}

/** Notify supplier when their quotation is accepted */
export async function notifyQuotationAccepted(params: {
  supplierId: string;
  quotationNumber: string;
  quotationId: string;
}) {
  await createNotification({
    user_id: params.supplierId,
    type: 'quotation_accepted',
    title_ar: `تم قبول عرض السعر ${params.quotationNumber}`,
    title_en: `Quotation ${params.quotationNumber} was accepted`,
    link: `/dashboard/quotations/${params.quotationId}`,
    entity_type: 'quotation',
    entity_id: params.quotationId,
  });
}

// ---------------------------------------------------------------------------
// DEAL NOTIFICATIONS
// ---------------------------------------------------------------------------

/** Notify both parties when a deal is created */
export async function notifyDealCreated(params: {
  userIds: string[];
  dealNumber: string;
  dealId: string;
}) {
  for (const userId of params.userIds) {
    await createNotification({
      user_id: userId,
      type: 'deal_created',
      title_ar: `تم إنشاء صفقة جديدة #${params.dealNumber}`,
      title_en: `New deal created #${params.dealNumber}`,
      link: `/dashboard/deals/${params.dealId}`,
      entity_type: 'deal',
      entity_id: params.dealId,
    });
  }
}

/** Notify when deal status changes */
export async function notifyDealStatusChanged(params: {
  userIds: string[];
  dealNumber: string;
  newStatus: string;
  dealId: string;
}) {
  const statusLabels: Record<string, { ar: string; en: string }> = {
    in_progress: { ar: 'قيد التنفيذ', en: 'In Progress' },
    completed: { ar: 'مكتملة', en: 'Completed' },
    cancelled: { ar: 'ملغاة', en: 'Cancelled' },
    disputed: { ar: 'متنازع عليها', en: 'Disputed' },
  };
  const label = statusLabels[params.newStatus] || { ar: params.newStatus, en: params.newStatus };

  for (const userId of params.userIds) {
    await createNotification({
      user_id: userId,
      type: 'deal_status_changed',
      title_ar: `تغيّرت حالة الصفقة #${params.dealNumber} إلى ${label.ar}`,
      title_en: `Deal #${params.dealNumber} status changed to ${label.en}`,
      link: `/dashboard/deals/${params.dealId}`,
      entity_type: 'deal',
      entity_id: params.dealId,
    });
  }
}

/** Notify when deal is completed */
export async function notifyDealCompleted(params: {
  userIds: string[];
  dealNumber: string;
  dealId: string;
}) {
  for (const userId of params.userIds) {
    await createNotification({
      user_id: userId,
      type: 'deal_completed',
      title_ar: `تم إكمال الصفقة #${params.dealNumber}`,
      title_en: `Deal #${params.dealNumber} completed`,
      body_ar: 'يمكنك الآن تقييم الطرف الآخر',
      body_en: 'You can now review the other party',
      link: `/dashboard/deals/${params.dealId}`,
      entity_type: 'deal',
      entity_id: params.dealId,
    });
  }
}

// ---------------------------------------------------------------------------
// PAYMENT & COMMISSION NOTIFICATIONS
// ---------------------------------------------------------------------------

/** Notify on payment confirmation */
export async function notifyPaymentConfirmed(params: {
  userId: string;
  amount: number;
  paymentId: string;
}) {
  await createNotification({
    user_id: params.userId,
    type: 'payment_confirmed',
    title_ar: `تم تأكيد الدفع - ${params.amount} ر.س`,
    title_en: `Payment confirmed - SAR ${params.amount}`,
    link: `/dashboard/payments`,
    entity_type: 'payment',
    entity_id: params.paymentId,
  });
}

/** Notify seller when commission is due */
export async function notifyCommissionDue(params: {
  sellerId: string;
  amount: number;
  dealNumber: string;
  commissionId: string;
}) {
  await createNotification({
    user_id: params.sellerId,
    type: 'commission_due',
    title_ar: `عمولة مستحقة: ${params.amount} ر.س - الصفقة #${params.dealNumber}`,
    title_en: `Commission due: SAR ${params.amount} - Deal #${params.dealNumber}`,
    link: `/dashboard/commissions`,
    entity_type: 'commission',
    entity_id: params.commissionId,
  });
}

/** Notify seller when commission is overdue */
export async function notifyCommissionOverdue(params: {
  sellerId: string;
  amount: number;
  daysOverdue: number;
  commissionId: string;
}) {
  await createNotification({
    user_id: params.sellerId,
    type: 'commission_overdue',
    title_ar: `عمولة متأخرة: ${params.amount} ر.س (${params.daysOverdue} يوم)`,
    title_en: `Commission overdue: SAR ${params.amount} (${params.daysOverdue} days)`,
    body_ar: params.daysOverdue >= 30 ? 'سيتم تقييد حسابك إذا لم يتم الدفع' : undefined,
    body_en: params.daysOverdue >= 30 ? 'Your account will be restricted if not paid' : undefined,
    link: `/dashboard/commissions`,
    entity_type: 'commission',
    entity_id: params.commissionId,
  });
}

// ---------------------------------------------------------------------------
// REVIEW NOTIFICATIONS
// ---------------------------------------------------------------------------

/** Notify user when they receive a review */
export async function notifyReviewReceived(params: {
  userId: string;
  reviewerName: string;
  rating: number;
  dealId: string;
  reviewId: string;
}) {
  const stars = '★'.repeat(params.rating) + '☆'.repeat(5 - params.rating);
  await createNotification({
    user_id: params.userId,
    type: 'review_received',
    title_ar: `تقييم جديد من ${params.reviewerName}: ${stars}`,
    title_en: `New review from ${params.reviewerName}: ${stars}`,
    link: `/dashboard/reviews`,
    entity_type: 'review',
    entity_id: params.reviewId,
  });
}

// ---------------------------------------------------------------------------
// SUBSCRIPTION NOTIFICATIONS
// ---------------------------------------------------------------------------

/** Notify user about upcoming subscription expiry */
export async function notifySubscriptionExpiring(params: {
  userId: string;
  daysLeft: number;
  tier: string;
}) {
  await createNotification({
    user_id: params.userId,
    type: 'subscription_expiring',
    title_ar: `اشتراك ${params.tier} ينتهي خلال ${params.daysLeft} يوم`,
    title_en: `${params.tier} subscription expires in ${params.daysLeft} days`,
    body_ar: 'قم بالتجديد للحفاظ على ميزاتك',
    body_en: 'Renew to keep your features',
    link: `/dashboard/subscription`,
  });
}

/** Notify user when subscription expires */
export async function notifySubscriptionExpired(params: {
  userId: string;
  tier: string;
}) {
  await createNotification({
    user_id: params.userId,
    type: 'subscription_expired',
    title_ar: `انتهى اشتراك ${params.tier}`,
    title_en: `${params.tier} subscription expired`,
    body_ar: 'تم تحويلك إلى الباقة المجانية',
    body_en: 'You have been downgraded to the Starter plan',
    link: `/dashboard/subscription`,
  });
}

// ---------------------------------------------------------------------------
// DOCUMENT VERIFICATION NOTIFICATIONS
// ---------------------------------------------------------------------------

/** Notify user when their document is approved */
export async function notifyDocumentApproved(params: {
  userId: string;
  documentType: string;
}) {
  await createNotification({
    user_id: params.userId,
    type: 'document_approved',
    title_ar: `تم اعتماد المستند: ${params.documentType}`,
    title_en: `Document approved: ${params.documentType}`,
    link: `/dashboard/settings`,
  });
}

/** Notify user when their document is rejected */
export async function notifyDocumentRejected(params: {
  userId: string;
  documentType: string;
  reason?: string;
}) {
  await createNotification({
    user_id: params.userId,
    type: 'document_rejected',
    title_ar: `تم رفض المستند: ${params.documentType}`,
    title_en: `Document rejected: ${params.documentType}`,
    body_ar: params.reason,
    body_en: params.reason,
    link: `/dashboard/settings`,
  });
}

// ---------------------------------------------------------------------------
// POST MODERATION NOTIFICATIONS
// ---------------------------------------------------------------------------

/** Notify post owner when their post is approved */
export async function notifyPostApproved(params: {
  userId: string;
  postTitle: { ar: string; en: string };
  postType: 'project' | 'product' | 'rfq';
  postId: string;
}) {
  const typeLabels = {
    project: { ar: 'المشروع', en: 'Project' },
    product: { ar: 'المنتج', en: 'Product' },
    rfq: { ar: 'طلب عروض الأسعار', en: 'RFQ' },
  };
  const label = typeLabels[params.postType];

  await createNotification({
    user_id: params.userId,
    type: 'post_approved',
    title_ar: `تم نشر ${label.ar} "${params.postTitle.ar}"`,
    title_en: `${label.en} "${params.postTitle.en}" published`,
    link: `/dashboard/${params.postType}s/${params.postId}`,
    entity_type: params.postType,
    entity_id: params.postId,
  });
}

/** Notify post owner when their post is rejected */
export async function notifyPostRejected(params: {
  userId: string;
  postTitle: { ar: string; en: string };
  postType: 'project' | 'product' | 'rfq';
  postId: string;
  reason?: string;
}) {
  const typeLabels = {
    project: { ar: 'المشروع', en: 'Project' },
    product: { ar: 'المنتج', en: 'Product' },
    rfq: { ar: 'طلب عروض الأسعار', en: 'RFQ' },
  };
  const label = typeLabels[params.postType];

  await createNotification({
    user_id: params.userId,
    type: 'post_rejected',
    title_ar: `تم رفض ${label.ar} "${params.postTitle.ar}"`,
    title_en: `${label.en} "${params.postTitle.en}" rejected`,
    body_ar: params.reason,
    body_en: params.reason,
    link: `/dashboard/${params.postType}s/${params.postId}`,
    entity_type: params.postType,
    entity_id: params.postId,
  });
}

// ---------------------------------------------------------------------------
// RFQ NOTIFICATIONS
// ---------------------------------------------------------------------------

/** Notify relevant suppliers when a new RFQ is published */
export async function notifyRfqPublished(params: {
  supplierIds: string[];
  rfqTitle: { ar: string; en: string };
  rfqId: string;
}) {
  for (const supplierId of params.supplierIds) {
    await createNotification({
      user_id: supplierId,
      type: 'rfq_published',
      title_ar: `طلب عروض أسعار جديد: "${params.rfqTitle.ar}"`,
      title_en: `New RFQ: "${params.rfqTitle.en}"`,
      link: `/rfqs/${params.rfqId}`,
      entity_type: 'rfq',
      entity_id: params.rfqId,
    });
  }
}

/** Notify RFQ owner when a response is received */
export async function notifyRfqResponseReceived(params: {
  ownerId: string;
  rfqTitle: { ar: string; en: string };
  responderName: string;
  rfqId: string;
  responseId: string;
}) {
  await createNotification({
    user_id: params.ownerId,
    type: 'rfq_response_received',
    title_ar: `رد جديد على طلب عروض الأسعار "${params.rfqTitle.ar}"`,
    title_en: `New response on RFQ "${params.rfqTitle.en}"`,
    body_ar: `من ${params.responderName}`,
    body_en: `From ${params.responderName}`,
    link: `/dashboard/rfqs/${params.rfqId}/responses`,
    entity_type: 'rfq_response',
    entity_id: params.responseId,
  });
}

/** Notify supplier when their RFQ response is accepted */
export async function notifyRfqResponseAccepted(params: {
  supplierId: string;
  rfqTitle: { ar: string; en: string };
  rfqId: string;
  responseId: string;
}) {
  await createNotification({
    user_id: params.supplierId,
    type: 'rfq_response_accepted',
    title_ar: `تم قبول ردك على "${params.rfqTitle.ar}"`,
    title_en: `Your response on "${params.rfqTitle.en}" was accepted`,
    link: `/dashboard/rfqs/${params.rfqId}`,
    entity_type: 'rfq_response',
    entity_id: params.responseId,
  });
}

/** Notify supplier when their RFQ response is rejected */
export async function notifyRfqResponseRejected(params: {
  supplierId: string;
  rfqTitle: { ar: string; en: string };
  responseId: string;
}) {
  await createNotification({
    user_id: params.supplierId,
    type: 'rfq_response_rejected',
    title_ar: `لم يتم قبول ردك على "${params.rfqTitle.ar}"`,
    title_en: `Your response on "${params.rfqTitle.en}" was not accepted`,
    link: `/dashboard/rfqs`,
    entity_type: 'rfq_response',
    entity_id: params.responseId,
  });
}

// ---------------------------------------------------------------------------
// SUPPLIER HIRE NOTIFICATIONS
// ---------------------------------------------------------------------------

/** Notify supplier when they receive a quote invitation */
export async function notifySupplierHireRequestReceived(params: {
  supplierId: string;
  requesterName: string;
  requestId: string;
}) {
  await createNotification({
    user_id: params.supplierId,
    type: 'supplier_hire_request_received',
    title_ar: `دعوة لتقديم عرض سعر من ${params.requesterName}`,
    title_en: `Quote invitation from ${params.requesterName}`,
    link: `/dashboard/invitations`,
    entity_type: 'hire_request',
    entity_id: params.requestId,
  });
}

/** Notify requester when supplier sends quotation for invitation */
export async function notifySupplierHireQuotationReceived(params: {
  requesterId: string;
  supplierName: string;
  quotationId: string;
}) {
  await createNotification({
    user_id: params.requesterId,
    type: 'supplier_hire_quotation_received',
    title_ar: `عرض سعر من ${params.supplierName} استجابة لدعوتك`,
    title_en: `Quotation from ${params.supplierName} in response to your invitation`,
    link: `/dashboard/quotations/${params.quotationId}`,
    entity_type: 'quotation',
    entity_id: params.quotationId,
  });
}

// ---------------------------------------------------------------------------
// DEAL FLAGGED REVIEW
// ---------------------------------------------------------------------------

export async function notifyDealFlaggedForReview(params: {
  adminIds: string[];
  dealNumber: string;
  dealId: string;
  reason: string;
}) {
  for (const adminId of params.adminIds) {
    await createNotification({
      user_id: adminId,
      type: 'deal_flagged_review',
      title_ar: `صفقة تحتاج مراجعة #${params.dealNumber}`,
      title_en: `Deal needs review #${params.dealNumber}`,
      body_ar: params.reason,
      body_en: params.reason,
      link: `/admin/deals/${params.dealId}`,
      entity_type: 'deal',
      entity_id: params.dealId,
    });
  }
}

// ---------------------------------------------------------------------------
// DEAL CANCELLATION REQUEST NOTIFICATIONS
// ---------------------------------------------------------------------------

/** Notify counterparty that a cancellation was requested */
export async function notifyCancellationRequested(params: {
  counterpartyId: string;
  dealNumber: string;
  dealId: string;
  reason: string;
}) {
  await createNotification({
    user_id: params.counterpartyId,
    type: 'deal_status_changed',
    title_ar: `طلب إلغاء الصفقة #${params.dealNumber}`,
    title_en: `Cancellation requested for deal #${params.dealNumber}`,
    body_ar: params.reason,
    body_en: params.reason,
    link: `/dashboard/deals/${params.dealId}`,
    entity_type: 'deal',
    entity_id: params.dealId,
  });
}

/** Notify parties when a cancellation request is approved or rejected */
export async function notifyCancellationResolved(params: {
  userIds: string[];
  dealNumber: string;
  dealId: string;
  outcome: 'approved' | 'rejected';
}) {
  const titles = {
    approved: {
      ar: `تم إلغاء الصفقة #${params.dealNumber}`,
      en: `Deal #${params.dealNumber} has been cancelled`,
    },
    rejected: {
      ar: `تم رفض طلب إلغاء الصفقة #${params.dealNumber}`,
      en: `Cancellation request for deal #${params.dealNumber} was rejected`,
    },
  };
  const label = titles[params.outcome];

  for (const userId of params.userIds) {
    await createNotification({
      user_id: userId,
      type: 'deal_status_changed',
      title_ar: label.ar,
      title_en: label.en,
      link: `/dashboard/deals/${params.dealId}`,
      entity_type: 'deal',
      entity_id: params.dealId,
    });
  }
}

// ---------------------------------------------------------------------------
// DEAL SKIP MILESTONE NOTIFICATIONS
// ---------------------------------------------------------------------------

/** Notify counterparty that a skip milestone was requested */
export async function notifySkipMilestoneRequested(params: {
  counterpartyId: string;
  dealNumber: string;
  dealId: string;
  milestoneTitle: { ar: string; en: string };
}) {
  await createNotification({
    user_id: params.counterpartyId,
    type: 'deal_status_changed',
    title_ar: `طلب تخطي مرحلة "${params.milestoneTitle.ar}" في الصفقة #${params.dealNumber}`,
    title_en: `Skip requested for milestone "${params.milestoneTitle.en}" in deal #${params.dealNumber}`,
    link: `/dashboard/deals/${params.dealId}?tab=milestones`,
    entity_type: 'deal',
    entity_id: params.dealId,
  });
}

/** Notify requester when a skip milestone request is approved or rejected */
export async function notifySkipMilestoneResolved(params: {
  requesterId: string;
  dealNumber: string;
  dealId: string;
  outcome: 'approved' | 'rejected';
}) {
  const titles = {
    approved: {
      ar: `تمت الموافقة على تخطي المرحلة في الصفقة #${params.dealNumber}`,
      en: `Skip milestone approved for deal #${params.dealNumber}`,
    },
    rejected: {
      ar: `تم رفض طلب تخطي المرحلة في الصفقة #${params.dealNumber}`,
      en: `Skip milestone rejected for deal #${params.dealNumber}`,
    },
  };
  const label = titles[params.outcome];

  await createNotification({
    user_id: params.requesterId,
    type: 'deal_status_changed',
    title_ar: label.ar,
    title_en: label.en,
    link: `/dashboard/deals/${params.dealId}?tab=milestones`,
    entity_type: 'deal',
    entity_id: params.dealId,
  });
}

// ---------------------------------------------------------------------------
// SUBSCRIPTION NOTIFICATIONS
// ---------------------------------------------------------------------------

/** Notify user when their subscription is upgraded */
export async function notifySubscriptionUpgraded(params: {
  userId: string;
  newTier: string;
}) {
  await createNotification({
    user_id: params.userId,
    type: 'subscription_upgraded',
    title_ar: `تمت ترقية اشتراكك إلى ${params.newTier}`,
    title_en: `Your subscription has been upgraded to ${params.newTier}`,
    body_ar: 'يمكنك الآن الاستفادة من المزايا الجديدة',
    body_en: 'You can now enjoy the new features',
    link: '/dashboard/subscription',
    entity_type: 'subscription',
  });
}

/** Notify user when their subscription is renewed */
export async function notifySubscriptionRenewed(params: {
  userId: string;
  tier: string;
}) {
  await createNotification({
    user_id: params.userId,
    type: 'subscription_renewed',
    title_ar: `تم تجديد اشتراكك في باقة ${params.tier}`,
    title_en: `Your ${params.tier} subscription has been renewed`,
    body_ar: 'اشتراكك نشط وجاهز للاستخدام',
    body_en: 'Your subscription is active and ready to use',
    link: '/dashboard/subscription',
    entity_type: 'subscription',
  });
}

/** Notify user when their bank transfer payment is approved by admin */
export async function notifySubscriptionPaymentApproved(params: {
  userId: string;
  tier: string;
}) {
  await createNotification({
    user_id: params.userId,
    type: 'subscription_payment_approved',
    title_ar: `تمت الموافقة على دفعتك لباقة ${params.tier}`,
    title_en: `Your payment for ${params.tier} plan has been approved`,
    body_ar: 'تم تفعيل اشتراكك بنجاح',
    body_en: 'Your subscription has been activated successfully',
    link: '/dashboard/subscription',
    entity_type: 'subscription',
  });
}
