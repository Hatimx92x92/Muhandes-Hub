import { PageLoadingSkeleton } from '@/components/features/page-loading-skeleton';

export default function NotificationsLoading() {
  return <PageLoadingSkeleton variant="list" statCount={2} />;
}
