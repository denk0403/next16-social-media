'use server';

import { updateTag } from 'next/cache';
import { z } from 'zod';
import { verifyAuth } from '@/features/user/user-queries';
import { prisma } from '@/lib/db';
import { delay } from '@/lib/utils';

const HASHTAG_PATTERN = /#(\w+)/g;
const FENCE_PATTERN = /```\w*\n[\s\S]*?\n?```/g;

function extractTags(body: string): string[] {
  const prose = body.replace(FENCE_PATTERN, '');
  const tags = new Set<string>();
  for (const match of prose.matchAll(HASHTAG_PATTERN)) {
    tags.add(match[1].toLowerCase());
  }
  return Array.from(tags);
}

const postDropSchema = z.object({
  body: z
    .string()
    .min(1, 'Say something')
    .max(1000, '1000 characters max')
    .transform(s => s.replace(/\r\n/g, '\n')),
});

export async function postDrop(formData: FormData) {
  await delay(300);

  const parsed = postDropSchema.safeParse({ body: formData.get('body') });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message, ok: false as const };
  }

  const me = await verifyAuth();
  const tags = extractTags(parsed.data.body);
  const drop = await prisma.drop.create({
    data: {
      authorHandle: me,
      body: parsed.data.body,
      createdAt: new Date(),
      tags: tags.join(','),
    },
  });
  updateTag('feed');
  updateTag(`user-drops-${me}`);
  updateTag('trending');
  for (const tag of tags) updateTag(`tag-${tag}`);
  return { drop, ok: true as const };
}

export async function postReply(parentId: string, formData: FormData) {
  await delay(600);

  const parsed = postDropSchema.safeParse({ body: formData.get('body') });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message, ok: false as const };
  }

  const parent = await prisma.drop.findUnique({ where: { id: parentId } });
  if (!parent) return { error: 'Drop not found', ok: false as const };

  const me = await verifyAuth();
  const tags = extractTags(parsed.data.body);
  const [reply] = await prisma.$transaction([
    prisma.drop.create({
      data: {
        authorHandle: me,
        body: parsed.data.body,
        createdAt: new Date(),
        parentId,
        tags: tags.join(','),
      },
    }),
    prisma.drop.update({ data: { replyCount: { increment: 1 } }, where: { id: parentId } }),
  ]);
  if (parent.authorHandle !== me) {
    await prisma.notification.create({
      data: {
        actorHandle: me,
        body: parsed.data.body,
        dropId: parentId,
        kind: 'reply',
        recipientHandle: parent.authorHandle,
      },
    });
    updateTag('notifications');
  }
  updateTag(`drop-${parentId}`);
  updateTag(`replies-${parentId}`);
  updateTag(`user-replies-${me}`);
  return { ok: true as const, reply };
}

const idSchema = z.string().min(1).max(30);

export async function toggleLike(dropId: string) {
  await delay(300);
  const id = idSchema.parse(dropId);
  const me = await verifyAuth();
  const existing = await prisma.like.findUnique({ where: { userHandle_dropId: { dropId: id, userHandle: me } } });
  if (existing) {
    await prisma.$transaction([
      prisma.like.delete({ where: { userHandle_dropId: { dropId: id, userHandle: me } } }),
      prisma.drop.update({ data: { likeCount: { decrement: 1 } }, where: { id } }),
    ]);
  } else {
    await prisma.$transaction([
      prisma.like.create({ data: { dropId: id, userHandle: me } }),
      prisma.drop.update({ data: { likeCount: { increment: 1 } }, where: { id } }),
    ]);
    const drop = await prisma.drop.findUnique({ select: { authorHandle: true }, where: { id } });
    if (drop && drop.authorHandle !== me) {
      await prisma.notification.create({
        data: { actorHandle: me, dropId: id, kind: 'like', recipientHandle: drop.authorHandle },
      });
      updateTag('notifications');
    }
  }
  updateTag(`drop-${id}`);
  updateTag(`user-state:${me}:${id}`);
  return { ok: true as const };
}

export async function toggleRepost(dropId: string) {
  await delay(300);
  const id = idSchema.parse(dropId);
  const me = await verifyAuth();
  const existing = await prisma.repost.findUnique({ where: { userHandle_dropId: { dropId: id, userHandle: me } } });
  if (existing) {
    await prisma.$transaction([
      prisma.repost.delete({ where: { userHandle_dropId: { dropId: id, userHandle: me } } }),
      prisma.drop.update({ data: { repostCount: { decrement: 1 } }, where: { id } }),
    ]);
  } else {
    await prisma.$transaction([
      prisma.repost.create({ data: { dropId: id, userHandle: me } }),
      prisma.drop.update({ data: { repostCount: { increment: 1 } }, where: { id } }),
    ]);
    const drop = await prisma.drop.findUnique({ select: { authorHandle: true }, where: { id } });
    if (drop && drop.authorHandle !== me) {
      await prisma.notification.create({
        data: { actorHandle: me, dropId: id, kind: 'repost', recipientHandle: drop.authorHandle },
      });
      updateTag('notifications');
    }
  }
  updateTag(`drop-${id}`);
  updateTag(`user-state:${me}:${id}`);
  updateTag(`user-drops-${me}`);
  updateTag('feed');
  return { ok: true as const };
}

export async function toggleBookmark(dropId: string) {
  await delay(250);
  const id = idSchema.parse(dropId);
  const me = await verifyAuth();
  const existing = await prisma.bookmark.findUnique({ where: { userHandle_dropId: { dropId: id, userHandle: me } } });
  if (existing) {
    await prisma.bookmark.delete({ where: { userHandle_dropId: { dropId: id, userHandle: me } } });
  } else {
    await prisma.bookmark.create({ data: { dropId: id, userHandle: me } });
  }
  updateTag(`user-state:${me}:${id}`);
  updateTag(`bookmarks:${me}`);
  return { ok: true as const };
}
