'use client';

import { useReducedMotion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import {
  Building2,
  Factory,
  Warehouse,
  HardHat,
  Landmark,
  Hammer,
  Layers,
  Container,
  Ruler,
  Cone,
} from 'lucide-react';
import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ==========================================================================
   PartnerLogoSlider — Infinite marquee of partner/client logos
   Uses CSS animation for buttery-smooth continuous scroll.
   Two copies of the strip rendered side-by-side for seamless looping.
   ========================================================================== */

interface PartnerLogo {
  name: string;
  icon: LucideIcon;
}

interface PartnerEntry {
  key: string;
  icon: LucideIcon;
}

const partnerEntries: PartnerEntry[] = [
  { key: 'advancedConstruction', icon: Building2 },
  { key: 'saudiIronFactory', icon: Factory },
  { key: 'gulfWarehouses', icon: Warehouse },
  { key: 'contractorsGroup', icon: HardHat },
  { key: 'nationalArchitecture', icon: Landmark },
  { key: 'constructionTools', icon: Hammer },
  { key: 'layersMaterials', icon: Layers },
  { key: 'riyadhContainers', icon: Container },
  { key: 'precisionMeasurement', icon: Ruler },
  { key: 'safetyExcellence', icon: Cone },
];

function LogoItem({ partner }: { partner: PartnerLogo }) {
  const Icon = partner.icon;
  return (
    <div className="flex shrink-0 items-center gap-3 rounded-xl border border-border/50 bg-card px-6 py-4 mx-3 grayscale opacity-60 transition-all duration-300 hover:grayscale-0 hover:opacity-100 hover:border-primary/30 hover:shadow-md">
      <Icon className="h-7 w-7 text-primary" />
      <span className="whitespace-nowrap text-sm font-semibold text-foreground">
        {partner.name}
      </span>
    </div>
  );
}

interface PartnerLogoSliderProps {
  className?: string;
}

export function PartnerLogoSlider({ className }: PartnerLogoSliderProps) {
  const t = useTranslations('home.partners');
  const prefersReduced = useReducedMotion();

  const partners: PartnerLogo[] = partnerEntries.map(e => ({
    name: t(`logos.${e.key}`),
    icon: e.icon,
  }));

  return (
    <div
      className={cn('w-full overflow-hidden', className)}
      aria-label={t('ariaLabel')}
    >
      {/* Row 1 — scrolls left (in RTL context, marquee-rtl goes right-to-left visually) */}
      <div
        className={cn(
          'flex w-max',
          prefersReduced ? '' : 'animate-marquee'
        )}
        style={prefersReduced ? {} : { animationDuration: '40s' }}
      >
        {/* Two copies for seamless loop */}
        {[...partners, ...partners].map((partner, i) => (
          <LogoItem key={`row1-${i}`} partner={partner} />
        ))}
      </div>

      {/* Row 2 — scrolls in opposite direction */}
      <div
        className={cn(
          'flex w-max mt-4',
          prefersReduced ? '' : 'animate-marquee-reverse'
        )}
        style={prefersReduced ? {} : { animationDuration: '45s' }}
      >
        {[...[...partners].reverse(), ...[...partners].reverse()].map(
          (partner, i) => (
            <LogoItem key={`row2-${i}`} partner={partner} />
          )
        )}
      </div>
    </div>
  );
}
