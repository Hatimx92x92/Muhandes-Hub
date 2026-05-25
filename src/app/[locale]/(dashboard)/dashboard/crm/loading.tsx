import { PageLoadingSkeleton } from '@/components/features/page-loading-skeleton';

export default function CRMLoading() {
  return <PageLoadingSkeleton variant="list" statCount={3} />;
}
