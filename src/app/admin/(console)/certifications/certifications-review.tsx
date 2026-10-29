"use client";

import { useMemo, useState, useTransition } from "react";
import { toCsv, downloadCsv } from "@/lib/csv";
import {
  BadgeCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  FileText,
  Layers,
  Loader2,
  RotateCcw,
  Search,
  X,
  XCircle,
  type LucideIcon,
} from "lucide-react";

const PAGE_SIZE = 20;
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

const TABS: {
  key: Filter;
  label: string;
  Icon: LucideIcon;
  tint: string;
}[] = [
  {
    key: "unverified",
    label: "Pending review",
    Icon: Clock,
    tint: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  {
    key: "verified",
    label: "Verified",
    Icon: BadgeCheck,
    tint: "bg-eten-verified-soft text-eten-verified",
  },
  {
    key: "rejected",
    label: "Rejected",
    Icon: XCircle,
    tint: "bg-red-500/10 text-red-600 dark:text-red-400",
  },
  {
    key: "all",
    label: "All submitted",
    Icon: Layers,
    tint: "bg-eten-accent-soft text-eten-accent",
  },
];

function initials(name: string | null): string {
  return (
    (name ?? "")
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?"
  );
}

function shortId(id: string): string {
  return id.length > 12 ? `${id.slice(0, 6)}…${id.slice(-4)}` : id;
}

function StatusChip({ status }: { status: CertRow["status"] }) {
  const map = {
    unverified: {
      cls: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      dot: "bg-amber-500",
      label: "Pending",
    },
    verified: {
      cls: "bg-eten-verified-soft text-eten-verified",
      dot: "bg-eten-verified",
      label: "Verified",
    },
    rejected: {
      cls: "bg-red-500/10 text-red-600 dark:text-red-400",
      dot: "bg-red-500",
      label: "Rejected",
    },
  } as const;
  const { cls, dot, label } = map[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap ${cls}`}
    >
      <span className={`size-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

export function CertificationsReview({ certs }: { certs: CertRow[] }) {
  const [filter, setFilter] = useState<Filter>("unverified");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
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

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return certs
      .filter((c) => filter === "all" || c.status === filter)
      .filter(
        (c) =>
          !q ||
          `${c.memberName ?? ""} ${c.memberEmail ?? ""} ${c.name} ${c.issuer ?? ""} ${c.credentialId ?? ""}`
            .toLowerCase()
            .includes(q),
      );
  }, [certs, filter, query]);

  const totalPages = Math.max(1, Math.ceil(shown.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const from = (safePage - 1) * PAGE_SIZE;
  const pageRows = shown.slice(from, from + PAGE_SIZE);

  function exportCsv() {
    downloadCsv(
      "eten-certifications.csv",
      toCsv(
        [
          "Member",
          "Email",
          "Certification",
          "Issuer",
          "Credential ID",
          "Status",
        ],
        shown.map((c) => [
          c.memberName ?? "",
          c.memberEmail ?? "",
          c.name,
          c.issuer ?? "",
          c.credentialId ?? "",
          c.status,
        ]),
      ),
    );
  }

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
    <div className="flex flex-col gap-6">
      {/* Status cards act as tabs */}
      <div className="grid [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))] gap-3">
        {TABS.map(({ key, label, Icon, tint }) => {
          const on = filter === key;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => {
                setFilter(key);
                setPage(1);
              }}
              className={
                "bg-eten-panel flex items-center gap-3.5 rounded-2xl p-4 text-left transition-shadow " +
                (on
                  ? "border-eten-accent border-2 shadow-sm"
                  : "border-eten-line hover:border-eten-accent/40 border")
              }
            >
              <span
                className={
                  "grid size-10 shrink-0 place-items-center rounded-xl " + tint
                }
              >
                <Icon className="size-[18px]" strokeWidth={1.9} />
              </span>
              <span className="flex flex-col">
                <span className="text-eten-ink-muted text-[13px] font-semibold">
                  {label}
                </span>
                <span className="text-eten-ink text-2xl font-extrabold">
                  {counts[key]}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {error && (
        <p className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border p-3 text-sm">
          {error}
        </p>
      )}

      {/* Table card */}
      <section className="bg-eten-panel border-eten-line flex min-w-0 flex-col rounded-[18px] border">
        <div className="border-eten-line flex flex-wrap items-center gap-3 border-b p-4 sm:px-5">
          <label className="border-eten-line bg-eten-panel-hi text-eten-faint flex h-11 max-w-[420px] min-w-0 flex-1 items-center gap-2.5 rounded-xl border px-3.5">
            <Search className="size-[18px] shrink-0" strokeWidth={1.8} />
            <span className="sr-only">Search certifications</span>
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search member, certification or issuer"
              className="text-eten-ink min-w-0 flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-current"
            />
          </label>
          <button
            type="button"
            onClick={exportCsv}
            disabled={shown.length === 0}
            className="border-eten-line text-eten-ink-muted hover:text-eten-ink hover:bg-eten-panel-hi ml-auto inline-flex h-11 items-center gap-2 rounded-xl border px-3.5 text-[13px] font-semibold transition-colors disabled:opacity-60"
          >
            <Download className="size-4" strokeWidth={1.8} /> Export CSV
          </button>
        </div>

        {shown.length === 0 ? (
          <div className="flex flex-col items-center gap-2.5 px-6 py-12 text-center">
            <span className="bg-eten-verified-soft text-eten-verified grid size-13 place-items-center rounded-2xl">
              <BadgeCheck className="size-6" />
            </span>
            <div className="text-eten-ink text-[15px] font-bold">
              {query ? "No matches" : "Nothing here"}
            </div>
            <div className="text-eten-ink-muted text-[13px]">
              {query
                ? "Try a different search."
                : "New submissions will show up here."}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] border-collapse text-sm">
              <thead>
                <tr className="bg-eten-panel-hi text-left">
                  <Th className="pl-5">Member</Th>
                  <Th>Certification</Th>
                  <Th>Proof</Th>
                  <Th>Status</Th>
                  <Th className="pr-5 text-right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((c) => {
                  const isBusy = pending && busyId === c.id;
                  return (
                    <tr
                      key={c.id}
                      className="border-eten-line-soft hover:bg-eten-hover border-b last:border-0"
                    >
                      <td className="py-4 pr-3 pl-5">
                        <div className="flex items-center gap-3">
                          <span className="bg-eten-accent-soft text-eten-accent grid size-9 shrink-0 place-items-center rounded-full text-[13px] font-bold">
                            {initials(c.memberName)}
                          </span>
                          <div className="flex min-w-0 flex-col">
                            <span className="text-eten-ink font-bold">
                              {c.memberName ?? "—"}
                            </span>
                            {c.memberEmail && (
                              <span className="text-eten-ink-muted text-[13px]">
                                {c.memberEmail}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex items-center gap-3">
                          <span className="bg-eten-accent-soft text-eten-accent grid size-9 shrink-0 place-items-center rounded-[10px] text-[12px] font-extrabold">
                            {initials(c.issuer)}
                          </span>
                          <div className="flex min-w-0 flex-col gap-1">
                            <span className="text-eten-ink font-semibold">
                              {c.name}
                            </span>
                            <span className="text-eten-ink-muted flex flex-wrap items-center gap-1.5 text-[12px]">
                              {c.issuer && (
                                <span className="font-semibold">
                                  {c.issuer}
                                </span>
                              )}
                              {c.credentialId && (
                                <span
                                  title={c.credentialId}
                                  className="bg-eten-panel-hi border-eten-line text-eten-ink-muted rounded-md border px-1.5 py-0.5 font-mono text-[11px]"
                                >
                                  ID {shortId(c.credentialId)}
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        {c.certificatePath ? (
                          <a
                            href={`/api/admin/certificate?path=${encodeURIComponent(
                              c.certificatePath,
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="border-eten-line text-eten-accent hover:bg-eten-hover inline-flex h-9 items-center gap-1.5 rounded-[10px] border px-3 text-[13px] font-semibold whitespace-nowrap"
                          >
                            <FileText className="size-3.5" />
                            View file
                          </a>
                        ) : (
                          <span className="text-eten-faint text-xs italic">
                            No file
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-4">
                        <StatusChip status={c.status} />
                      </td>
                      <td className="py-4 pr-5 pl-3">
                        {isBusy ? (
                          <div className="flex justify-end">
                            <Loader2 className="text-eten-faint size-4 animate-spin" />
                          </div>
                        ) : (
                          <div className="flex flex-wrap justify-end gap-2">
                            {c.status !== "verified" && (
                              <button
                                type="button"
                                disabled={pending}
                                onClick={() => act(c.id, "verified")}
                                className="bg-eten-verified-soft text-eten-verified inline-flex h-9 items-center gap-1.5 rounded-[10px] px-3 text-[13px] font-bold disabled:opacity-50"
                              >
                                <Check className="size-3.5" strokeWidth={2.4} />
                                Verify
                              </button>
                            )}
                            {c.status !== "rejected" && (
                              <button
                                type="button"
                                disabled={pending}
                                onClick={() => act(c.id, "rejected")}
                                className="border-eten-line inline-flex h-9 items-center gap-1.5 rounded-[10px] border px-3 text-[13px] font-bold text-red-600 hover:bg-red-500/10 disabled:opacity-50 dark:text-red-400"
                              >
                                <X className="size-3.5" strokeWidth={2.4} />
                                Reject
                              </button>
                            )}
                            {c.status !== "unverified" && (
                              <button
                                type="button"
                                disabled={pending}
                                onClick={() => act(c.id, "unverified")}
                                aria-label="Reset to pending"
                                title="Reset to pending"
                                className="border-eten-line text-eten-ink-muted hover:bg-eten-hover grid size-9 place-items-center rounded-[10px] border disabled:opacity-50"
                              >
                                <RotateCcw className="size-[15px]" />
                              </button>
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

        {shown.length > 0 && (
          <div className="text-eten-ink-muted flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 text-[13px]">
            <span>
              Showing{" "}
              <b className="text-eten-ink">
                {from + 1}–{from + pageRows.length}
              </b>{" "}
              of <b className="text-eten-ink">{shown.length}</b>
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPage(safePage - 1)}
                  disabled={safePage <= 1}
                  className="border-eten-line text-eten-ink hover:bg-eten-panel-hi inline-flex h-9 items-center gap-1 rounded-lg border px-3 font-semibold disabled:opacity-50"
                >
                  <ChevronLeft className="size-4" /> Previous
                </button>
                <span className="px-1.5">
                  Page <b className="text-eten-ink">{safePage}</b> of{" "}
                  {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage(safePage + 1)}
                  disabled={safePage >= totalPages}
                  className="border-eten-line text-eten-ink hover:bg-eten-panel-hi inline-flex h-9 items-center gap-1 rounded-lg border px-3 font-semibold disabled:opacity-50"
                >
                  Next <ChevronRight className="size-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function Th({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={
        "text-eten-ink-muted border-eten-line border-b px-3 py-3 text-[12px] font-bold " +
        className
      }
    >
      {children}
    </th>
  );
}
