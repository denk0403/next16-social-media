import 'server-only';

import { cacheLife, cacheTag } from 'next/cache';
import { cache } from 'react';
import { getCurrentUserHandle } from '@/features/user/user-queries';
import { prisma } from '@/lib/db';
import { delay } from '@/lib/utils';
import type { Notification, NotificationKind } from '@/types/notification';

export const getNotifications = cache(async (): Promise<Notification[]> => {
  'use cache: private';
  cacheTag('notifications');
  cacheLife('seconds');

  await delay(600);

  const handle = await getCurrentUserHandle();

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
});

export const getUnreadNotificationCount = cache(async (): Promise<number> => {
  'use cache: private';
  cacheTag('notifications');
  cacheLife('seconds');

  const handle = await getCurrentUserHandle();
  return prisma.notification.count({
    where: { readAt: null, recipientHandle: handle },
  });
});
