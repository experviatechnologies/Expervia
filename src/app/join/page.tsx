import type { Metadata } from "next";
import Link from "next/link";
import { JoinForm } from "./join-form";
import {
  COMMUNITY_INTERESTS,
  parseCommunityInterest,
} from "@/lib/eten/community-interest";

export const metadata: Metadata = {
  title: "Create your ETEN account",
  robots: { index: false, follow: false },
};

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Arriving from a community landing page (e.g. /women-in-tech) records that
  // interest on the new account. Unknown values are ignored.
  const community = parseCommunityInterest((await searchParams).community);

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="glass-card w-full max-w-md rounded-2xl p-8 sm:p-10">
        <div className="mb-8 text-center">
          <p className="text-label-sm text-primary mb-2 font-mono tracking-widest uppercase">
            Join ETEN
          </p>
          <h1 className="font-display text-headline-md text-on-surface font-bold">
            Create your account
          </h1>
          <p className="text-on-surface-variant mt-2 text-sm">
            The professional community for technology talent across Africa.
          </p>
          {community && (
            <p className="border-primary/30 bg-primary/10 text-primary mt-4 inline-flex rounded-full border px-3 py-1 text-xs font-semibold">
              Joining {COMMUNITY_INTERESTS[community]}
            </p>
          )}
        </div>

        <JoinForm community={community} />

        <p className="text-on-surface-variant mt-6 text-center text-sm">
          Already have an account?{" "}
          <Link href="/signin" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
