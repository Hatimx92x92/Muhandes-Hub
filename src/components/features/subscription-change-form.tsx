'use client';

import { useState, useRef, useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from '@/hooks/use-locale';
import {
  CreditCard,
  Building,
  Upload,
  FileText,
  Copy,
  Check,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Loader2,
  Tag,
  CalendarDays,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatSAR } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  SUBSCRIPTION_PRICING,
  DURATION_DISCOUNTS,
  VAT_RATE,
} from '@/types';
import type { SubscriptionTier } from '@/types/enums';
import type { ActionResult } from '@/types';
import { upgradeSubscription, downgradeSubscription, renewSubscription, applyCoupon } from '@/actions/subscriptions';

// =============================================================================
// Types
// =============================================================================

export type ChangeMode = 'upgrade' | 'downgrade' | 'renew';

interface SubscriptionChangeFormProps {
  mode: ChangeMode;
  currentTier: string;
  targetTier: string;
  currentExpiresAt: string | null;
  currentStartsAt: string | null;
  currentSubTotal: number;
  currentDurationMonths: number;
}

// =============================================================================
// Helpers
// =============================================================================

const DURATION_OPTIONS = [1, 3, 6, 12] as const;

function calculatePrice(tier: string, months: number) {
  const baseMonthly = SUBSCRIPTION_PRICING[tier as keyof typeof SUBSCRIPTION_PRICING]?.monthly ?? 0;
  const discount = DURATION_DISCOUNTS[months as keyof typeof DURATION_DISCOUNTS] ?? 0;
  const subtotal = baseMonthly * months * (1 - discount);
  const vat = subtotal * VAT_RATE;
  return { baseMonthly, subtotal, vat, total: subtotal + vat, discount };
}

function calculateCredit(expiresAt: string | null, totalPaid: number, durationMonths: number) {
  if (!expiresAt || totalPaid <= 0) return 0;
  const now = new Date();
  const expiry = new Date(expiresAt);
  const remainingMs = Math.max(0, expiry.getTime() - now.getTime());
  const remainingDays = remainingMs / (1000 * 60 * 60 * 24);
  const totalDays = durationMonths * 30;
  const dailyRate = totalPaid / totalDays;
  return Math.round(dailyRate * remainingDays * 100) / 100;
}

function generateReferenceCode(): string {
  return `MQH-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

// =============================================================================
// Component
// =============================================================================

export function SubscriptionChangeForm({
  mode,
  currentTier,
  targetTier,
  currentExpiresAt,
  currentStartsAt,
  currentSubTotal,
  currentDurationMonths,
}: SubscriptionChangeFormProps) {
  const t = useTranslations('dashboard.subscription.change');
  const tp = useTranslations('pricing');
  const tPay = useTranslations('auth.paymentStep');
  const { locale } = useLocale();

  // Form state
  const [duration, setDuration] = useState<number>(1);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank_transfer'>('card');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptError, setReceiptError] = useState('');
  const [copiedField, setCopiedField] = useState('');
  const [referenceCode] = useState(generateReferenceCode);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState<{ type: string; value: number } | null>(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  // Success/redirect state
  const [submitted, setSubmitted] = useState(false);

  // Price calculation
  const tier = mode === 'renew' ? currentTier : targetTier;
  const price = calculatePrice(tier, duration);
  const credit = mode === 'upgrade'
    ? calculateCredit(currentExpiresAt, currentSubTotal, currentDurationMonths)
    : 0;
  const couponAmount = couponDiscount
    ? couponDiscount.type === 'percentage'
      ? price.subtotal * (couponDiscount.value / 100)
      : couponDiscount.value
    : 0;
  const finalTotal = Math.max(0, price.total - credit - couponAmount);

  // Remaining days calculation
  const remainingDays = currentExpiresAt
    ? Math.max(0, Math.ceil((new Date(currentExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  // Action states
  const actionFn = mode === 'upgrade'
    ? upgradeSubscription
    : mode === 'downgrade'
      ? downgradeSubscription
      : renewSubscription;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [state, formAction, isPending] = useActionState<any, FormData>(actionFn as any, null);

  // Handle form submission
  const handleSubmit = (formData: FormData) => {
    if (mode !== 'downgrade' && paymentMethod === 'bank_transfer' && !receiptFile) {
      setReceiptError(tPay('receiptRequired'));
      return;
    }

    // Inject extra fields
    if (mode === 'upgrade') {
      formData.set('new_tier', targetTier);
      formData.set('duration_months', String(duration));
      formData.set('payment_method', paymentMethod);
      if (couponCode) formData.set('coupon_code', couponCode);
    } else if (mode === 'downgrade') {
      formData.set('new_tier', targetTier);
    } else {
      formData.set('duration_months', String(duration));
      formData.set('payment_method', paymentMethod);
      if (couponCode) formData.set('coupon_code', couponCode);
    }
    formData.set('locale', locale);

    // Append receipt file for bank transfer
    if (paymentMethod === 'bank_transfer' && receiptFile) {
      formData.set('bank_receipt', receiptFile);
    }

    formAction(formData);
    setSubmitted(true);
  };

  // Handle redirect on successful card payment
  if (submitted && state?.data?.paymentUrl) {
    window.location.href = state.data.paymentUrl;
    return (
      <div className="flex items-center justify-center gap-3 py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>{t('redirectingToPayment')}</span>
      </div>
    );
  }

  // Handle successful downgrade
  if (submitted && state?.data?.effectiveDate) {
    return (
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-6 text-center space-y-3">
        <Check className="h-10 w-10 text-primary mx-auto" />
        <h3 className="text-lg font-semibold text-foreground">{t('downgradeScheduled')}</h3>
        <p className="text-sm text-muted-foreground">
          {t('downgradeEffectiveDate', {
            date: new Date(state.data.effectiveDate).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-SA'),
          })}
        </p>
      </div>
    );
  }

  // Handle successful bank transfer submission
  if (submitted && state?.data && !state.data.paymentUrl && mode !== 'downgrade' && paymentMethod === 'bank_transfer') {
    return (
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-6 text-center space-y-3">
        <Check className="h-10 w-10 text-primary mx-auto" />
        <h3 className="text-lg font-semibold text-foreground">{t('bankTransferSubmitted')}</h3>
        <p className="text-sm text-muted-foreground">{t('bankTransferPending')}</p>
      </div>
    );
  }

  // Handle free upgrade (credit covers cost)
  if (submitted && state?.data && mode === 'upgrade' && state.data.newTotal === 0) {
    return (
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-6 text-center space-y-3">
        <Check className="h-10 w-10 text-primary mx-auto" />
        <h3 className="text-lg font-semibold text-foreground">{t('upgradeActivated')}</h3>
        <p className="text-sm text-muted-foreground">{t('upgradeActivatedDescription')}</p>
      </div>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 5 * 1024 * 1024;
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];

    if (!allowedTypes.includes(file.type)) {
      setReceiptError(tPay('uploadReceiptHint'));
      return;
    }
    if (file.size > maxSize) {
      setReceiptError(tPay('uploadReceiptHint'));
      return;
    }

    setReceiptError('');
    setReceiptFile(file);
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(''), 2000);
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    setCouponDiscount(null);

    const fd = new FormData();
    fd.set('coupon_code', couponCode.trim());
    fd.set('tier', tier);

    const result = await applyCoupon(null, fd);
    setCouponLoading(false);

    if (result.error) {
      setCouponError(result.error);
    } else if (result.data) {
      setCouponDiscount({ type: result.data.discount_type, value: result.data.discount_value });
    }
  };

  const bankName = process.env.NEXT_PUBLIC_BANK_NAME || 'Al Rajhi Bank';
  const accountName = process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME || 'Muhandes HUB Platform';
  const iban = process.env.NEXT_PUBLIC_BANK_IBAN || 'SA0000000000000000000000';

  const ModeIcon = mode === 'upgrade' ? ArrowUp : mode === 'downgrade' ? ArrowDown : RefreshCw;

  return (
    <form action={handleSubmit} className="space-y-6">
      {/* Mode header */}
      <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-4">
        <div className={cn(
          'flex h-10 w-10 items-center justify-center rounded-full',
          mode === 'upgrade' ? 'bg-primary/10 text-primary' :
            mode === 'downgrade' ? 'bg-accent-orange text-accent-orange-foreground' :
              'bg-info/10 text-info',
        )}>
          <ModeIcon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">
            {mode === 'upgrade'
              ? t('upgradeTitle', { tier: tp(`tiers.${tier}.name`) })
              : mode === 'downgrade'
                ? t('downgradeTitle', { tier: tp(`tiers.${tier}.name`) })
                : t('renewTitle', { tier: tp(`tiers.${tier}.name`) })}
          </h3>
          <p className="text-sm text-muted-foreground">
            {tp(`tiers.${currentTier}.name`)} → {tp(`tiers.${tier}.name`)}
          </p>
        </div>
      </div>

      {/* Current subscription dates & remaining days */}
      {currentExpiresAt && (
        <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            {t('currentSubscription')}
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {currentStartsAt && (
              <div>
                <span className="text-muted-foreground block text-xs">{t('startDate')}</span>
                <span className="font-medium text-foreground">
                  {new Date(currentStartsAt).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-SA', { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
              </div>
            )}
            <div>
              <span className="text-muted-foreground block text-xs">{t('endDate')}</span>
              <span className="font-medium text-foreground">
                {new Date(currentExpiresAt).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-SA', { year: 'numeric', month: 'short', day: 'numeric' })}
              </span>
            </div>
          </div>
          {remainingDays > 0 && (
            <div className="flex items-center justify-between rounded-md bg-background border border-border px-3 py-2 text-sm">
              <span className="text-muted-foreground">{t('remainingDays', { days: remainingDays })}</span>
              <span className={cn(
                'font-bold',
                remainingDays <= 7 ? 'text-destructive' : remainingDays <= 30 ? 'text-accent-orange-foreground' : 'text-primary',
              )}>
                {remainingDays}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Duration selector — not shown for downgrade */}
      {mode !== 'downgrade' && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">{t('selectDuration')}</label>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {DURATION_OPTIONS.map((m) => {
              const d = DURATION_DISCOUNTS[m];
              const isSelected = duration === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setDuration(m)}
                  className={cn(
                    'relative rounded-lg border-2 p-3 text-center transition-colors',
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50',
                  )}
                >
                  <div className="text-lg font-bold text-foreground">{m}</div>
                  <div className="text-xs text-muted-foreground">
                    {m === 1 ? t('month') : t('months')}
                  </div>
                  {d > 0 && (
                    <span className="absolute -top-2 end-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground">
                      {(d * 100).toFixed(0)}% {t('off')}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Price breakdown — not shown for downgrade */}
      {mode !== 'downgrade' && (
        <div className="rounded-lg border border-border bg-card p-4 space-y-2">
          <h4 className="text-sm font-semibold text-foreground">{t('priceBreakdown')}</h4>

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {tp(`tiers.${tier}.name`)} × {duration} {duration === 1 ? t('month') : t('months')}
            </span>
            <span>{formatSAR(price.baseMonthly * duration, locale)}</span>
          </div>

          {price.discount > 0 && (
            <div className="flex justify-between text-sm text-primary">
              <span>{t('durationDiscount')} ({(price.discount * 100).toFixed(0)}%)</span>
              <span>-{formatSAR(price.baseMonthly * duration * price.discount, locale)}</span>
            </div>
          )}

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t('vat')} (15%)</span>
            <span>{formatSAR(price.vat, locale)}</span>
          </div>

          {credit > 0 && (
            <div className="flex justify-between text-sm text-primary">
              <span>{t('prorationCredit')}</span>
              <span>-{formatSAR(credit, locale)}</span>
            </div>
          )}

          {couponAmount > 0 && (
            <div className="flex justify-between text-sm text-primary">
              <span>{t('couponDiscount')}</span>
              <span>-{formatSAR(couponAmount, locale)}</span>
            </div>
          )}

          <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
            <span>{t('totalDue')}</span>
            <span className="text-primary">{formatSAR(finalTotal, locale)}</span>
          </div>
        </div>
      )}

      {/* Coupon code — not shown for downgrade */}
      {mode !== 'downgrade' && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">{t('couponCode')}</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Tag className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={couponCode}
                onChange={(e) => {
                  setCouponCode(e.target.value);
                  if (couponDiscount) { setCouponDiscount(null); setCouponError(''); }
                }}
                placeholder={t('couponPlaceholder')}
                className="w-full rounded-lg border border-border bg-background ps-9 pe-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                disabled={!!couponDiscount}
              />
            </div>
            <Button
              type="button"
              variant={couponDiscount ? 'outline' : 'secondary'}
              size="md"
              onClick={() => {
                if (couponDiscount) {
                  setCouponDiscount(null);
                  setCouponCode('');
                  setCouponError('');
                } else {
                  handleApplyCoupon();
                }
              }}
              disabled={couponLoading || (!couponDiscount && !couponCode.trim())}
              loading={couponLoading}
            >
              {couponDiscount ? '✕' : t('applyCoupon')}
            </Button>
          </div>
          {couponDiscount && (
            <p className="text-xs text-primary flex items-center gap-1">
              <Check className="h-3 w-3" />
              {t('couponApplied', {
                discount: couponDiscount.type === 'percentage'
                  ? `${couponDiscount.value}%`
                  : formatSAR(couponDiscount.value, locale),
              })}
            </p>
          )}
          {couponError && <p className="text-xs text-destructive">{couponError}</p>}
        </div>
      )}

      {/* Payment method selector — not shown for downgrade */}
      {mode !== 'downgrade' && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">{t('paymentMethod')}</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPaymentMethod('card')}
              className={cn(
                'flex items-center gap-3 rounded-lg border-2 p-4 transition-colors',
                paymentMethod === 'card'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50',
              )}
            >
              <CreditCard className="h-5 w-5 text-primary" />
              <div className="text-start">
                <div className="text-sm font-medium">{t('cardPayment')}</div>
                <div className="text-xs text-muted-foreground">{t('cardDescription')}</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('bank_transfer')}
              className={cn(
                'flex items-center gap-3 rounded-lg border-2 p-4 transition-colors',
                paymentMethod === 'bank_transfer'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50',
              )}
            >
              <Building className="h-5 w-5 text-primary" />
              <div className="text-start">
                <div className="text-sm font-medium">{t('bankTransfer')}</div>
                <div className="text-xs text-muted-foreground">{t('bankDescription')}</div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Bank transfer details */}
      {mode !== 'downgrade' && paymentMethod === 'bank_transfer' && (
        <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-5 space-y-4">
          {/* Bank details table */}
          <div className="rounded-lg bg-background border border-border divide-y divide-border text-sm">
            {[
              { label: tPay('bankName'), value: bankName, key: 'bank' },
              { label: tPay('accountName'), value: accountName, key: 'account' },
              { label: tPay('iban'), value: iban, key: 'iban' },
              { label: tPay('referenceCode'), value: referenceCode, key: 'ref' },
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

          <p className="text-xs text-muted-foreground">{tPay('referenceHint')}</p>

          {/* Receipt upload */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">{tPay('uploadReceipt')}</label>
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
                receiptFile
                  ? 'border-primary/50 bg-primary/5 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground',
              )}
            >
              {receiptFile ? (
                <>
                  <FileText className="h-4 w-4" />
                  {receiptFile.name}
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  {tPay('uploadReceipt')}
                </>
              )}
            </button>
            <p className="text-xs text-muted-foreground">{tPay('uploadReceiptHint')}</p>
            {receiptError && <p className="text-xs text-destructive">{receiptError}</p>}
          </div>
        </div>
      )}

      {/* Error message */}
      {state?.error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      {/* Downgrade confirmation info */}
      {mode === 'downgrade' && (
        <div className="rounded-lg border border-accent-orange-foreground/20 bg-accent-orange p-4">
          <p className="text-sm text-accent-orange-foreground">{t('downgradeWarning')}</p>
        </div>
      )}

      {/* Submit */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full"
        loading={isPending}
      >
        {mode === 'upgrade'
          ? t('confirmUpgrade')
          : mode === 'downgrade'
            ? t('confirmDowngrade')
            : t('confirmRenewal')}
      </Button>
    </form>
  );
}
