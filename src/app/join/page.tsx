import type { Metadata } from "next";
import Link from "next/link";
import { JoinForm } from "./join-form";

export const metadata: Metadata = {
  title: "Create your ETEN account",
  robots: { index: false, follow: false },
};

export default function JoinPage() {
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
        </div>

        <JoinForm />

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
