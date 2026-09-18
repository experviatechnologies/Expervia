import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentManager } from "@/lib/supabase-server";
import { isOperations } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { listPendingMigration } from "@/lib/eten/migration-pending";
import { MigrationRunner } from "./migration-runner";
import { PendingClaims } from "./pending-claims";

export const metadata: Metadata = {
  title: "Member Migration",
  robots: { index: false, follow: false },
};

export default async function MigrationPage() {
  const manager = await getCurrentManager();
  if (!manager) redirect("/admin/login");
  if (!(await isOperations())) redirect("/dashboard");

  const pending = await listPendingMigration(getSupabaseAdmin());

  return (
    <div className="px-margin-mobile md:px-margin-desktop mx-auto max-w-4xl py-10">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-label-sm text-primary mb-1 font-mono tracking-widest uppercase">
            Expervia Admin
          </p>
          <h1 className="font-display text-headline-lg text-on-surface font-bold">
            Existing-member Migration
          </h1>
          <p className="text-on-surface-variant mt-1 max-w-2xl text-sm">
            Invite people who already registered with Expervia (community
            applications + event registrations) to claim a pre-built ETEN
            account. Always preview first, then test on your own address, then
            send.
          </p>
        </div>
      </div>

      <div className="mb-8">
        <PendingClaims pending={pending} />
      </div>

      <MigrationRunner />
    </div>
  );
}
