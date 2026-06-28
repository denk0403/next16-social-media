import 'server-only';

import { cacheLife, cacheTag } from 'next/cache';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { getCurrentUserHandle } from '@/features/user/user-queries';
import { prisma } from '@/lib/db';
import { delay } from '@/lib/utils';
import { toDrop, type Drop } from '@/types/drop';

const FEED_PAGE_SIZE = 10;

type FeedPage = { drops: Drop[]; hasMore: boolean };

export const getFeed = cache(async (page: number = 1): Promise<FeedPage> => {
  const handle = await getCurrentUserHandle();
  return getFeedForHandle(handle, page);
});

async function getFeedForHandle(handle: string, page: number): Promise<FeedPage> {
  'use cache';
  cacheTag('feed', `feed:${handle}`);
  cacheLife('minutes');

  await delay(800);
  const following = await prisma.follow.findMany({
    select: { targetHandle: true },
    where: { followerHandle: handle },
  });
  const followedHandles = [handle, ...following.map(f => f.targetHandle)];
  const rows = await prisma.drop.findMany({
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * FEED_PAGE_SIZE,
    take: FEED_PAGE_SIZE + 1,
    where: {
      authorHandle: { in: followedHandles },
      parentId: null,
    },
  });
  const hasMore = rows.length > FEED_PAGE_SIZE;
  const items = hasMore ? rows.slice(0, FEED_PAGE_SIZE) : rows;
  return {
    drops: items.map(toDrop),
    hasMore,
  };
}

export const getDiscoverFeed = cache(async (page: number = 1): Promise<FeedPage> => {
  const handle = await getCurrentUserHandle();
  return getDiscoverFeedForHandle(handle, page);
});

async function getDiscoverFeedForHandle(handle: string, page: number): Promise<FeedPage> {
  'use cache';
  cacheTag('feed', `discover:${handle}`);
  cacheLife('minutes');

  await delay(800);
  const following = await prisma.follow.findMany({
    select: { targetHandle: true },
    where: { followerHandle: handle },
  });
  const excludeHandles = [handle, ...following.map(f => f.targetHandle)];
  const rows = await prisma.drop.findMany({
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * FEED_PAGE_SIZE,
    take: FEED_PAGE_SIZE + 1,
    where: {
      authorHandle: { notIn: excludeHandles },
      parentId: null,
    },
  });
  const hasMore = rows.length > FEED_PAGE_SIZE;
  const items = hasMore ? rows.slice(0, FEED_PAGE_SIZE) : rows;
  return {
    drops: items.map(toDrop),
    hasMore,
  };
}

export const getDrop = cache(async (id: string) => {
  'use cache';
  cacheTag('drops', `drop-${id}`);
  cacheLife('hours');

  await delay(600);
  const row = await prisma.drop.findUnique({ where: { id } });
  if (!row) notFound();
  return toDrop(row);
});

export const getReplies = cache(async (dropId: string) => {
  'use cache';
  cacheTag(`replies-${dropId}`);
  cacheLife('minutes');

  await delay(1800);
  const parent = await prisma.drop.findUnique({
    select: { authorHandle: true },
    where: { id: dropId },
  });
  const rows = await prisma.drop.findMany({
    orderBy: { createdAt: 'desc' },
    where: { parentId: dropId },
  });
  // Twitter-style: pin the original author's replies first, then newest-first for everyone else.
  const authorHandle = parent?.authorHandle;
  const authorReplies = authorHandle ? rows.filter(r => r.authorHandle === authorHandle) : [];
  const otherReplies = authorHandle ? rows.filter(r => r.authorHandle !== authorHandle) : rows;
  return [...authorReplies, ...otherReplies].map(toDrop);
});

type ProfileFeedItem =
  | { kind: 'drop'; drop: Drop; pinnedAt: number }
  | { kind: 'repost'; drop: Drop; repostedBy: string; pinnedAt: number };

export const getDropsByAuthor = cache(async (handle: string): Promise<ProfileFeedItem[]> => {
  'use cache';
  cacheTag('drops', `user-drops-${handle}`);
  cacheLife('minutes');

  await delay(400);
  const [authored, reposts] = await Promise.all([
    prisma.drop.findMany({
      where: { authorHandle: handle, parentId: null },
    }),
    prisma.repost.findMany({
      include: { drop: true },
      where: { drop: { parentId: null }, userHandle: handle },
    }),
  ]);

  const items: ProfileFeedItem[] = [
    ...authored.map(d => ({ drop: toDrop(d), kind: 'drop' as const, pinnedAt: d.createdAt.getTime() })),
    ...reposts.map(r => ({
      drop: toDrop(r.drop),
      kind: 'repost' as const,
      pinnedAt: r.createdAt.getTime(),
      repostedBy: handle,
    })),
  ];
  return items.sort((a, b) => b.pinnedAt - a.pinnedAt);
});

export const getRepliesByAuthor = cache(async (handle: string) => {
  'use cache';
  cacheTag('drops', `user-replies-${handle}`);
  cacheLife('minutes');

  await delay(400);
  const rows = await prisma.drop.findMany({
    orderBy: { createdAt: 'desc' },
    where: { authorHandle: handle, parentId: { not: null } },
  });
  return rows.map(toDrop);
});

export const getDropsByTag = cache(async (tag: string) => {
  'use cache';
  cacheTag('drops', `tag-${tag}`);
  cacheLife('minutes');

  await delay(400);
  const rows = await prisma.drop.findMany({
    orderBy: { createdAt: 'desc' },
    where: { parentId: null, tags: { contains: tag } },
  });
  return rows.map(toDrop).filter(d => d.tags.includes(tag));
});

export const getBookmarkedDrops = cache(async () => {
  const handle = await getCurrentUserHandle();
  return getBookmarkedDropsForHandle(handle);
});

async function getBookmarkedDropsForHandle(handle: string) {
  'use cache';
  cacheTag(`bookmarks:${handle}`);
  cacheLife('hours');

  await delay(400);
  const rows = await prisma.bookmark.findMany({
    include: { drop: true },
    orderBy: { createdAt: 'desc' },
    where: { drop: { parentId: null }, userHandle: handle },
  });
  return rows.map(r => toDrop(r.drop));
}

export const searchDrops = cache(async (query: string) => {
  'use cache';
  cacheTag('drops', `search-${query}`);
  cacheLife('hours');

  await delay(300);
  const rows = await prisma.drop.findMany({
    orderBy: { createdAt: 'desc' },
    where: {
      body: { contains: query, mode: 'insensitive' },
      parentId: null,
    },
  });
  return rows.map(toDrop);
});
