import { PageLoadingSkeleton } from '@/components/features/page-loading-skeleton';

export default function ContractsLoading() {
  return <PageLoadingSkeleton variant="list" statCount={3} />;
}
