import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BadgeCheck } from "lucide-react";
import { getCurrentManager } from "@/lib/supabase-server";
import { isOperations } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
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

  return (
    <div className="mx-auto w-full max-w-[1360px] px-4 py-7 md:px-8">
      <header className="mb-6 max-w-[680px]">
        <h1 className="text-eten-ink text-[30px] font-extrabold tracking-[-0.02em]">
          Certifications
        </h1>
        <p className="text-eten-ink-muted mt-1.5 text-[15px] leading-relaxed">
          Review members&apos; credentials. Verified credentials appear on the
          member&apos;s public profile.
        </p>
      </header>

      {certs.length === 0 ? (
        <div className="bg-eten-panel border-eten-line text-eten-ink-muted flex flex-col items-center gap-3 rounded-2xl border p-16 text-center">
          <BadgeCheck className="text-eten-faint size-10" />
          <p>No certifications submitted yet.</p>
        </div>
      ) : (
        <CertificationsReview certs={certs} />
      )}
    </div>
  );
}
