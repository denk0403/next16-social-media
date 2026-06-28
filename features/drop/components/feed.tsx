import { Suspense } from 'react';
import { Crossfade } from '@/components/ui/crossfade';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadMore } from '@/components/ui/load-more';
import { Drop, DropListSkeleton } from '@/features/drop/components/drop';
import { getDiscoverFeed, getFeed } from '@/features/drop/drop-queries';
import type { Route } from 'next';

export async function Feed({ page = 1 }: { page?: number }) {
  const { drops } = await getFeed(1);
  if (drops.length === 0) {
    return (
      <EmptyState
        title="Your following feed is quiet"
        body="Follow some people, or head to Discover to find new voices."
      />
    );
  }
  return (
    <ul>
      {Array.from({ length: page }).map((_, i) => {
        const p = i + 1;
        const isLast = p === page;
        return p === 1 ? (
          <FeedPage key={p} page={p} isLast={isLast} />
        ) : (
          <Suspense key={p} fallback={<DropListSkeleton count={3} />}>
            <Crossfade>
              <FeedPage page={p} isLast={isLast} />
            </Crossfade>
          </Suspense>
        );
      })}
    </ul>
  );
}

async function FeedPage({ page, isLast }: { page: number; isLast: boolean }) {
  const { drops, hasMore } = await getFeed(page);
  return (
    <>
      {drops.map(drop => (
        <li key={drop.id}>
          <Drop drop={drop} />
        </li>
      ))}
      {isLast && hasMore ? (
        <li className="flex justify-center p-6">
          <LoadMore href={`/?page=${page + 1}` as Route} />
        </li>
      ) : null}
    </>
  );
}

export async function DiscoverFeed({ page = 1 }: { page?: number }) {
  const { drops } = await getDiscoverFeed(1);
  if (drops.length === 0) {
    return (
      <EmptyState title="You already follow everyone" body="Nothing new to discover right now. Check back later." />
    );
  }
  return (
    <ul>
      {Array.from({ length: page }).map((_, i) => {
        const p = i + 1;
        const isLast = p === page;
        return p === 1 ? (
          <DiscoverFeedPage key={p} page={p} isLast={isLast} />
        ) : (
          <Suspense key={p} fallback={<DropListSkeleton count={3} />}>
            <Crossfade>
              <DiscoverFeedPage page={p} isLast={isLast} />
            </Crossfade>
          </Suspense>
        );
      })}
    </ul>
  );
}

async function DiscoverFeedPage({ page, isLast }: { page: number; isLast: boolean }) {
  const { drops, hasMore } = await getDiscoverFeed(page);
  return (
    <>
      {drops.map(drop => (
        <li key={drop.id}>
          <Drop drop={drop} />
        </li>
      ))}
      {isLast && hasMore ? (
        <li className="flex justify-center p-6">
          <LoadMore href={`/?tab=discover&page=${page + 1}` as Route} />
        </li>
      ) : null}
    </>
  );
}
