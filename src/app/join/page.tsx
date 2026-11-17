import type { Metadata } from "next";
import Link from "next/link";
import { JoinForm } from "./join-form";
import {
  COMMUNITY_INTERESTS,
  parseCommunityInterest,
} from "@/lib/eten/community-interest";
import { AuthShell, authLinkClass } from "@/components/site/auth-shell";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Create your ETEN account",
  robots: { index: false, follow: false },
};

const steps = [
  { title: "Create your account", text: "Name, email and a password." },
  { title: "Complete your profile", text: "Your role, experience and CV." },
  {
    title: "Member verification",
    text: "We confirm your details and onboard you.",
  },
  {
    title: "Join your communities",
    text: "Pick the Pods that match your expertise.",
  },
];

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Arriving from a community landing page (e.g. /women-in-tech) records that
  // interest on the new account. Unknown values are ignored.
  const community = parseCommunityInterest((await searchParams).community);

  return (
    <AuthShell
      eyebrow={community ? COMMUNITY_INTERESTS[community] : "Join ETEN"}
      headline="The professional community for technology talent across Africa and beyond."
      aside={
        <ol aria-label="How joining works" className="flex flex-col">
          {steps.map((s, i) => {
            // Steps 1-2 happen in the signup flow itself; 3-4 come after.
            const current = i < 2;
            return (
              <li key={s.title} className="relative flex gap-4 pb-7 last:pb-0">
                {i < steps.length - 1 && (
                  <span
                    aria-hidden
                    className="absolute top-9 bottom-1 left-[15px] w-px bg-white/15"
                  />
                )}
                <span
                  className={cn(
                    "inline-flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                    current
                      ? "text-brand-900 bg-white"
                      : "text-brand-100 border border-white/25",
                  )}
                >
                  {i + 1}
                </span>
                <div>
                  <p
                    className={cn(
                      "font-semibold",
                      current ? "text-white" : "text-brand-100/70",
                    )}
                  >
                    {s.title}
                  </p>
                  <p className="text-brand-100/65 mt-0.5 text-sm">{s.text}</p>
                </div>
              </li>
            );
          })}
        </ol>
      }
    >
      <JoinForm community={community} />
      <p className="border-brand-100 text-ink/70 mt-6 border-t pt-6 text-sm">
        Already a member?{" "}
        <Link href="/signin" className={authLinkClass}>
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
