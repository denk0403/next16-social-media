'use client';

import { Bookmark, Heart, MessageCircle, Repeat2 } from 'lucide-react';
import { useOptimistic, useTransition } from 'react';
import { toast } from 'sonner';
import { Boundary } from '@/components/internal/boundary';
import { IconButton } from '@/components/ui/icon-button';
import { toggleBookmark, toggleLike, toggleRepost } from '@/features/drop/drop-actions';
import type { DropUserState } from '@/features/user/user-queries';
import { cn, formatCount } from '@/lib/utils';
import type { Route } from 'next';

type Props = {
  dropId: string;
  parentId?: string;
  replies: number;
  reposts: number;
  likes: number;
  userState: DropUserState;
  compact?: boolean;
};

type OptimisticState = DropUserState & { repostsDelta: number; likesDelta: number };
type Toggle = 'liked' | 'reposted' | 'bookmarked';

function reduce(state: OptimisticState, toggle: Toggle): OptimisticState {
  switch (toggle) {
    case 'liked':
      return { ...state, liked: !state.liked, likesDelta: state.likesDelta + (state.liked ? -1 : 1) };
    case 'reposted':
      return { ...state, reposted: !state.reposted, repostsDelta: state.repostsDelta + (state.reposted ? -1 : 1) };
    case 'bookmarked':
      return { ...state, bookmarked: !state.bookmarked };
  }
}

export function DropActions({ dropId, parentId, replies, reposts, likes, userState, compact }: Props) {
  const [optimistic, addOptimistic] = useOptimistic({ ...userState, likesDelta: 0, repostsDelta: 0 }, reduce);
  const [, startTransition] = useTransition();

  function toggle(field: Toggle, action: () => Promise<unknown>) {
    const messages: Record<Toggle, [string, string]> = {
      bookmarked: ['Added to bookmarks', 'Removed from bookmarks'],
      liked: ['Liked', 'Unliked'],
      reposted: ['Reposted', 'Removed repost'],
    };
    const willActivate = !optimistic[field];

    startTransition(async () => {
      addOptimistic(field);
      try {
        await action();
        toast.success(willActivate ? messages[field][0] : messages[field][1]);
      } catch {
        toast.error('Something went wrong. Try again.');
      }
    });
  }

  return (
    <Boundary label="DropActions">
      <div className="text-gray -ml-2 flex items-center gap-1 pt-0.5">
        {!compact && (
          <IconButton
            label="Reply"
            icon={<MessageCircle className="h-4 w-4" />}
            href={`/drop/${parentId ?? dropId}` as Route}
          >
            <span>{formatCount(replies)}</span>
          </IconButton>
        )}
        <IconButton
          label="Repost"
          icon={<Repeat2 className="h-4 w-4" />}
          active={optimistic.reposted}
          activeColor="text-success"
          hoverColor="hover:bg-success/10 hover:text-success"
          onClick={() => {
            toggle('reposted', () => toggleRepost(dropId));
          }}
        >
          <span>{formatCount(reposts + optimistic.repostsDelta)}</span>
        </IconButton>
        <IconButton
          label="Like"
          icon={<Heart className={cn('h-4 w-4', optimistic.liked && 'fill-current')} />}
          active={optimistic.liked}
          activeColor="text-danger"
          hoverColor="hover:bg-danger/10 hover:text-danger"
          onClick={() => {
            toggle('liked', () => toggleLike(dropId));
          }}
        >
          <span>{formatCount(likes + optimistic.likesDelta)}</span>
        </IconButton>
        <IconButton
          label={optimistic.bookmarked ? 'Saved' : 'Save for later'}
          icon={<Bookmark className={cn('h-4 w-4', optimistic.bookmarked && 'fill-current')} />}
          active={optimistic.bookmarked}
          activeColor="text-accent"
          hoverColor="hover:bg-accent/10 hover:text-accent"
          onClick={() => {
            toggle('bookmarked', () => toggleBookmark(dropId));
          }}
        >
          <span className="hidden sm:inline">{optimistic.bookmarked ? 'Saved' : 'Save'}</span>
        </IconButton>
      </div>
    </Boundary>
  );
}
