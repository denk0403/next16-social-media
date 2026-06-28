<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes. APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

Follow the [Next.js App Architecture](.agents/skills/nextjs-app-architecture/SKILL.md) skill for all architectural decisions. For animations, follow the [React View Transitions skill](https://github.com/vercel-labs/agent-skills/tree/main/skills/react-view-transitions).

## Repo conventions

- Next.js 16.3 canary, `cacheComponents: true`, React Compiler enabled
- Prisma 7 on Neon Postgres via `@prisma/adapter-pg`
- Tailwind CSS v4 with `group/` and `peer` selectors
- Ariakit for Dialog/Popover
- Shiki for server-side syntax highlighting
- Feature folders: `features/drop/`, `features/user/`, `features/tag/`, `features/search/`
- Domain type "drop" is the app's term for a post/tweet
- Queries use `delay()` calls for demo visibility of loading states
- All pages export `unstable_prefetch = 'force-runtime'`
- Demo toggles (boundary visualizer) in `components/demo/`
- User switching via cookie (`drop-user`), `switchUser` action calls `updateTag('current-user')`
- React Compiler enabled — do not use `useCallback` / `useMemo`.
- After adding a model to `prisma/schema.prisma` and running `prisma db push` + `prisma generate`, **restart the dev server**. The `globalThis.prisma` singleton in `lib/db.ts` survives HMR and holds the old client, so the new model will throw "Cannot read properties of undefined" until the process restarts.

## Navigation escape hatches

Next's `usePathname()` and `useSearchParams()` require a Suspense boundary in cache-components mode on dynamic routes. To keep top-of-tree UI prerenderable:

- `NavLink` wraps a `usePathname()` read in `<Suspense>` with a fallback that renders the link in its inactive state, so layout stays stable while active state resolves.
- `useSyncInputToSearchParam` — keeps a search input in sync with the URL across soft navigations. Paired with `SeedFromSearchParam` inline script.

See `ux-patterns.md` in the architecture skill for the general pattern.

## View Transitions — project-specific CSS

For general patterns and CSS recipes, see the [React View Transitions skill](https://github.com/vercel-labs/agent-skills/tree/main/skills/react-view-transitions). Project-specific additions:

### Persistent elements

Exclude layout-persistent elements from animations:

```css
::view-transition-group(sidebar),
::view-transition-group(mobile-nav),
::view-transition-group(demo-toolbar) {
  animation: none;
  z-index: 100;
}
```

### Crossfade on Suspense reveal

Wrap Suspense content in `<Crossfade>` (`<ViewTransition enter="auto" default="none">`) for smooth reveals instead of hard swaps.

**Caveat:** Crossfade on small frequently-revalidating elements (sidebar lists, form-triggered list updates) may cause a visible flash. If you observe flashing, remove the Crossfade wrapper from that specific boundary.

### Ariakit exclusion

Ariakit Dialog/Popover render portaled content. Add `viewTransitionName: 'none'` to their style to prevent them from animating during navigation transitions. (The architecture skill's `ux-patterns.md` covers this for floating UI in general; Ariakit is the specific library used here.)

## Errors

Use `catchError` from `next/error` for error boundaries. It handles `notFound()`, `redirect()`, and server data re-fetching correctly via `retry()`.
