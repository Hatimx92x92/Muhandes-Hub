'use client';

import { BorderBeam } from '@/components/ui/border-beam';

export function PricingBorderBeam() {
  return (
    <BorderBeam
      size={200}
      duration={8}
      colorFrom="hsl(var(--primary))"
      colorTo="hsl(var(--secondary))"
      className="opacity-60"
    />
  );
}
