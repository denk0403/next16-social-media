'use client';

import { useEffect, useState } from 'react';
import { Boundary } from '@/components/internal/boundary';

import { timeAgo } from '@/lib/utils';

export function RelativeTime({ date, verbose = false }: { date: Date; verbose?: boolean }) {
  const [label, setLabel] = useState(() => (verbose ? formatAbsolute(date) : timeAgo(date)));
  useEffect(() => {
    const update = () => {
      setLabel(verbose ? formatAbsolute(date) : timeAgo(date));
    };
    update();
    if (verbose) return;
    const id = setInterval(update, 60_000);
    return () => {
      clearInterval(id);
    };
  }, [date, verbose]);

  return (
    <Boundary label="RelativeTime">
      <time dateTime={date.toISOString()} suppressHydrationWarning>
        {label}
      </time>
    </Boundary>
  );
}

function formatAbsolute(date: Date): string {
  const time = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  const day = date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  return `${time} · ${day}`;
}
