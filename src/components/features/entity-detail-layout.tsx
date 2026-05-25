import { cn } from '@/lib/utils';

interface EntityDetailLayoutProps {
  /** Main content — occupies 2/3 width on large screens */
  children: React.ReactNode;
  /** Optional metadata sidebar — occupies 1/3 width on large screens */
  sidebar?: React.ReactNode;
  className?: string;
}

export function EntityDetailLayout({
  children,
  sidebar,
  className,
}: EntityDetailLayoutProps) {
  if (!sidebar) {
    return <div className={cn('space-y-6', className)}>{children}</div>;
  }

  return (
    <div className={cn('grid grid-cols-1 gap-6 lg:grid-cols-3', className)}>
      <div className="space-y-6 lg:col-span-2">{children}</div>
      <div className="space-y-6 lg:col-span-1">{sidebar}</div>
    </div>
  );
}
