// =============================================================================
// Muhandes HUB — Moyasar Payment Gateway Utility (Server-only)
// =============================================================================
// Creates payment sessions via the Moyasar Invoice API.
// Used by subscription and commission server actions.
// Docs: https://docs.moyasar.com/
// =============================================================================

const MOYASAR_API_URL = 'https://api.moyasar.com/v1/invoices';

interface CreatePaymentSessionParams {
  /** Amount in SAR (will be converted to halalas) */
  amount: number;
  /** Description shown on Moyasar payment page */
  description: string;
  /** URL Moyasar redirects to after payment */
  callbackUrl: string;
  /** Metadata attached to the payment — returned in webhook */
  metadata: Record<string, string>;
}

interface MoyasarInvoiceResponse {
  id: string;
  status: string;
  amount: number;
  currency: string;
  url: string;
}

/**
 * Create a Moyasar payment session (Invoice API).
 * Returns the hosted payment page URL for user redirect.
 */
export async function createPaymentSession({
  amount,
  description,
  callbackUrl,
  metadata,
}: CreatePaymentSessionParams): Promise<{ paymentUrl: string; invoiceId: string }> {
  const secretKey = process.env.MOYASAR_SECRET_KEY;
  if (!secretKey) {
    throw new Error('MOYASAR_SECRET_KEY is not configured');
  }

  // Moyasar expects amounts in halalas (1 SAR = 100 halalas)
  const amountInHalalas = Math.round(amount * 100);

  const response = await fetch(MOYASAR_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(secretKey + ':').toString('base64')}`,
    },
    body: JSON.stringify({
      amount: amountInHalalas,
      currency: 'SAR',
      description,
      callback_url: callbackUrl,
      metadata,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Moyasar API error (${response.status}): ${errorBody}`);
  }

  const invoice: MoyasarInvoiceResponse = await response.json();

  return {
    paymentUrl: invoice.url,
    invoiceId: invoice.id,
  };
}
