import type { NextConfig } from "next";

// When the mentorship subdomain is live, set NEXT_PUBLIC_MENTORSHIP_HOST (e.g.
// "mentorship.expervia.com"). Requests to that host are rewritten into the
// /mentorship route group, so the subdomain serves the product at its root
// while the code stays under /mentorship. Inert until the env var is set, so
// path-based /mentorship keeps working everywhere until the DNS/Vercel domain
// is attached (verify on a preview once it is).
const MENTORSHIP_HOST = process.env.NEXT_PUBLIC_MENTORSHIP_HOST;

// The presales tracker's own address (Phase 9), e.g.
// "presales.experviatechnologies.com": that host serves /tracker at its root.
// Shared screens it hands off to (sign-in, two-step sign-in, password reset,
// auth callbacks) and api/ are served as they are. Inert until set.
const TRACKER_HOST = process.env.NEXT_PUBLIC_TRACKER_HOST;

const nextConfig: NextConfig = {
  async rewrites() {
    const beforeFiles: {
      source: string;
      has: { type: "host"; value: string }[];
      destination: string;
    }[] = [];
    if (TRACKER_HOST) {
      const has = [{ type: "host" as const, value: TRACKER_HOST }];
      beforeFiles.push(
        { source: "/", has, destination: "/tracker" },
        {
          source:
            "/:path((?!tracker$|tracker/|_next/|api/|auth/|signin$|join$|mfa$|forgot-password$|reset-password$|onboarding$|onboarding/|suspended$|.*\\..*).*)",
          has,
          destination: "/tracker/:path",
        },
      );
    }
    if (!MENTORSHIP_HOST) return { beforeFiles, afterFiles: [], fallback: [] };
    const has = [{ type: "host" as const, value: MENTORSHIP_HOST }];
    return {
      beforeFiles: [
        ...beforeFiles,
        { source: "/", has, destination: "/mentorship" },
        {
          // Everything except: static assets in /public (any path with a file
          // extension, e.g. /expervia-logo.png, /favicon.ico — the `.*\..*`
          // branch, so they're served from the root, not 404'd at
          // /mentorship/...), _next/ and api/, and the shared app routes the
          // mentorship product hands off to: /auth (email confirmation, password
          // recovery) and /onboarding (validation / "Continue to ETEN"). The
          // already-prefixed /mentorship path is excluded too.
          source:
            "/:path((?!mentorship$|mentorship/|_next/|api/|auth/|onboarding$|onboarding/|.*\\..*).*)",
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
