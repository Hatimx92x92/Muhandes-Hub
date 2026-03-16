// =============================================================================
// Contact Page — public contact form with company info
// =============================================================================

import { getTranslations } from 'next-intl/server';
import { ContactForm } from '@/components/forms/contact-form';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';

export default async function ContactPage() {
  const t = await getTranslations('public.contact');

  const contactInfo = [
    {
      icon: Mail,
      label: t('email'),
      value: 'support@muqawilhub.com',
      dir: 'ltr' as const,
    },
    {
      icon: Phone,
      label: t('phone'),
      value: '+966 11 000 0000',
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

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
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
