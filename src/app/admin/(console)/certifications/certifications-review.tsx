"use client";

import { useMemo, useState, useTransition } from "react";
import { Check, FileText, Loader2, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setVerificationStatus } from "./actions";

export type CertRow = {
  id: string;
  memberId: string;
  memberName: string | null;
  memberEmail: string | null;
  name: string;
  issuer: string | null;
  credentialId: string | null;
  dateObtained: string | null;
  expiryDate: string | null;
  status: "unverified" | "verified" | "rejected";
  certificatePath: string | null;
  createdAt: string;
};

type Filter = "unverified" | "verified" | "rejected" | "all";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "unverified", label: "Pending" },
  { key: "verified", label: "Verified" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All" },
];

function StatusBadge({ status }: { status: CertRow["status"] }) {
  const map = {
    unverified: {
      cls: "border-amber-500/30 bg-amber-500/10 text-amber-400",
      label: "Pending",
    },
    verified: {
      cls: "border-primary/30 bg-primary/10 text-primary",
      label: "Verified",
    },
    rejected: {
      cls: "border-destructive/30 bg-destructive/10 text-destructive",
      label: "Rejected",
    },
  } as const;
  const { cls, label } = map[status];
  return (
    <span
      className={`inline-block rounded-full border px-2.5 py-1 text-xs font-medium ${cls}`}
    >
      {label}
    </span>
  );
}

export function CertificationsReview({ certs }: { certs: CertRow[] }) {
  const [filter, setFilter] = useState<Filter>("unverified");
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const counts = useMemo(
    () => ({
      unverified: certs.filter((c) => c.status === "unverified").length,
      verified: certs.filter((c) => c.status === "verified").length,
      rejected: certs.filter((c) => c.status === "rejected").length,
      all: certs.length,
    }),
    [certs],
  );

  const shown =
    filter === "all" ? certs : certs.filter((c) => c.status === filter);

  function act(certId: string, status: CertRow["status"]) {
    setError(null);
    setBusyId(certId);
    startTransition(async () => {
      const res = await setVerificationStatus({ certId, status });
      if ("error" in res) setError(res.error);
      setBusyId(null);
    });
  }

  return (
    <div>
      {/* Filter tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={
              filter === key
                ? "bg-primary text-primary-foreground rounded-full px-3.5 py-1.5 text-sm font-semibold"
                : "border-outline-variant text-on-surface-variant hover:text-on-surface rounded-full border px-3.5 py-1.5 text-sm transition-colors"
            }
          >
            {label}
            <span className="ml-1.5 opacity-60">{counts[key]}</span>
          </button>
        ))}
      </div>

      {error && (
        <p className="border-destructive/30 bg-destructive/10 text-destructive mb-4 rounded-lg border p-3 text-sm">
          {error}
        </p>
      )}

      {shown.length === 0 ? (
        <div className="glass-card text-on-surface-variant rounded-2xl p-12 text-center text-sm">
          Nothing here.
        </div>
      ) : (
        <div className="glass-card overflow-x-auto rounded-2xl">
          <table className="w-full min-w-[820px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left">
                <Th>Member</Th>
                <Th>Certification</Th>
                <Th>Proof</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {shown.map((c) => {
                const isBusy = pending && busyId === c.id;
                return (
                  <tr
                    key={c.id}
                    className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]"
                  >
                    <td className="px-4 py-4 align-top">
                      <div className="text-on-surface font-medium">
                        {c.memberName ?? "—"}
                      </div>
                      {c.memberEmail && (
                        <div className="text-on-surface-variant text-xs">
                          {c.memberEmail}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className="text-on-surface font-medium">
                        {c.name}
                      </div>
                      <div className="text-on-surface-variant text-xs">
                        {[
                          c.issuer,
                          c.credentialId && `ID: ${c.credentialId}`,
                          formatDate(c.dateObtained),
                        ]
                          .filter(Boolean)
                          .join(" · ") || "—"}
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top">
                      {c.certificatePath ? (
                        <a
                          href={`/api/admin/certificate?path=${encodeURIComponent(
                            c.certificatePath,
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary inline-flex items-center gap-1.5 hover:underline"
                        >
                          <FileText className="size-4" />
                          View file
                        </a>
                      ) : (
                        <span className="text-on-surface-variant/60 text-xs italic">
                          No file
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-4 py-4 align-top">
                      {isBusy ? (
                        <Loader2 className="text-on-surface-variant size-4 animate-spin" />
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {c.status !== "verified" && (
                            <Button
                              type="button"
                              variant="brand"
                              size="sm"
                              disabled={pending}
                              onClick={() => act(c.id, "verified")}
                            >
                              <Check className="size-3.5" />
                              Verify
                            </Button>
                          )}
                          {c.status !== "rejected" && (
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              disabled={pending}
                              onClick={() => act(c.id, "rejected")}
                            >
                              <X className="size-3.5" />
                              Reject
                            </Button>
                          )}
                          {c.status !== "unverified" && (
                            <Button
                              type="button"
                              variant="brandOutline"
                              size="sm"
                              disabled={pending}
                              onClick={() => act(c.id, "unverified")}
                            >
                              <RotateCcw className="size-3.5" />
                              Reset
                            </Button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="text-label-sm text-on-surface-variant px-4 py-3 font-mono font-normal tracking-wider uppercase">
      {children}
    </th>
  );
}

/** Human date from a YYYY-MM-DD string; "" if absent. */
function formatDate(date: string | null): string {
  if (!date) return "";
  const d = new Date(date);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-US", { year: "numeric", month: "short" });
}
