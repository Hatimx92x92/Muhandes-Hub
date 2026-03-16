'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { manageCoupon } from '@/actions/admin/settings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ActionResult } from '@/types';

type State = ActionResult<{ id: string }> | null;

export function CouponForm() {
  const [state, formAction, isPending] = useActionState<State, FormData>(manageCoupon, null);
  const t = useTranslations('features.couponForm');

  return (
    <form action={formAction} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Input name="code" placeholder={t('codePlaceholder')} required />
        <select
          name="discount_type"
          className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
          required
        >
          <option value="percentage">{t('percentage')}</option>
          <option value="fixed">{t('fixedAmount')}</option>
        </select>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Input name="discount_value" type="number" placeholder={t('discountValue')} min={0} step={0.01} required />
        <Input name="max_discount_cap" type="number" placeholder={t('maxDiscountCap')} min={0} step={0.01} />
        <Input name="usage_limit" type="number" placeholder={t('usageLimit')} min={0} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">{t('startDate')}</label>
          <Input name="valid_from" type="date" required />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">{t('endDate')}</label>
          <Input name="valid_to" type="date" required />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Input name="per_user_limit" type="number" placeholder={t('perUserLimit')} min={1} defaultValue={1} />
        <div className="flex items-center gap-2">
          <input type="hidden" name="is_active" value="true" />
          <label className="text-sm text-muted-foreground">{t('activeAfterCreation')}</label>
        </div>
      </div>

      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      {state?.data?.id && (
        <p className="text-sm text-success">{t('savedSuccess')}</p>
      )}

      <Button type="submit" variant="primary" loading={isPending}>
        {t('createCoupon')}
      </Button>
    </form>
  );
}
