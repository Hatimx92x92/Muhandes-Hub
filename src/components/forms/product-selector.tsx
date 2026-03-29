'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import Image from 'next/image';
import { searchPublishedProducts, type SearchedProduct } from '@/actions/products';
import { cn, getLocaleField, formatSAR } from '@/lib/utils';
import { Search, X, Package, Clock, BoxesIcon, CheckCircle2, XCircle } from 'lucide-react';

interface ProductSelectorProps {
  name: string;
  defaultValue?: string;
  defaultProduct?: SearchedProduct;
}

export function ProductSelector({ name, defaultValue, defaultProduct }: ProductSelectorProps) {
  const t = useTranslations('forms.rfq.productSelector');
  const locale = useLocale();
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<SearchedProduct[]>([]);
  const [selected, setSelected] = useState<SearchedProduct | null>(defaultProduct ?? null);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  const doSearch = useCallback(async (query: string) => {
    setIsSearching(true);
    const result = await searchPublishedProducts(query);
    if (result.data) {
      setResults(result.data);
    }
    setIsSearching(false);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(search), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, isOpen, doSearch]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <label className="mb-1.5 block text-sm font-medium text-foreground">
        {t('label')}
      </label>

      {/* Hidden input for form submission */}
      <input type="hidden" name={name} value={selected?.id ?? defaultValue ?? ''} />

      {selected ? (
        <>
          {/* Selected indicator with clear */}
          <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2.5">
            <Package className="h-4 w-4 text-primary" />
            <span className="flex-1 text-sm font-medium text-foreground">
              {getLocaleField(selected as unknown as Record<string, unknown>, 'name', locale)}
            </span>
            <button
              type="button"
              onClick={() => {
                setSelected(null);
                setSearch('');
              }}
              className="rounded p-0.5 text-muted-foreground hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Product info card */}
          <div className="mt-2 rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex gap-4">
              {/* Product image */}
              <div className="shrink-0">
                {selected.primary_image_url ? (
                  <Image
                    src={selected.primary_image_url}
                    alt={getLocaleField(selected as unknown as Record<string, unknown>, 'name', locale)}
                    width={80}
                    height={80}
                    className="rounded-lg border border-border object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-border bg-muted">
                    <Package className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Product details */}
              <div className="min-w-0 flex-1 space-y-2">
                {/* Name */}
                <h4 className="text-sm font-semibold text-foreground">
                  {getLocaleField(selected as unknown as Record<string, unknown>, 'name', locale)}
                </h4>

                {/* Description */}
                {(selected.description_ar || selected.description_en) && (
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {getLocaleField(selected as unknown as Record<string, unknown>, 'description', locale)}
                  </p>
                )}

                {/* Meta info grid */}
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {/* Price */}
                  {selected.price != null && (
                    <span className="text-sm font-medium text-primary">
                      {formatSAR(Number(selected.price), locale)}
                    </span>
                  )}

                  {/* Stock status */}
                  <span className={cn(
                    'inline-flex items-center gap-1 text-xs font-medium',
                    selected.in_stock ? 'text-emerald-600' : 'text-destructive',
                  )}>
                    {selected.in_stock
                      ? <><CheckCircle2 className="h-3.5 w-3.5" />{t('inStock')}</>
                      : <><XCircle className="h-3.5 w-3.5" />{t('outOfStock')}</>
                    }
                  </span>

                  {/* Min order */}
                  {selected.min_order_qty != null && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <BoxesIcon className="h-3.5 w-3.5" />
                      {t('minOrder', { qty: selected.min_order_qty })}
                    </span>
                  )}

                  {/* Lead time */}
                  {selected.lead_time_days != null && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {t('leadTime', { days: selected.lead_time_days })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="relative">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            suppressHydrationWarning
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => {
              setIsOpen(true);
              if (results.length === 0) doSearch('');
            }}
            placeholder={t('placeholder')}
            className="w-full rounded-lg border border-input bg-background py-2.5 pe-3 ps-9 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      )}

      {/* Dropdown */}
      {isOpen && !selected && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-popover shadow-lg">
          {isSearching ? (
            <div className="px-3 py-4 text-center text-sm text-muted-foreground">
              {t('searching')}
            </div>
          ) : results.length === 0 ? (
            <div className="px-3 py-4 text-center text-sm text-muted-foreground">
              {t('noResults')}
            </div>
          ) : (
            <ul className="max-h-60 overflow-auto py-1">
              {results.map((product) => (
                <li key={product.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(product);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className={cn(
                      'flex w-full items-center gap-3 px-3 py-2.5 text-start text-sm transition-colors hover:bg-muted',
                    )}
                  >
                    {/* Thumbnail */}
                    {product.primary_image_url ? (
                      <Image
                        src={product.primary_image_url}
                        alt=""
                        width={36}
                        height={36}
                        className="shrink-0 rounded border border-border object-cover"
                      />
                    ) : (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-border bg-muted">
                        <Package className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}

                    {/* Name + stock */}
                    <div className="min-w-0 flex-1">
                      <span className="block truncate font-medium">
                        {getLocaleField(product as unknown as Record<string, unknown>, 'name', locale)}
                      </span>
                      <span className={cn(
                        'text-xs',
                        product.in_stock ? 'text-emerald-600' : 'text-destructive',
                      )}>
                        {product.in_stock ? t('inStock') : t('outOfStock')}
                      </span>
                    </div>

                    {/* Price */}
                    {product.price != null && (
                      <span className="shrink-0 text-xs font-medium text-primary">
                        {formatSAR(Number(product.price), locale)}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
