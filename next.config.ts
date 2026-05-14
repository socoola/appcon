import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.resolve(__dirname, '../../'),
  allowedDevOrigins: ['*.dev.coze.site'],
  serverExternalPackages: ['pg', 'pg-native', 'bcryptjs', 'drizzle-orm'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*',
        pathname: '/**',
      },
    ],
  },
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
