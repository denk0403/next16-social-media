---
name: nextjs-app-architecture
description: Architecture patterns for building Next.js 16 App Router applications with React Server Components, Cache Components, Suspense streaming, and feature-sliced design. Use this skill whenever building a new Next.js app, adding a feature to an existing one, refactoring a page or component, scaffolding pages, designing loading states, structuring feature folders, setting up data fetching with caching, or creating client/server component boundaries. Also use when the user asks about RSC composition, Suspense boundaries, skeleton placement, CLS prevention, cache invalidation, or how to structure a Next.js project.
---

# Next.js App Architecture

Use this skill when building a new Next.js 16+ App Router app or adding/refactoring a feature in an existing one. Follow these steps in order.

This targets Next.js 16+ with `cacheComponents: true`.

## The model

With `cacheComponents: true`, Next.js builds a static shell at build time and streams dynamic content at request time:

- **Static shell**: synchronous content, `'use cache'` components, and Suspense fallbacks are prerendered at build time
- **Dynamic holes**: async components that access uncached data stream in at request time behind `<Suspense>` boundaries
- **The key constraint**: any component that does async work without `'use cache'` must be wrapped in `<Suspense>`, or you get a build error
- Pages should stay synchronous. Use `params.then()` instead of `await params` to avoid pulling the entire page out of the static shell

## Step 1: Locate or create the feature folder

Check if the domain already has a feature folder under `features/`. If it does, use it. If not, create one:

```
features/<domain>/
  <domain>-queries.ts   # Server-only queries with 'use cache'
  <domain>-actions.ts   # Server actions with 'use server'
  components/           # Self-contained async components + skeletons
```

If the code you're working with has domain logic scattered across pages or mixed into other folders, refactor it into this structure first. Move queries into `<domain>-queries.ts`, actions into `<domain>-actions.ts`, and components into `components/`. Pages in `app/` should only compose feature components, never contain domain logic.

## Step 2: Write the queries

Create `<domain>-queries.ts`. Mark it with `import 'server-only'`. Wrap every query in `cache()` from React for request deduplication. Without it, the same query called from multiple components in the same render will hit the database multiple times. Add `'use cache'` + `cacheTag` + `cacheLife`.

```tsx
import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import { cache } from 'react';

export const getFeed = cache(async (userId: string) => {
  'use cache';
  cacheTag('feed', `feed-${userId}`);
  cacheLife('seconds');
  return db.post.findMany({ where: { userId } });
});
```

If the query reads cookies or session data, use `'use cache: private'` to scope the cache per user.

Define clean domain types in `types/` with a mapper from your DB layer. Components should only see domain types, not ORM types.

Persistent per-user state belongs in the database, not `localStorage`. "Last seen" timestamps, read/unread flags, dismissed banners: store them server-side as soon as the state needs to survive across browsers, accounts, or tab switches. `localStorage` is fine for genuinely client-only state (a sidebar collapsed flag, a draft autosave), but the moment another account or device should see the same state, move it to the DB.

## Step 3: Write the actions

Create `<domain>-actions.ts`. Mark with `'use server'`. Always verify auth and validate input inside the action. Call `updateTag()` to invalidate the matching cache tags. Return `{ ok, error }`.

```tsx
'use server';
export async function createPost(formData: FormData) {
  const user = await verifyUser();
  const parsed = schema.safeParse({ body: formData.get('body') });
  if (!parsed.success) return { error: parsed.error.issues[0].message, ok: false as const };

  await db.post.create({ data: { body: parsed.data.body, userId: user.id } });
  updateTag('feed');
  return { ok: true as const };
}
```

The `cacheTag` in the query and the `updateTag` in the action live in the same feature folder. This is the full cycle: tag, cache, invalidate.

## Step 4: Build the component

Create an async server component in `features/<domain>/components/`. Before building a new component, check if there's already a reusable one in the same feature folder that does what you need. If there is, use it. If not, create one that calls its own query and renders the result. Export a skeleton from the same file.

Default to async server components. They `await` their own queries directly. Don't reach for `use()` until you actually need a client component:

```tsx
import { getUnreadNotificationCount } from '@/features/notifications/notifications-queries';

export async function NotificationsBadge() {
  const count = await getUnreadNotificationCount();
  if (count === 0) return null;
  return <span aria-label={`${count} unread`}>{count}</span>;
}
```

```tsx
<Suspense>
  <NotificationsBadge />
</Suspense>
```

Only pass a promise + use `use()` when the consumer must be a client component (it needs hooks, event handlers, or browser APIs). In that case, name promise props with a `Promise` suffix and put a `fallback` on the Suspense matching the resolved UI, unless the component renders nothing in the empty state:

```tsx
<Suspense fallback={<TagListSkeleton />}>
  <TagPicker itemsPromise={getTags()} />
</Suspense>
```

```tsx
'use client';
import { use } from 'react';

export function TagPicker({ itemsPromise }: { itemsPromise: Promise<Tag[]> }) {
  const items = use(itemsPromise);
  // ...interactive logic
}
```

This keeps the boundary where it belongs and avoids redundant server wrappers, but only when interactivity actually requires the client.

Group small related components into one file when they're always used together or one is the natural building block for another. Don't split a card and the grid that renders it into separate files. Examples:

- `genre-card.tsx` exports `GenrePill`, `GenreCard`, `GenreGrid`, `GenreGridSkeleton`
- `playlist-card.tsx` exports `PlaylistCard`, `PlaylistList`, `PlaylistCardSkeleton`, `PlaylistListSkeleton`
- `track-interactions.tsx` (a `'use client'` file) exports the small interactive pieces (`PlayButton`, `FavoriteButton`, `TrackIndexCell`) used together by a server-side row component

A new file should hold something with real surface area, not a two-line passthrough. If you find yourself importing a component from a sibling file that's only ever used in one place, move it in.

The server/client boundary blocks some grouping. An async server component and its `'use client'` helper (a poller, an optimistic-input wrapper) cannot share a file. Keep them as siblings in the same feature folder and don't fight the boundary.

Don't extract shared UI primitives prematurely. Two sidebar widgets that happen to look similar but render different data shapes (a pinned-projects row vs a recent-deploys row with status) are not the same component. The visual will diverge as soon as one needs an extra slot. Wait until at least three call sites would use the abstraction with the exact same shape before extracting.

```tsx
export async function Feed({ userId }: { userId: string }) {
  const posts = await getFeed(userId);
  return (
    <ul>
      {posts.map(p => (
        <Post key={p.id} post={p} />
      ))}
    </ul>
  );
}

export function FeedSkeleton() {
  return (
    <ul>
      {Array.from({ length: 3 }).map((_, i) => (
        <li key={i}>
          <Skeleton className="h-24" />
        </li>
      ))}
    </ul>
  );
}
```

The server component receives plain values as props (strings, IDs), never promises. It awaits its own queries internally. If it needs the current user or session data, it calls a `'use cache: private'` query rather than receiving it from the page. The component stays self-contained.

Client components are different: when a client component needs server data but should own its loading state (a sidebar badge, a popover that fetches on mount), pass the unresolved promise from the server and resolve it with `use()` on the client. Wrap the consumer in `<Suspense>`.

When a parent component already has the data from its own query, pass it as props instead of having the child refetch. For example, `<Feed>` fetches a list of posts and passes each `post` object to `<Post post={post} />`. There is no reason for `<Post>` to refetch its own row by id when the parent already has it.

The skeleton matches the exact layout of the real component. Show fewer items than expected for variable-length lists.

### Skeleton design rules

1. Match the exact layout: same flex direction, gaps, padding, responsive breakpoints
2. If the real component uses `flex-col sm:flex-row`, the skeleton must too
3. Include all structural elements: avatar circles, action button placeholders, image squares
4. Use matching size classes
5. Include placeholder shapes for action buttons, not just content
6. Responsive visibility must match (`hidden sm:block` in real = same in skeleton)
7. Don't include skeletons for inner Suspense content
8. Co-locate with the real component, export alongside it

If the entire component output can be cached (a self-contained widget), put `'use cache'` on the component directly instead of on the query:

```tsx
async function TrendingTags() {
  'use cache';
  cacheTag('trending');
  cacheLife('minutes');

  const tags = await db.tag.findMany({ orderBy: { count: 'desc' }, take: 6 });
  return (
    <ul>
      {tags.map(t => (
        <li key={t.name}>#{t.name}</li>
      ))}
    </ul>
  );
}
```

## Step 5: Decide the client boundary

Push `'use client'` as deep as possible. Only add it when you need hooks, event handlers, or browser APIs.

If the component needs interactive pieces, keep the server component as the parent and render client leaves:

```tsx
async function PostDetail({ id }: { id: string }) {
  const [post, userState] = await Promise.all([getPost(id), getPostUserState(id)]);
  return (
    <article>
      <PostBody body={post.body} />
      <PostActions userState={userState} /> {/* 'use client' leaf */}
    </article>
  );
}
```

Server content can flow into client components as children:

```tsx
<ComposerForm
  avatar={
    <Suspense fallback={<AvatarSkeleton />}>
      <CurrentUserAvatar />
    </Suspense>
  }
/>
```

The client component doesn't know where the avatar came from. Composition crosses the boundary.

Use `useOptimistic` for instant feedback on mutations. Skip success toasts when the optimistic UI already shows the result. Only toast on error.

For deeper patterns on building interactive client components alongside async React (coordinating `useTransition`, `useOptimistic`, `useActionState`, `data-pending`, Suspense streaming, and caching across server and client in one app), see the [Interactive Apps guide](https://nextjs.org/docs/app/guides/interactive-apps).

### Live data via polling

If the feature needs to reflect updates that happen on the server (other users posting, new notifications, vote counts changing), drop a `<Poller>` client component into the page:

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function Poller({ intervalMs = 5000 }: { intervalMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const interval = setInterval(() => router.refresh(), intervalMs);
    const onFocus = () => router.refresh();
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [router, intervalMs]);
  return null;
}
```

`router.refresh()` re-renders the server components on the server. Combined with `'use cache'` + `cacheLife('seconds')`, the queries return cached data until they expire, then the next refresh picks up the new data. No WebSockets, no SSE, just the existing cache cycle.

## Step 6: Compose the page

Create or update the page in `app/`. The page composes components from feature folders with Suspense boundaries. It never fetches data directly.

Use `params.then()` instead of `await params` to keep the page synchronous. Content above the `.then()` gets pre-rendered into the static shell. Use the generated `PageProps<'/route'>` and `LayoutProps<'/route'>` types for all page and layout function signatures.

```tsx
// Page with params
export default function PostPage({ params }: PageProps<'/post/[id]'>) {
  return (
    <div>
      <PageHeader back title="Post" />
      <Suspense fallback={<PostDetailSkeleton />}>
        {params.then(({ id }) => (
          <>
            <PostDetail id={id} />
            <ErrorBoundary title="Replies didn't load">
              <Suspense fallback={<RepliesSkeleton />}>
                <Replies postId={id} />
              </Suspense>
            </ErrorBoundary>
          </>
        ))}
      </Suspense>
    </div>
  );
}

// Page with searchParams
export default function SearchPage({ searchParams }: PageProps<'/search'>) {
  return searchParams.then(sp => {
    const q = typeof sp.q === 'string' ? sp.q : '';
    return q ? <SearchResults query={q} /> : <EmptyState />;
  });
}

// Page with both
export default function ProfilePage({ params, searchParams }: PageProps<'/u/[handle]'>) {
  return Promise.all([params, searchParams]).then(([{ handle }, sp]) => (
    <ProfileFeed handle={handle} tab={parseTab(sp.tab)} />
  ));
}
```

Choose boundary placement deliberately:

- Group things that should appear together in one boundary
- Nest boundaries for slower content that should stream independently
- Wrap fallible sections in `<ErrorBoundary>` so one failure doesn't crash the page
- Optional: wrap content in `<ViewTransition>` for smooth reveals on Suspense resolution. See the [React View Transitions skill](https://github.com/vercel-labs/agent-skills/tree/main/skills/react-view-transitions) for patterns

### Suspense boundary placement rules

1. The first section gets its own Suspense with a skeleton fallback (known, predictable height)
2. Section headings go outside their Suspense (in the static shell)
3. If a section has variable height, group everything below it inside the same Suspense
4. If a section has fixed height (deterministic count), it can have its own boundary safely
5. Show fewer skeleton items than the expected real count for variable-length lists (2-5 items)
6. Sections that only appear after variable-height content resolves don't need their own skeletons
7. Detail components can have inner Suspense for secondary content. The page-level skeleton should NOT include the inner skeleton

### Layout-level Suspense

Layouts can also compose feature components with Suspense for sidebars and persistent widgets. Wrap each in an error boundary so a failing widget doesn't break the whole page.

Add `export const unstable_prefetch = 'force-runtime'` so navigations are backed by prefetched data.

`generateMetadata` can use `await params` since it runs before the page and doesn't affect the static shell.
