// =============================================================================
// Muhandes HUB — Email Unsubscribe Endpoint
// One-click unsubscribe for all non-critical notification types.
// Token is HMAC-SHA256(userId, CRON_SECRET|RESEND_API_KEY) generated in client.ts.
// =============================================================================

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyUnsubscribeToken } from '@/lib/resend/client';

export const dynamic = 'force-dynamic';

// All types the user can bulk-unsubscribe from (excludes the 6 critical types)
const UNSUBSCRIBABLE_TYPES = [
  'bid_received',
  'bid_shortlisted',
  'bid_rejected',
  'inquiry_received',
  'quotation_received',
  'quotation_accepted',
  'supplier_hire_quotation_received',
  'deal_status_changed',
  'deal_flagged_review',
  'review_received',
  'subscription_expiring',
  'subscription_expired',
  'subscription_upgraded',
  'subscription_renewed',
  'subscription_payment_approved',
  'subscription_payment_rejected',
  'document_approved',
  'document_rejected',
  'post_approved',
  'post_rejected',
  'rfq_published',
  'rfq_response_received',
  'rfq_response_accepted',
  'rfq_response_rejected',
  'supplier_hire_request_received',
] as const;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const uid = searchParams.get('uid');
  const token = searchParams.get('t');

  if (!uid || !token || !verifyUnsubscribeToken(uid, token)) {
    return new NextResponse(errorHtml(), {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const rows = UNSUBSCRIBABLE_TYPES.map(type => ({
    user_id: uid,
    notification_type: type,
    email_enabled: false,
  }));

  await supabase
    .from('notification_preferences')
    .upsert(rows, { onConflict: 'user_id,notification_type' });

  return new NextResponse(successHtml(), {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

function successHtml(): string {
  return `<!DOCTYPE html>
<html lang="ar">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>إلغاء الاشتراك | Unsubscribed</title>
</head>
<body style="margin:0;padding:40px 16px;background-color:#f4f4f5;font-family:'Segoe UI',Tahoma,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;">
  <div style="background:#ffffff;border-radius:12px;padding:48px 40px;max-width:480px;width:100%;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <div style="width:56px;height:56px;background:#dcfce7;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:24px;">
      <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#16a34a" stroke-width="2.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
      </svg>
    </div>
    <h1 dir="rtl" style="margin:0 0 12px;color:#1e293b;font-size:22px;">تم إلغاء الاشتراك</h1>
    <p dir="rtl" style="margin:0 0 4px;color:#475569;font-size:15px;line-height:1.6;">لن تتلقى بعد الآن رسائل بريد إلكتروني من منصة مهندس.</p>
    <p dir="rtl" style="margin:0 0 24px;color:#64748b;font-size:13px;">ستظل تتلقى الإشعارات الهامة المتعلقة بالصفقات والمدفوعات.</p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:0 0 24px;">
    <h1 style="margin:0 0 12px;color:#1e293b;font-size:22px;">Unsubscribed</h1>
    <p style="margin:0 0 4px;color:#475569;font-size:15px;line-height:1.6;">You will no longer receive marketing emails from Muhandes HUB.</p>
    <p style="margin:0 0 24px;color:#64748b;font-size:13px;">You will still receive critical notifications about deals and payments.</p>
    <p style="margin:0;font-size:13px;color:#94a3b8;">
      <a href="/dashboard/notifications" style="color:#2563eb;text-decoration:none;">إدارة إعدادات الإشعارات | Manage notification settings</a>
    </p>
  </div>
</body>
</html>`;
}

function errorHtml(): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Invalid Link</title></head>
<body style="margin:0;padding:40px;background:#f4f4f5;font-family:'Segoe UI',sans-serif;text-align:center;color:#475569;min-height:100vh;display:flex;align-items:center;justify-content:center;">
  <div>
    <p style="font-size:16px;">رابط إلغاء الاشتراك غير صالح أو منتهي الصلاحية.</p>
    <p style="font-size:16px;">Invalid or expired unsubscribe link.</p>
    <p><a href="/dashboard/notifications" style="color:#2563eb;">إدارة الإشعارات | Manage notifications</a></p>
  </div>
</body>
</html>`;
}
