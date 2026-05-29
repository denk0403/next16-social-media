'use client';

import { useRouter } from 'next/navigation';
import { Tabs } from '@/components/ui/tabs';
import type { Route } from 'next';
import { useEffect } from 'react';

export type ProfileTab = 'drops' | 'replies';

const PROFILE_TABS: { label: string; value: ProfileTab }[] = [
  { label: 'Drops', value: 'drops' },
  { label: 'Replies', value: 'replies' },
];

export function ProfileTabs({ handle, active }: { handle: string; active: ProfileTab }) {
  const router = useRouter();

  useEffect(function prefetchTabs() {
    PROFILE_TABS.forEach(t => {
      router.prefetch(`/u/${handle}${t.value === 'drops' ? '' : `?tab=${t.value}`}` as Route);
    });
  }, [handle]);

  return (
    <Tabs
      tabs={PROFILE_TABS}
      active={active}
      action={value => {
        router.push(`/u/${handle}${value === 'drops' ? '' : `?tab=${value}`}` as Route);
      }}
      label="Profile sections"
    />
  );
}
