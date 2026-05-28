'use client';

import { Tabs } from '@/components/ui/tabs';
import type { Route } from 'next';

type FeedTab = 'following' | 'discover';

const FEED_TABS: { label: string; value: FeedTab; href: Route }[] = [
  { label: 'Following', value: 'following', href: '/' },
  { label: 'Discover', value: 'discover', href: '/?tab=discover' },
];

function parseTab(value: string): FeedTab {
  return value === 'discover' ? 'discover' : 'following';
}

export function FeedTabs() {
  return (
    <Tabs
      tabs={FEED_TABS}
      label="Feed sections"
      parser={parseTab}
    />
  );
}
