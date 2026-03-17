'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { adminEditPost } from '@/actions/admin/moderation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PostEditFormProps {
  postId: string;
  postType: 'project' | 'product' | 'rfq';
  initialData: {
    title_ar?: string;
    title_en?: string;
    description_ar?: string;
    description_en?: string;
    status?: string;
  };
}

export function PostEditForm({ postId, postType, initialData }: PostEditFormProps) {
  const t = useTranslations('admin.postEdit');
  const tAdmin = useTranslations('admin');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [titleAr, setTitleAr] = useState(initialData.title_ar ?? '');
  const [titleEn, setTitleEn] = useState(initialData.title_en ?? '');
  const [descAr, setDescAr] = useState(initialData.description_ar ?? '');
  const [descEn, setDescEn] = useState(initialData.description_en ?? '');

  const handleSave = () => {
    startTransition(async () => {
      const res = await adminEditPost(postId, postType, {
        title_ar: titleAr,
        title_en: titleEn,
        description_ar: descAr,
        description_en: descEn,
      });
      if (res.error) {
        setResult({ type: 'error', message: res.error });
      } else {
        setResult({ type: 'success', message: t('success') });
        router.refresh();
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">{t('title')}</CardTitle>
          <div className="flex gap-2">
            {initialData.status && (
              <Badge variant={initialData.status as 'pending' | 'published' | 'rejected' | 'draft'}>
                {tAdmin(`postStatus.${initialData.status}`)}
              </Badge>
            )}
            <Badge variant="secondary">{tAdmin(`postType.${postType}`)}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('titleAr')}</label>
            <Input dir="rtl" value={titleAr} onChange={(e) => setTitleAr(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('titleEn')}</label>
            <Input dir="ltr" value={titleEn} onChange={(e) => setTitleEn(e.target.value)} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('descriptionAr')}</label>
            <textarea
              dir="rtl"
              className="w-full min-h-37.5 rounded-lg border border-border bg-background p-3 text-sm resize-y"
              value={descAr}
              onChange={(e) => setDescAr(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('descriptionEn')}</label>
            <textarea
              dir="ltr"
              className="w-full min-h-37.5 rounded-lg border border-border bg-background p-3 text-sm resize-y"
              value={descEn}
              onChange={(e) => setDescEn(e.target.value)}
            />
          </div>
        </div>

        {result && (
          <p className={`text-sm ${result.type === 'error' ? 'text-destructive' : 'text-success'}`}>
            {result.message}
          </p>
        )}

        <div className="flex gap-2">
          <Button variant="primary" loading={isPending} onClick={handleSave}>
            {t('save')}
          </Button>
          <Button variant="outline" onClick={() => router.push('/admin/posts')}>
            {t('cancel')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
