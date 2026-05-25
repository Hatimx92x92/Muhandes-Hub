import { Skeleton } from '@/components/ui/skeleton';

interface PageLoadingSkeletonProps {
  variant: 'list' | 'detail' | 'form';
  /** 'list' variant: number of stat cards to render (2–4) */
  statCount?: number;
}

export function PageLoadingSkeleton({
  variant,
  statCount = 3,
}: PageLoadingSkeletonProps) {
  const header = (
    <div className="space-y-2">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-72" />
    </div>
  );

  if (variant === 'list') {
    const cols = statCount === 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-1 sm:grid-cols-3';
    return (
      <div className="space-y-6">
        {header}
        <div className={`grid ${cols} gap-3`}>
          {Array.from({ length: statCount }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        <div className="space-y-3">
          <div className="flex gap-3">
            <Skeleton className="h-9 w-64 rounded-lg" />
            <Skeleton className="h-9 w-28 rounded-lg" />
          </div>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'detail') {
    return (
      <div className="space-y-6">
        {header}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
          <div className="space-y-4 lg:col-span-1">
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  // form
  return (
    <div className="space-y-6">
      {header}
      <Skeleton className="h-[480px] rounded-xl" />
    </div>
  );
}
