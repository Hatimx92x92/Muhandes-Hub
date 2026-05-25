'use client';

// =============================================================================
// Muhandes HUB — BilingualFieldPair
// Renders AR or EN input based on user locale. Admins can see both via
// showBothLanguages prop. A "Add translation" toggle reveals the secondary field.
// =============================================================================

import { useRef, useEffect, useCallback, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Loader2, Languages } from 'lucide-react';
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
  /** Show both languages side-by-side (admin mode) */
  showBothLanguages?: boolean;
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
  showBothLanguages = false,
}: BilingualFieldPairProps) {
  const locale = useLocale() as 'ar' | 'en';
  const t = useTranslations('common');
  const isControlled = valueAr !== undefined || valueEn !== undefined;

  const arRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const enRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  const sourceIsAr = locale === 'ar';

  // Whether the secondary (non-locale) field is expanded by the user
  const [secondaryExpanded, setSecondaryExpanded] = useState(false);

  // In both-languages mode we always show both; otherwise follow expand state
  const showSecondary = showBothLanguages || secondaryExpanded;

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
      if (showSecondary) arToEn.onSourceChange(val);
    },
    [onChangeAr, arToEn, showSecondary],
  );

  const handleEnChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const val = e.target.value;
      if (onChangeEn) onChangeEn(val);
      if (showSecondary) enToAr.onSourceChange(val);
    },
    [onChangeEn, enToAr, showSecondary],
  );

  const handleArManualEdit = useCallback(() => {
    if (enToAr.isAutoTranslated) enToAr.onTargetManualEdit();
  }, [enToAr]);

  const handleEnManualEdit = useCallback(() => {
    if (arToEn.isAutoTranslated) arToEn.onTargetManualEdit();
  }, [arToEn]);

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
      return <span className="text-xs text-muted-foreground">{t('autoTranslated')}</span>;
    }
    return null;
  };

  const secondaryLabel = sourceIsAr ? labelEn : labelAr;
  const addTranslationLabel = sourceIsAr
    ? t('addEnglishTranslation')
    : t('addArabicTranslation');

  if (showBothLanguages) {
    // Admin / both-languages mode: original 2-column side-by-side layout
    return (
      <div className="grid gap-4 sm:grid-cols-2">
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
              if (!sourceIsAr) handleArManualEdit();
            }}
            className={cn(showArIndicator && 'border-primary/30')}
          />
          {showArIndicator && renderIndicator(enToAr.isTranslating, enToAr.isAutoTranslated)}
        </div>
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
              if (sourceIsAr) handleEnManualEdit();
            }}
            className={cn(showEnIndicator && 'border-primary/30')}
          />
          {showEnIndicator && renderIndicator(arToEn.isTranslating, arToEn.isAutoTranslated)}
        </div>
      </div>
    );
  }

  // Single-locale mode: show only the user's locale field
  return (
    <div className="space-y-2">
      {/* Primary field — user's locale */}
      <div className="space-y-1">
        {sourceIsAr ? (
          <>
            <Component
              ref={arRef as never}
              name={`${baseName}_ar`}
              label={labelAr}
              defaultValue={!isControlled ? defaultValueAr : undefined}
              value={isControlled ? valueAr : undefined}
              error={errorAr}
              placeholder={placeholderAr}
              required={required}
              {...(type === 'textarea' ? { rows } : {})}
              onChange={(e: React.ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) =>
                handleArChange(e)
              }
            />
            {errorAr && !secondaryExpanded && null}
          </>
        ) : (
          <>
            <Component
              ref={enRef as never}
              name={`${baseName}_en`}
              label={labelEn}
              defaultValue={!isControlled ? defaultValueEn : undefined}
              value={isControlled ? valueEn : undefined}
              error={errorEn}
              placeholder={placeholderEn}
              required={required}
              dir="ltr"
              {...(type === 'textarea' ? { rows } : {})}
              onChange={(e: React.ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) =>
                handleEnChange(e)
              }
            />
          </>
        )}
      </div>

      {/* Secondary field — optional expansion */}
      {secondaryExpanded && (
        <div className="space-y-1 border-s-2 border-border ps-3">
          <p className="text-xs text-muted-foreground">{secondaryLabel}</p>
          {sourceIsAr ? (
            <div className="space-y-1">
              <Component
                ref={enRef as never}
                name={`${baseName}_en`}
                label={labelEn}
                defaultValue={!isControlled ? defaultValueEn : undefined}
                value={isControlled ? valueEn : undefined}
                error={errorEn}
                placeholder={placeholderEn}
                dir="ltr"
                {...(type === 'textarea' ? { rows } : {})}
                onChange={(e: React.ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) => {
                  handleEnChange(e);
                  handleEnManualEdit();
                }}
                className={cn(showEnIndicator && 'border-primary/30')}
              />
              {showEnIndicator && renderIndicator(arToEn.isTranslating, arToEn.isAutoTranslated)}
            </div>
          ) : (
            <div className="space-y-1">
              <Component
                ref={arRef as never}
                name={`${baseName}_ar`}
                label={labelAr}
                defaultValue={!isControlled ? defaultValueAr : undefined}
                value={isControlled ? valueAr : undefined}
                error={errorAr}
                placeholder={placeholderAr}
                {...(type === 'textarea' ? { rows } : {})}
                onChange={(e: React.ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) => {
                  handleArChange(e);
                  handleArManualEdit();
                }}
                className={cn(showArIndicator && 'border-primary/30')}
              />
              {showArIndicator && renderIndicator(enToAr.isTranslating, enToAr.isAutoTranslated)}
            </div>
          )}
        </div>
      )}

      {/* Add/hide translation toggle */}
      <button
        type="button"
        onClick={() => setSecondaryExpanded((prev) => !prev)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <Languages className="h-3.5 w-3.5" />
        {secondaryExpanded ? t('hideTranslation') : addTranslationLabel}
      </button>
    </div>
  );
}
