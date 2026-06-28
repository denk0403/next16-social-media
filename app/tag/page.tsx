import { Suspense } from 'react';
import { Crossfade } from '@/components/ui/crossfade';
import { PageHeader } from '@/components/ui/page-header';
import { TagsList, TagsListSkeleton } from '@/features/tag/components/tags-list';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  alternates: { canonical: '/tag' },
  description: 'Trending tags on Drop.',
  title: 'Trending Tags',
};

export const prefetch = 'allow-runtime';

export default function TagsPage() {
  return (
    <div>
      <PageHeader title="Trending Tags" />
      <Suspense fallback={<TagsListSkeleton />}>
        <Crossfade>
          <TagsList />
        </Crossfade>
      </Suspense>
    </div>
  );
}
