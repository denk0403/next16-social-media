/* eslint-disable no-console */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { BOOKMARKS, DROPS, FOLLOWS, LIKES, REPLIES, REPOSTS, USERS } from '../lib/seed-data';
import { PrismaClient } from '../generated/prisma/client';

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  console.log('Clearing existing data...');
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

  console.log(`Seeded ${USERS.length} users, ${DROPS.length + REPLIES.length} drops`);
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
