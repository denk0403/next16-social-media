'use client';

import { Tabs } from '@/components/ui/tabs';
import type { Route } from 'next';

export type ProfileTab = 'drops' | 'replies';

export function ProfileTabs({ handle, active }: { handle: string; active: ProfileTab }) {
  const tabs: { label: string; value: ProfileTab; href: Route }[] = [
    { href: `/u/${handle}` as Route, label: 'Drops', value: 'drops' },
    { href: `/u/${handle}?tab=replies` as Route, label: 'Replies', value: 'replies' },
  ];

  return <Tabs tabs={tabs} active={active} label="Profile sections" />;
}
