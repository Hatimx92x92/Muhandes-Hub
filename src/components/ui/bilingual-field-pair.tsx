'use client';

// =============================================================================
// Muhandes HUB — BilingualFieldPair
// Renders AR + EN inputs side-by-side with auto-translate wiring
// =============================================================================

import { useRef, useEffect, useCallback } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useAutoTranslate } from '@/hooks/use-auto-translate';

interface BilingualFieldPairProps {
  /** Base field name — generates `{baseName}_ar` and `{baseName}_en` */
  baseName: string;
  /** Input type */
  type?: 'input' | 'textarea';
  /** Rows for textarea */
  rows?: number;
  /** Label for the Arabic field */
  labelAr: string;
  /** Label for the English field */
  labelEn: string;
  /** Default value for Arabic field */
  defaultValueAr?: string;
  /** Default value for English field */
  defaultValueEn?: string;
  /** Validation error for Arabic field */
  errorAr?: string;
  /** Validation error for English field */
  errorEn?: string;
  /** Placeholder for Arabic field */
  placeholderAr?: string;
  /** Placeholder for English field */
  placeholderEn?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Controlled mode: onChange callback for Arabic field */
  onChangeAr?: (value: string) => void;
  /** Controlled mode: onChange callback for English field */
  onChangeEn?: (value: string) => void;
  /** Controlled mode: value for Arabic field */
  valueAr?: string;
  /** Controlled mode: value for English field */
  valueEn?: string;
}

export function BilingualFieldPair({
  baseName,
  type = 'input',
  rows = 4,
  labelAr,
  labelEn,
  defaultValueAr,
  defaultValueEn,
  errorAr,
  errorEn,
  placeholderAr,
  placeholderEn,
  required,
  onChangeAr,
  onChangeEn,
  valueAr,
  valueEn,
}: BilingualFieldPairProps) {
  const locale = useLocale() as 'ar' | 'en';
  const t = useTranslations('common');
  const isControlled = valueAr !== undefined || valueEn !== undefined;

  const arRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const enRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Determine source → target based on user's locale
  const sourceIsAr = locale === 'ar';

  const arToEn = useAutoTranslate({ from: 'ar', to: 'en' });
  const enToAr = useAutoTranslate({ from: 'en', to: 'ar' });

  // Apply auto-translated text to the target field
  useEffect(() => {
    if (arToEn.translatedText && enRef.current) {
      enRef.current.value = arToEn.translatedText;
      if (isControlled && onChangeEn) onChangeEn(arToEn.translatedText);
    }
  }, [arToEn.translatedText, isControlled, onChangeEn]);

  useEffect(() => {
    if (enToAr.translatedText && arRef.current) {
      arRef.current.value = enToAr.translatedText;
      if (isControlled && onChangeAr) onChangeAr(enToAr.translatedText);
    }
  }, [enToAr.translatedText, isControlled, onChangeAr]);

  const handleArChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const val = e.target.value;
      if (onChangeAr) onChangeAr(val);
      arToEn.onSourceChange(val);
    },
    [onChangeAr, arToEn],
  );

  const handleEnChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const val = e.target.value;
      if (onChangeEn) onChangeEn(val);
      enToAr.onSourceChange(val);
    },
    [onChangeEn, enToAr],
  );

  const handleArManualEdit = useCallback(() => {
    // User is manually editing the AR field while it was auto-translated from EN
    if (enToAr.isAutoTranslated) {
      enToAr.onTargetManualEdit();
    }
  }, [enToAr]);

  const handleEnManualEdit = useCallback(() => {
    // User is manually editing the EN field while it was auto-translated from AR
    if (arToEn.isAutoTranslated) {
      arToEn.onTargetManualEdit();
    }
  }, [arToEn]);

  // Determine which field shows the auto-translate indicator
  const showArIndicator = enToAr.isAutoTranslated || enToAr.isTranslating;
  const showEnIndicator = arToEn.isAutoTranslated || arToEn.isTranslating;

  const Component = type === 'textarea' ? Textarea : Input;

  const renderIndicator = (isTranslating: boolean, isAutoTranslated: boolean) => {
    if (isTranslating) {
      return (
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          {t('translating')}
        </span>
      );
    }
    if (isAutoTranslated) {
      return (
        <span className="text-xs text-muted-foreground">
          {t('autoTranslated')}
        </span>
      );
    }
    return null;
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {/* Arabic field */}
      <div className="space-y-1">
        <Component
          ref={arRef as never}
          name={`${baseName}_ar`}
          label={labelAr}
          defaultValue={!isControlled ? defaultValueAr : undefined}
          value={isControlled ? valueAr : undefined}
          error={errorAr}
          placeholder={placeholderAr}
          required={sourceIsAr ? required : undefined}
          {...(type === 'textarea' ? { rows } : {})}
          onChange={(e: React.ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) => {
            handleArChange(e);
            // If this is the target field (user locale is EN), mark manual edit
            if (!sourceIsAr) handleArManualEdit();
          }}
          className={cn(showArIndicator && 'border-primary/30')}
        />
        {showArIndicator && renderIndicator(enToAr.isTranslating, enToAr.isAutoTranslated)}
      </div>

      {/* English field */}
      <div className="space-y-1">
        <Component
          ref={enRef as never}
          name={`${baseName}_en`}
          label={labelEn}
          defaultValue={!isControlled ? defaultValueEn : undefined}
          value={isControlled ? valueEn : undefined}
          error={errorEn}
          placeholder={placeholderEn}
          required={!sourceIsAr ? required : undefined}
          dir="ltr"
          {...(type === 'textarea' ? { rows } : {})}
          onChange={(e: React.ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) => {
            handleEnChange(e);
            // If this is the target field (user locale is AR), mark manual edit
            if (sourceIsAr) handleEnManualEdit();
          }}
          className={cn(showEnIndicator && 'border-primary/30')}
        />
        {showEnIndicator && renderIndicator(arToEn.isTranslating, arToEn.isAutoTranslated)}
      </div>
    </div>
  );
}
