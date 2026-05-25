'use client';

import { useState, useTransition } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { MessageSquare, Plus, Search, Loader2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/features/empty-state';
import { searchUsersForMessaging, adminStartConversation } from '@/actions/messages';
import { cn } from '@/lib/utils';

type ConversationItem = {
  id: string;
  updated_at: string;
  lastMessageContent: string | null;
  unreadCount: number;
  participantName: string;
  participantCompany: string | null;
};

type UserResult = {
  id: string;
  full_name: string;
  company_name_ar: string | null;
  company_name_en: string | null;
  role: string;
  avatar_url: string | null;
};

interface AdminMessagesClientProps {
  conversations: ConversationItem[];
}

export function AdminMessagesClient({ conversations }: AdminMessagesClientProps) {
  const t = useTranslations('admin.messagesPage');
  const locale = useLocale();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [starting, startTransition] = useTransition();

  async function handleSearch(value: string) {
    setQuery(value);
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    const res = await searchUsersForMessaging(value);
    setResults(res.data ?? []);
    setSearching(false);
  }

  function handleSelectUser(userId: string) {
    startTransition(async () => {
      const res = await adminStartConversation(userId);
      if (res.data) {
        setOpen(false);
        router.push(`/admin/messages/${res.data.conversationId}` as Parameters<typeof router.push>[0]);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            render={
              <Button variant="primary" size="sm" className="gap-2 shrink-0">
                <Plus className="h-4 w-4" />
                {t('newConversation')}
              </Button>
            }
          />

          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t('selectUser')}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute inset-s-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder={t('searchPlaceholder')}
                  value={query}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="ps-9"
                  autoFocus
                />
              </div>

              <div className="min-h-30 space-y-1">
                {searching && (
                  <div className="flex items-center justify-center py-8 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin me-2" />
                    <span className="text-sm">...</span>
                  </div>
                )}

                {!searching && query.length < 2 && (
                  <p className="text-center text-sm text-muted-foreground py-8">
                    {t('searchMinChars')}
                  </p>
                )}

                {!searching && query.length >= 2 && results.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-8">
                    {t('noResults')}
                  </p>
                )}

                {!searching && results.map((user) => {
                  const company = locale === 'ar' ? user.company_name_ar : user.company_name_en;
                  return (
                    <button
                      key={user.id}
                      onClick={() => handleSelectUser(user.id)}
                      disabled={starting}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-start transition-colors',
                        'hover:bg-muted focus:bg-muted outline-none',
                        starting && 'opacity-50 cursor-not-allowed',
                      )}
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        <User className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{user.full_name}</p>
                        {company && (
                          <p className="truncate text-xs text-muted-foreground">{company}</p>
                        )}
                      </div>
                      {starting && <Loader2 className="h-3 w-3 animate-spin shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {conversations.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="h-12 w-12" />}
          title={t('noConversations')}
          description={t('noConversationsDesc')}
        />
      ) : (
        <div className="space-y-3">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => router.push(`/admin/messages/${conv.id}` as Parameters<typeof router.push>[0])}
              className="w-full text-start"
            >
              <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/20 cursor-pointer">
                <CardContent className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base truncate">
                        {conv.participantName}
                      </CardTitle>
                      {conv.participantCompany && (
                        <span className="text-xs text-muted-foreground truncate hidden sm:block">
                          · {conv.participantCompany}
                        </span>
                      )}
                      {conv.unreadCount > 0 && (
                        <Badge variant="info" className="shrink-0">
                          {t('unreadCount', { count: conv.unreadCount })}
                        </Badge>
                      )}
                    </div>
                    {conv.lastMessageContent && (
                      <p className="mt-1 truncate text-sm text-muted-foreground">
                        {conv.lastMessageContent}
                      </p>
                    )}
                  </div>
                  <time className="shrink-0 text-xs text-muted-foreground">
                    {new Date(conv.updated_at).toLocaleDateString(locale)}
                  </time>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
