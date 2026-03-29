// =============================================================================
// Product Inquiry Button — opens inline form for product quote request
// =============================================================================

'use client';

import { useState, useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertBanner } from '@/components/ui/alert-banner';
import { sendProductInquiry } from '@/actions/inquiries';
import { ShoppingCart, X, Send } from 'lucide-react';

interface Props {
  productId: string;
  isOwnProduct?: boolean;
}

export function ProductInquiryButton({ productId, isOwnProduct }: Props) {
  const [showForm, setShowForm] = useState(false);
  const t = useTranslations('features.productInquiry');
  const [state, formAction, isPending] = useActionState(sendProductInquiry, null);

  if (isOwnProduct) return null;

  if (state?.data) {
    return (
      <AlertBanner variant="success" className="text-center">
        {t('inquirySent')}
      </AlertBanner>
    );
  }

  if (!showForm) {
    return (
      <Button className="w-full" onClick={() => setShowForm(true)}>
        <ShoppingCart className="me-2 h-4 w-4" />
        {t('requestQuote')}
      </Button>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="product_id" value={productId} />

      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{t('requestQuote')}</span>
        <button type="button" onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div>
        <label className="text-xs text-muted-foreground">{t('quantity')}</label>
        <Input name="quantity" type="number" min={1} placeholder="100" />
      </div>

      <div>
        <label className="text-xs text-muted-foreground">{t('messageAr')}</label>
        <textarea
          name="message_ar"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          rows={2}
          placeholder={t('messagePlaceholderAr')}
          required
          minLength={10}
        />
      </div>

      <div>
        <label className="text-xs text-muted-foreground">{t('messageEn')}</label>
        <textarea
          name="message_en"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          rows={2}
          placeholder={t('messagePlaceholderEn')}
        />
      </div>

      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <Button type="submit" className="w-full" disabled={isPending}>
        <Send className="me-2 h-4 w-4" />
        {isPending ? t('sending') : t('submit')}
      </Button>
    </form>
  );
}
