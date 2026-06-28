'use client';

import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { Boundary } from '@/components/internal/boundary';

export function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function copy(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch {
      /* ignore */
    }
  }

  return (
    <Boundary label="CopyButton">
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? 'Copied' : 'Copy code'}
        className="border-divider text-gray dark:border-divider-dark dark:bg-card-dark absolute top-2 right-2 z-30 inline-flex h-7 w-7 items-center justify-center rounded-md border bg-white opacity-0 transition-all group-hover/code:opacity-100 hover:text-black focus:opacity-100 dark:hover:text-white"
      >
        {copied ? <Check className="text-success h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </Boundary>
  );
}
