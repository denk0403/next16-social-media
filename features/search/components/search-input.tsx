'use client';

import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useId, useRef, useTransition } from 'react';
import { Boundary } from '@/components/internal/boundary';
import { SeedFromSearchParam } from '@/components/scripts/seed-from-search-param';
import { Spinner } from '@/components/ui/spinner';
import { useSyncInputToSearchParam } from '@/hooks/use-sync-input-to-search-param';
import type { Route } from 'next';

export function SearchInput() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const [isPending, startTransition] = useTransition();

  useSyncInputToSearchParam(inputRef, 'q');

  return (
    <Boundary label="SearchInput">
      <div className="relative">
        {isPending ? (
          <Spinner className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 opacity-40" />
        ) : (
          <Search className="text-gray pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        )}
        <input
          ref={inputRef}
          id={inputId}
          type="search"
          name="q"
          aria-label="Search drops"
          placeholder="Search drops…"
          suppressHydrationWarning
          onChange={e => {
            const value = e.target.value;
            startTransition(() => {
              router.replace(value ? (`/search?q=${encodeURIComponent(value)}` as Route) : '/search');
            });
          }}
          className="bg-card dark:bg-card-dark placeholder-gray w-full rounded-lg py-2.5 pr-3 pl-9 text-sm outline-none"
        />
        <SeedFromSearchParam targetId={inputId} param="q" />
      </div>
    </Boundary>
  );
}
