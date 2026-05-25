// =============================================================================
// Muhandes HUB — Resend Email Client + Bilingual Template
// =============================================================================

import { Resend } from 'resend';
import { createHmac } from 'crypto';

interface EmailParams {
  to: string;
  subject: { ar: string; en: string };
  heading: { ar: string; en: string };
  body: { ar: string; en: string };
  ctaText?: { ar: string; en: string };
  ctaUrl?: string;
  footer?: { ar: string; en: string };
  preheader?: { ar: string; en: string };
  userId?: string;
}

const FROM_EMAIL = 'Muhandes HUB <noreply@muhandeshub.com>';
const APP_NAME = 'Muhandes HUB | منصة مهندس';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://muhandeshub.com';

let _resend: Resend | null = null;
function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  if (!_resend) _resend = new Resend(apiKey);
  return _resend;
}

// HMAC-signed token used in unsubscribe URLs — verified in /api/unsubscribe
export function generateUnsubscribeToken(userId: string): string {
  const secret = process.env.CRON_SECRET || process.env.RESEND_API_KEY || 'mh-unsub';
  return createHmac('sha256', secret).update(userId).digest('hex');
}

export function verifyUnsubscribeToken(userId: string, token: string): boolean {
  return generateUnsubscribeToken(userId) === token;
}

export async function sendEmail(params: EmailParams): Promise<{ success: boolean; error?: string }> {
  const resend = getResend();
  if (!resend) {
    console.warn('RESEND_API_KEY not configured — email not sent');
    return { success: false, error: 'Email service not configured' };
  }

  const html = buildBilingualTemplate(params);

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: [params.to],
    subject: `${params.subject.ar} | ${params.subject.en}`,
    html,
  });

  if (error) {
    console.error('Resend error:', error);
    return { success: false, error: 'Failed to send email' };
  }

  return { success: true };
}

function buildBilingualTemplate(params: EmailParams): string {
  const { heading, body, ctaText, ctaUrl, footer, preheader, userId } = params;

  const preheaderHtml = preheader
    ? `<span style="display:none;font-size:1px;color:#f8fafc;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtml(preheader.ar)} | ${escapeHtml(preheader.en)}</span>`
    : '';

  const ctaButton = ctaText && ctaUrl
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px auto;">
        <tr>
          <td style="background-color:#2563eb;border-radius:6px;padding:12px 32px;">
            <a href="${escapeHtml(ctaUrl)}" style="color:#ffffff;text-decoration:none;font-weight:600;font-size:16px;">${escapeHtml(ctaText.ar)} | ${escapeHtml(ctaText.en)}</a>
          </td>
        </tr>
      </table>`
    : '';

  const unsubscribeUrl = userId
    ? `${APP_URL}/api/unsubscribe?uid=${encodeURIComponent(userId)}&t=${generateUnsubscribeToken(userId)}`
    : `${APP_URL}/dashboard/notifications`;

  const footerText = footer
    ? `${escapeHtml(footer.ar)} | ${escapeHtml(footer.en)}`
    : `© ${new Date().getFullYear()} ${escapeHtml(APP_NAME)}`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  ${preheaderHtml}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;max-width:600px;">

          <!-- Header -->
          <tr>
            <td style="background-color:#1e293b;padding:24px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:20px;">${escapeHtml(APP_NAME)}</h1>
            </td>
          </tr>

          <!-- Arabic Section (RTL) -->
          <tr>
            <td dir="rtl" style="padding:32px 24px 16px;text-align:right;font-family:'Segoe UI',Tahoma,sans-serif;">
              <h2 style="margin:0 0 16px;color:#1e293b;font-size:20px;">${escapeHtml(heading.ar)}</h2>
              <p style="margin:0;color:#475569;font-size:15px;line-height:1.7;">${escapeHtml(body.ar)}</p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 24px;">
              <hr style="border:none;border-top:1px solid #e2e8f0;margin:0;">
            </td>
          </tr>

          <!-- English Section (LTR) -->
          <tr>
            <td dir="ltr" style="padding:16px 24px 32px;text-align:left;font-family:'Segoe UI',Tahoma,sans-serif;">
              <h2 style="margin:0 0 16px;color:#1e293b;font-size:20px;">${escapeHtml(heading.en)}</h2>
              <p style="margin:0;color:#475569;font-size:15px;line-height:1.7;">${escapeHtml(body.en)}</p>
            </td>
          </tr>

          <!-- CTA Button -->
          ${ctaButton ? `<tr><td style="padding:0 24px 32px;">${ctaButton}</td></tr>` : ''}

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;padding:16px 24px;text-align:center;">
              <p style="margin:0 0 8px;color:#94a3b8;font-size:12px;">${footerText}</p>
              <p style="margin:0;font-size:12px;">
                <a href="${escapeHtml(unsubscribeUrl)}" style="color:#94a3b8;text-decoration:underline;">إلغاء الاشتراك | Unsubscribe</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
