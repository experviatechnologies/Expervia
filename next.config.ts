import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Persist Turbopack's compile cache to .next/ so dev restarts are warm
    // instead of recompiling every route from scratch (stable for dev).
    turbopackFileSystemCacheForDev: true,
  },
};

export default nextConfig;
