import Image from 'next/image';
import { cn } from '@/lib/utils';

/* ==========================================================================
   Logo — Muhandes HUB brand mark (image + text)
   ========================================================================== */

const sizes = {
  sm: { box: 40, text: 'text-lg', sub: 'text-[10px]' },
  md: { box: 48, text: 'text-xl', sub: 'text-[11px]' },
  lg: { box: 56, text: 'text-2xl', sub: 'text-xs' },
} as const;

interface LogoProps {
  size?: keyof typeof sizes;
  showText?: boolean;
  subtitle?: string;
  className?: string;
}

function LogoMark({ size }: { size: number }) {
  return (
    <Image
      src="/android-chrome-192x192.png"
      alt="Muhandes HUB"
      width={size}
      height={size}
      className="shrink-0"
      priority
    />
  );
}

export function Logo({ size = 'md', showText = true, subtitle, className }: LogoProps) {
  const s = sizes[size];

  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <LogoMark size={s.box} />
      {showText && (
        <span className="flex flex-col">
          <span className={cn(s.text, 'font-bold text-foreground leading-tight')}>
            Muhandes HUB
          </span>
          {subtitle && (
            <span className={cn(s.sub, 'font-medium text-muted-foreground leading-none -mt-0.5')}>
              {subtitle}
            </span>
          )}
        </span>
      )}
    </span>
  );
}
