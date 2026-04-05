'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import {
  CommandDialog,
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Handshake,
  FolderKanban,
  Package,
  Users,
  FileSignature,
  Search,
  Loader2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { globalSearch, type GlobalSearchResult } from '@/actions/search';

// =============================================================================
// Command Search — Global Cmd+K palette for dashboard
// =============================================================================

const TYPE_ICONS: Record<string, React.ElementType> = {
  deal: Handshake,
  project: FolderKanban,
  product: Package,
  crm_client: Users,
  contract: FileSignature,
  conversation: Users,
  admin_user: Users,
  admin_post: FolderKanban,
};

interface CommandSearchProps {
  isAdmin?: boolean;
}

export function CommandSearch({ isAdmin }: CommandSearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const t = useTranslations('features.commandSearch');

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!open || query.trim().length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      startTransition(async () => {
        const res = await globalSearch(query, { isAdmin });
        if (res.data) {
          setResults(res.data);
        }
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [query, open, isAdmin]);

  const handleSelect = useCallback(
    (result: GlobalSearchResult) => {
      setOpen(false);
      setQuery('');
      setResults([]);
      router.push(result.href);
    },
    [router],
  );

  // Group results by type
  const grouped = results.reduce<Record<string, GlobalSearchResult[]>>((acc, r) => {
    const group = r.type.startsWith('admin_') ? 'admin' : r.type;
    if (!acc[group]) acc[group] = [];
    acc[group].push(r);
    return acc;
  }, {});

  const typeLabels: Record<string, string> = {
    deal: t('deals'),
    project: t('projects'),
    product: t('products'),
    crm_client: t('clients'),
    contract: t('contracts'),
    conversation: t('conversations'),
    admin: t('admin'),
  };

  return (
    <>
      {/* Search trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex h-9 w-full max-w-sm items-center gap-2 rounded-lg border border-input bg-background px-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-start">{t('placeholder')}</span>
        <kbd className="pointer-events-none hidden h-5 items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog
        open={open}
        onOpenChange={(val) => {
          setOpen(val);
          if (!val) {
            setQuery('');
            setResults([]);
          }
        }}
        title={t('title')}
        description={t('description')}
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={t('placeholder')}
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {isPending && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}

            {!isPending && query.trim().length >= 2 && results.length === 0 && (
              <CommandEmpty>{t('noResults')}</CommandEmpty>
            )}

            {!isPending && query.trim().length < 2 && (
              <CommandEmpty>{t('typeToSearch')}</CommandEmpty>
            )}

            {Object.entries(grouped).map(([group, items], idx) => (
              <div key={group}>
                {idx > 0 && <CommandSeparator />}
                <CommandGroup heading={typeLabels[group] ?? group}>
                  {items.map((result) => {
                    const Icon = TYPE_ICONS[result.type] ?? Search;
                    return (
                      <CommandItem
                        key={`${result.type}-${result.id}`}
                        value={`${result.type}-${result.id}`}
                        onSelect={() => handleSelect(result)}
                      >
                        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm">{result.title}</p>
                          {result.subtitle && (
                            <p className="truncate text-xs text-muted-foreground">{result.subtitle}</p>
                          )}
                        </div>
                        <Badge variant="outline" className="shrink-0 text-[10px]">
                          {typeLabels[result.type.startsWith('admin_') ? 'admin' : result.type] ?? result.type}
                        </Badge>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </div>
            ))}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
