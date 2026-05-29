'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs } from '@/components/ui/tabs';
import type { Route } from 'next';
import { useEffect } from 'react';

type FeedTab = 'following' | 'discover';

const FEED_TABS: { label: string; value: FeedTab }[] = [
  { label: 'Following', value: 'following' },
  { label: 'Discover', value: 'discover' },
];

function parseTab(value: string | null): FeedTab {
  return value === 'discover' ? 'discover' : 'following';
}

export function FeedTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const active = parseTab(searchParams.get('tab'));

  useEffect(function prefetchTabs() {
    FEED_TABS.forEach(t => {
      router.prefetch((t.value === 'following' ? '/' : '/?tab=discover') as Route);
    });
  }, [router]);

  return (
    <Tabs
      tabs={FEED_TABS}
      active={active}
      action={value => {
        router.push((value === 'following' ? '/' : '/?tab=discover') as Route);
      }}
      label="Feed sections"
    />
  );
}
