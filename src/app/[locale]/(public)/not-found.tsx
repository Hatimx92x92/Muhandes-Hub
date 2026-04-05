import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { FileQuestion } from 'lucide-react';

export default function PublicNotFoundPage() {
  const t = useTranslations('errors');

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-7xl flex-col items-center justify-center px-4 text-center sm:px-6 lg:px-8">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <FileQuestion className="h-10 w-10 text-muted-foreground" />
      </div>
      <h1 className="mt-6 text-3xl font-bold text-foreground">404</h1>
      <h2 className="mt-2 text-xl font-semibold text-foreground">{t('notFound')}</h2>
      <p className="mt-2 max-w-md text-muted-foreground">{t('notFoundMsg')}</p>
      <div className="mt-8 flex items-center gap-3">
        <Link href="/">
          <Button variant="primary">{t('home')}</Button>
        </Link>
      </div>
    </div>
  );
}
