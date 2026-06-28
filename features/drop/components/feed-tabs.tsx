'use client';

import { useSearchParams } from 'next/navigation';
import { Tabs } from '@/components/ui/tabs';
import type { Route } from 'next';

type FeedTab = 'following' | 'discover';

const FEED_TABS: { label: string; value: FeedTab; href: Route }[] = [
  { href: '/' as Route, label: 'Following', value: 'following' },
  { href: '/?tab=discover' as Route, label: 'Discover', value: 'discover' },
];

function parseTab(value: string | null): FeedTab {
  return value === 'discover' ? 'discover' : 'following';
}

export function FeedTabs() {
  const searchParams = useSearchParams();
  const active = parseTab(searchParams.get('tab'));

  return <Tabs tabs={FEED_TABS} active={active} label="Feed sections" />;
}
