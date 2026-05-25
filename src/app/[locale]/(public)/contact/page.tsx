// =============================================================================
// Contact Page — public contact form with company info
// =============================================================================

import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ContactForm } from '@/components/forms/contact-form';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://muhandeshub.com';

// ---------------------------------------------------------------------------
// SEO — generateMetadata
// ---------------------------------------------------------------------------
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('metadata.contact');

  return {
    title: t('title'),
    description: t('description'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      type: 'website',
      locale: locale === 'ar' ? 'ar_SA' : 'en_US',
      alternateLocale: locale === 'ar' ? 'en_US' : 'ar_SA',
      siteName: 'Muhandes HUB',
    },
    alternates: {
      canonical: `${BASE_URL}/${locale}/contact`,
      languages: {
        ar: `${BASE_URL}/ar/contact`,
        en: `${BASE_URL}/en/contact`,
      },
    },
  };
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('public.contact');

  const contactInfo = [
    {
      icon: Mail,
      label: t('email'),
      value: t('emailValue'),
      dir: 'ltr' as const,
    },
    {
      icon: Phone,
      label: t('phone'),
      value: t('phoneValue'),
      dir: 'ltr' as const,
    },
    {
      icon: MapPin,
      label: t('address'),
      value: t('addressValue'),
      dir: undefined,
    },
    {
      icon: Clock,
      label: t('hours'),
      value: t('hoursValue'),
      dir: undefined,
    },
  ];

  const localBusinessJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Muhandes HUB',
    alternateName: 'منصة مهندس',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://muhandeshub.com',
    email: 'info@muhandeshub.com',
    telephone: t('phoneValue'),
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'SA',
      addressRegion: 'Riyadh',
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
      opens: '09:00',
      closes: '18:00',
    },
    parentOrganization: {
      '@type': 'Organization',
      name: 'Remal Al Mas',
      alternateName: 'رمال الماس',
      url: 'https://remal-almas.com',
    },
  };

  return (
    <div className="mx-auto max-w-6xl py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }} />
      <div className="text-center mb-14">
        <h1 className="text-3xl font-extrabold text-foreground sm:text-4xl lg:text-5xl">{t('title')}</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          {t('subtitle')}
        </p>
      </div>

      <div className="grid gap-12 lg:grid-cols-3">
        {/* Contact info */}
        <div className="lg:col-span-1 space-y-6">
          {contactInfo.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-sm text-muted-foreground" dir={item.dir}>
                    {item.value}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Form */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
          <h2 className="text-xl font-bold text-foreground mb-6">{t('sendMessage')}</h2>
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
