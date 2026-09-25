import type { NextConfig } from "next";

// When the mentorship subdomain is live, set NEXT_PUBLIC_MENTORSHIP_HOST (e.g.
// "mentorship.expervia.com"). Requests to that host are rewritten into the
// /mentorship route group, so the subdomain serves the product at its root
// while the code stays under /mentorship. Inert until the env var is set, so
// path-based /mentorship keeps working everywhere until the DNS/Vercel domain
// is attached (verify on a preview once it is).
const MENTORSHIP_HOST = process.env.NEXT_PUBLIC_MENTORSHIP_HOST;

const nextConfig: NextConfig = {
  async rewrites() {
    if (!MENTORSHIP_HOST) return [];
    const has = [{ type: "host" as const, value: MENTORSHIP_HOST }];
    return {
      beforeFiles: [
        { source: "/", has, destination: "/mentorship" },
        {
          // Everything except assets, api and the already-prefixed path.
          source: "/:path((?!mentorship$|mentorship/|_next/|api/).*)",
          has,
          destination: "/mentorship/:path",
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
  images: {
    // Event flyers are served from the public Supabase Storage bucket
    // (<ref>.supabase.co/storage/v1/object/public/...), so allow that host for
    // next/image.
    remotePatterns: [{ protocol: "https", hostname: "**.supabase.co" }],
  },
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
