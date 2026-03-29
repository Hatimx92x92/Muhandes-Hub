'use client';

import {
  Zap,
  FileCheck,
  Users,
  Globe,
  BarChart3,
  Shield,
} from 'lucide-react';
import { type LucideIcon } from 'lucide-react';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/motion';
import { AnimatedIcon } from '@/components/ui/animated-icon';
import { MagicCard } from '@/components/ui/magic-card';
import { useTranslations } from 'next-intl';

/* ==========================================================================
   FeaturesSection — Platform features with Magic Card spotlight effect
   ========================================================================== */

const featureCards: { key: string; icon: LucideIcon }[] = [
  { key: 'dealWorkspace', icon: Zap },
  { key: 'contracts', icon: FileCheck },
  { key: 'crm', icon: Users },
  { key: 'search', icon: Globe },
  { key: 'analytics', icon: BarChart3 },
  { key: 'security', icon: Shield },
];

export function FeaturesSection() {
  const t = useTranslations('home.features');

  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section heading */}
        <FadeIn direction="up" className="text-center mb-14">
          <h2 className="text-3xl font-extrabold text-foreground sm:text-4xl">
            {t('title')}
          </h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            {t('subtitle')}
          </p>
        </FadeIn>

        {/* Feature cards grid with stagger + Magic Card spotlight */}
        <StaggerContainer
          stagger={0.1}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {featureCards.map((feature) => (
            <StaggerItem key={feature.key}>
              <MagicCard
                className="rounded-2xl border border-border bg-card p-6 transition-shadow duration-300 hover:shadow-md hover:border-primary/20"
                gradientColor="hsl(var(--primary) / 0.07)"
              >
                {/* Animated icon */}
                <AnimatedIcon
                  icon={feature.icon}
                  containerClassName="mb-4 h-12 w-12 rounded-xl bg-primary/10"
                  iconClassName="text-primary"
                  size={24}
                />

                <h3 className="text-lg font-bold text-foreground">
                  {t(`${feature.key}.title`)}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {t(`${feature.key}.desc`)}
                </p>
              </MagicCard>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
