'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { adminUpdateProfile } from '@/actions/admin/users';
import type { AdminUpdateProfileData } from '@/schemas/admin';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pencil, Save, X, User, Building2, Hash, Globe, MapPin } from 'lucide-react';

interface AdminProfileEditFormProps {
  userId: string;
  profile: Record<string, unknown>;
  isAdmin: boolean;
}

export function AdminProfileEditForm({ userId, profile, isAdmin }: AdminProfileEditFormProps) {
  const t = useTranslations('admin.userDetail');
  const tAdmin = useTranslations('admin');
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const router = useRouter();

  // Strip country code prefix for phone (DB stores +966XXXXXXXXX, schema expects 9 digits)
  const stripPhone = (p: string) => p.replace(/^\+?966/, '');

  // Editable field state
  const [fields, setFields] = useState({
    full_name: (profile?.full_name as string) ?? '',
    phone: stripPhone((profile?.phone as string) ?? ''),
    profile_type: (profile?.profile_type as string) ?? 'company',
    company_name_ar: (profile?.company_name_ar as string) ?? '',
    company_name_en: (profile?.company_name_en as string) ?? '',
    cr_number: (profile?.cr_number as string) ?? '',
    vat_number: (profile?.vat_number as string) ?? '',
    website: (profile?.website as string) ?? '',
    bio_ar: (profile?.bio_ar as string) ?? '',
    bio_en: (profile?.bio_en as string) ?? '',
    address_ar: (profile?.address_ar as string) ?? '',
    address_en: (profile?.address_en as string) ?? '',
    verification_status: (profile?.verification_status as string) ?? 'pending_email',
  });

  const resetFields = () => {
    setFields({
      full_name: (profile?.full_name as string) ?? '',
      phone: stripPhone((profile?.phone as string) ?? ''),
      profile_type: (profile?.profile_type as string) ?? 'company',
      company_name_ar: (profile?.company_name_ar as string) ?? '',
      company_name_en: (profile?.company_name_en as string) ?? '',
      cr_number: (profile?.cr_number as string) ?? '',
      vat_number: (profile?.vat_number as string) ?? '',
      website: (profile?.website as string) ?? '',
      bio_ar: (profile?.bio_ar as string) ?? '',
      bio_en: (profile?.bio_en as string) ?? '',
      address_ar: (profile?.address_ar as string) ?? '',
      address_en: (profile?.address_en as string) ?? '',
      verification_status: (profile?.verification_status as string) ?? 'pending_email',
    });
    setResult(null);
  };

  const handleSave = () => {
    startTransition(async () => {
      const res = await adminUpdateProfile(userId, fields as AdminUpdateProfileData);
      if (res.error) {
        setResult({ type: 'error', message: res.error });
      } else {
        setResult({ type: 'success', message: t('saved') });
        setIsEditing(false);
        router.refresh();
      }
    });
  };

  const handleCancel = () => {
    resetFields();
    setIsEditing(false);
  };

  const update = (key: string, value: string) => {
    setFields((prev) => ({ ...prev, [key]: value }));
    setResult(null);
  };

  const VERIFICATION_STATUSES = [
    'pending_email', 'pending_payment', 'pending_documents',
    'pending_approval', 'active', 'restricted', 'banned',
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4" />
            {t('profileInfo')}
          </CardTitle>
          {!isAdmin && (
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button size="sm" variant="primary" loading={isPending} onClick={handleSave}>
                    <Save className="me-1 h-3 w-3" />
                    {isPending ? t('saving') : t('save')}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleCancel} disabled={isPending}>
                    <X className="me-1 h-3 w-3" />
                    {t('cancel')}
                  </Button>
                </>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                  <Pencil className="me-1 h-3 w-3" />
                  {t('edit')}
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {result && (
          <p className={`mb-4 text-sm ${result.type === 'error' ? 'text-destructive' : 'text-success'}`}>
            {result.message}
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Full Name */}
          <div className="flex items-start gap-3">
            <User className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">{t('fullName')}</p>
              {isEditing ? (
                <Input value={fields.full_name} onChange={(e) => update('full_name', e.target.value)} className="mt-1 h-8" />
              ) : (
                <p className="text-sm font-medium">{fields.full_name || t('notProvided')}</p>
              )}
            </div>
          </div>

          {/* Phone */}
          <div className="flex items-start gap-3">
            <Hash className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">{t('phone')}</p>
              {isEditing ? (
                <Input value={fields.phone} onChange={(e) => update('phone', e.target.value)} className="mt-1 h-8" placeholder="5XXXXXXXX" />
              ) : (
                <p className="text-sm font-medium">{fields.phone ? `+966${fields.phone}` : t('notProvided')}</p>
              )}
            </div>
          </div>

          {/* Profile Type */}
          <div className="flex items-start gap-3">
            <Building2 className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">{t('profileType')}</p>
              {isEditing ? (
                <Select value={fields.profile_type} onValueChange={(val) => update('profile_type', val ?? '')}>
                  <SelectTrigger className="mt-1 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="company">{t('company')}</SelectItem>
                    <SelectItem value="personal">{t('personal')}</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant="secondary" className="mt-0.5">{t(fields.profile_type as 'company' | 'personal')}</Badge>
              )}
            </div>
          </div>

          {/* Company Name AR */}
          <div className="flex items-start gap-3">
            <Building2 className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">{t('companyNameAr')}</p>
              {isEditing ? (
                <Input value={fields.company_name_ar} onChange={(e) => update('company_name_ar', e.target.value)} className="mt-1 h-8" dir="rtl" />
              ) : (
                <p className="text-sm font-medium">{fields.company_name_ar || t('notProvided')}</p>
              )}
            </div>
          </div>

          {/* Company Name EN */}
          <div className="flex items-start gap-3">
            <Building2 className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">{t('companyNameEn')}</p>
              {isEditing ? (
                <Input value={fields.company_name_en} onChange={(e) => update('company_name_en', e.target.value)} className="mt-1 h-8" dir="ltr" />
              ) : (
                <p className="text-sm font-medium">{fields.company_name_en || t('notProvided')}</p>
              )}
            </div>
          </div>

          {/* Role (read-only — immutable) */}
          <div className="flex items-start gap-3">
            <User className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">{t('role')}</p>
              <Badge variant={(profile?.role as string) === 'project_owner' ? 'project_owner' : (profile?.role as string) === 'contractor' ? 'contractor' : (profile?.role as string) === 'supplier' ? 'supplier' : 'buyer'} className="mt-0.5">
                {profile?.role ? tAdmin(`roleLabels.${profile.role as string}`) : t('notProvided')}
              </Badge>
            </div>
          </div>

          {/* CR Number */}
          <div className="flex items-start gap-3">
            <Hash className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">{t('crNumber')}</p>
              {isEditing ? (
                <Input value={fields.cr_number} onChange={(e) => update('cr_number', e.target.value)} className="mt-1 h-8" />
              ) : (
                <p className="text-sm font-medium">{fields.cr_number || t('notProvided')}</p>
              )}
            </div>
          </div>

          {/* VAT Number */}
          <div className="flex items-start gap-3">
            <Hash className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">{t('vatNumber')}</p>
              {isEditing ? (
                <Input value={fields.vat_number} onChange={(e) => update('vat_number', e.target.value)} className="mt-1 h-8" />
              ) : (
                <p className="text-sm font-medium">{fields.vat_number || t('notProvided')}</p>
              )}
            </div>
          </div>

          {/* Website */}
          <div className="flex items-start gap-3">
            <Globe className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">{t('website')}</p>
              {isEditing ? (
                <Input value={fields.website} onChange={(e) => update('website', e.target.value)} className="mt-1 h-8" type="url" />
              ) : (
                <p className="text-sm font-medium">{fields.website || t('notProvided')}</p>
              )}
            </div>
          </div>

          {/* Verification Status */}
          <div className="flex items-start gap-3">
            <MapPin className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">{t('verificationStatus')}</p>
              {isEditing ? (
                <Select value={fields.verification_status} onValueChange={(val) => update('verification_status', val ?? '')}>
                  <SelectTrigger className="mt-1 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VERIFICATION_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{tAdmin(`userStatus.${s}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant={
                  fields.verification_status === 'active' ? 'success' :
                  fields.verification_status === 'banned' ? 'destructive' :
                  fields.verification_status === 'restricted' ? 'warning' :
                  'pending'
                } className="mt-0.5">
                  {tAdmin(`userStatus.${fields.verification_status}`)}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Bio & Address — full width rows */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {/* Bio AR */}
          <div>
            <p className="mb-1 text-xs text-muted-foreground">{t('bioAr')}</p>
            {isEditing ? (
              <Textarea value={fields.bio_ar} onChange={(e) => update('bio_ar', e.target.value)} className="min-h-[60px]" dir="rtl" />
            ) : (
              <p className="text-sm">{fields.bio_ar || t('notProvided')}</p>
            )}
          </div>

          {/* Bio EN */}
          <div>
            <p className="mb-1 text-xs text-muted-foreground">{t('bioEn')}</p>
            {isEditing ? (
              <Textarea value={fields.bio_en} onChange={(e) => update('bio_en', e.target.value)} className="min-h-[60px]" dir="ltr" />
            ) : (
              <p className="text-sm">{fields.bio_en || t('notProvided')}</p>
            )}
          </div>

          {/* Address AR */}
          <div>
            <p className="mb-1 text-xs text-muted-foreground">{t('addressAr')}</p>
            {isEditing ? (
              <Input value={fields.address_ar} onChange={(e) => update('address_ar', e.target.value)} dir="rtl" />
            ) : (
              <p className="text-sm">{fields.address_ar || t('notProvided')}</p>
            )}
          </div>

          {/* Address EN */}
          <div>
            <p className="mb-1 text-xs text-muted-foreground">{t('addressEn')}</p>
            {isEditing ? (
              <Input value={fields.address_en} onChange={(e) => update('address_en', e.target.value)} dir="ltr" />
            ) : (
              <p className="text-sm">{fields.address_en || t('notProvided')}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
