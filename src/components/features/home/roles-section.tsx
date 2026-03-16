'use client';

import { motion } from 'framer-motion';
import { Building2, HardHat, Truck, ShoppingCart } from 'lucide-react';
import { type LucideIcon } from 'lucide-react';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/motion';
import { AnimatedIcon } from '@/components/ui/animated-icon';
import { useTranslations } from 'next-intl';

/* ==========================================================================
   RolesSection — Animated role cards with icon entrance animations
   ========================================================================== */

interface RoleCard {
  key: string;
  icon: LucideIcon;
  color: string;
  iconColor: string;
  accentColor: string;
}

const roleCards: RoleCard[] = [
  {
    key: 'projectOwner',
    icon: Building2,
    color: 'bg-role-po/10',
    iconColor: 'text-role-po-foreground',
    accentColor: 'bg-role-po-foreground',
  },
  {
    key: 'contractor',
    icon: HardHat,
    color: 'bg-role-contractor/10',
    iconColor: 'text-role-contractor-foreground',
    accentColor: 'bg-role-contractor-foreground',
  },
  {
    key: 'supplier',
    icon: Truck,
    color: 'bg-role-supplier/10',
    iconColor: 'text-role-supplier-foreground',
    accentColor: 'bg-role-supplier-foreground',
  },
  {
    key: 'buyer',
    icon: ShoppingCart,
    color: 'bg-role-buyer/10',
    iconColor: 'text-role-buyer-foreground',
    accentColor: 'bg-role-buyer-foreground',
  },
];

export function RolesSection() {
  const t = useTranslations('home.roles');

  return (
    <section className="py-24 bg-muted/30">
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

        {/* Cards grid with stagger */}
        <StaggerContainer
          stagger={0.12}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {roleCards.map((role) => (
            <StaggerItem key={role.key}>
              <motion.div
                whileHover={{
                  y: -6,
                  transition: { duration: 0.25, ease: 'easeOut' },
                }}
                className="relative rounded-2xl border border-border bg-card p-6 text-center transition-shadow duration-300 hover:shadow-lg hover:border-primary/20 overflow-hidden"
              >
                {/* Top accent line */}
                <div
                  className={`absolute top-0 inset-x-0 h-1 ${role.accentColor} opacity-60`}
                />

                {/* Animated icon */}
                <AnimatedIcon
                  icon={role.icon}
                  containerClassName={`mx-auto mb-4 h-14 w-14 rounded-2xl ${role.color}`}
                  iconClassName={role.iconColor}
                  size={28}
                />

                <h3 className="text-lg font-bold text-foreground">
                  {t(`${role.key}.title`)}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {t(`${role.key}.desc`)}
                </p>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
