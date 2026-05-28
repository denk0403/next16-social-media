'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { Route } from 'next';
import Link, { useLinkStatus } from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

export type Tab<T extends string> = { label: string; value: T; href: Route };
export type TabParser<T extends string> = (value: string) => T;

type Props<T extends string> = {
  tabs: Tab<T>[];
  label?: string;
  parser: TabParser<T>;
};

export function Tabs<T extends string>({ tabs, label = 'Sections', parser }: Props<T>) {
  return (
    <nav
      className="border-divider/70 dark:border-divider-dark/70 flex border-b text-sm"
      aria-label={label}
      data-client="Tabs"
    >
      {tabs.map(t => (
        <Suspense key={t.value} fallback={<ActivatableTabLink tab={t} isActive={false} />}>
          <TabLink key={t.value} tab={t} parser={parser} />
        </Suspense>
      ))}
    </nav>
  );
}

function TabLink<T extends string>({ tab, parser }: { tab: Tab<T>; parser: TabParser<T> }) {
  const searchParams = useSearchParams();
  const active = parser(searchParams.get('tab') ?? '') === tab.value;
  return <ActivatableTabLink tab={tab} isActive={active} />;
}

function ActivatableTabLink<T extends string>({ tab, isActive }: { tab: Tab<T>; isActive: boolean }) {
  return (
    <Link
      href={tab.href}
      aria-current={isActive ? 'page' : undefined}
      transitionTypes={['tabChange']}
      className={cn(
        'hover:bg-card dark:hover:bg-card-dark relative flex-1 px-4 py-4 transition-colors',
        isActive ? 'font-semibold text-black dark:text-white' : 'text-gray font-medium',
      )}
    >
      <TabLinkContent>{tab.label}</TabLinkContent>
      {isActive ? (
        <span className="absolute inset-x-6 -bottom-px h-1 rounded-t-full bg-black dark:bg-white" aria-hidden />
      ) : null}
    </Link>
  );
}

function TabLinkContent({ children }: { children: React.ReactNode }) {
  const { pending } = useLinkStatus();
  return <span className={cn(pending && 'animate-pulse')}>{children}</span>;
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
