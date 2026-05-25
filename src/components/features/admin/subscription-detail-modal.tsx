'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, CreditCard, User, Calendar, FileImage, Tag } from 'lucide-react';
import { formatSAR } from '@/lib/utils';
import { LocaleDate } from '@/components/ui/locale-date';
import { getProxyUrl } from '@/lib/file-utils';
import { Link } from '@/i18n/navigation';
import type { AdminSubscriptionRow } from '@/actions/admin/queries';

const TIER_BADGE: Record<string, 'starter' | 'pro' | 'business' | 'enterprise' | 'secondary'> = {
  starter: 'starter',
  pro: 'pro',
  business: 'business',
  enterprise: 'enterprise',
};

interface SubscriptionDetailModalProps {
  subscription: AdminSubscriptionRow;
  translations: Record<string, string>;
}

export function SubscriptionDetailModal({ subscription: s, translations: t }: SubscriptionDetailModalProps) {
  const status = s.payment_status === 'pending' ? 'pending' : s.is_active ? 'active' : 'expired';

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button variant="ghost" size="sm">
            <Eye className="me-1 h-3.5 w-3.5" />
            {t['viewDetails'] ?? 'View'}
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {t['subscriptionDetail']}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Tier + Status */}
          <div className="flex items-center gap-2">
            <Badge variant={TIER_BADGE[s.tier] ?? 'secondary'} className="text-sm">
              {t[`tier_${s.tier}`] ?? s.tier}
            </Badge>
            <Badge variant={status === 'active' ? 'success' : status === 'pending' ? 'warning' : 'destructive'}>
              {t[`subStatus_${status}`] ?? status}
            </Badge>
          </div>

          {/* Pricing Breakdown */}
          <div className="rounded-lg border border-border p-4 space-y-2">
            <h4 className="text-sm font-semibold">{t['pricingBreakdown']}</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {s.base_price != null && (
                <>
                  <span className="text-muted-foreground">{t['basePrice']}</span>
                  <span className="text-end">{formatSAR(s.base_price)}</span>
                </>
              )}
              {s.duration_months != null && (
                <>
                  <span className="text-muted-foreground">{t['duration']}</span>
                  <span className="text-end">{s.duration_months} {t['months']}</span>
                </>
              )}
              {s.duration_discount != null && s.duration_discount > 0 && (
                <>
                  <span className="text-muted-foreground">{t['durationDiscount']}</span>
                  <span className="text-end text-success">-{formatSAR(s.duration_discount)}</span>
                </>
              )}
              {s.coupon_discount != null && s.coupon_discount > 0 && (
                <>
                  <span className="text-muted-foreground">{t['couponDiscount']}</span>
                  <span className="text-end text-success">-{formatSAR(s.coupon_discount)}</span>
                </>
              )}
              <span className="font-semibold border-t border-border pt-1">{t['finalPrice']}</span>
              <span className="font-bold text-end border-t border-border pt-1">{formatSAR(s.final_price)}</span>
            </div>
          </div>

          {/* Coupon */}
          {s.coupon_code && (
            <div className="flex items-center gap-2 text-sm">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{t['couponUsed']}:</span>
              <Badge variant="outline" className="font-mono">{s.coupon_code}</Badge>
            </div>
          )}

          {/* Payment Info */}
          <div className="rounded-lg border border-border p-4 space-y-2">
            <h4 className="text-sm font-semibold">{t['paymentInfo']}</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">{t['paymentMethod']}</span>
              <span className="text-end">
                {s.payment_method ? (t[`pm_${s.payment_method}`] ?? s.payment_method) : '—'}
              </span>
              <span className="text-muted-foreground">{t['paymentStatus']}</span>
              <span className="text-end">
                {s.payment_status ? (t[`ps_${s.payment_status}`] ?? s.payment_status) : '—'}
              </span>
              {s.moyasar_payment_id && (
                <>
                  <span className="text-muted-foreground">{t['paymentGatewayId']}</span>
                  <span className="text-end font-mono text-xs">{s.moyasar_payment_id}</span>
                </>
              )}
            </div>
            {s.bank_receipt_url && (
              <a
                href={getProxyUrl(s.bank_receipt_url)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2"
              >
                <FileImage className="h-4 w-4" />
                {t['viewReceipt']}
              </a>
            )}
          </div>

          {/* Dates */}
          <div className="rounded-lg border border-border p-4 space-y-2">
            <h4 className="text-sm font-semibold">{t['subscriptionDates']}</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">{t['col_startDate']}</span>
              <span className="text-end">
                <LocaleDate date={s.starts_at} />
              </span>
              <span className="text-muted-foreground">{t['col_expiresDate']}</span>
              <span className="text-end">
                <LocaleDate date={s.expires_at} />
              </span>
              <span className="text-muted-foreground">{t['col_created'] ?? 'Created'}</span>
              <span className="text-end"><LocaleDate date={s.created_at} /></span>
            </div>
          </div>

          {/* User Info */}
          <div className="rounded-lg border border-border p-3 space-y-1">
            <h4 className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <User className="h-3.5 w-3.5" />
              {t['col_user']}
            </h4>
            <p className="text-sm font-medium">{s.user_name ?? s.user_id.slice(0, 8)}</p>
            {s.user_email && <p className="text-xs text-muted-foreground" dir="ltr">{s.user_email}</p>}
            {s.user_role && <Badge variant="secondary" className="text-[10px]">{s.user_role}</Badge>}
            <Link
              href={`/admin/users/${s.user_id}` as '/admin/users/[id]'}
              className="text-xs text-primary hover:underline"
            >
              {t['viewProfile'] ?? 'View Profile'} →
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
