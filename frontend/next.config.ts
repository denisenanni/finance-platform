import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api",
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "s.yimg.com",
      },
      {
        protocol: "https",
        hostname: "media.zenfs.com",
      },
    ],
  },
};

export default nextConfig;
