'use server';

import { updateTag } from 'next/cache';
import { verifyUser } from '@/features/user/user-queries';
import { prisma } from '@/lib/db';

export async function markAllNotificationsRead() {
  const me = await verifyUser();
  await prisma.notification.updateMany({
    data: { readAt: new Date() },
    where: { readAt: null, recipientHandle: me },
  });
  updateTag('notifications');
  return { ok: true as const };
}
