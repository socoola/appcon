import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['bcryptjs'],

  async rewrites() {
    return [
      { source: '/api/san/ad-config', destination: '/api/ad-config' },
    ];
  },

  // Turbopack resolve aliases — replace pg and related modules with stubs.
  // We use @supabase/supabase-js (HTTP API), not direct pg connections.
  // pg is transitively required by coze-coding-dev-sdk but never used.
  // Without this alias, Turbopack bundles pg with a hash suffix (e.g. pg-<hash>)
  // which then can't be found at runtime, causing 500 errors on all APIs.
  turbopack: {
    resolveAlias: {
      'pg': './scripts/pg-stub.js',
      'pg-native': './scripts/pg-stub.js',
      'pg-pool': './scripts/pg-stub.js',
      'pg-query-stream': './scripts/pg-stub.js',
      'drizzle-orm': './scripts/pg-stub.js',
      'drizzle-zod': './scripts/pg-stub.js',
    },
  },
};

export default nextConfig;
