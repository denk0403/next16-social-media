'use client';

import { Tabs } from '@/components/ui/tabs';
import { parseProfileTab } from '@/lib/parseProfileTab';
import type { Route } from 'next';

export type ProfileTab = 'drops' | 'replies';

export function ProfileTabs({ handle }: { handle: string }) {
  const tabs: { label: string; value: ProfileTab; href: Route }[] = [
    { label: 'Drops', value: 'drops', href: `/u/${handle}` as Route },
    { label: 'Replies', value: 'replies', href: `/u/${handle}?tab=replies` as Route },
  ];

  return <Tabs tabs={tabs} label="Profile sections" parser={parseProfileTab} />;
}
