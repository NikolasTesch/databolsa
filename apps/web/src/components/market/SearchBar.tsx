'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/components/ui/cn';
import { AssetClassBadge } from '@/components/assets/AssetClassBadge';
import { Spinner } from '@/components/ui/Spinner';
import type { AssetClass } from '@/types/api';

interface SearchResult {
  ticker: string;
  name: string;
  assetClass: AssetClass;
}

interface SearchBarProps {
  variant?: 'hero' | 'compact';
  placeholder?: string;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function SearchBar({ variant = 'hero', placeholder }: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedQuery = useDebounce(query, 200);

  const defaultPlaceholder =
    variant === 'hero'
      ? 'Pesquise por ticker ou nome... ex: PETR4, Bitcoin'
      : 'Buscar ativo...';

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch(`/api/market/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setResults(data.results ?? []);
        setOpen((data.results ?? []).length > 0);
        setActiveIndex(-1);
      })
      .catch(() => {
        if (!cancelled) setResults([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const navigate = useCallback(
    (result: SearchResult) => {
      router.push(`/ativos/${result.ticker}?class=${result.assetClass}`);
      setQuery('');
      setOpen(false);
      setResults([]);
    },
    [router],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && results[activeIndex]) {
        navigate(results[activeIndex]);
      } else if (results.length > 0) {
        navigate(results[0]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isHero = variant === 'hero';

  return (
    <div ref={containerRef} className={cn('relative w-full', isHero ? 'max-w-xl mx-auto' : 'max-w-xs')}>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-content-muted" aria-hidden="true">
          <svg className={cn('fill-none stroke-current', isHero ? 'h-5 w-5' : 'h-4 w-4')} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </span>
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          aria-controls="search-listbox"
          aria-activedescendant={activeIndex >= 0 ? `search-item-${activeIndex}` : undefined}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder ?? defaultPlaceholder}
          className={cn(
            'w-full rounded-lg border border-border bg-surface text-content placeholder:text-content-subtle',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary',
            'transition-colors',
            isHero ? 'h-12 pl-11 pr-4 text-base' : 'h-9 pl-9 pr-3 text-sm',
          )}
        />
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">
            <Spinner size="sm" />
          </span>
        )}
      </div>

      {open && results.length > 0 && (
        <ul
          id="search-listbox"
          role="listbox"
          className="absolute z-dropdown mt-1 w-full rounded-lg border border-border bg-surface shadow-md overflow-hidden"
        >
          {results.map((result, index) => (
            <li
              key={result.ticker}
              id={`search-item-${index}`}
              role="option"
              aria-selected={activeIndex === index}
              onMouseDown={(e) => {
                e.preventDefault();
                navigate(result);
              }}
              onMouseEnter={() => setActiveIndex(index)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 cursor-pointer',
                activeIndex === index ? 'bg-surface-muted' : 'hover:bg-surface-muted',
              )}
            >
              <AssetClassBadge assetClass={result.assetClass} />
              <span className="font-mono text-sm font-semibold text-content">{result.ticker}</span>
              <span className="text-xs text-content-muted truncate flex-1">{result.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
