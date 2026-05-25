import { PageLoadingSkeleton } from '@/components/features/page-loading-skeleton';

export default function ProductsLoading() {
  return <PageLoadingSkeleton variant="list" statCount={3} />;
}
