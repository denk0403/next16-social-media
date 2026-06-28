import { Suspense } from 'react';
import { Crossfade } from '@/components/ui/crossfade';
import { PageHeader } from '@/components/ui/page-header';
import { BookmarksFeed } from '@/features/drop/components/bookmarks-feed';
import { DropListSkeleton } from '@/features/drop/components/drop';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  alternates: { canonical: '/bookmarks' },
  description: 'Drops you bookmarked.',
  robots: { follow: false, index: false },
  title: 'Bookmarks',
};

export const prefetch = 'allow-runtime';

export default function BookmarksPage() {
  return (
    <div>
      <PageHeader title="Bookmarks" />
      <Suspense fallback={<DropListSkeleton count={3} />}>
        <Crossfade>
          <BookmarksFeed />
        </Crossfade>
      </Suspense>
    </div>
  );
}
