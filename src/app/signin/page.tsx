import type { Metadata } from "next";
import Link from "next/link";
import { SignInForm } from "./signin-form";

export const metadata: Metadata = {
  title: "Sign in to ETEN",
  robots: { index: false, follow: false },
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="glass-card w-full max-w-md rounded-2xl p-8 sm:p-10">
        <div className="mb-8 text-center">
          <p className="text-label-sm text-primary mb-2 font-mono tracking-widest uppercase">
            ETEN
          </p>
          <h1 className="font-display text-headline-md text-on-surface font-bold">
            Welcome back
          </h1>
          <p className="text-on-surface-variant mt-2 text-sm">
            Sign in to your professional community.
          </p>
        </div>

        {error === "link_invalid" && (
          <p className="border-destructive/30 bg-destructive/10 text-destructive mb-6 rounded-lg border p-3 text-center text-sm">
            That sign-in link was invalid or has expired. Please try again.
          </p>
        )}

        <SignInForm />

        <p className="mt-6 text-center text-sm">
          <Link
            href="/forgot-password"
            className="text-on-surface-variant hover:text-on-surface transition-colors"
          >
            Forgot your password?
          </Link>
        </p>

        <p className="text-on-surface-variant mt-2 text-center text-sm">
          New here?{" "}
          <Link href="/join" className="text-primary hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
