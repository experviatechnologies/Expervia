import type { Metadata } from "next";
import Link from "next/link";
import { Briefcase, Layers, Presentation, Sprout } from "lucide-react";
import { SignInForm } from "./signin-form";
import { safeNext as toSafeNext } from "@/lib/safe-next";
import {
  AuthShell,
  authErrorClass,
  authLinkClass,
} from "@/components/site/auth-shell";

export const metadata: Metadata = {
  title: "Sign in to ETEN",
  robots: { index: false, follow: false },
};

const perks = [
  {
    icon: Layers,
    title: "Your communities and Pods",
    text: "Pick up the discussions in your specialist communities.",
  },
  {
    icon: Presentation,
    title: "Webinars and sessions",
    text: "Join expert-led sessions and knowledge-sharing activities.",
  },
  {
    icon: Briefcase,
    title: "Projects and collaboration",
    text: "Find practical projects and teams to work with.",
  },
  {
    icon: Sprout,
    title: "Mentorship",
    text: "Learn from experienced professionals, or mentor others.",
  },
];

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string; notice?: string }>;
}) {
  const { error, next, notice } = await searchParams;
  // Only same-site paths (e.g. /tracker); anything else falls back.
  const safeNext = toSafeNext(next);

  return (
    <AuthShell
      eyebrow="Member sign in"
      headline="Welcome back to your technology network."
      aside={
        <ul aria-label="In your network" className="flex flex-col gap-5">
          {perks.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex gap-4">
              <span className="text-brand-100 inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
                <Icon aria-hidden className="size-5" />
              </span>
              <div>
                <p className="font-semibold text-white">{title}</p>
                <p className="text-brand-100/65 mt-0.5 text-sm">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      }
    >
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="font-jakarta text-brand-950 text-3xl font-extrabold tracking-tight sm:text-[2.1rem]">
            Sign in to ETEN
          </h1>
          <p className="text-ink/65 mt-2">
            Welcome back. Use the email and password you registered with.
          </p>
        </div>

        {error === "link_invalid" && (
          <p role="alert" className={authErrorClass}>
            That sign-in link was invalid or has expired. Please try again.
          </p>
        )}

        {notice === "already_active" && (
          <p
            role="status"
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
          >
            Your account is already active. Sign in with your email and
            password, or choose &ldquo;Forgot password&rdquo; if you need a new
            one.
          </p>
        )}
        {(notice === "activation_expired" ||
          notice === "activation_failed") && (
          <p role="alert" className={authErrorClass}>
            {notice === "activation_expired"
              ? "That activation link has expired or isn't valid."
              : "We couldn't open that activation link just now."}{" "}
            Choose &ldquo;Forgot password&rdquo; below with your email address
            and we&apos;ll send you a new link.
          </p>
        )}

        <SignInForm next={safeNext} />

        <p className="border-brand-100 text-ink/70 border-t pt-6 text-[0.95rem]">
          New to ETEN?{" "}
          <Link href="/join" className={authLinkClass}>
            Create an account
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
