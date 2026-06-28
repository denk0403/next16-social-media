import { Suspense } from 'react';
import { Crossfade } from '@/components/ui/crossfade';
import { PageHeader } from '@/components/ui/page-header';
import { RefreshButton } from '@/components/ui/refresh-button';
import { MarkNotificationsRead } from '@/features/notifications/components/mark-notifications-read';
import { NotificationList, NotificationListSkeleton } from '@/features/notifications/components/notification-list';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  alternates: { canonical: '/notifications' },
  description: 'Activity on your drops.',
  robots: { follow: false, index: false },
  title: 'Activity',
};

export const prefetch = 'allow-runtime';

export default function NotificationsPage() {
  return (
    <div>
      <PageHeader title="Activity">
        <RefreshButton label="Refresh activity" />
      </PageHeader>
      <MarkNotificationsRead />
      <Suspense fallback={<NotificationListSkeleton />}>
        <Crossfade>
          <NotificationList />
        </Crossfade>
      </Suspense>
    </div>
  );
}
