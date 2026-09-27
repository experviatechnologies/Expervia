import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { getCurrentManager } from "@/lib/supabase-server";
import { isOperations } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { SendReminderControl } from "./send-reminder-control";

export const metadata: Metadata = {
  title: "Document gaps",
  robots: { index: false, follow: false },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

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

export default async function MemberGapsPage() {
  const manager = await getCurrentManager();
  if (!manager) redirect("/admin/login");
  if (!(await isOperations())) redirect("/dashboard");

  const admin = getSupabaseAdmin();

  const [
    { data: memberRows },
    { data: profileRows },
    { data: verifRows },
    { data: certRows },
    { data: reminderRows },
    emails,
  ] = await Promise.all([
    admin
      .from("members")
      .select("id, membership_id, created_at")
      .eq("status", "active")
      .order("created_at", { ascending: true }),
    admin.from("profiles").select("member_id, full_name"),
    admin
      .from("member_verifications")
      .select("member_id, kind")
      .eq("status", "verified"),
    admin.from("certifications").select("member_id"),
    admin
      .from("member_document_reminders")
      .select("member_id, sent_at")
      .order("sent_at", { ascending: false }),
    loadEmails(admin),
  ]);

  const nameById = new Map(
    (profileRows ?? []).map((p) => [p.member_id, p.full_name ?? "A member"]),
  );
  const verifiedIdentity = new Set<string>();
  const verifiedAddress = new Set<string>();
  for (const v of verifRows ?? []) {
    if (v.kind === "identity") verifiedIdentity.add(v.member_id);
    else if (v.kind === "address") verifiedAddress.add(v.member_id);
  }
  const hasCert = new Set<string>();
  for (const c of certRows ?? []) hasCert.add(c.member_id);

  // Rows are newest-first, so the first seen per member is the latest reminder.
  const lastReminder = new Map<string, string>();
  for (const r of reminderRows ?? []) {
    if (!lastReminder.has(r.member_id))
      lastReminder.set(r.member_id, r.sent_at);
  }

  type GapRow = {
    id: string;
    membershipId: string | null;
    name: string;
    email: string | null;
    gaps: string[];
    lastReminded: string | null;
  };
  const rows: GapRow[] = [];
  for (const m of memberRows ?? []) {
    const gaps: string[] = [];
    if (!verifiedIdentity.has(m.id)) gaps.push("Identity");
    if (!verifiedAddress.has(m.id)) gaps.push("Proof of address");
    if (!hasCert.has(m.id)) gaps.push("Certification");
    if (gaps.length === 0) continue;
    rows.push({
      id: m.id,
      membershipId: m.membership_id,
      name: nameById.get(m.id) ?? "A member",
      email: emails.get(m.id) ?? null,
      gaps,
      lastReminded: lastReminder.get(m.id) ?? null,
    });
  }

  const activeTotal = (memberRows ?? []).length;

  return (
    <div className="mx-auto w-full max-w-[1180px] px-4 py-6 md:px-6">
      <Link
        href="/admin/members"
        className="text-eten-faint hover:text-eten-ink mb-4 inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" />
        All members
      </Link>

      <header className="mb-6">
        <h1 className="text-eten-ink text-2xl font-extrabold tracking-[-0.02em]">
          Document gaps
        </h1>
        <p className="text-eten-ink-muted mt-1 text-sm">
          {rows.length} of {activeTotal} active member
          {activeTotal === 1 ? "" : "s"} are missing a verified identity, proof
          of address, or a certification. Send a reminder to nudge them.
        </p>
      </header>

      {rows.length === 0 ? (
        <div className="bg-eten-panel border-eten-line text-eten-faint flex flex-col items-center gap-3 rounded-2xl border p-16 text-center">
          <ShieldCheck className="text-eten-verified/60 size-10" />
          <p>Every active member has completed their documents.</p>
        </div>
      ) : (
        <div className="bg-eten-panel border-eten-line overflow-hidden rounded-2xl border">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="border-eten-line-soft border-b text-left">
                  <Th>Member</Th>
                  <Th>Missing</Th>
                  <Th>Last reminded</Th>
                  <Th>Action</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    className="border-eten-line-soft hover:bg-eten-hover border-b last:border-0"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/members/${r.id}`}
                        className="text-eten-ink font-medium hover:underline"
                      >
                        {r.name}
                      </Link>
                      <div className="text-eten-faint font-mono text-[11px]">
                        {r.membershipId ?? "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {r.gaps.map((g) => (
                          <span
                            key={g}
                            className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-400"
                          >
                            {g}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="text-eten-ink-muted px-4 py-3 text-xs whitespace-nowrap tabular-nums">
                      {r.lastReminded ? formatDate(r.lastReminded) : "Never"}
                    </td>
                    <td className="px-4 py-3">
                      <SendReminderControl
                        memberId={r.id}
                        hasEmail={Boolean(r.email)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="text-eten-faint px-4 py-3 font-mono text-[11px] font-bold tracking-wider uppercase">
      {children}
    </th>
  );
}
