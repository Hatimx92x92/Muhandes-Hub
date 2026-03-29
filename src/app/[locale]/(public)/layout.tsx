// =============================================================================
// (public) Layout — Public pages wrapper
// =============================================================================

import { BreadcrumbProvider } from '@/components/layout/breadcrumb-provider';
import { BreadcrumbNav } from '@/components/layout/breadcrumb-nav';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex-1">
      <BreadcrumbProvider>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <BreadcrumbNav rootType="public" className="pt-6 mb-6" />
          {children}
        </div>
      </BreadcrumbProvider>
    </main>
  );
}
