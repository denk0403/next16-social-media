import Link from 'next/link';

type Props = {
  tag: string;
};

export function TagPill({ tag }: Props) {
  return (
    <Link
      prefetch={true}
      href={`/tag/${tag}`}
      className="border-divider text-gray hover:border-accent hover:text-accent dark:border-divider-dark inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[11px] transition-colors"
    >
      #{tag}
    </Link>
  );
}
