import { notFound } from 'next/navigation';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { PDPLConsentBanner } from '@/components/features/pdpl-consent-banner';
import { DocumentDirection } from '@/components/document-direction';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

// =============================================================================
// [locale] Layout — Locale-aware wrapper (provides translations to all children)
// =============================================================================

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Validate locale
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  // Load messages for the current locale
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <DocumentDirection />
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="flex flex-1 flex-col">{children}</div>
        <Footer />
      </div>
      <PDPLConsentBanner />
    </NextIntlClientProvider>
  );
}
