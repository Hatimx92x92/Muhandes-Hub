import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

const variants = {
  error: {
    container: 'border-destructive/30 bg-destructive/5 text-destructive',
    icon: AlertCircle,
  },
  success: {
    container: 'border-success/30 bg-success/5 text-success',
    icon: CheckCircle2,
  },
  warning: {
    container: 'border-warning/30 bg-warning/5 text-warning-foreground',
    icon: AlertTriangle,
  },
  info: {
    container: 'border-info/30 bg-info/5 text-info',
    icon: Info,
  },
} as const;

interface AlertBannerProps {
  variant: keyof typeof variants;
  children: React.ReactNode;
  icon?: boolean;
  className?: string;
}

export function AlertBanner({ variant, children, icon = true, className }: AlertBannerProps) {
  const v = variants[variant];
  const Icon = v.icon;

  return (
    <div className={cn('rounded-lg border p-3 text-sm', v.container, className)} role="alert">
      {icon ? (
        <span className="flex items-start gap-2">
          <Icon className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{children}</span>
        </span>
      ) : (
        children
      )}
    </div>
  );
}
