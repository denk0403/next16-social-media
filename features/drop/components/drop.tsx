import { Repeat2 } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';
import { CodeBlock } from '@/components/ui/code-block';
import { RelativeTime } from '@/components/ui/relative-time';
import { Skeleton } from '@/components/ui/skeleton';
import { DropActions } from '@/features/drop/components/drop-actions';
import { DropBody } from '@/features/drop/components/drop-body';
import { UserAvatar } from '@/features/user/components/user-avatar';
import { getCurrentUserHandle, getDropUserState, getUserByHandle } from '@/features/user/user-queries';
import type { Drop as DropT } from '@/types/drop';

type Props = {
  drop: DropT;
  compact?: boolean;
  repostedBy?: string;
};

export async function Drop({ drop, compact = false, repostedBy }: Props) {
  const userState = await getDropUserState(drop.id);
  return (
    <article className="group/drop border-divider/70 dark:border-divider-dark/70 hover:bg-card/40 dark:hover:bg-card-dark/40 relative border-b transition-colors">
      <Link
        prefetch={true}
        href={`/drop/${drop.parentId ?? drop.id}`}
        aria-label="Open drop"
        className="absolute inset-0 z-10"
      />
      {repostedBy ? (
        <Suspense fallback={null}>
          <Reposter handle={repostedBy} />
        </Suspense>
      ) : null}
      <div className="relative flex gap-3 px-4 py-4 sm:px-5">
        <Link prefetch={true} href={`/u/${drop.authorHandle}`} className="relative z-20 shrink-0">
          <UserAvatar handle={drop.authorHandle} size="md" />
        </Link>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <header className="flex flex-wrap items-baseline gap-x-1.5 text-sm">
            <AuthorName handle={drop.authorHandle} />
            <span className="text-gray font-mono text-[12px]">·</span>
            <span className="text-gray font-mono text-[12px]">
              <RelativeTime date={drop.createdAt} />
            </span>
          </header>
          <DropBody body={drop.body} compact={compact} />
          {drop.embeddedCode && !compact ? (
            <div className="relative z-20">
              <CodeBlock lang={drop.embeddedCode.lang} code={drop.embeddedCode.code} />
            </div>
          ) : null}
          <div className="relative z-20">
            <DropActions
              dropId={drop.id}
              parentId={drop.parentId}
              replies={drop.replies}
              reposts={drop.reposts}
              likes={drop.likes}
              userState={userState}
              compact={compact}
            />
          </div>
        </div>
      </div>
    </article>
  );
}

function DropSkeleton() {
  return (
    <div className="border-divider/70 dark:border-divider-dark/70 min-h-[120px] border-b px-4 py-4 sm:px-5">
      <div className="flex gap-3">
        <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
      </div>
    </div>
  );
}

export function DropList({
  drops,
  compact,
  repostedBy,
}: {
  drops: DropT[];
  compact?: boolean;
  repostedBy?: (drop: DropT) => string | undefined;
}) {
  return (
    <ul>
      {drops.map((drop, i) => (
        <li key={`${drop.id}-${i}`}>
          <Drop drop={drop} compact={compact} repostedBy={repostedBy?.(drop)} />
        </li>
      ))}
    </ul>
  );
}

export function DropListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <ul aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <li key={i}>
          <DropSkeleton />
        </li>
      ))}
    </ul>
  );
}

async function AuthorName({ handle }: { handle: string }) {
  const author = await getUserByHandle(handle);
  return (
    <>
      <Link
        prefetch={true}
        href={`/u/${author.handle}`}
        className="relative z-20 font-semibold tracking-tight text-black hover:underline dark:text-white"
      >
        {author.displayName}
      </Link>
      <Link prefetch={true} href={`/u/${author.handle}`} className="text-gray relative z-20 font-mono text-[12px]">
        @{author.handle}
      </Link>
    </>
  );
}

async function Reposter({ handle }: { handle: string }) {
  const [reposter, currentHandle] = await Promise.all([getUserByHandle(handle), getCurrentUserHandle()]);
  return (
    <Link
      prefetch={true}
      href={`/u/${reposter.handle}`}
      className="text-gray hover:text-success relative z-20 flex w-fit items-center gap-2 px-4 pt-3 text-xs sm:px-5"
    >
      <Repeat2 className="h-3 w-3" />
      <span>{reposter.handle === currentHandle ? 'You' : reposter.displayName} reposted</span>
    </Link>
  );
}
