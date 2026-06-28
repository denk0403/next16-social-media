import { Hash } from 'lucide-react';
import Link from 'next/link';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { getAllTags } from '@/features/tag/tag-queries';
import { formatCount } from '@/lib/utils';
import type { Route } from 'next';

export async function TagsList() {
  const tags = await getAllTags();
  if (tags.length === 0) {
    return <EmptyState title="No tags yet" body="Drops with #hashtags will show up here." />;
  }

  return (
    <ul>
      {tags.map(tag => (
        <li key={tag.name}>
          <Link
            prefetch={true}
            href={`/tag/${tag.name}` as Route}
            className="border-divider/70 dark:border-divider-dark/70 hover:bg-card dark:hover:bg-card-dark flex items-center gap-3 border-b px-4 py-3 transition-colors sm:px-5"
          >
            <Hash className="text-gray h-5 w-5 shrink-0" aria-hidden />
            <div className="flex flex-1 flex-col">
              <span className="text-sm font-semibold tracking-tight">#{tag.name}</span>
              <span className="text-gray font-mono text-[11px]">
                {formatCount(tag.count)} {tag.count === 1 ? 'drop' : 'drops'}
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function TagsListSkeleton() {
  return (
    <ul aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <li
          key={i}
          className="border-divider/70 dark:border-divider-dark/70 flex items-center gap-3 border-b px-4 py-5 sm:px-5"
        >
          <Hash className="text-gray h-5 w-5 shrink-0" aria-hidden />
          <Skeleton className="h-4 w-24 rounded" />
        </li>
      ))}
    </ul>
  );
}
