'use client';

import { RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { cn } from '@/lib/utils';

export function RefreshButton({ label = 'Refresh' }: { label?: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      aria-label={label}
      disabled={isPending}
      onClick={() => {
        startTransition(() => {
          router.refresh();
        });
      }}
      className="text-gray ml-auto rounded-full p-1.5 transition-colors hover:text-black disabled:cursor-not-allowed disabled:opacity-50 dark:hover:text-white"
    >
      <RefreshCw className={cn('h-4 w-4', isPending && 'animate-spin')} />
    </button>
  );
}
