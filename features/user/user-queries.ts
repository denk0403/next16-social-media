import 'server-only';

import { cacheLife, cacheTag } from 'next/cache';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { prisma } from '@/lib/db';
import { delay } from '@/lib/utils';

const SESSION_COOKIE = 'drop-user';
const DEFAULT_HANDLE = 'aurora';

export const getCurrentUserHandle = cache(async (): Promise<string> => {
  'use cache: private';

  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value ?? DEFAULT_HANDLE;
});

export async function verifyAuth(): Promise<string> {
  const handle = await getCurrentUserHandle();
  const user = await prisma.user.findUnique({ where: { handle } });
  if (!user) throw new Error('Unauthorized');
  return handle;
}

export const getCurrentUser = cache(async () => {
  'use cache: private';
  cacheTag('current-user');

  return getUserByHandle(await getCurrentUserHandle());
});

export const getUserByHandle = cache(async (handle: string) => {
  'use cache';
  cacheTag('users', `user-${handle}`);
  cacheLife('minutes');

  await delay(500);
  const user = await prisma.user.findUnique({ where: { handle } });
  if (!user) notFound();
  return user;
});

export const getWhoToFollow = cache(async () => {
  const handle = await getCurrentUserHandle();
  return getWhoToFollowForHandle(handle);
});

async function getWhoToFollowForHandle(handle: string) {
  'use cache';
  cacheTag(`who-to-follow:${handle}`);

  await delay(700);
  const followed = await prisma.follow.findMany({
    select: { targetHandle: true },
    where: { followerHandle: handle },
  });
  return prisma.user.findMany({
    take: 3,
    where: {
      handle: {
        notIn: [handle, ...followed.map(f => f.targetHandle)],
      },
    },
  });
}

export const isFollowing = cache(async (targetHandle: string) => {
  const followerHandle = await getCurrentUserHandle();
  return isFollowingForHandle(followerHandle, targetHandle);
});

async function isFollowingForHandle(followerHandle: string, targetHandle: string) {
  'use cache';
  cacheTag(`is-following:${followerHandle}:${targetHandle}`);

  await delay(120);
  const row = await prisma.follow.findUnique({
    where: { followerHandle_targetHandle: { followerHandle, targetHandle } },
  });
  return row !== null;
}

export const searchUsers = cache(async (query: string) => {
  'use cache';
  cacheTag('users', `search-users-${query}`);
  cacheLife('hours');

  await delay(200);
  return prisma.user.findMany({
    take: 5,
    where: {
      OR: [
        { handle: { contains: query, mode: 'insensitive' } },
        { displayName: { contains: query, mode: 'insensitive' } },
      ],
    },
  });
});

export type DropUserState = {
  liked: boolean;
  reposted: boolean;
  bookmarked: boolean;
};

export const getDropUserState = cache(async (dropId: string): Promise<DropUserState> => {
  const handle = await getCurrentUserHandle();
  return getDropUserStateForHandle(dropId, handle);
});

async function getDropUserStateForHandle(dropId: string, handle: string): Promise<DropUserState> {
  'use cache';
  cacheTag(`user-state:${handle}:${dropId}`);

  await delay(300);
  const [like, repost, bookmark] = await Promise.all([
    prisma.like.findUnique({ where: { userHandle_dropId: { dropId, userHandle: handle } } }),
    prisma.repost.findUnique({ where: { userHandle_dropId: { dropId, userHandle: handle } } }),
    prisma.bookmark.findUnique({ where: { userHandle_dropId: { dropId, userHandle: handle } } }),
  ]);
  return { bookmarked: bookmark !== null, liked: like !== null, reposted: repost !== null };
}

export const getAllUsers = cache(async () => {
  'use cache';
  cacheTag('users');
  cacheLife('minutes');

  return prisma.user.findMany({
    orderBy: { handle: 'asc' },
    select: { avatarColor: true, displayName: true, handle: true },
  });
});
