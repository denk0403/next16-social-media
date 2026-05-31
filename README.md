# Next 16 Social Media "Drop"

A dev-flavored social network built with Next.js 16, React 19, Tailwind CSS v4, Prisma 7 on Neon Postgres, and Shiki for server-side syntax highlighting.

The architecture follows the [Next.js App Architecture](.agents/skills/nextjs-app-architecture/SKILL.md) skill and the [Component Architecture for React Server Components](https://aurorascharff.no/posts/component-architecture-for-react-server-components/) blog post.

## Architecture

- **Feature-sliced structure**: `drop/`, `user/`, `tag/` each own queries, actions, and components
- **Components own their data**: `<Feed>`, `<DropDetail>`, `<TrendingTagsList>` fetch on the server. Move them between pages freely
- **Pages compose, they don't fetch**: each page is a synchronous blueprint of async components wrapped in Suspense
- **Client boundaries as leaf nodes**: `'use client'` pushed deep. Server content flows into client components as children

## Caching and Navigation

- **Cache Components**: `'use cache'` per query, not per page. A feed caches for seconds, trending tags for minutes, user-specific data with `'use cache: private'`. `cacheTag` names data, `updateTag` invalidates both server and browser cache
- **Runtime prefetching**: all pages export `unstable_prefetch = 'force-runtime'` so the framework prefetches cached dynamic data ahead of time, making even database-driven pages instant on click

## Getting Started

```bash
pnpm install
pnpm run prisma.push
pnpm run prisma.seed
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
app/                    Pages and layouts
components/ui/          Visual primitives
features/
  drop/                 Queries, actions, and components for drops
  user/                 Queries, actions, and components for users
  tag/                  Queries and components for tags
  search/               Components for search
types/                  Shared types
lib/                    Prisma client, utilities
tests/                  Playwright E2E tests
```

## E2E Tests

Uses `@next/playwright` with the `instant()` API to assert loading states:

```bash
pnpm test:e2e
```

## Database

Uses Prisma with PostgreSQL (Neon).

```bash
pnpm run prisma.push     # Push schema to DB
pnpm run prisma.seed     # Seed with sample data
pnpm run prisma.studio   # Open Prisma Studio
pnpm run prisma.reset    # Reset and re-seed
```
