'use client';

import { cn } from '@/lib/utils';
import { Building2, HardHat, Package, ShoppingCart } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import type { WizardData } from '../register-wizard';
import { RegisterStep1Schema } from '@/schemas/auth';
import { useState } from 'react';

// =============================================================================
// Step 1: Role Selection — 4 visual cards
// =============================================================================

const ROLES = [
  { value: 'project_owner' as const, key: 'projectOwner', icon: Building2 },
  { value: 'contractor' as const, key: 'contractor', icon: HardHat },
  { value: 'supplier' as const, key: 'supplier', icon: Package },
  { value: 'buyer' as const, key: 'buyer', icon: ShoppingCart },
] as const;

interface RoleStepProps {
  data: WizardData;
  updateData: (partial: Partial<WizardData>) => void;
  onNext: () => void;
}

export function RoleStep({ data, updateData, onNext }: RoleStepProps) {
  const [error, setError] = useState('');
  const t = useTranslations('auth.roleStep');
  const tc = useTranslations('common');

  const handleNext = () => {
    const result = RegisterStep1Schema.safeParse({ role: data.role });
    if (!result.success) {
      setError(t('validation'));
      return;
    }
    setError('');
    onNext();
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-center">{t('title')}</h3>
      <p className="text-sm text-muted-foreground text-center">
        {t('subtitle')}
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {ROLES.map((role) => {
          const Icon = role.icon;
          const isSelected = data.role === role.value;

          return (
            <button
              key={role.value}
              type="button"
              onClick={() => {
                updateData({ role: role.value });
                setError('');
              }}
              className={cn(
                'flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all',
                'hover:border-primary/50 hover:bg-primary/5',
                isSelected
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border bg-background',
              )}
            >
              <div
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-full',
                  isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                )}
              >
                <Icon className="h-6 w-6" />
              </div>
              <span className="font-medium text-foreground">{t(`${role.key}.title`)}</span>
              <span className="text-xs text-muted-foreground">{t(`${role.key}.desc`)}</span>
            </button>
          );
        })}
      </div>

      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}

      <Button onClick={handleNext} className="w-full" disabled={!data.role}>
        {tc('next')}
      </Button>
    </div>
  );
}
