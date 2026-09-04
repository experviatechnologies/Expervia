import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { getCurrentMember } from "@/lib/auth";
import { SignOutButton } from "./sign-out-button";

export const metadata: Metadata = {
  title: "Account unavailable",
  robots: { index: false, follow: false },
};

export default async function SuspendedPage() {
  const member = await getCurrentMember();
  if (!member) redirect("/signin");
  // Active members have no business here — send them back into the app.
  if (member.status === "active") redirect("/dashboard");

  const isDeactivated = member.status === "deactivated";

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="glass-card w-full max-w-md rounded-2xl p-8 text-center sm:p-10">
        <span className="bg-destructive/10 text-destructive mx-auto mb-6 flex size-14 items-center justify-center rounded-full">
          <ShieldAlert className="size-7" />
        </span>
        <p className="text-label-sm text-primary mb-2 font-mono tracking-widest uppercase">
          ETEN
        </p>
        <h1 className="font-display text-headline-md text-on-surface font-bold">
          {isDeactivated
            ? "Your account is deactivated"
            : "Your account is suspended"}
        </h1>
        <p className="text-on-surface-variant mt-3 text-sm">
          {isDeactivated
            ? "This account has been deactivated and can no longer access ETEN. If you believe this is a mistake, contact the ETEN team."
            : "Your access to ETEN is temporarily suspended. If you have questions or believe this is a mistake, please contact the ETEN team."}
        </p>
        <div className="mt-8">
          <SignOutButton />
        </div>
      </div>
    </div>
  );
}
