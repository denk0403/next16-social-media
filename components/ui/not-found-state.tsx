import Link from 'next/link';
import { DropMark } from '@/components/ui/drop-mark';
import type { Route } from 'next';

type Props = {
  title: string;
  body: string;
  backHref?: string;
  backLabel?: string;
};

export function NotFoundState({ title, body, backHref, backLabel }: Props) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
      <DropMark size={40} className="text-divider dark:text-divider-dark" />
      <h2 className="text-lg font-bold tracking-tight uppercase">{title}</h2>
      <p className="text-gray text-sm">{body}</p>
      {backHref ? (
        <Link prefetch={true} href={backHref as Route} className="text-accent text-sm hover:underline">
          {backLabel ?? 'Back to the feed'}
        </Link>
      ) : null}
    </div>
  );
}
