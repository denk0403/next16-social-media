'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Tabs } from '@/components/ui/tabs';
import type { Route } from 'next';

export type ProfileTab = 'drops' | 'replies';

const PROFILE_TABS: { label: string; value: ProfileTab }[] = [
  { label: 'Drops', value: 'drops' },
  { label: 'Replies', value: 'replies' },
];

export function ProfileTabs({ handle, active }: { handle: string; active: ProfileTab }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <div data-pending={isPending ? '' : undefined}>
      <Tabs
        tabs={PROFILE_TABS}
        active={active}
        action={value => {
          startTransition(() => {
            router.push(`/u/${handle}${value === 'drops' ? '' : `?tab=${value}`}` as Route);
          });
        }}
        href={value => `/u/${handle}${value === 'drops' ? '' : `?tab=${value}`}` as Route}
        label="Profile sections"
      />
    </div>
  );
}
