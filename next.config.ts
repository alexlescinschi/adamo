import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  // ponytail: laptopuri/minipc erau copii ale category/[slug]; redirect permanent.
  // Next forwards ?type/?page automat.
  async redirects() {
    return [
      {
        source: "/:locale/laptopuri",
        destination: "/:locale/category/laptops",
        permanent: true,
      },
      {
        source: "/:locale/minipc",
        destination: "/:locale/category/minipc",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
