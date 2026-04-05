'use client';

import { useState, useEffect, useTransition, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Bookmark, Plus, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
  saveFilter as saveFilterAction,
  getSavedFilters as getSavedFiltersAction,
  deleteSavedFilter as deleteSavedFilterAction,
  type SavedFilter,
} from '@/actions/filters';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type PageKey = 'projects' | 'marketplace' | 'rfqs';

interface SavedFiltersProps {
  page: PageKey;
  translations: Record<string, string>;
  isAuthenticated: boolean;
}

// ---------------------------------------------------------------------------
// Local storage key
// ---------------------------------------------------------------------------
const LS_KEY = 'muhandes_saved_filters';

function getLocalFilters(page: string): SavedFilter[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const all = JSON.parse(raw) as SavedFilter[];
    return all.filter((f) => f.page === page);
  } catch {
    return [];
  }
}

function setLocalFilters(page: string, filters: SavedFilter[]) {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const all: SavedFilter[] = raw ? JSON.parse(raw) : [];
    const others = all.filter((f) => f.page !== page);
    localStorage.setItem(LS_KEY, JSON.stringify([...others, ...filters]));
  } catch {
    // silent
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function SavedFilters({ page, translations: t, isAuthenticated }: SavedFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<SavedFilter[]>([]);
  const [name, setName] = useState('');
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Gather current URL params (excluding page number)
  const getCurrentFilters = useCallback((): Record<string, string> => {
    const result: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      if (key !== 'page' && value) result[key] = value;
    });
    return result;
  }, [searchParams]);

  const hasActiveFilters = Object.keys(getCurrentFilters()).length > 0;

  // Load saved filters on mount
  useEffect(() => {
    if (isAuthenticated) {
      getSavedFiltersAction(page).then((res) => {
        if (res.data) setFilters(res.data);
      });
    } else {
      setFilters(getLocalFilters(page));
    }
  }, [page, isAuthenticated]);

  // Save filter
  const handleSave = () => {
    if (!name.trim()) return;
    const currentFilters = getCurrentFilters();
    if (Object.keys(currentFilters).length === 0) return;

    startTransition(async () => {
      if (isAuthenticated) {
        const res = await saveFilterAction({ name: name.trim(), page, filters: currentFilters });
        if (res.data) setFilters((prev) => [res.data!, ...prev]);
      } else {
        const newFilter: SavedFilter = {
          id: crypto.randomUUID(),
          name: name.trim(),
          page,
          filters: currentFilters,
          created_at: new Date().toISOString(),
        };
        const updated = [newFilter, ...filters];
        setLocalFilters(page, updated);
        setFilters(updated);
      }
      setName('');
      setOpen(false);
    });
  };

  // Delete filter
  const handleDelete = (id: string) => {
    startTransition(async () => {
      if (isAuthenticated) {
        await deleteSavedFilterAction(id);
      }
      const updated = filters.filter((f) => f.id !== id);
      if (!isAuthenticated) setLocalFilters(page, updated);
      setFilters(updated);
    });
  };

  // Apply filter — navigate with URL params
  const handleApply = (filter: SavedFilter) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filter.filters)) {
      if (value) params.set(key, value);
    }
    const qs = params.toString();
    router.push(qs ? `?${qs}` : '?');
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Saved filter chips */}
      {filters.map((filter) => (
        <Badge
          key={filter.id}
          variant="secondary"
          className="cursor-pointer gap-1.5 py-1 pe-1 ps-2.5 text-xs transition-colors hover:bg-secondary/80"
        >
          <button
            type="button"
            onClick={() => handleApply(filter)}
            className="flex items-center gap-1"
          >
            <Bookmark className="h-3 w-3" />
            {filter.name}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(filter.id);
            }}
            className="inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-destructive/20 hover:text-destructive"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </Badge>
      ))}

      {/* Save current filters button */}
      {hasActiveFilters && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            render={
              <Button variant="outline" size="sm" className="h-7 gap-1 text-xs">
                <Plus className="h-3 w-3" />
                {t.save}
              </Button>
            }
          />
          <PopoverContent align="start" className="w-64">
            <div className="space-y-2">
              <p className="text-xs font-medium">{t.saveTitle}</p>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                placeholder={t.namePlaceholder}
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                maxLength={50}
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setOpen(false)}
                  className="h-7 text-xs"
                >
                  {t.cancel}
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={!name.trim() || isPending}
                  className="h-7 text-xs"
                >
                  {isPending && <Loader2 className="h-3 w-3 animate-spin me-1" />}
                  {t.confirm}
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
