'use client';

import Link, { useLinkStatus } from 'next/link';
import { useSelectedLayoutSegments } from 'next/navigation';
import { Suspense } from 'react';
import type { Route } from 'next';

type RenderProps = { isActive: boolean; isPending: boolean };
type Renderable<T> = T | ((props: RenderProps) => T);

type Props<T extends string = string> = Omit<React.ComponentProps<typeof Link>, 'href' | 'className' | 'children'> & {
  href: Route<T> | URL;
  className?: Renderable<string | undefined>;
  children?: Renderable<React.ReactNode>;
};

function checkActive(segments: string[], href: string): boolean {
  const want = href.split('?')[0].split('#')[0].split('/').filter(Boolean);
  return want.length === segments.length && want.every((s, i) => s === segments[i]);
}

function resolve<T>(value: Renderable<T> | undefined, props: RenderProps): T | undefined {
  return typeof value === 'function' ? (value as (p: RenderProps) => T)(props) : value;
}

export function NavLinkSegments<T extends string>(props: Props<T>) {
  return (
    <Suspense fallback={<NavLinkShell {...props} isActive={false} />}>
      <NavLinkInner {...props} />
    </Suspense>
  );
}

function NavLinkInner<T extends string>(props: Props<T>) {
  const segments = useSelectedLayoutSegments();
  const isActive = checkActive(segments, props.href.toString());
  return <NavLinkShell {...props} isActive={isActive} />;
}

function NavLinkShell<T extends string>({
  href,
  className,
  children,
  isActive,
  ...rest
}: Props<T> & { isActive: boolean }) {
  return (
    <Link
      prefetch={true}
      href={href as Route}
      aria-current={isActive ? 'page' : undefined}
      className={resolve(className, { isActive, isPending: false })}
      data-navlink-href={href.toString()}
      suppressHydrationWarning
      {...rest}
    >
      <PendingIndicator isActive={isActive}>{children}</PendingIndicator>
    </Link>
  );
}

function PendingIndicator({ isActive, children }: { isActive: boolean; children?: Renderable<React.ReactNode> }) {
  const { pending } = useLinkStatus();
  return <>{resolve(children, { isActive, isPending: pending })}</>;
}
