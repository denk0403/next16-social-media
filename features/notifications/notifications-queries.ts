import 'server-only';

import { cacheLife, cacheTag } from 'next/cache';
import { cache } from 'react';
import { getCurrentUserHandle } from '@/features/user/user-queries';
import { prisma } from '@/lib/db';
import { delay } from '@/lib/utils';
import type { Notification, NotificationKind } from '@/types/notification';

export const getNotifications = cache(async (): Promise<Notification[]> => {
  const handle = await getCurrentUserHandle();
  return getNotificationsForHandle(handle);
});

async function getNotificationsForHandle(handle: string): Promise<Notification[]> {
  'use cache';
  cacheTag('notifications', `notifications:${handle}`);
  cacheLife('minutes');

  await delay(600);

  const rows = await prisma.notification.findMany({
    orderBy: { createdAt: 'desc' },
    take: 30,
    where: { recipientHandle: handle },
  });

  return rows.map(r => ({
    actorHandle: r.actorHandle,
    body: r.body ?? undefined,
    createdAt: r.createdAt,
    dropId: r.dropId ?? undefined,
    id: r.id,
    kind: r.kind as NotificationKind,
    read: r.readAt !== null,
  }));
}

export const getUnreadNotificationCount = cache(async (): Promise<number> => {
  const handle = await getCurrentUserHandle();
  return getUnreadNotificationCountForHandle(handle);
});

async function getUnreadNotificationCountForHandle(handle: string): Promise<number> {
  'use cache';
  cacheTag('notifications', `notifications:${handle}`);
  cacheLife('minutes');

  return prisma.notification.count({
    where: { readAt: null, recipientHandle: handle },
  });
}
