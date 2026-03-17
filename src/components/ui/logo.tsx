import { cn } from '@/lib/utils';

/* ==========================================================================
   Logo — Muqawil HUB brand mark (inline SVG monogram + text)
   ========================================================================== */

const sizes = {
  sm: { box: 32, text: 'text-base', sub: 'text-[9px]' },
  md: { box: 36, text: 'text-lg', sub: 'text-[10px]' },
  lg: { box: 44, text: 'text-xl', sub: 'text-[11px]' },
} as const;

interface LogoProps {
  size?: keyof typeof sizes;
  showText?: boolean;
  className?: string;
}

function LogoMark({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
      aria-hidden="true"
    >
      <rect width="48" height="48" rx="12" fill="url(#logo-grad)" />
      {/* M */}
      <path
        d="M10 36V16l7 10 7-10v20"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* H */}
      <path
        d="M30 16v20M38 16v20M30 26h8"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient id="logo-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--primary)" />
          <stop offset="1" stopColor="var(--primary-dark)" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function Logo({ size = 'md', showText = true, className }: LogoProps) {
  const s = sizes[size];

  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <LogoMark size={s.box} />
      {showText && (
        <span className="flex flex-col">
          <span className={cn(s.text, 'font-bold text-foreground leading-tight')}>
            Muhaned Hub
          </span>
          <span className={cn(s.sub, 'font-medium text-muted-foreground leading-none -mt-0.5')}>
            Saudi Construction B2B
          </span>
        </span>
      )}
    </span>
  );
}
