import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentManager } from "@/lib/supabase-server";
import { isOperations } from "@/lib/auth";
import { RosterImporter } from "./roster-importer";

export const metadata: Metadata = {
  title: "Import roster",
  robots: { index: false, follow: false },
};

// Creating accounts is paced (auth and email rate limits): allow a full batch.
export const maxDuration = 60;

export default async function RosterImportPage() {
  const manager = await getCurrentManager();
  if (!manager) redirect("/admin/login");
  if (!(await isOperations())) redirect("/dashboard");

  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 py-7 md:px-8">
      <Link
        href="/admin/tracker-readiness"
        className="text-eten-faint hover:text-eten-ink mb-4 inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" /> Tracker readiness
      </Link>
      <h1 className="text-eten-ink text-[30px] font-extrabold tracking-[-0.02em]">
        Import the member roster
      </h1>
      <p className="text-eten-ink-muted mt-1.5 max-w-[760px] text-sm">
        Reconcile ETEN with the business&apos;s authoritative list of engineers
        and pods. Upload a CSV, review every row, then confirm. Nothing changes
        until you confirm, and nobody is removed from a pod because they are
        missing from the file.
      </p>
      <RosterImporter />
    </div>
  );
}
