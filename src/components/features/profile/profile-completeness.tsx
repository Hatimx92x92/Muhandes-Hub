import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { CheckCircle2 } from 'lucide-react';
import type { UserProfile } from '@/hooks/use-auth';

// =============================================================================
// Profile Completeness — progress bar based on filled fields
// =============================================================================

interface ProfileCompletenessProps {
  profile: UserProfile;
  documentsCount: number;
}

const FIELDS = [
  { key: 'full_name', check: (p: UserProfile) => !!p.full_name },
  { key: 'phone', check: (p: UserProfile) => !!p.phone },
  { key: 'city', check: (p: UserProfile) => !!p.city },
  { key: 'bio', check: (p: UserProfile) => !!p.bio_ar || !!p.bio_en },
  { key: 'avatar', check: (p: UserProfile) => !!p.avatar_url },
  { key: 'logo', check: (p: UserProfile) => !!p.logo_url },
  { key: 'website', check: (p: UserProfile) => !!p.website },
  { key: 'cr_number', check: (p: UserProfile) => !!p.cr_number },
  { key: 'documents', check: (_p: UserProfile, docs: number) => docs > 0 },
  { key: 'specializations', check: (p: UserProfile) => !!(p.specializations && p.specializations.length > 0) },
] as const;

export function ProfileCompleteness({ profile, documentsCount }: ProfileCompletenessProps) {
  const t = useTranslations('forms.profile.completeness');

  const completed = FIELDS.filter(f => f.check(profile, documentsCount)).length;
  const total = FIELDS.length;
  const percentage = Math.round((completed / total) * 100);

  const barColor = percentage === 100
    ? 'bg-status-active'
    : percentage >= 60
      ? 'bg-primary'
      : 'bg-status-pending';

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          {percentage === 100 && <CheckCircle2 className="h-4 w-4 text-status-active" />}
          {t('title')}
        </h3>
        <span className={cn(
          'text-sm font-bold',
          percentage === 100 ? 'text-status-active' : 'text-foreground',
        )}>
          {percentage}%
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', barColor)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        {t('description', { completed, total })}
      </p>

      {percentage < 100 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {FIELDS.filter(f => !f.check(profile, documentsCount)).map(f => (
            <span
              key={f.key}
              className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
            >
              {t(`fields.${f.key}` as never)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
