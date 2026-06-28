import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { Route } from 'next';

type Props = {
  label: string;
  icon: React.ReactNode;
  href?: Route;
  active?: boolean;
  activeColor?: string;
  hoverColor?: string;
  onClick?: () => void;
  children?: React.ReactNode;
};

export function IconButton({ label, icon, href, active, activeColor, hoverColor, onClick, children }: Props) {
  const className = cn(
    'inline-flex items-center gap-1 rounded-full px-2 py-1.5 font-mono text-xs transition-colors',
    active && activeColor,
    hoverColor ?? 'hover:bg-card dark:hover:bg-card-dark hover:text-black dark:hover:text-white',
  );

  if (href) {
    return (
      <Link
        prefetch={true}
        href={href}
        aria-label={label}
        onClick={e => {
          e.stopPropagation();
        }}
        className={className}
      >
        {icon}
        {children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={
        onClick
          ? e => {
              e.preventDefault();
              e.stopPropagation();
              onClick();
            }
          : undefined
      }
      className={className}
    >
      {icon}
      {children}
    </button>
  );
}
