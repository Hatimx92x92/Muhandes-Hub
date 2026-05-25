// =============================================================================
// CRM Add Client Form — user search picker (only existing platform users)
// =============================================================================

'use client';

import { useActionState, useState, useRef, useEffect, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/forms/form-field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { addClient, searchUsersForCRM, type CRMUserResult } from '@/actions/crm';
import { cn } from '@/lib/utils';
import { Search, X, User } from 'lucide-react';
import type { ActionResult } from '@/types';

interface Props {
  tags: Array<Record<string, unknown>>;
}

type State = ActionResult<{ id: string }> | null;

export function CrmAddClientForm({ tags }: Props) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState<State, FormData>(addClient, null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CRMUserResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<CRMUserResult | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, startSearch] = useTransition();

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const t = useTranslations('features.crmAddClient');

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Reset form state when dialog closes
  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults([]);
      setSelectedUser(null);
      setShowDropdown(false);
      setSelectedTags([]);
    }
  }, [open]);

  // Close dialog on success
  useEffect(() => {
    if (state?.data) {
      setOpen(false);
    }
  }, [state?.data]);

  function handleQueryChange(value: string) {
    setQuery(value);
    setSelectedUser(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      startSearch(async () => {
        const res = await searchUsersForCRM(value.trim());
        setResults(res.data ?? []);
        setShowDropdown(true);
      });
    }, 300);
  }

  function selectUser(u: CRMUserResult) {
    setSelectedUser(u);
    setShowDropdown(false);
    setQuery('');
  }

  function clearUser() {
    setSelectedUser(null);
    setQuery('');
    setResults([]);
  }

  function userDisplayName(u: CRMUserResult) {
    return u.full_name_ar || u.full_name_en || u.email || '—';
  }

  function userCompany(u: CRMUserResult) {
    return u.company_name_ar || u.company_name_en || null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="primary" />}>
        {t('addClient')}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
        </DialogHeader>

        {state?.error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {state.error}
          </div>
        )}

        <form action={formAction} className="space-y-4">
          {/* Hidden linked_user_id */}
          {selectedUser && (
            <input type="hidden" name="linked_user_id" value={selectedUser.id} />
          )}

          {/* User search / selected user card */}
          <FormField label={t('user')} required error={state?.error ? state.fieldErrors?.linked_user_id?.[0] : undefined}>
            {selectedUser ? (
              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {userDisplayName(selectedUser)}
                    </p>
                    {userCompany(selectedUser) && (
                      <p className="truncate text-xs text-muted-foreground">
                        {userCompany(selectedUser)}
                      </p>
                    )}
                    {selectedUser.email && (
                      <p className="truncate text-xs text-muted-foreground" dir="ltr">
                        {selectedUser.email}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 h-7 w-7"
                  onClick={clearUser}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <div className="relative" ref={dropdownRef}>
                <div className="relative">
                  <Search className="absolute inset-s-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    value={query}
                    onChange={e => handleQueryChange(e.target.value)}
                    placeholder={t('searchPlaceholder')}
                    className="ps-9"
                    autoComplete="off"
                  />
                  {isSearching && (
                    <div className="absolute inset-e-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  )}
                </div>

                {showDropdown && (
                  <div className={cn(
                    'absolute z-50 mt-1 w-full rounded-lg border border-border bg-popover shadow-md',
                  )}>
                    {results.length === 0 ? (
                      <p className="px-3 py-2.5 text-sm text-muted-foreground">{t('searchNoResults')}</p>
                    ) : (
                      <ul>
                        {results.map(u => (
                          <li key={u.id}>
                            <button
                              type="button"
                              className="flex w-full items-center gap-2 px-3 py-2 text-start text-sm hover:bg-accent"
                              onClick={() => selectUser(u)}
                            >
                              <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                              <div className="min-w-0">
                                <p className="truncate font-medium">{userDisplayName(u)}</p>
                                {userCompany(u) && (
                                  <p className="truncate text-xs text-muted-foreground">{userCompany(u)}</p>
                                )}
                              </div>
                              {u.email && (
                                <Badge variant="secondary" className="ms-auto shrink-0 text-xs" dir="ltr">
                                  {u.email}
                                </Badge>
                              )}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            )}
          </FormField>

          <FormField label={t('source')}>
            <Select name="source" defaultValue="manual_entry">
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual_entry">{t('sources.manual_entry')}</SelectItem>
                <SelectItem value="bid_award">{t('sources.bid_award')}</SelectItem>
                <SelectItem value="product_inquiry">{t('sources.product_inquiry')}</SelectItem>
                <SelectItem value="rfq_response">{t('sources.rfq_response')}</SelectItem>
                <SelectItem value="direct_hire">{t('sources.direct_hire')}</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          <FormField label={t('pipelineStage')}>
            <Select name="pipeline_stage" defaultValue="lead">
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lead">{t('stages.lead')}</SelectItem>
                <SelectItem value="in_negotiation">{t('stages.in_negotiation')}</SelectItem>
                <SelectItem value="active_deal">{t('stages.active_deal')}</SelectItem>
                <SelectItem value="completed">{t('stages.completed')}</SelectItem>
                <SelectItem value="repeat">{t('stages.repeat')}</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          {tags.length > 0 && (
            <FormField label={t('tags')}>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <label key={tag.id as string} className="flex items-center gap-1 text-xs">
                    <Checkbox
                      name="tags"
                      value={tag.id as string}
                      checked={selectedTags.includes(tag.id as string)}
                      onCheckedChange={(v) => {
                        const id = tag.id as string;
                        setSelectedTags(prev => v ? [...prev, id] : prev.filter(t => t !== id));
                      }}
                    />
                    <span
                      className="inline-block rounded-full px-2 py-0.5"
                      style={{ backgroundColor: `${tag.color as string}20`, color: tag.color as string }}
                    >
                      {tag.name as string}
                    </span>
                  </label>
                ))}
              </div>
            </FormField>
          )}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              {t('cancel')}
            </Button>
            <Button type="submit" variant="primary" loading={isPending} disabled={!selectedUser}>
              {t('add')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
