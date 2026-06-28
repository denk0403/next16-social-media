import { Suspense } from 'react';
import { Crossfade } from '@/components/ui/crossfade';
import { TabsSkeleton } from '@/components/ui/tabs';
import { DropComposer } from '@/features/drop/components/composer';
import { DropListSkeleton } from '@/features/drop/components/drop';
import { Feed, DiscoverFeed } from '@/features/drop/components/feed';
import { FeedTabs } from '@/features/drop/components/feed-tabs';

export const prefetch = 'allow-runtime';

function parseTab(value: string | string[] | undefined): 'following' | 'discover' {
  return value === 'discover' ? 'discover' : 'following';
}

function parsePage(value: string | string[] | undefined): number {
  const n = Number(value);
  return n > 0 && Number.isInteger(n) ? n : 1;
}

export default function HomePage({ searchParams }: PageProps<'/'>) {
  return (
    <div className="group/tabs">
      <div className="sticky top-0 z-30 bg-white/70 backdrop-blur-md backdrop-saturate-150 dark:bg-black/70">
        <Suspense fallback={<TabsSkeleton />}>
          <FeedTabs />
        </Suspense>
      </div>
      <DropComposer />
      <div className="transition-opacity group-has-data-pending/tabs:opacity-50">
        <Suspense fallback={<DropListSkeleton />}>
          <Crossfade>
            {searchParams.then(sp => {
              const tab = parseTab(sp.tab);
              const page = parsePage(sp.page);
              return tab === 'discover' ? <DiscoverFeed page={page} /> : <Feed page={page} />;
            })}
          </Crossfade>
        </Suspense>
      </div>
    </div>
  );
}
