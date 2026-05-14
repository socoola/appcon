import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['bcryptjs', 'pg', 'pg-native', 'pg-pool', 'drizzle-orm'],
  async rewrites() {
    return [
      {
        source: '/api/san/ad-config',
        destination: '/api/ad-config',
      },
    ];
  },
};

export default nextConfig;
