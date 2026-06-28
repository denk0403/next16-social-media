'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Boundary } from '@/components/internal/boundary';
import type { Route } from 'next';

export function LoadMore({ href }: { href: Route }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Boundary label="LoadMore">
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          startTransition(() => {
            router.push(href, { scroll: false });
          });
        }}
        className="border-divider dark:border-divider-dark rounded-full border px-4 py-2 text-sm font-medium transition-colors hover:bg-black/5 disabled:opacity-50 dark:hover:bg-white/5"
      >
        {isPending ? 'Loading…' : 'Load more'}
      </button>
    </Boundary>
  );
}
