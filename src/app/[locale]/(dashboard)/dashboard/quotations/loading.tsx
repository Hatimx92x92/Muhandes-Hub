import { PageLoadingSkeleton } from '@/components/features/page-loading-skeleton';

export default function QuotationsLoading() {
  return <PageLoadingSkeleton variant="list" statCount={3} />;
}
