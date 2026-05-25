import { PageLoadingSkeleton } from '@/components/features/page-loading-skeleton';

export default function MyBidsLoading() {
  return <PageLoadingSkeleton variant="list" statCount={4} />;
}
