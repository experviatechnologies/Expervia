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
  const [{ data: pods }, { data: broadcastRows }] = await Promise.all([
    admin.from("pods").select("id, name").eq("is_main", false).order("name"),
    admin
      .from("email_broadcasts")
      .select(
        "id, subject, audience, recipient_count, sent_count, failed_count, sent_by, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const broadcasts = broadcastRows ?? [];
  const senderIds = [
    ...new Set(broadcasts.map((b) => b.sent_by).filter(Boolean)),
  ] as string[];
  const { data: senderRows } = senderIds.length
    ? await admin
        .from("profiles")
        .select("member_id, full_name")
        .in("member_id", senderIds)
    : { data: [] };
  const senderName = new Map(
    (senderRows ?? []).map((s) => [s.member_id, s.full_name ?? "Operations"]),
  );
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

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

      {broadcasts.length > 0 && (
        <section className="mt-10">
          <h2 className="text-eten-faint mb-3 font-mono text-xs tracking-wider uppercase">
            Recent sends
          </h2>
          <div className="bg-eten-panel border-eten-line overflow-hidden rounded-2xl border">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead>
                  <tr className="border-eten-line-soft border-b text-left">
                    <Th>Subject</Th>
                    <Th>Audience</Th>
                    <Th>Sent</Th>
                    <Th>By</Th>
                    <Th>When</Th>
                  </tr>
                </thead>
                <tbody>
                  {broadcasts.map((b) => (
                    <tr
                      key={b.id}
                      className="border-eten-line-soft border-b last:border-0"
                    >
                      <td className="text-eten-ink px-4 py-3 font-medium">
                        {b.subject}
                      </td>
                      <td className="text-eten-ink-muted px-4 py-3">
                        {b.audience}
                      </td>
                      <td className="text-eten-ink-muted px-4 py-3 tabular-nums">
                        {b.sent_count}/{b.recipient_count}
                        {b.failed_count > 0 ? (
                          <span className="text-destructive">
                            {" "}
                            · {b.failed_count} failed
                          </span>
                        ) : (
                          ""
                        )}
                      </td>
                      <td className="text-eten-ink-muted px-4 py-3">
                        {senderName.get(b.sent_by ?? "") ?? "Operations"}
                      </td>
                      <td className="text-eten-faint px-4 py-3 text-xs whitespace-nowrap tabular-nums">
                        {fmtDate(b.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
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
