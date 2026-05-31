'use server';

import { updateTag } from 'next/cache';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { verifyUser } from '@/features/user/user-queries';
import { prisma } from '@/lib/db';
import { delay } from '@/lib/utils';

const handleSchema = z.string().min(1).max(30).regex(/^\w+$/);
const SESSION_COOKIE = 'drop-user';

export async function switchUser(handle: string) {
  const target = handleSchema.parse(handle);
  const store = await cookies();
  store.set(SESSION_COOKIE, target, { path: '/', sameSite: 'lax' });
  updateTag('current-user');
}

export async function toggleFollow(targetHandle: string) {
  await delay(100);
  const target = handleSchema.parse(targetHandle);
  const me = await verifyUser();
  if (target === me) {
    return { ok: false as const };
  }
  const existing = await prisma.follow.findUnique({
    where: { followerHandle_targetHandle: { followerHandle: me, targetHandle: target } },
  });
  if (existing) {
    await prisma.$transaction([
      prisma.follow.delete({ where: { followerHandle_targetHandle: { followerHandle: me, targetHandle: target } } }),
      prisma.user.update({ data: { following: { decrement: 1 } }, where: { handle: me } }),
      prisma.user.update({ data: { followers: { decrement: 1 } }, where: { handle: target } }),
    ]);
  } else {
    await prisma.$transaction([
      prisma.follow.create({ data: { followerHandle: me, targetHandle: target } }),
      prisma.user.update({ data: { following: { increment: 1 } }, where: { handle: me } }),
      prisma.user.update({ data: { followers: { increment: 1 } }, where: { handle: target } }),
    ]);
    await prisma.notification.create({
      data: { actorHandle: me, kind: 'follow', recipientHandle: target },
    });
    updateTag('notifications');
  }
  updateTag(`user-${target}`);
  updateTag(`user-${me}`);
  updateTag(`is-following-${target}`);
  updateTag(`who-to-follow-${me}`);
  updateTag('feed');
  return { ok: true as const };
}
