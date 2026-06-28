import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  cacheComponents: true,
  experimental: {
    inlineCss: true,
    useOffline: true,
    viewTransition: true,
    allowDevelopmentBuild: process.env.NODE_ENV === 'development' ? true : undefined,
  },
  productionBrowserSourceMaps: true,
  reactProductionProfiling: true,
  partialPrefetching: true,
  reactCompiler: true,
  typedRoutes: true,
};

export default nextConfig;
