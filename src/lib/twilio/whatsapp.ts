// =============================================================================
// Muhandes HUB — Twilio WhatsApp Client (Skeleton)
// =============================================================================
// Future integration: Twilio WhatsApp Business API for notifications
// Package required: twilio (not yet installed)
// Env vars required: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM
// =============================================================================

export interface WhatsAppMessage {
  to: string;       // +966XXXXXXXXX format
  body: string;     // Message text (max 1024 chars for template-free)
  templateSid?: string;  // Twilio content template SID for pre-approved messages
  variables?: Record<string, string>; // Template variables
}

export interface WhatsAppResult {
  success: boolean;
  messageSid?: string;
  error?: string;
}

/**
 * Send a WhatsApp message via Twilio.
 * Currently a no-op skeleton — returns success without sending.
 * To activate: `npm install twilio` and set env vars.
 */
export async function sendWhatsApp(msg: WhatsAppMessage): Promise<WhatsAppResult> {
  // Validate Saudi phone format
  if (!/^\+966[0-9]{9}$/.test(msg.to)) {
    return { success: false, error: 'Invalid Saudi phone number format' };
  }

  // --- Skeleton: uncomment when Twilio is installed ---
  // const accountSid = process.env.TWILIO_ACCOUNT_SID;
  // const authToken = process.env.TWILIO_AUTH_TOKEN;
  // const from = process.env.TWILIO_WHATSAPP_FROM; // e.g. 'whatsapp:+14155238886'
  //
  // if (!accountSid || !authToken || !from) {
  //   return { success: false, error: 'Twilio credentials not configured' };
  // }
  //
  // const twilio = require('twilio');
  // const client = twilio(accountSid, authToken);
  //
  // try {
  //   const message = await client.messages.create({
  //     from: `whatsapp:${from}`,
  //     to: `whatsapp:${msg.to}`,
  //     body: msg.body,
  //     ...(msg.templateSid ? { contentSid: msg.templateSid, contentVariables: JSON.stringify(msg.variables ?? {}) } : {}),
  //   });
  //   return { success: true, messageSid: message.sid };
  // } catch (err: unknown) {
  //   const errorMessage = err instanceof Error ? err.message : 'Unknown error';
  //   return { success: false, error: errorMessage };
  // }

  // No-op: return success for development
  console.log(`[WhatsApp Skeleton] Would send to ${msg.to}: ${msg.body.substring(0, 50)}...`);
  return { success: true, messageSid: 'skeleton-no-op' };
}

// ---------------------------------------------------------------------------
// Pre-built notification helpers (ready to use once Twilio is activated)
// ---------------------------------------------------------------------------

export async function notifyWhatsAppBidReceived(
  ownerPhone: string,
  projectTitle: string,
  bidderName: string,
): Promise<WhatsAppResult> {
  return sendWhatsApp({
    to: ownerPhone,
    body: `📋 عرض جديد على مشروعك "${projectTitle}" من ${bidderName}. افتح التطبيق للمراجعة.\n\nNew bid on "${projectTitle}" from ${bidderName}. Open the app to review.`,
  });
}

export async function notifyWhatsAppDealCreated(
  phone: string,
  dealNumber: string,
  partnerName: string,
): Promise<WhatsAppResult> {
  return sendWhatsApp({
    to: phone,
    body: `🤝 صفقة جديدة #${dealNumber} مع ${partnerName}. افتح التطبيق لبدء العمل.\n\nNew deal #${dealNumber} with ${partnerName}. Open the app to start.`,
  });
}

export async function notifyWhatsAppPaymentDue(
  phone: string,
  amount: string,
  dueDate: string,
): Promise<WhatsAppResult> {
  return sendWhatsApp({
    to: phone,
    body: `💰 دفعة مستحقة: ${amount} ر.س بتاريخ ${dueDate}. ادخل التطبيق للدفع.\n\nPayment due: ${amount} SAR on ${dueDate}. Open the app to pay.`,
  });
}

export async function notifyWhatsAppCommissionDue(
  phone: string,
  amount: string,
  dealNumber: string,
): Promise<WhatsAppResult> {
  return sendWhatsApp({
    to: phone,
    body: `📊 عمولة مستحقة: ${amount} ر.س للصفقة #${dealNumber}. ادخل التطبيق للدفع.\n\nCommission due: ${amount} SAR for deal #${dealNumber}. Open the app to pay.`,
  });
}
