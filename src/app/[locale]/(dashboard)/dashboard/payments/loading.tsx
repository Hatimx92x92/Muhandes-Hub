import { PageLoadingSkeleton } from '@/components/features/page-loading-skeleton';

export default function PaymentsLoading() {
  return <PageLoadingSkeleton variant="list" statCount={4} />;
}
