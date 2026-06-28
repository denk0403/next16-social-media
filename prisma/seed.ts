/* eslint-disable no-console */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { BOOKMARKS, DROPS, FOLLOWS, LIKES, REPLIES, REPOSTS, USERS } from '../lib/seed-data';
import { PrismaClient } from '../generated/prisma/client';
import { normalizeDatabaseUrl } from '../lib/db-url';

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
  const adapter = new PrismaPg({ connectionString: normalizeDatabaseUrl(process.env.DATABASE_URL) });
  const prisma = new PrismaClient({ adapter });

  console.log('Clearing existing data...');
  await prisma.notification.deleteMany();
  await prisma.like.deleteMany();
  await prisma.repost.deleteMany();
  await prisma.bookmark.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.drop.deleteMany();
  await prisma.user.deleteMany();

  console.log('Inserting users...');
  for (const u of USERS) {
    await prisma.user.create({ data: u });
  }

  console.log('Inserting drops...');
  for (const d of [...DROPS, ...REPLIES]) {
    await prisma.drop.create({
      data: {
        authorHandle: d.authorHandle,
        body: d.body,
        createdAt: d.createdAt,
        embeddedCode: d.embeddedCode?.code,
        embeddedLang: d.embeddedCode?.lang,
        id: d.id,
        likeCount: d.likes,
        parentId: d.parentId,
        replyCount: d.replies,
        repostCount: d.reposts,
        tags: d.tags.join(','),
      },
    });
  }

  console.log('Reconciling reply counts...');
  const parents = await prisma.drop.groupBy({
    _count: { _all: true },
    by: ['parentId'],
    where: { parentId: { not: null } },
  });
  await prisma.drop.updateMany({ data: { replyCount: 0 }, where: { parentId: null } });
  for (const p of parents) {
    if (!p.parentId) continue;
    await prisma.drop.update({ data: { replyCount: p._count._all }, where: { id: p.parentId } });
  }

  console.log('Inserting follows...');
  for (const [follower, targets] of Object.entries(FOLLOWS)) {
    for (const target of targets) {
      await prisma.follow.create({ data: { followerHandle: follower, targetHandle: target } });
    }
  }

  console.log('Inserting likes...');
  for (const [user, drops] of Object.entries(LIKES)) {
    for (const dropId of drops) {
      await prisma.like.create({ data: { dropId, userHandle: user } });
    }
  }

  console.log('Inserting reposts...');
  for (const [user, drops] of Object.entries(REPOSTS)) {
    for (const dropId of drops) {
      await prisma.repost.create({ data: { dropId, userHandle: user } });
    }
  }

  console.log('Inserting bookmarks...');
  for (const [user, drops] of Object.entries(BOOKMARKS)) {
    for (const dropId of drops) {
      await prisma.bookmark.create({ data: { dropId, userHandle: user } });
    }
  }

  console.log('Backfilling notifications from existing activity...');
  const dropsForNotifs = await prisma.drop.findMany({
    select: { authorHandle: true, body: true, id: true, parentId: true },
  });
  const dropById = new Map(dropsForNotifs.map(d => [d.id, d]));

  // Likes
  const allLikes = await prisma.like.findMany();
  for (const like of allLikes) {
    const drop = dropById.get(like.dropId);
    if (!drop || drop.authorHandle === like.userHandle) continue;
    await prisma.notification.create({
      data: {
        actorHandle: like.userHandle,
        createdAt: like.createdAt,
        dropId: like.dropId,
        kind: 'like',
        readAt: like.createdAt,
        recipientHandle: drop.authorHandle,
      },
    });
  }
  // Reposts
  const allReposts = await prisma.repost.findMany();
  for (const repost of allReposts) {
    const drop = dropById.get(repost.dropId);
    if (!drop || drop.authorHandle === repost.userHandle) continue;
    await prisma.notification.create({
      data: {
        actorHandle: repost.userHandle,
        createdAt: repost.createdAt,
        dropId: repost.dropId,
        kind: 'repost',
        readAt: repost.createdAt,
        recipientHandle: drop.authorHandle,
      },
    });
  }
  // Follows
  const allFollows = await prisma.follow.findMany();
  for (const follow of allFollows) {
    await prisma.notification.create({
      data: {
        actorHandle: follow.followerHandle,
        createdAt: follow.createdAt,
        kind: 'follow',
        readAt: follow.createdAt,
        recipientHandle: follow.targetHandle,
      },
    });
  }
  // Replies
  for (const reply of dropsForNotifs) {
    if (!reply.parentId) continue;
    const parent = dropById.get(reply.parentId);
    if (!parent || parent.authorHandle === reply.authorHandle) continue;
    await prisma.notification.create({
      data: {
        actorHandle: reply.authorHandle,
        body: reply.body,
        dropId: reply.parentId,
        kind: 'reply',
        readAt: new Date(),
        recipientHandle: parent.authorHandle,
      },
    });
  }

  console.log(`Seeded ${USERS.length} users, ${DROPS.length + REPLIES.length} drops`);
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
