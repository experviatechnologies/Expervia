import type { Metadata } from "next";
import Link from "next/link";
import { verifyUnsubscribe } from "@/lib/email-unsubscribe";
import { confirmUnsubscribe } from "./actions";

export const metadata: Metadata = {
  title: "Unsubscribe from ETEN announcements",
  robots: { index: false, follow: false },
};

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{
    e?: string;
    t?: string;
    done?: string;
    failed?: string;
  }>;
}) {
  const { e = "", t = "", done, failed } = await searchParams;
  const email = e.toLowerCase();
  const valid = verifyUnsubscribe(email, t);

  let title: string;
  let body: React.ReactNode;
  if (!valid) {
    title = "This link isn't valid";
    body = (
      <p>
        The unsubscribe link may have been cut short when it was copied. Open it
        again from the email, or reply to the email and we&apos;ll remove you.
      </p>
    );
  } else if (done) {
    title = "You're unsubscribed";
    body = (
      <p>
        <strong className="text-on-surface">{email}</strong> won&apos;t receive
        ETEN announcements any more. You&apos;ll still get emails about your
        account, sessions and payments, because you need those to use ETEN.
      </p>
    );
  } else {
    title = "Unsubscribe from announcements?";
    body = (
      <>
        <p>
          Stop sending ETEN announcements to{" "}
          <strong className="text-on-surface">{email}</strong>. You&apos;ll
          still get emails about your account, sessions and payments.
        </p>
        {failed && (
          <p className="border-destructive/30 bg-destructive/10 text-destructive mt-4 rounded-lg border p-3 text-sm">
            That didn&apos;t save. Please try again.
          </p>
        )}
        <form action={confirmUnsubscribe} className="mt-6">
          <input type="hidden" name="e" value={email} />
          <input type="hidden" name="t" value={t} />
          <button
            type="submit"
            className="bg-primary text-primary-foreground w-full rounded-lg px-5 py-3 font-semibold transition-opacity hover:opacity-90"
          >
            Unsubscribe
          </button>
        </form>
      </>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="glass-card w-full max-w-md rounded-2xl p-8 sm:p-10">
        <p className="text-label-sm text-primary mb-2 text-center font-mono tracking-widest uppercase">
          ETEN
        </p>
        <h1 className="font-display text-headline-md text-on-surface mb-4 text-center font-bold">
          {title}
        </h1>
        <div className="text-on-surface-variant text-sm leading-relaxed">
          {body}
        </div>
        <p className="mt-6 text-center text-sm">
          <Link href="/" className="text-primary hover:underline">
            Go to the Expervia website
          </Link>
        </p>
      </div>
    </div>
  );
}
