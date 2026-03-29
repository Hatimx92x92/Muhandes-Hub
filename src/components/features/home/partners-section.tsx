import { FadeIn } from '@/components/ui/motion';
import { Marquee } from '@/components/ui/marquee';
import { getTranslations } from 'next-intl/server';
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

/* ==========================================================================
   PartnersSection — Infinite marquee slider of partner logos (Magic UI)
   ========================================================================== */

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

function LogoCard({ name, icon: Icon }: { name: string; icon: LucideIcon }) {
  return (
    <div className="flex shrink-0 items-center gap-3 rounded-xl border border-border/50 bg-card px-6 py-4 grayscale opacity-60 transition-all duration-300 hover:grayscale-0 hover:opacity-100 hover:border-primary/30 hover:shadow-md">
      <Icon className="h-7 w-7 text-primary" />
      <span className="whitespace-nowrap text-sm font-semibold text-foreground">
        {name}
      </span>
    </div>
  );
}

export async function PartnersSection() {
  const t = await getTranslations('home.partners');

  const partners = partnerEntries.map(e => ({
    name: t(`logos.${e.key}`),
    icon: e.icon,
  }));

  // Split into two rows
  const firstHalf = partners.slice(0, Math.ceil(partners.length / 2));
  const secondHalf = partners.slice(Math.ceil(partners.length / 2));

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

      {/* Row 1 — scrolls in default direction */}
      <FadeIn direction="up" delay={0.2}>
        <Marquee pauseOnHover className="[--duration:35s]">
          {firstHalf.map((p) => (
            <LogoCard key={p.name} name={p.name} icon={p.icon} />
          ))}
        </Marquee>
      </FadeIn>

      {/* Row 2 — scrolls in reverse direction */}
      <FadeIn direction="up" delay={0.3}>
        <Marquee reverse pauseOnHover className="mt-4 [--duration:40s]">
          {secondHalf.map((p) => (
            <LogoCard key={p.name} name={p.name} icon={p.icon} />
          ))}
        </Marquee>
      </FadeIn>
    </section>
  );
}
