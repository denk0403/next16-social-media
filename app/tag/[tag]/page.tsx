import { Suspense } from 'react';
import { Crossfade } from '@/components/ui/crossfade';
import { PageHeader } from '@/components/ui/page-header';
import { DropListSkeleton } from '@/features/drop/components/drop';
import { TagFeed } from '@/features/tag/components/tag-feed';
import { TagHeader, TagHeaderSkeleton } from '@/features/tag/components/tag-header';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: PageProps<'/tag/[tag]'>): Promise<Metadata> {
  const { tag } = await params;
  const title = `#${tag}`;
  const description = `Drops tagged #${tag}`;
  const url = `/tag/${tag}`;
  return {
    alternates: { canonical: url },
    description,
    title,
  };
}

export const prefetch = 'allow-runtime';

export default function TagPage({ params }: PageProps<'/tag/[tag]'>) {
  return (
    <div>
      <PageHeader back title="Tag" />
      <Suspense fallback={<TagHeaderSkeleton />}>
        <Crossfade>
          {params.then(({ tag }) => (
            <TagHeader tag={tag} />
          ))}
        </Crossfade>
      </Suspense>
      <Suspense fallback={<DropListSkeleton count={4} />}>
        <Crossfade>
          {params.then(({ tag }) => (
            <TagFeed tag={tag} />
          ))}
        </Crossfade>
      </Suspense>
    </div>
  );
}
