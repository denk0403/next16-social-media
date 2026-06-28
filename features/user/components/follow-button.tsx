'use client';

import { useOptimistic, useTransition } from 'react';
import { toast } from 'sonner';
import { Boundary } from '@/components/internal/boundary';
import { Button } from '@/components/ui/button';
import { toggleFollow } from '@/features/user/user-actions';

type Props = {
  targetHandle: string;
  following: boolean;
};

export function FollowButton({ targetHandle, following: initialFollowing }: Props) {
  const [following, setOptimistic] = useOptimistic(initialFollowing);
  const [, startTransition] = useTransition();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      setOptimistic(!following);
      try {
        await toggleFollow(targetHandle);
      } catch {
        toast.error('Something went wrong. Try again.');
      }
    });
  };

  return (
    <Boundary label="FollowButton">
      <Button variant={following ? 'secondary' : 'primary'} size="sm" className="min-w-[7rem]" onClick={handleClick}>
        {following ? 'Following' : 'Follow'}
      </Button>
    </Boundary>
  );
}
