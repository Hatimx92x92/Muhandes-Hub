import { Card } from '@/components/ui/card';

export default function PartnerProfileLoading() {
  return (
    <div className="py-8">
      {/* Hero skeleton */}
      <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4 sm:gap-5">
            <div className="h-20 w-20 shrink-0 animate-pulse rounded-xl bg-muted" />
            <div className="flex-1 space-y-3">
              <div className="h-8 w-56 animate-pulse rounded-md bg-muted" />
              <div className="flex gap-2">
                <div className="h-5 w-20 animate-pulse rounded-full bg-muted" />
                <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
                <div className="h-5 w-24 animate-pulse rounded-full bg-muted" />
              </div>
              <div className="hidden h-4 w-96 animate-pulse rounded bg-muted sm:block" />
            </div>
          </div>
          <div className="h-10 w-36 animate-pulse rounded-lg bg-muted" />
        </div>
        <div className="mt-6 flex gap-6 border-t border-border pt-5">
          <div className="h-4 w-28 animate-pulse rounded bg-muted" />
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          <div className="h-4 w-36 animate-pulse rounded bg-muted" />
        </div>
      </div>

      {/* Tabs skeleton */}
      <div className="mt-8">
        <div className="flex gap-1 border-b border-border">
          <div className="h-10 w-24 animate-pulse rounded-t bg-muted" />
          <div className="h-10 w-24 animate-pulse rounded-t bg-muted" />
          <div className="h-10 w-24 animate-pulse rounded-t bg-muted" />
        </div>
        <div className="space-y-6 pt-6">
          <Card className="p-6">
            <div className="h-5 w-40 animate-pulse rounded bg-muted" />
            <div className="mt-4 space-y-2">
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="h-5 w-32 animate-pulse rounded bg-muted" />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-9 w-9 animate-pulse rounded-lg bg-muted" />
                  <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
