import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Persist Turbopack's compile cache to .next/ so dev restarts are warm
    // instead of recompiling every route from scratch (stable for dev).
    turbopackFileSystemCacheForDev: true,
    // Server Actions cap request bodies at 1MB by default. Certificate uploads
    // (addCertification/updateCertification) accept files up to 10MB, so raise
    // the limit above that — with headroom for multipart encoding and the other
    // form fields — or larger files fail with a generic framework server error
    // before the action's own validation ever runs.
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
