import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { HeroSection } from '@/components/features/home/hero-section';
import { RolesSection } from '@/components/features/home/roles-section';
import { FeaturesSection } from '@/components/features/home/features-section';
import { PartnersSection } from '@/components/features/home/partners-section';
import { CTASection } from '@/components/features/home/cta-section';
import { getPublicStats } from '@/actions/analytics';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://muhandeshub.com';

// =============================================================================
// SEO Metadata
// =============================================================================

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('metadata.home');
  return {
    title: t('title'),
    description: t('description'),
    openGraph: {
      title: t('ogTitle'),
      description: t('ogDescription'),
      type: 'website',
      locale: 'ar_SA',
      alternateLocale: 'en_US',
    },
    alternates: {
      canonical: `${BASE_URL}/${locale}`,
      languages: {
        ar: `${BASE_URL}/ar`,
        en: `${BASE_URL}/en`,
      },
    },
  };
}

// =============================================================================
// Homepage — Animated landing page (Bold & Corporate — Procore-style)
// =============================================================================

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const stats = await getPublicStats();

  return (
    <main className="flex-1">
      <HeroSection stats={stats} />
      <RolesSection />
      <FeaturesSection />
      <PartnersSection />
      <CTASection />
    </main>
  );
}
