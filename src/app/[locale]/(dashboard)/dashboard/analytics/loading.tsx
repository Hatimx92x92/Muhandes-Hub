import { PageLoadingSkeleton } from '@/components/features/page-loading-skeleton';

export default function AnalyticsLoading() {
  return <PageLoadingSkeleton variant="list" statCount={4} />;
}
