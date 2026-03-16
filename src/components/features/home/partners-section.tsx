import { FadeIn } from '@/components/ui/motion';
import { PartnerLogoSlider } from '@/components/ui/partner-logo-slider';
import { getTranslations } from 'next-intl/server';

/* ==========================================================================
   PartnersSection — Infinite marquee slider of partner logos
   ========================================================================== */

export async function PartnersSection() {
  const t = await getTranslations('home.partners');

  return (
    <section className="py-20 bg-muted/20 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section heading */}
        <FadeIn direction="up" className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-foreground sm:text-4xl">
            {t('title')}
          </h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            {t('subtitle')}
          </p>
        </FadeIn>
      </div>

      {/* Slider — full-bleed (no max-width constraint) for seamless loop */}
      <FadeIn direction="up" delay={0.2}>
        <PartnerLogoSlider />
      </FadeIn>
    </section>
  );
}
