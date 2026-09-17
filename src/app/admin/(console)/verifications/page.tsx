import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BadgeCheck, FileText, MapPin, ShieldCheck } from "lucide-react";
import { getCurrentManager } from "@/lib/supabase-server";
import { isOperations } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { ReviewControl } from "./review-control";

export const metadata: Metadata = {
  title: "Identity & Address",
  robots: { index: false, follow: false },
};

const ID_TYPE_LABEL: Record<string, string> = {
  passport: "International Passport",
  drivers_license: "Driver's License",
  nin: "National ID (NIN)",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

type Row = {
  id: string;
  member_id: string;
  kind: "identity" | "address";
  document_type: "passport" | "drivers_license" | "nin" | null;
  status: "unverified" | "verified" | "rejected";
  file_path: string;
  review_note: string | null;
  created_at: string;
  reviewed_at: string | null;
};

export default async function AdminVerificationsPage() {
  const manager = await getCurrentManager();
  if (!manager) redirect("/admin/login");
  if (!(await isOperations())) redirect("/dashboard");

  const admin = getSupabaseAdmin();

  const { data: rowsData } = await admin
    .from("member_verifications")
    .select(
      "id, member_id, kind, document_type, status, file_path, review_note, created_at, reviewed_at",
    )
    .order("created_at", { ascending: false });
  const rows = (rowsData ?? []) as Row[];

  const memberIds = [...new Set(rows.map((r) => r.member_id))];
  const { data: profileRows } = memberIds.length
    ? await admin
        .from("profiles")
        .select("member_id, full_name")
        .in("member_id", memberIds)
    : { data: [] };
  const nameById = new Map(
    (profileRows ?? []).map((p) => [p.member_id, p.full_name]),
  );

  const pending = rows.filter((r) => r.status === "unverified");
  const reviewed = rows.filter((r) => r.status !== "unverified");

  return (
    <div className="mx-auto w-full max-w-[1180px] px-4 py-6 md:px-6">
      <header className="mb-6">
        <h1 className="text-eten-ink text-2xl font-extrabold tracking-[-0.02em]">
          Identity &amp; Address
        </h1>
        <p className="text-eten-ink-muted mt-1 text-sm">
          Review members&apos; KYC documents. {pending.length} awaiting review.
        </p>
      </header>

      {/* Pending queue */}
      <section className="mb-8">
        <h2 className="text-eten-faint mb-3 font-mono text-xs tracking-wider uppercase">
          Pending · {pending.length}
        </h2>
        {pending.length === 0 ? (
          <div className="bg-eten-panel border-eten-line text-eten-faint flex flex-col items-center gap-3 rounded-2xl border p-12 text-center">
            <ShieldCheck className="text-eten-faint/50 size-9" />
            <p className="text-sm">Nothing awaiting review.</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {pending.map((r) => (
              <li
                key={r.id}
                className="bg-eten-panel border-eten-line flex flex-wrap items-start justify-between gap-4 rounded-2xl border p-5"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <KindBadge kind={r.kind} />
                    <Link
                      href={`/admin/members/${r.member_id}`}
                      className="text-eten-ink font-semibold hover:underline"
                    >
                      {nameById.get(r.member_id) ?? "A member"}
                    </Link>
                  </div>
                  <div className="text-eten-faint mt-1 text-xs">
                    {r.kind === "identity" && r.document_type
                      ? `${ID_TYPE_LABEL[r.document_type]} · `
                      : ""}
                    submitted {formatDate(r.created_at)}
                  </div>
                  <a
                    href={`/api/admin/verification?path=${encodeURIComponent(r.file_path)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-eten-accent mt-2 inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
                  >
                    <FileText className="size-4" />
                    View document
                  </a>
                </div>
                <ReviewControl id={r.id} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Reviewed */}
      {reviewed.length > 0 && (
        <section>
          <h2 className="text-eten-faint mb-3 font-mono text-xs tracking-wider uppercase">
            Reviewed · {reviewed.length}
          </h2>
          <div className="bg-eten-panel border-eten-line overflow-hidden rounded-2xl border">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead>
                  <tr className="border-eten-line-soft border-b text-left">
                    <Th>Member</Th>
                    <Th>Type</Th>
                    <Th>Status</Th>
                    <Th>Reviewed</Th>
                    <Th>Document</Th>
                  </tr>
                </thead>
                <tbody>
                  {reviewed.map((r) => (
                    <tr
                      key={r.id}
                      className="border-eten-line-soft hover:bg-eten-hover border-b last:border-0"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/members/${r.member_id}`}
                          className="text-eten-ink font-medium hover:underline"
                        >
                          {nameById.get(r.member_id) ?? "A member"}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <KindBadge kind={r.kind} />
                      </td>
                      <td className="px-4 py-3">
                        {r.status === "verified" ? (
                          <span className="text-eten-verified text-xs font-semibold">
                            Verified
                          </span>
                        ) : (
                          <span className="text-destructive text-xs font-semibold">
                            Rejected
                          </span>
                        )}
                      </td>
                      <td className="text-eten-ink-muted px-4 py-3 text-xs whitespace-nowrap tabular-nums">
                        {r.reviewed_at ? formatDate(r.reviewed_at) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <a
                          href={`/api/admin/verification?path=${encodeURIComponent(r.file_path)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-eten-accent inline-flex items-center gap-1.5 text-xs font-medium hover:underline"
                        >
                          <FileText className="size-3.5" />
                          View
                        </a>
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

function KindBadge({ kind }: { kind: "identity" | "address" }) {
  return kind === "identity" ? (
    <span className="bg-eten-accent-soft text-eten-accent inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold">
      <BadgeCheck className="size-3" />
      Identity
    </span>
  ) : (
    <span className="bg-eten-panel-hi text-eten-ink-muted inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold">
      <MapPin className="size-3" />
      Address
    </span>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="text-eten-faint px-4 py-3 font-mono text-[11px] font-bold tracking-wider uppercase">
      {children}
    </th>
  );
}
