// =============================================================================
// Muqawil HUB — Resend Email Client + Bilingual Template
// =============================================================================

interface EmailParams {
  to: string;
  subject: { ar: string; en: string };
  heading: { ar: string; en: string };
  body: { ar: string; en: string };
  ctaText?: { ar: string; en: string };
  ctaUrl?: string;
  footer?: { ar: string; en: string };
}

const FROM_EMAIL = 'Muqawil HUB <noreply@muqawilhub.com>';
const APP_NAME = 'Muqawil HUB | مقاول هب';

/**
 * Send a bilingual email via Resend.
 * The email contains both Arabic and English sections.
 */
export async function sendEmail(params: EmailParams): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('RESEND_API_KEY not configured — email not sent');
    return { success: false, error: 'Email service not configured' };
  }

  const html = buildBilingualTemplate(params);

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [params.to],
        subject: `${params.subject.ar} | ${params.subject.en}`,
        html,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Resend error:', err);
      return { success: false, error: 'Failed to send email' };
    }

    return { success: true };
  } catch (err) {
    console.error('Email send error:', err);
    return { success: false, error: 'Failed to send email' };
  }
}

/**
 * Build a bilingual HTML email template.
 * Arabic section (RTL) on top, English section (LTR) below.
 */
function buildBilingualTemplate(params: EmailParams): string {
  const { heading, body, ctaText, ctaUrl, footer } = params;

  const ctaButton = ctaText && ctaUrl
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px auto;">
        <tr>
          <td style="background-color:#2563eb;border-radius:6px;padding:12px 32px;">
            <a href="${escapeHtml(ctaUrl)}" style="color:#ffffff;text-decoration:none;font-weight:600;font-size:16px;">${escapeHtml(ctaText.ar)} | ${escapeHtml(ctaText.en)}</a>
          </td>
        </tr>
      </table>`
    : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
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
              <p style="margin:0;color:#94a3b8;font-size:12px;">
                ${footer ? `${escapeHtml(footer.ar)} | ${escapeHtml(footer.en)}` : `© ${new Date().getFullYear()} ${escapeHtml(APP_NAME)}`}
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
