import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BadgeCheck } from "lucide-react";
import { getCurrentManager } from "@/lib/supabase-server";
import { isOperations } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { SignOutButton } from "../applications/sign-out-button";
import { AdminTabs } from "../admin-tabs";
import { CertificationsReview, type CertRow } from "./certifications-review";

export const metadata: Metadata = {
  title: "Certifications",
  robots: { index: false, follow: false },
};

/** Gather auth emails (id → email) across all pages, capped for safety. */
async function loadEmails(
  admin: ReturnType<typeof getSupabaseAdmin>,
): Promise<Map<string, string>> {
  const emails = new Map<string, string>();
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error || !data?.users?.length) break;
    for (const u of data.users) if (u.email) emails.set(u.id, u.email);
    if (data.users.length < 1000) break;
  }
  return emails;
}

export default async function AdminCertificationsPage() {
  const manager = await getCurrentManager();
  if (!manager) redirect("/admin/login");
  if (!(await isOperations())) redirect("/dashboard");

  const admin = getSupabaseAdmin();

  // Read via service_role: ops needs to see every member's certs regardless of
  // RLS, plus the member's name/email for context. Writes go through the ops
  // session client (see actions.ts) so the verification trigger permits them.
  const [{ data: certRows }, { data: profileRows }, emails] = await Promise.all(
    [
      admin
        .from("certifications")
        .select(
          "id, member_id, name, issuer, credential_id, date_obtained, expiry_date, verification_status, certificate_path, created_at",
        )
        .order("created_at", { ascending: false }),
      admin.from("profiles").select("member_id, full_name"),
      loadEmails(admin),
    ],
  );

  const names = new Map<string, string | null>();
  for (const p of profileRows ?? []) names.set(p.member_id, p.full_name);

  const certs: CertRow[] = (certRows ?? []).map((c) => ({
    id: c.id,
    memberId: c.member_id,
    memberName: names.get(c.member_id) ?? null,
    memberEmail: emails.get(c.member_id) ?? null,
    name: c.name,
    issuer: c.issuer,
    credentialId: c.credential_id,
    dateObtained: c.date_obtained,
    expiryDate: c.expiry_date,
    status: c.verification_status,
    certificatePath: c.certificate_path,
    createdAt: c.created_at,
  }));

  const pendingCount = certs.filter((c) => c.status === "unverified").length;

  return (
    <div className="px-margin-mobile md:px-margin-desktop mx-auto max-w-6xl py-10">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-label-sm text-primary mb-1 font-mono tracking-widest uppercase">
            Expervia Admin
          </p>
          <h1 className="font-display text-headline-lg text-on-surface font-bold">
            Certifications
          </h1>
          <p className="text-on-surface-variant mt-1 text-sm">
            {certs.length} submitted · {pendingCount} awaiting review. Verified
            credentials appear on the member&apos;s public profile.
          </p>
        </div>
        <SignOutButton />
      </div>

      <AdminTabs active="certifications" />

      {certs.length === 0 ? (
        <div className="glass-card text-on-surface-variant flex flex-col items-center gap-3 rounded-2xl p-16 text-center">
          <BadgeCheck className="text-on-surface-variant/50 size-10" />
          <p>No certifications submitted yet.</p>
        </div>
      ) : (
        <CertificationsReview certs={certs} />
      )}
    </div>
  );
}
