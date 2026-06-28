import Link from 'next/link';
import { type ReactNode } from 'react';
import { UserAvatar } from '@/features/user/components/user-avatar';

type Props = {
  handle: string;
  displayName: string;
  action?: ReactNode;
};

export function UserRow({ handle, displayName, action }: Props) {
  return (
    <Link
      prefetch={true}
      href={`/u/${handle}`}
      className="border-divider/70 dark:border-divider-dark/70 flex items-center gap-3 border-b px-4 py-3.5 transition-colors last:border-b-0 hover:bg-black/[0.02] sm:px-5 dark:hover:bg-white/[0.02]"
    >
      <UserAvatar handle={handle} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold tracking-tight">{displayName}</div>
        <div className="text-gray truncate font-mono text-[11px]">@{handle}</div>
      </div>
      {action}
    </Link>
  );
}
