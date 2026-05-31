<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes. APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

Follow the [Next.js App Architecture](.agents/skills/nextjs-app-architecture/SKILL.md) skill for all architectural decisions.

## Repo conventions

- Next.js 16.3 canary, `cacheComponents: true`, React Compiler enabled
- Prisma 7 on Neon Postgres via `@prisma/adapter-pg`
- Tailwind CSS v4 with `group/` and `peer` selectors, `data-pending` pattern
- Ariakit for Dialog/Popover with `viewTransitionName: 'none'` to exclude from view transitions
- Shiki for server-side syntax highlighting
- Feature folders: `features/drop/`, `features/user/`, `features/tag/`, `features/search/`
- Domain type "drop" is the app's term for a post/tweet
- Queries use `delay()` calls for demo visibility of loading states
- All pages export `unstable_prefetch = 'force-runtime'`
- Demo toggles (prefetch toggle, boundary visualizer) in `components/demo/`
- User switching via cookie (`drop-user`), `switchUser` action calls `updateTag('current-user')`
- `use-client-pathname.ts` has `'use no memo'` directive for React Compiler compatibility
- After adding a model to `prisma/schema.prisma` and running `prisma db push` + `prisma generate`, **restart the dev server**. The `globalThis.prisma` singleton in `lib/db.ts` survives HMR and holds the old client, so the new model will throw "Cannot read properties of undefined" until the process restarts.

## Navigation

### Active NavLink without Suspense

`usePathname()` triggers a Suspense boundary. Use `useClientPathname()` (via `useSyncExternalStore` reading `window.location.pathname`) instead. Add an inline pre-paint script (`SeedNavLinksFromPathname`) that sets the correct active class using `data-navlink-*` attributes before the page paints.

### Search input without Suspense

`useSearchParams()` also requires a Suspense boundary. Instead:

- `SeedFromSearchParam` inline script to populate the input value from the URL before paint
- `useSyncInputToSearchParam` hook for soft navigation re-syncing
- `useTransition` + `router.replace` for instant feedback with a spinner

## View Transitions

View transitions are an enhancement layer. Keep them subtle. The goal is to make navigation feel smooth, not flashy. For general patterns and CSS recipes, see the [React View Transitions skill](https://github.com/vercel-labs/agent-skills/tree/main/skills/react-view-transitions).

### Persistent elements

Exclude layout-persistent elements from animations with CSS:

```css
::view-transition-group(sidebar),
::view-transition-group(mobile-nav),
::view-transition-group(demo-toolbar) {
  animation: none;
  z-index: 100;
}
```

### Shared element morphing

Use matching `<ViewTransition name={unique-id} default="none">` on the same element in two views. Use the browser's default morph.

### Crossfade on Suspense reveal

Wrap Suspense content in `<Crossfade>` (`<ViewTransition enter="auto" default="none">`) for smooth reveals instead of hard swaps.

### Crossfade caveat

Crossfade on small frequently-revalidating elements (sidebar lists, form-triggered list updates) may cause a visible flash. If you observe flashing, remove the Crossfade wrapper from that specific boundary.

### Ariakit exclusion

Ariakit Dialog/Popover renders portaled content. Add `viewTransitionName: 'none'` to their style to prevent them from animating during navigation transitions.

### Toasts and floating UI

Apply `viewTransitionName: 'none'` to all portal/floating-layer elements: toast containers, dialog backdrops, popover panels, dropdown menus. Without this, they flicker during route view transitions.

## Mutations

### Destructive actions with confirmation

Don't use `redirect()` in the server action for destructive operations. It throws and prevents the client from showing a toast or closing the dialog. Return `{ ok: true }` and handle navigation client-side with `router.push()`.

### Confirm dialogs and view transitions

Don't wrap the entire server action call in `useTransition` inside a confirm dialog. It triggers view transitions on the background UI. Use `useState` for pending state and only use `startTransition` for hiding the dialog on success.

### Error boundaries

Use `catchError` from `next/error` for error boundaries. It handles `notFound()`, `redirect()`, and server data re-fetching correctly via `retry()`.

## Data patterns

### Passing promises to client components with `use()`

When a client component needs server data but should own its loading state (a popover that fetches on mount), pass the promise from the server and resolve it client-side with `use()`. Wrap the `use()` call in `<Suspense>` for the loading fallback.

### URL-based pagination

Use `searchParams` to control the page number. Render each page as a separate Suspense boundary. Only the first page renders without Suspense. The `LoadMore` button uses `router.push(nextPageUrl, { scroll: false })` inside a transition.

### Client-side state (if needed)

If your app has global client state (audio player, shopping cart), add a provider with `useReducer`. The provider must be `'use client'`, but its `children` remain server components. Place it in the root layout. Only leaf client components call `useContext`. Don't use `useCallback`/`useMemo` when React Compiler is enabled.

## UI patterns

### Interactive list spacing

Use a small gap (`gap-0.5`) on vertical list containers of interactive rows so hover backgrounds don't merge into a single block.
