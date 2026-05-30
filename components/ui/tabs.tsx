'use client';

import Link from 'next/link';
import { startTransition, useOptimistic } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { Route } from 'next';

type Tab<T extends string> = { label: string; value: T };

type Props<T extends string> = {
  tabs: Tab<T>[];
  active: T;
  action: (value: T) => void | Promise<void>;
  href: (value: T) => Route;
  label?: string;
};

export function Tabs<T extends string>({ tabs, active, action, href, label = 'Sections' }: Props<T>) {
  const [optimisticActive, setOptimisticActive] = useOptimistic(active);

  return (
    <nav
      className="border-divider/70 dark:border-divider-dark/70 flex border-b text-sm"
      aria-label={label}
      data-client="Tabs"
    >
      {tabs.map(t => {
        const isActive = optimisticActive === t.value;
        return (
          <Link
            key={t.value}
            href={href(t.value)}
            onClick={e => {
              e.preventDefault();
              if (t.value === optimisticActive) return;
              startTransition(async () => {
                setOptimisticActive(t.value);
                await action(t.value);
              });
            }}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'hover:bg-card dark:hover:bg-card-dark relative flex-1 px-4 py-4 text-center transition-colors',
              isActive ? 'font-semibold text-black dark:text-white' : 'text-gray font-medium',
            )}
          >
            {t.label}
            {isActive ? (
              <span className="absolute inset-x-6 -bottom-px h-1 rounded-t-full bg-black dark:bg-white" aria-hidden />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

export function TabsSkeleton({ count = 2 }: { count?: number }) {
  return (
    <div className="border-divider/70 dark:border-divider-dark/70 flex border-b text-sm" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} className="flex-1 px-4 py-4 text-center">
          <Skeleton className="inline-block h-4.5 w-16 rounded align-middle" />
        </span>
      ))}
    </div>
  );
}
