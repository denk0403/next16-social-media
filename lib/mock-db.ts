import 'server-only';

import {
  BOOKMARKS,
  DROPS,
  FOLLOWS,
  LIKES,
  REPLIES,
  REPOSTS,
  USERS,
} from '@/lib/seed-data';
import type { DbBookmark, DbDrop, DbFollow, DbLike, DbRepost, DbUser } from '@/lib/db-types';

type OrderBy = Record<string, 'asc' | 'desc'>;

function sortRows<T extends Record<string, unknown>>(rows: T[], orderBy?: OrderBy | OrderBy[]): T[] {
  if (!orderBy) return rows;
  const rules = Array.isArray(orderBy) ? orderBy : [orderBy];
  return [...rows].sort((a, b) => {
    for (const rule of rules) {
      const [field, direction] = Object.entries(rule)[0] ?? [];
      if (!field) continue;
      const left = a[field];
      const right = b[field];
      if (left === right) continue;
      if (left instanceof Date && right instanceof Date) {
        return direction === 'asc' ? left.getTime() - right.getTime() : right.getTime() - left.getTime();
      }
      if (typeof left === 'string' && typeof right === 'string') {
        return direction === 'asc' ? left.localeCompare(right) : right.localeCompare(left);
      }
      if (typeof left === 'number' && typeof right === 'number') {
        return direction === 'asc' ? left - right : right - left;
      }
    }
    return 0;
  });
}

function paginate<T>(rows: T[], skip = 0, take?: number): T[] {
  const sliced = rows.slice(skip);
  return take === undefined ? sliced : sliced.slice(0, take);
}

function pick<T extends Record<string, unknown>, K extends keyof T>(row: T, select?: Partial<Record<K, true>>): T | Pick<T, K> {
  if (!select) return row;
  const picked = {} as Pick<T, K>;
  for (const key of Object.keys(select) as K[]) {
    if (select[key]) picked[key] = row[key];
  }
  return picked;
}

function matchesStringFilter(value: string, filter: string | { in?: string[]; notIn?: string[]; contains?: string; mode?: 'insensitive' }): boolean {
  if (typeof filter === 'string') return value === filter;
  if (filter.in && !filter.in.includes(value)) return false;
  if (filter.notIn && filter.notIn.includes(value)) return false;
  if (filter.contains) {
    const haystack = filter.mode === 'insensitive' ? value.toLowerCase() : value;
    const needle = filter.mode === 'insensitive' ? filter.contains.toLowerCase() : filter.contains;
    if (!haystack.includes(needle)) return false;
  }
  return true;
}

function matchesDropWhere(row: DbDrop, where: Record<string, unknown>): boolean {
  if (where.id !== undefined && row.id !== where.id) return false;
  if (where.authorHandle !== undefined && !matchesStringFilter(row.authorHandle, where.authorHandle as never)) return false;
  if (where.parentId === null && row.parentId !== null) return false;
  if (where.parentId && typeof where.parentId === 'object' && 'not' in where.parentId) {
    if (where.parentId.not === null && row.parentId === null) return false;
  }
  if (where.tags && typeof where.tags === 'object' && 'contains' in where.tags) {
    if (!row.tags.includes(String(where.tags.contains))) return false;
  }
  if (where.body && typeof where.body === 'object' && 'contains' in where.body) {
    const bodyFilter = where.body as { contains: string; mode?: 'insensitive' };
    const haystack = bodyFilter.mode === 'insensitive' ? row.body.toLowerCase() : row.body;
    const needle = bodyFilter.mode === 'insensitive' ? bodyFilter.contains.toLowerCase() : bodyFilter.contains;
    if (!haystack.includes(needle)) return false;
  }
  return true;
}

function matchesUserWhere(row: DbUser, where: Record<string, unknown>): boolean {
  if (where.handle !== undefined && !matchesStringFilter(row.handle, where.handle as never)) return false;
  if (where.OR && Array.isArray(where.OR)) {
    const matched = where.OR.some(orWhere => matchesUserWhere(row, orWhere as Record<string, unknown>));
    if (!matched) return false;
  }
  if (where.displayName && typeof where.displayName === 'object' && 'contains' in where.displayName) {
    const filter = where.displayName as { contains: string; mode?: 'insensitive' };
    const haystack = filter.mode === 'insensitive' ? row.displayName.toLowerCase() : row.displayName;
    const needle = filter.mode === 'insensitive' ? filter.contains.toLowerCase() : filter.contains;
    if (!haystack.includes(needle)) return false;
  }
  return true;
}

function applyNumericUpdate(value: number, update: number | { increment?: number; decrement?: number }): number {
  if (typeof update === 'number') return update;
  if (update.increment !== undefined) return value + update.increment;
  if (update.decrement !== undefined) return value - update.decrement;
  return value;
}

class MockStore {
  users: DbUser[] = [];
  drops: DbDrop[] = [];
  likes: DbLike[] = [];
  reposts: DbRepost[] = [];
  bookmarks: DbBookmark[] = [];
  follows: DbFollow[] = [];

  reset() {
    this.users = [];
    this.drops = [];
    this.likes = [];
    this.reposts = [];
    this.bookmarks = [];
    this.follows = [];
  }
}

function populateStore(store: MockStore) {
  store.reset();

  for (const user of USERS) {
    store.users.push({ ...user, createdAt: new Date() });
  }

  for (const drop of [...DROPS, ...REPLIES]) {
    store.drops.push({
      authorHandle: drop.authorHandle,
      body: drop.body,
      createdAt: drop.createdAt,
      embeddedCode: drop.embeddedCode?.code ?? null,
      embeddedLang: drop.embeddedCode?.lang ?? null,
      id: drop.id,
      likeCount: drop.likes,
      parentId: drop.parentId ?? null,
      replyCount: drop.replies,
      repostCount: drop.reposts,
      tags: drop.tags.join(','),
    });
  }

  const replyCounts = new Map<string, number>();
  for (const drop of store.drops) {
    if (!drop.parentId) continue;
    replyCounts.set(drop.parentId, (replyCounts.get(drop.parentId) ?? 0) + 1);
  }
  for (const drop of store.drops) {
    if (drop.parentId) continue;
    drop.replyCount = replyCounts.get(drop.id) ?? 0;
  }

  for (const [follower, targets] of Object.entries(FOLLOWS)) {
    for (const target of targets) {
      store.follows.push({ createdAt: new Date(), followerHandle: follower, targetHandle: target });
    }
  }

  for (const [userHandle, dropIds] of Object.entries(LIKES)) {
    for (const dropId of dropIds) {
      store.likes.push({ createdAt: new Date(), dropId, userHandle });
    }
  }

  for (const [userHandle, dropIds] of Object.entries(REPOSTS)) {
    for (const dropId of dropIds) {
      store.reposts.push({ createdAt: new Date(), dropId, userHandle });
    }
  }

  for (const [userHandle, dropIds] of Object.entries(BOOKMARKS)) {
    for (const dropId of dropIds) {
      store.bookmarks.push({ createdAt: new Date(), dropId, userHandle });
    }
  }
}

const globalForMock = globalThis as unknown as { mockStore?: MockStore };
const store = globalForMock.mockStore ?? new MockStore();
if (!globalForMock.mockStore) {
  populateStore(store);
  globalForMock.mockStore = store;
}

export class MockPrismaClient {
  user = {
    create: async ({ data }: { data: Omit<DbUser, 'createdAt'> & { createdAt?: Date } }) => {
      const row: DbUser = { ...data, createdAt: data.createdAt ?? new Date() };
      store.users.push(row);
      return row;
    },
    deleteMany: async () => {
      store.users = [];
      return { count: 0 };
    },
    findMany: async ({
      orderBy,
      select,
      take,
      where,
    }: {
      orderBy?: OrderBy;
      select?: Partial<Record<keyof DbUser, true>>;
      take?: number;
      where?: Record<string, unknown>;
    } = {}) => {
      let rows = store.users.filter(row => (where ? matchesUserWhere(row, where) : true));
      rows = sortRows(rows, orderBy);
      rows = take === undefined ? rows : rows.slice(0, take);
      return rows.map(row => pick(row, select));
    },
    findUnique: async ({ where }: { where: { handle?: string } }) => {
      return store.users.find(row => row.handle === where.handle) ?? null;
    },
    update: async ({
      data,
      where,
    }: {
      data: Partial<Record<keyof DbUser, number | { increment?: number; decrement?: number }>>;
      where: { handle: string };
    }) => {
      const row = store.users.find(item => item.handle === where.handle);
      if (!row) throw new Error('User not found');
      if (data.followers !== undefined) row.followers = applyNumericUpdate(row.followers, data.followers);
      if (data.following !== undefined) row.following = applyNumericUpdate(row.following, data.following);
      return row;
    },
  };

  drop = {
    create: async ({ data }: { data: Partial<DbDrop> & Pick<DbDrop, 'authorHandle' | 'body' | 'createdAt'> }) => {
      const row: DbDrop = {
        authorHandle: data.authorHandle,
        body: data.body,
        createdAt: data.createdAt,
        embeddedCode: data.embeddedCode ?? null,
        embeddedLang: data.embeddedLang ?? null,
        id: data.id ?? `d-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        likeCount: data.likeCount ?? 0,
        parentId: data.parentId ?? null,
        replyCount: data.replyCount ?? 0,
        repostCount: data.repostCount ?? 0,
        tags: data.tags ?? '',
      };
      store.drops.push(row);
      return row;
    },
    deleteMany: async () => {
      store.drops = [];
      return { count: 0 };
    },
    findMany: async ({
      orderBy,
      select,
      skip,
      take,
      where,
    }: {
      orderBy?: OrderBy;
      select?: Partial<Record<keyof DbDrop, true>>;
      skip?: number;
      take?: number;
      where?: Record<string, unknown>;
    } = {}) => {
      let rows = store.drops.filter(row => (where ? matchesDropWhere(row, where) : true));
      rows = sortRows(rows, orderBy);
      rows = paginate(rows, skip, take);
      return rows.map(row => pick(row, select));
    },
    findUnique: async ({
      select,
      where,
    }: {
      select?: Partial<Record<keyof DbDrop, true>>;
      where: { id: string };
    }) => {
      const row = store.drops.find(item => item.id === where.id);
      return row ? pick(row, select) : null;
    },
    groupBy: async ({
      _count,
      by,
      where,
    }: {
      _count?: { _all?: true };
      by: Array<keyof DbDrop>;
      where?: Record<string, unknown>;
    }) => {
      const groups = new Map<string, { parentId: string | null; _count: { _all: number } }>();
      for (const row of store.drops) {
        if (where && !matchesDropWhere(row, where)) continue;
        const key = String(row[by[0] as keyof DbDrop]);
        const existing = groups.get(key);
        if (existing) {
          existing._count._all += 1;
        } else {
          groups.set(key, { _count: { _all: 1 }, parentId: row.parentId });
        }
      }
      return Array.from(groups.values());
    },
    update: async ({
      data,
      where,
    }: {
      data: Partial<Record<keyof DbDrop, number | { increment?: number; decrement?: number }>>;
      where: { id: string };
    }) => {
      const row = store.drops.find(item => item.id === where.id);
      if (!row) throw new Error('Drop not found');
      if (data.replyCount !== undefined) row.replyCount = applyNumericUpdate(row.replyCount, data.replyCount);
      if (data.likeCount !== undefined) row.likeCount = applyNumericUpdate(row.likeCount, data.likeCount);
      if (data.repostCount !== undefined) row.repostCount = applyNumericUpdate(row.repostCount, data.repostCount);
      return row;
    },
    updateMany: async ({ data, where }: { data: Partial<DbDrop>; where?: Record<string, unknown> }) => {
      let count = 0;
      for (const row of store.drops) {
        if (where && !matchesDropWhere(row, where)) continue;
        Object.assign(row, data);
        count += 1;
      }
      return { count };
    },
  };

  like = {
    create: async ({ data }: { data: Pick<DbLike, 'dropId' | 'userHandle'> }) => {
      const row: DbLike = { ...data, createdAt: new Date() };
      store.likes.push(row);
      return row;
    },
    delete: async ({ where }: { where: { userHandle_dropId: Pick<DbLike, 'dropId' | 'userHandle'> } }) => {
      const { dropId, userHandle } = where.userHandle_dropId;
      store.likes = store.likes.filter(row => !(row.userHandle === userHandle && row.dropId === dropId));
      return { dropId, userHandle };
    },
    deleteMany: async () => {
      store.likes = [];
      return { count: 0 };
    },
    findUnique: async ({ where }: { where: { userHandle_dropId: Pick<DbLike, 'dropId' | 'userHandle'> } }) => {
      const { dropId, userHandle } = where.userHandle_dropId;
      return store.likes.find(row => row.userHandle === userHandle && row.dropId === dropId) ?? null;
    },
  };

  repost = {
    create: async ({ data }: { data: Pick<DbRepost, 'dropId' | 'userHandle'> }) => {
      const row: DbRepost = { ...data, createdAt: new Date() };
      store.reposts.push(row);
      return row;
    },
    delete: async ({ where }: { where: { userHandle_dropId: Pick<DbRepost, 'dropId' | 'userHandle'> } }) => {
      const { dropId, userHandle } = where.userHandle_dropId;
      store.reposts = store.reposts.filter(row => !(row.userHandle === userHandle && row.dropId === dropId));
      return { dropId, userHandle };
    },
    deleteMany: async () => {
      store.reposts = [];
      return { count: 0 };
    },
    findMany: (async ({
      include,
      where,
    }: {
      include?: { drop?: true };
      where?: { drop?: { parentId?: null }; userHandle?: string };
    } = {}) => {
      let rows = store.reposts.filter(row => {
        if (where?.userHandle && row.userHandle !== where.userHandle) return false;
        if (where?.drop?.parentId === null) {
          const drop = store.drops.find(item => item.id === row.dropId);
          if (!drop || drop.parentId !== null) return false;
        }
        return true;
      });
      if (include?.drop) {
        return rows.map(row => ({
          ...row,
          drop: store.drops.find(item => item.id === row.dropId)!,
        }));
      }
      return rows;
    }) as {
      (args: {
        include: { drop: true };
        where?: { drop?: { parentId?: null }; userHandle?: string };
      }): Promise<Array<DbRepost & { drop: DbDrop }>>;
      (args?: {
        include?: { drop?: true };
        where?: { drop?: { parentId?: null }; userHandle?: string };
      }): Promise<DbRepost[]>;
    },
    findUnique: async ({ where }: { where: { userHandle_dropId: Pick<DbRepost, 'dropId' | 'userHandle'> } }) => {
      const { dropId, userHandle } = where.userHandle_dropId;
      return store.reposts.find(row => row.userHandle === userHandle && row.dropId === dropId) ?? null;
    },
  };

  bookmark = {
    create: async ({ data }: { data: Pick<DbBookmark, 'dropId' | 'userHandle'> }) => {
      const row: DbBookmark = { ...data, createdAt: new Date() };
      store.bookmarks.push(row);
      return row;
    },
    delete: async ({ where }: { where: { userHandle_dropId: Pick<DbBookmark, 'dropId' | 'userHandle'> } }) => {
      const { dropId, userHandle } = where.userHandle_dropId;
      store.bookmarks = store.bookmarks.filter(row => !(row.userHandle === userHandle && row.dropId === dropId));
      return { dropId, userHandle };
    },
    deleteMany: async () => {
      store.bookmarks = [];
      return { count: 0 };
    },
    findMany: (async ({
      include,
      orderBy,
      where,
    }: {
      include?: { drop?: true };
      orderBy?: OrderBy;
      where?: { drop?: { parentId?: null }; userHandle?: string };
    } = {}) => {
      let rows = store.bookmarks.filter(row => {
        if (where?.userHandle && row.userHandle !== where.userHandle) return false;
        if (where?.drop?.parentId === null) {
          const drop = store.drops.find(item => item.id === row.dropId);
          if (!drop || drop.parentId !== null) return false;
        }
        return true;
      });
      rows = sortRows(rows, orderBy);
      if (include?.drop) {
        return rows.map(row => ({
          ...row,
          drop: store.drops.find(item => item.id === row.dropId)!,
        }));
      }
      return rows;
    }) as {
      (args: {
        include: { drop: true };
        orderBy?: OrderBy;
        where?: { drop?: { parentId?: null }; userHandle?: string };
      }): Promise<Array<DbBookmark & { drop: DbDrop }>>;
      (args?: {
        include?: { drop?: true };
        orderBy?: OrderBy;
        where?: { drop?: { parentId?: null }; userHandle?: string };
      }): Promise<DbBookmark[]>;
    },
    findUnique: async ({ where }: { where: { userHandle_dropId: Pick<DbBookmark, 'dropId' | 'userHandle'> } }) => {
      const { dropId, userHandle } = where.userHandle_dropId;
      return store.bookmarks.find(row => row.userHandle === userHandle && row.dropId === dropId) ?? null;
    },
  };

  follow = {
    create: async ({ data }: { data: Pick<DbFollow, 'followerHandle' | 'targetHandle'> }) => {
      const row: DbFollow = { ...data, createdAt: new Date() };
      store.follows.push(row);
      return row;
    },
    delete: async ({
      where,
    }: {
      where: { followerHandle_targetHandle: Pick<DbFollow, 'followerHandle' | 'targetHandle'> };
    }) => {
      const { followerHandle, targetHandle } = where.followerHandle_targetHandle;
      store.follows = store.follows.filter(
        row => !(row.followerHandle === followerHandle && row.targetHandle === targetHandle),
      );
      return { followerHandle, targetHandle };
    },
    deleteMany: async () => {
      store.follows = [];
      return { count: 0 };
    },
    findMany: async ({
      select,
      where,
    }: {
      select?: Partial<Record<keyof DbFollow, true>>;
      where?: { followerHandle?: string };
    } = {}) => {
      let rows = store.follows.filter(row => (where?.followerHandle ? row.followerHandle === where.followerHandle : true));
      return rows.map(row => pick(row, select));
    },
    findUnique: async ({
      where,
    }: {
      where: { followerHandle_targetHandle: Pick<DbFollow, 'followerHandle' | 'targetHandle'> };
    }) => {
      const { followerHandle, targetHandle } = where.followerHandle_targetHandle;
      return (
        store.follows.find(row => row.followerHandle === followerHandle && row.targetHandle === targetHandle) ?? null
      );
    },
  };

  async $transaction<T extends Promise<unknown>[]>(operations: T): Promise<{ [K in keyof T]: Awaited<T[K]> }> {
    const results = [];
    for (const operation of operations) {
      results.push(await operation);
    }
    return results as { [K in keyof T]: Awaited<T[K]> };
  }

  async $disconnect() {}
}

export type AppPrismaClient = MockPrismaClient;
