import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  serverExternalPackages: ['bcryptjs'],
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
