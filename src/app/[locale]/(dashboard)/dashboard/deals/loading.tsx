import { PageLoadingSkeleton } from '@/components/features/page-loading-skeleton';

export default function DealsLoading() {
  return <PageLoadingSkeleton variant="list" statCount={3} />;
}
