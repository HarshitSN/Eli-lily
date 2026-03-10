import type { NextConfig } from "next";

const internalApiUrl =
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_GENESIS_API_URL ||
  "https://playground.statusneo.com";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "delivery-p137454-e1438138.adobeaemcloud.com",
        pathname: "/adobe/assets/**",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${internalApiUrl}/api/:path*`,
      },
      {
        source: "/health",
        destination: `${internalApiUrl}/health`,
      },
    ];
  },
};

export default nextConfig;
