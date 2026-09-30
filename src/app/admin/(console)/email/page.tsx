import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentManager } from "@/lib/supabase-server";
import { isOperations } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { EmailComposer } from "./email-composer";

export const metadata: Metadata = {
  title: "Send email",
  robots: { index: false, follow: false },
};

export default async function AdminEmailPage() {
  const manager = await getCurrentManager();
  if (!manager) redirect("/admin/login");
  if (!(await isOperations())) redirect("/dashboard");

  const admin = getSupabaseAdmin();
  const { data: pods } = await admin
    .from("pods")
    .select("id, name")
    .eq("is_main", false)
    .order("name");

  return (
    <div className="mx-auto w-full max-w-[1180px] px-4 py-6 md:px-6">
      <header className="mb-6">
        <h1 className="text-eten-ink text-2xl font-extrabold tracking-[-0.02em]">
          Send email
        </h1>
        <p className="text-eten-ink-muted mt-1 text-sm">
          Compose a custom email and send it to a chosen audience. Messages go
          out individually, so recipients never see each other.
        </p>
      </header>

      <EmailComposer pods={pods ?? []} />
    </div>
  );
}
