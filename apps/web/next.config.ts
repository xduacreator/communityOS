import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    const backendUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const cleanBackendUrl = backendUrl.replace(/\/$/, '');
    const targetUrl = cleanBackendUrl.endsWith('/api') ? cleanBackendUrl : `${cleanBackendUrl}/api`;

    return [
      {
        source: '/api/:path*',
        destination: `${targetUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
