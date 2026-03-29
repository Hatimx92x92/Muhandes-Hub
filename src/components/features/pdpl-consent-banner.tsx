// =============================================================================
// Muhandes HUB — PDPL Privacy Consent Banner
// Saudi PDPL compliance — shown to new visitors, stored in cookie
// =============================================================================

'use client';

import { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';
import { useTranslations } from 'next-intl';

const CONSENT_COOKIE = 'pdpl_consent';

export function PDPLConsentBanner() {
  const t = useTranslations('features.pdpl');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hasConsent = document.cookie
      .split(';')
      .some((c) => c.trim().startsWith(`${CONSENT_COOKIE}=`));
    if (!hasConsent) {
      setVisible(true);
    }
  }, []);

  function acceptConsent() {
    document.cookie = `${CONSENT_COOKIE}=accepted;path=/;max-age=${365 * 24 * 60 * 60};SameSite=Lax`;
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-4 animate-slide-up">
      <div className="mx-auto max-w-4xl rounded-2xl bg-card border border-border shadow-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Shield className="text-primary" size={20} />
          </div>
          <div className="flex-1 space-y-2">
            <h3 className="font-bold text-foreground">
              {t('title')}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('description')}
            </p>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={acceptConsent}
                className="px-6 py-2.5 text-sm font-bold bg-primary text-primary-foreground rounded-xl shadow-md hover:bg-primary-dark hover:shadow-lg transition-all duration-200 active:scale-[0.98]"
              >
                {t('accept')}
              </button>
              <a
                href="/privacy"
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                {t('privacyPolicy')}
              </a>
              <a
                href="/cookies"
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                {t('cookiePolicy')}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
