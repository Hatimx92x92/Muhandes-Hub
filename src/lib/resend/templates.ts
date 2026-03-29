// =============================================================================
// Muhandes HUB — Email Notification Templates
// Sends bilingual emails via Resend for key notification types
// =============================================================================

import { sendEmail } from '@/lib/resend/client';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://muqawilhub.com';

interface EmailNotificationParams {
  to: string;
  type: string;
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
  link?: string;
}

/**
 * Send an email notification for key events.
 * Fire-and-forget — errors are logged but not thrown.
 */
export async function sendNotificationEmail(params: EmailNotificationParams) {
  try {
    await sendEmail({
      to: params.to,
      subject: { ar: params.titleAr, en: params.titleEn },
      heading: { ar: params.titleAr, en: params.titleEn },
      body: { ar: params.bodyAr, en: params.bodyEn },
      ctaText: params.link
        ? { ar: 'عرض التفاصيل', en: 'View Details' }
        : undefined,
      ctaUrl: params.link ? `${APP_URL}${params.link}` : undefined,
    });
  } catch {
    // Silently fail — email is a secondary notification channel
  }
}

// ---------------------------------------------------------------------------
// Pre-built email senders for specific notification types
// ---------------------------------------------------------------------------

export async function emailBidAwarded(to: string, projectTitle: { ar: string; en: string }, dealId: string) {
  await sendNotificationEmail({
    to,
    type: 'bid_awarded',
    titleAr: `تهانينا! تم ترسية عرضك على "${projectTitle.ar}"`,
    titleEn: `Congratulations! Your bid was awarded on "${projectTitle.en}"`,
    bodyAr: 'تم قبول عرضك وإنشاء صفقة جديدة. قم بمراجعة تفاصيل الصفقة لبدء العمل.',
    bodyEn: 'Your bid was accepted and a new deal was created. Review the deal details to start working.',
    link: `/dashboard/deals/${dealId}`,
  });
}

export async function emailDealCompleted(to: string, dealNumber: string, dealId: string) {
  await sendNotificationEmail({
    to,
    type: 'deal_completed',
    titleAr: `تم إكمال الصفقة #${dealNumber}`,
    titleEn: `Deal #${dealNumber} completed`,
    bodyAr: 'تم إكمال الصفقة بنجاح. يمكنك الآن تقييم الطرف الآخر خلال 30 يوم.',
    bodyEn: 'The deal has been completed successfully. You can now review the other party within 30 days.',
    link: `/dashboard/deals/${dealId}`,
  });
}

export async function emailQuotationReceived(to: string, supplierName: string, quotationId: string) {
  await sendNotificationEmail({
    to,
    type: 'quotation_received',
    titleAr: `عرض سعر جديد من ${supplierName}`,
    titleEn: `New quotation from ${supplierName}`,
    bodyAr: 'تم إرسال عرض سعر جديد لك. قم بمراجعته والرد عليه.',
    bodyEn: 'A new quotation has been sent to you. Review and respond to it.',
    link: `/dashboard/quotations/${quotationId}`,
  });
}

export async function emailSubscriptionExpiring(to: string, tier: string, daysLeft: number) {
  await sendNotificationEmail({
    to,
    type: 'subscription_expiring',
    titleAr: `اشتراك ${tier} ينتهي خلال ${daysLeft} يوم`,
    titleEn: `${tier} subscription expires in ${daysLeft} days`,
    bodyAr: 'قم بالتجديد للحفاظ على ميزاتك الحالية وتجنب فقدان الوصول.',
    bodyEn: 'Renew to keep your current features and avoid losing access.',
    link: '/dashboard/subscription',
  });
}

export async function emailCommissionDue(to: string, amount: number, dealNumber: string) {
  await sendNotificationEmail({
    to,
    type: 'commission_due',
    titleAr: `عمولة مستحقة: ${amount} ر.س - الصفقة #${dealNumber}`,
    titleEn: `Commission due: SAR ${amount} - Deal #${dealNumber}`,
    bodyAr: 'يرجى سداد العمولة المستحقة خلال 14 يوم لتجنب تقييد الحساب.',
    bodyEn: 'Please pay the due commission within 14 days to avoid account restrictions.',
    link: '/dashboard/commissions',
  });
}

export async function emailReviewReceived(to: string, reviewerName: string, rating: number) {
  const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
  await sendNotificationEmail({
    to,
    type: 'review_received',
    titleAr: `تقييم جديد من ${reviewerName}: ${stars}`,
    titleEn: `New review from ${reviewerName}: ${stars}`,
    bodyAr: 'تلقيت تقييماً جديداً. قم بمراجعته في لوحة التحكم.',
    bodyEn: 'You received a new review. Check it in your dashboard.',
    link: '/dashboard/reviews',
  });
}

export async function emailFollowUpReminder(to: string, clientName: string, note: string | null, clientPath: string) {
  await sendNotificationEmail({
    to,
    type: 'follow_up_reminder',
    titleAr: `تذكير متابعة: ${clientName}`,
    titleEn: `Follow-up reminder: ${clientName}`,
    bodyAr: note || 'لديك متابعة مجدولة لهذا العميل اليوم.',
    bodyEn: note || 'You have a scheduled follow-up with this client today.',
    link: clientPath,
  });
}
