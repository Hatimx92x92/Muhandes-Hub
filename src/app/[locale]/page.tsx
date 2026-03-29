import { Link } from '@/i18n/navigation';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { HeroSection } from '@/components/features/home/hero-section';
import { RolesSection } from '@/components/features/home/roles-section';
import { FeaturesSection } from '@/components/features/home/features-section';
import { PartnersSection } from '@/components/features/home/partners-section';
import { CTASection } from '@/components/features/home/cta-section';

// =============================================================================
// SEO Metadata
// =============================================================================

export async function generateMetadata(): Promise<Metadata> {
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
  };
}

// =============================================================================
// Homepage — Animated landing page (Bold & Corporate — Procore-style)
// =============================================================================

export default function HomePage() {
  return (
    <main className="flex-1">
      <HeroSection />
      <RolesSection />
      <FeaturesSection />
      <PartnersSection />
      <CTASection />
    </main>
  );
}
