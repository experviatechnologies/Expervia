"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PendingMember } from "@/lib/eten/migration-pending";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function csvCell(value: string | null): string {
  const s = (value ?? "").replace(/"/g, '""');
  return `"${s}"`;
}

export function PendingClaims({ pending }: { pending: PendingMember[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingT, startTransition] = useTransition();

  const MAX_BATCH = 50;

  function resend(memberIds: string[], bulk: boolean) {
    setError(null);
    setMessage(null);
    if (bulk) setBulkBusy(true);
    else setBusyId(memberIds[0]);
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/resend-invite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ memberIds }),
        });
        const data: {
          sent?: number;
          error?: string;
          processed?: { status: string }[];
        } = await res.json().catch(() => ({}));
        if (!res.ok || data.error) {
          setError(data.error ?? "Couldn't send. Please try again.");
        } else {
          const failed =
            (data.processed ?? []).filter((p) => p.status === "failed")
              .length ?? 0;
          setMessage(
            `Sent ${data.sent ?? 0} invite${data.sent === 1 ? "" : "s"}` +
              (failed ? ` · ${failed} failed` : "") +
              ".",
          );
          router.refresh();
        }
      } catch {
        setError("Network error. Please try again.");
      } finally {
        setBulkBusy(false);
        setBusyId(null);
      }
    });
  }

  function exportCsv() {
    const header = [
      "Name",
      "Email",
      "Location",
      "Job title",
      "Industry",
      "Invited",
    ];
    const rows = pending.map((p) =>
      [
        p.fullName,
        p.email,
        p.location,
        p.jobTitle,
        p.industryExperience,
        formatDate(p.invitedAt),
      ]
        .map(csvCell)
        .join(","),
    );
    const csv = [header.map(csvCell).join(","), ...rows].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `eten-pending-migration-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  if (pending.length === 0) {
    return (
      <div className="bg-eten-panel border-eten-line text-eten-faint rounded-2xl border p-8 text-center text-sm">
        Everyone who was migrated has claimed their account. 🎉
      </div>
    );
  }

  const allIds = pending.slice(0, MAX_BATCH).map((p) => p.memberId);

  return (
    <div className="bg-eten-panel border-eten-line rounded-2xl border">
      <div className="border-eten-line-soft flex flex-wrap items-center justify-between gap-3 border-b p-5">
        <div>
          <h2 className="text-eten-ink font-bold">
            Not yet claimed · {pending.length}
          </h2>
          <p className="text-eten-faint mt-0.5 text-xs">
            Migrated members who were invited but haven&apos;t signed in.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="etenOutline"
            size="sm"
            onClick={exportCsv}
          >
            <Download className="size-3.5" />
            Export CSV
          </Button>
          <Button
            type="button"
            variant="eten"
            size="sm"
            disabled={pendingT || bulkBusy}
            onClick={() => resend(allIds, true)}
          >
            {bulkBusy ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Send className="size-3.5" />
            )}
            Resend to{" "}
            {pending.length > MAX_BATCH ? `first ${MAX_BATCH}` : "all"}
          </Button>
        </div>
      </div>

      {(message || error) && (
        <div className="border-eten-line-soft border-b px-5 py-3 text-sm">
          {message && <p className="text-eten-verified">{message}</p>}
          {error && <p className="text-destructive">{error}</p>}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] border-collapse text-sm">
          <thead>
            <tr className="border-eten-line-soft border-b text-left">
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Location</Th>
              <Th>Invited</Th>
              <Th> </Th>
            </tr>
          </thead>
          <tbody>
            {pending.map((p) => (
              <tr
                key={p.memberId}
                className="border-eten-line-soft hover:bg-eten-hover border-b last:border-0"
              >
                <td className="text-eten-ink px-4 py-3 font-medium">
                  {p.fullName ?? "—"}
                </td>
                <td className="text-eten-ink-muted px-4 py-3">
                  {p.email ?? "—"}
                </td>
                <td className="text-eten-ink-muted px-4 py-3">
                  {p.location ?? "—"}
                </td>
                <td className="text-eten-ink-muted px-4 py-3 text-xs whitespace-nowrap tabular-nums">
                  {formatDate(p.invitedAt)}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    type="button"
                    variant="etenOutline"
                    size="sm"
                    disabled={pendingT || busyId === p.memberId}
                    onClick={() => resend([p.memberId], false)}
                  >
                    {busyId === p.memberId ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Send className="size-3.5" />
                    )}
                    Resend
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
