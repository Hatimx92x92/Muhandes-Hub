'use client';

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { CreditCard, Building, Upload, FileText, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { SUBSCRIPTION_PRICING, DURATION_DISCOUNTS } from '@/types';
import { formatSAR } from '@/lib/utils';
import type { WizardData } from '../register-wizard';
import type { SubscriptionTier } from '@/types/enums';

// =============================================================================
// Step 5: Payment — Card (redirect to Moyasar) or Bank Transfer (IBAN + receipt)
// =============================================================================

interface PaymentStepProps {
  data: WizardData;
  updateData: (partial: Partial<WizardData>) => void;
  submitting: boolean;
  onSubmit: () => void;
  onBack: () => void;
}

function calculatePrice(tier: SubscriptionTier, months: number): number {
  const pricing = SUBSCRIPTION_PRICING[tier as keyof typeof SUBSCRIPTION_PRICING];
  if (!pricing) return 0;
  const discount = DURATION_DISCOUNTS[months as keyof typeof DURATION_DISCOUNTS] ?? 0;
  const monthlyAfterDiscount = pricing.monthly * (1 - discount);
  return monthlyAfterDiscount * months;
}

function generateReferenceCode(): string {
  return `MQH-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

export function PaymentStep({ data, updateData, submitting, onSubmit, onBack }: PaymentStepProps) {
  const t = useTranslations('auth.paymentStep');
  const tp = useTranslations('pricing');
  const tc = useTranslations('common');
  const [receiptError, setReceiptError] = useState('');
  const [copiedField, setCopiedField] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [referenceCode] = useState(generateReferenceCode);

  const totalPrice = calculatePrice(data.tier, data.duration_months);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];

    if (!allowedTypes.includes(file.type)) {
      setReceiptError(t('uploadReceiptHint'));
      return;
    }
    if (file.size > maxSize) {
      setReceiptError(t('uploadReceiptHint'));
      return;
    }

    setReceiptError('');
    updateData({ bank_receipt: file });
  };

  const handleSubmit = () => {
    if (data.payment_method === 'bank_transfer' && !data.bank_receipt) {
      setReceiptError(t('receiptRequired'));
      return;
    }
    onSubmit();
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(''), 2000);
  };

  // Bank details from environment (fallback to placeholders)
  const bankName = process.env.NEXT_PUBLIC_BANK_NAME || 'Al Rajhi Bank';
  const accountName = process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME || 'Muhandes HUB Platform';
  const iban = process.env.NEXT_PUBLIC_BANK_IBAN || 'SA0000000000000000000000';

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-center">{t('title')}</h3>

      {/* Payment summary */}
      <div className="rounded-lg bg-muted/50 p-4 space-y-2">
        <h4 className="text-sm font-medium">{t('summary')}</h4>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t('plan')}</span>
          <span className="font-medium">{tp(`tiers.${data.tier}.name`)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t('duration')}</span>
          <span className="font-medium">{data.duration_months} {t('months')}</span>
        </div>
        <div className="flex justify-between text-sm border-t border-border pt-2">
          <span className="font-medium">{t('total')}</span>
          <span className="font-bold text-primary">{formatSAR(totalPrice)}</span>
        </div>
      </div>

      {/* Card payment */}
      {data.payment_method === 'card' && (
        <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold text-sm">{t('cardTitle')}</h4>
              <p className="text-xs text-muted-foreground">{t('cardDescription')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Bank transfer */}
      {data.payment_method === 'bank_transfer' && (
        <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Building className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold text-sm">{t('bankTitle')}</h4>
              <p className="text-xs text-muted-foreground">{t('bankDescription')}</p>
            </div>
          </div>

          {/* Bank details table */}
          <div className="rounded-lg bg-background border border-border divide-y divide-border text-sm">
            {[
              { label: t('bankName'), value: bankName, key: 'bank' },
              { label: t('accountName'), value: accountName, key: 'account' },
              { label: t('iban'), value: iban, key: 'iban' },
              { label: t('referenceCode'), value: referenceCode, key: 'ref' },
            ].map((row) => (
              <div key={row.key} className="flex items-center justify-between p-3">
                <div>
                  <span className="text-muted-foreground text-xs block">{row.label}</span>
                  <span className="font-medium" dir="ltr">{row.value}</span>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(row.value, row.key)}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1"
                  aria-label={`Copy ${row.label}`}
                >
                  {copiedField === row.key ? (
                    <Check className="h-4 w-4 text-primary" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">{t('referenceHint')}</p>

          {/* Receipt upload */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">{t('uploadReceipt')}</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 text-sm transition-colors',
                data.bank_receipt
                  ? 'border-primary/50 bg-primary/5 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground',
              )}
            >
              {data.bank_receipt ? (
                <>
                  <FileText className="h-4 w-4" />
                  {data.bank_receipt.name}
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  {t('uploadReceipt')}
                </>
              )}
            </button>
            <p className="text-xs text-muted-foreground">{t('uploadReceiptHint')}</p>
            {receiptError && (
              <p className="text-xs text-destructive">{receiptError}</p>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          {tc('back')}
        </Button>
        <Button onClick={handleSubmit} className="flex-1" loading={submitting}>
          {data.payment_method === 'card' ? t('proceedToPayment') : t('submitRegistration')}
        </Button>
      </div>
    </div>
  );
}
