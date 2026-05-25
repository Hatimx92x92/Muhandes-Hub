// =============================================================================
// Muhandes HUB — Email Notification Templates
// Sends bilingual emails via Resend for key notification types
// =============================================================================

import { sendEmail } from '@/lib/resend/client';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://muhandeshub.com';

interface EmailNotificationParams {
  to: string;
  type: string;
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
  link?: string;
  userId?: string;
  preheaderAr?: string;
  preheaderEn?: string;
}

/**
 * Generic notification email — used as fallback for all notification types.
 * Fire-and-forget — errors are logged but not thrown.
 */
export async function sendNotificationEmail(params: EmailNotificationParams) {
  try {
    await sendEmail({
      to: params.to,
      subject: { ar: params.titleAr, en: params.titleEn },
      heading: { ar: params.titleAr, en: params.titleEn },
      body: { ar: params.bodyAr, en: params.bodyEn },
      ctaText: params.link ? { ar: 'عرض التفاصيل', en: 'View Details' } : undefined,
      ctaUrl: params.link ? `${APP_URL}${params.link}` : undefined,
      userId: params.userId,
      preheader: params.preheaderAr && params.preheaderEn
        ? { ar: params.preheaderAr, en: params.preheaderEn }
        : undefined,
    });
  } catch {
    // Silently fail — email is a secondary notification channel
  }
}

// ---------------------------------------------------------------------------
// Rich email senders for specific notification types
// ---------------------------------------------------------------------------

export async function emailBidAwarded(to: string, projectTitle: { ar: string; en: string }, dealId: string, userId?: string) {
  await sendNotificationEmail({
    to,
    userId,
    type: 'bid_awarded',
    titleAr: `تهانينا! تم ترسية عرضك على "${projectTitle.ar}"`,
    titleEn: `Congratulations! Your bid was awarded on "${projectTitle.en}"`,
    preheaderAr: 'تم قبول عرضك وإنشاء صفقة جديدة',
    preheaderEn: 'Your bid was accepted and a new deal has been created',
    bodyAr: 'تم قبول عرضك وإنشاء صفقة جديدة. قم بمراجعة تفاصيل الصفقة لبدء العمل وتأكيد المعالم مع صاحب المشروع.',
    bodyEn: 'Your bid was accepted and a new deal was created. Review the deal details to start working and confirm milestones with the project owner.',
    link: `/dashboard/deals/${dealId}`,
  });
}

export async function emailBidReceived(to: string, projectTitle: { ar: string; en: string }, contractorName: string, bidId: string, userId?: string) {
  await sendNotificationEmail({
    to,
    userId,
    type: 'bid_received',
    titleAr: `عرض جديد على مشروع "${projectTitle.ar}"`,
    titleEn: `New bid on project "${projectTitle.en}"`,
    preheaderAr: `قدّم ${contractorName} عرضاً على مشروعك`,
    preheaderEn: `${contractorName} submitted a bid on your project`,
    bodyAr: `قدّم ${contractorName} عرضاً على مشروعك. راجع العرض وقارنه بالعروض الأخرى قبل اتخاذ قرارك.`,
    bodyEn: `${contractorName} submitted a bid on your project. Review and compare it with other bids before making your decision.`,
    link: `/dashboard/projects/${bidId}`,
  });
}

export async function emailDealCreated(to: string, projectTitle: { ar: string; en: string }, dealId: string, role: 'contractor' | 'owner', userId?: string) {
  const isContractor = role === 'contractor';
  await sendNotificationEmail({
    to,
    userId,
    type: 'deal_created',
    titleAr: `تم إنشاء صفقة جديدة: ${projectTitle.ar}`,
    titleEn: `New deal created: ${projectTitle.en}`,
    preheaderAr: 'صفقتك جاهزة — راجع التفاصيل والمعالم',
    preheaderEn: 'Your deal is ready — review details and milestones',
    bodyAr: isContractor
      ? 'تم قبول عرضك وإنشاء صفقة رسمية. راجع شروط الاتفاقية والمعالم الزمنية وابدأ التواصل مع صاحب المشروع.'
      : 'تم قبول العرض وإنشاء صفقة رسمية مع المقاول. راجع شروط الاتفاقية وتأكد من التزامك بالجدول الزمني.',
    bodyEn: isContractor
      ? 'Your bid was accepted and an official deal has been created. Review the agreement terms and milestones, and start communicating with the project owner.'
      : 'The bid was accepted and an official deal has been created with the contractor. Review the agreement terms and confirm your schedule.',
    link: `/dashboard/deals/${dealId}`,
  });
}

export async function emailDealCompleted(to: string, dealNumber: string, dealId: string, userId?: string) {
  await sendNotificationEmail({
    to,
    userId,
    type: 'deal_completed',
    titleAr: `تم إكمال الصفقة #${dealNumber}`,
    titleEn: `Deal #${dealNumber} completed`,
    preheaderAr: 'قيّم تجربتك وأضف تقييمك خلال 30 يوماً',
    preheaderEn: 'Rate your experience — you have 30 days to leave a review',
    bodyAr: 'تم إكمال الصفقة بنجاح. يمكنك الآن تقييم الطرف الآخر خلال 30 يوماً. تقييماتك تساعد المجتمع على اتخاذ قرارات أفضل.',
    bodyEn: 'The deal has been completed successfully. You can now review the other party within 30 days. Your reviews help the community make better decisions.',
    link: `/dashboard/deals/${dealId}`,
  });
}

export async function emailPaymentConfirmed(to: string, amount: number, dealNumber: string, dealId: string, userId?: string) {
  await sendNotificationEmail({
    to,
    userId,
    type: 'payment_confirmed',
    titleAr: `تم تأكيد الدفعة: ${amount} ر.س - الصفقة #${dealNumber}`,
    titleEn: `Payment confirmed: SAR ${amount} - Deal #${dealNumber}`,
    preheaderAr: `تم استلام دفعة بمبلغ ${amount} ر.س`,
    preheaderEn: `A payment of SAR ${amount} has been received`,
    bodyAr: `تم تأكيد استلام الدفعة بمبلغ ${amount} ر.س للصفقة #${dealNumber}. يمكنك مراجعة سجل المدفوعات الكامل في لوحة التحكم.`,
    bodyEn: `A payment of SAR ${amount} for deal #${dealNumber} has been confirmed. You can review the complete payment history in your dashboard.`,
    link: `/dashboard/deals/${dealId}`,
  });
}

export async function emailCommissionDue(to: string, amount: number, dealNumber: string, userId?: string) {
  await sendNotificationEmail({
    to,
    userId,
    type: 'commission_due',
    titleAr: `عمولة مستحقة: ${amount} ر.س - الصفقة #${dealNumber}`,
    titleEn: `Commission due: SAR ${amount} - Deal #${dealNumber}`,
    preheaderAr: 'يرجى السداد خلال 14 يوماً لتجنب تقييد الحساب',
    preheaderEn: 'Please pay within 14 days to avoid account restrictions',
    bodyAr: `يرجى سداد العمولة المستحقة بمبلغ ${amount} ر.س للصفقة #${dealNumber} خلال 14 يوماً. التأخير في السداد قد يؤدي إلى تقييد الحساب.`,
    bodyEn: `Please pay the due commission of SAR ${amount} for deal #${dealNumber} within 14 days. Late payments may result in account restrictions.`,
    link: '/dashboard/commissions',
  });
}

export async function emailCommissionOverdue(to: string, amount: number, dealNumber: string, daysOverdue: number, userId?: string) {
  await sendNotificationEmail({
    to,
    userId,
    type: 'commission_overdue',
    titleAr: `⚠️ عمولة متأخرة (${daysOverdue} يوم): ${amount} ر.س`,
    titleEn: `⚠️ Overdue commission (${daysOverdue} days): SAR ${amount}`,
    preheaderAr: 'الحساب في خطر التقييد — يرجى التسوية الفورية',
    preheaderEn: 'Account at risk of restriction — immediate settlement required',
    bodyAr: `العمولة المستحقة بمبلغ ${amount} ر.س للصفقة #${dealNumber} متأخرة ${daysOverdue} يوماً. إذا تجاوز التأخير 30 يوماً، سيتم تقييد حسابك. يرجى السداد الفوري.`,
    bodyEn: `The commission of SAR ${amount} for deal #${dealNumber} is ${daysOverdue} days overdue. If the delay exceeds 30 days, your account will be restricted. Please settle immediately.`,
    link: '/dashboard/commissions',
  });
}

export async function emailSubscriptionExpiring(to: string, tier: string, daysLeft: number, userId?: string) {
  await sendNotificationEmail({
    to,
    userId,
    type: 'subscription_expiring',
    titleAr: `اشتراك ${tier} ينتهي خلال ${daysLeft} يوم`,
    titleEn: `${tier} subscription expires in ${daysLeft} days`,
    preheaderAr: `جدّد الآن للحفاظ على ميزاتك`,
    preheaderEn: `Renew now to keep your current features`,
    bodyAr: `اشتراكك في باقة ${tier} سينتهي خلال ${daysLeft} يوم. قم بالتجديد الآن للحفاظ على ميزاتك الحالية وتجنب انقطاع الخدمة.`,
    bodyEn: `Your ${tier} subscription expires in ${daysLeft} days. Renew now to keep your current features and avoid service interruption.`,
    link: '/dashboard/subscription',
  });
}

export async function emailSubscriptionExpired(to: string, tier: string, userId?: string) {
  await sendNotificationEmail({
    to,
    userId,
    type: 'subscription_expired',
    titleAr: `انتهى اشتراكك في باقة ${tier}`,
    titleEn: `Your ${tier} subscription has expired`,
    preheaderAr: 'تم تخفيض حسابك إلى الباقة المجانية',
    preheaderEn: 'Your account has been downgraded to the free plan',
    bodyAr: `انتهت صلاحية اشتراكك في باقة ${tier} وتم تخفيض حسابك إلى الباقة المجانية. جدّد اشتراكك الآن لاستعادة وصولك الكامل.`,
    bodyEn: `Your ${tier} subscription has expired and your account has been downgraded to the free plan. Renew your subscription now to restore full access.`,
    link: '/dashboard/subscription',
  });
}

export async function emailQuotationReceived(to: string, supplierName: string, quotationId: string, userId?: string) {
  await sendNotificationEmail({
    to,
    userId,
    type: 'quotation_received',
    titleAr: `عرض سعر جديد من ${supplierName}`,
    titleEn: `New quotation from ${supplierName}`,
    preheaderAr: 'راجع عرض السعر وابدأ التفاوض',
    preheaderEn: 'Review the quotation and start negotiating',
    bodyAr: `أرسل لك ${supplierName} عرض سعر جديداً. قم بمراجعة التفاصيل والرد في أقرب وقت لضمان التوافر.`,
    bodyEn: `${supplierName} has sent you a new quotation. Review the details and respond promptly to ensure availability.`,
    link: `/dashboard/quotations/${quotationId}`,
  });
}

export async function emailReviewReceived(to: string, reviewerName: string, rating: number, userId?: string) {
  const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
  await sendNotificationEmail({
    to,
    userId,
    type: 'review_received',
    titleAr: `تقييم جديد من ${reviewerName}: ${stars}`,
    titleEn: `New review from ${reviewerName}: ${stars}`,
    preheaderAr: `تلقيت تقييم ${rating} نجوم`,
    preheaderEn: `You received a ${rating}-star review`,
    bodyAr: `تلقيت تقييماً جديداً من ${reviewerName} بتقييم ${rating} نجوم. قم بمراجعة التقييم والرد عليه إن أحببت.`,
    bodyEn: `You received a new ${rating}-star review from ${reviewerName}. Check it in your dashboard and respond if you wish.`,
    link: '/dashboard/reviews',
  });
}

export async function emailFollowUpReminder(to: string, clientName: string, note: string | null, clientPath: string) {
  await sendNotificationEmail({
    to,
    type: 'follow_up_reminder',
    titleAr: `تذكير متابعة: ${clientName}`,
    titleEn: `Follow-up reminder: ${clientName}`,
    preheaderAr: 'لديك متابعة مجدولة اليوم',
    preheaderEn: 'You have a scheduled follow-up today',
    bodyAr: note || 'لديك متابعة مجدولة لهذا العميل اليوم.',
    bodyEn: note || 'You have a scheduled follow-up with this client today.',
    link: clientPath,
  });
}
