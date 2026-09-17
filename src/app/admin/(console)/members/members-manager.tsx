"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  Ban,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RotateCcw,
  Search,
  UserX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { setMemberStatus } from "./actions";

export type MemberRow = {
  id: string;
  fullName: string | null;
  email: string | null;
  status: "active" | "suspended" | "deactivated";
  role: "member" | "operations";
  origin: "self_signup" | "migrated";
  claimedAt: string | null;
  createdAt: string;
  pods: string[];
};

type StatusFilter = "all" | MemberRow["status"];
type RoleFilter = "all" | MemberRow["role"];

const PAGE_SIZE = 25;

const STATUS_STYLE: Record<MemberRow["status"], string> = {
  active: "bg-eten-verified-soft text-eten-verified",
  suspended: "bg-amber-500/10 text-amber-400",
  deactivated: "bg-destructive/10 text-destructive",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function MembersManager({ members }: { members: MemberRow[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [role, setRole] = useState<RoleFilter>("all");
  const [page, setPage] = useState(1);

  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members.filter((m) => {
      if (status !== "all" && m.status !== status) return false;
      if (role !== "all" && m.role !== role) return false;
      if (q) {
        const hay = `${m.fullName ?? ""} ${m.email ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [members, query, status, role]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const start = (current - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(start, start + PAGE_SIZE);

  function act(memberId: string, next: MemberRow["status"]) {
    setError(null);
    setBusyId(memberId);
    startTransition(async () => {
      const res = await setMemberStatus({ memberId, status: next });
      if ("error" in res) setError(res.error);
      setBusyId(null);
    });
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="bg-eten-panel border-eten-line flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border px-3 py-2">
          <Search className="text-eten-faint size-4 shrink-0" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name or email…"
            className="text-eten-ink placeholder:text-eten-faint w-full bg-transparent text-sm outline-none"
          />
        </label>

        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as StatusFilter);
            setPage(1);
          }}
          aria-label="Filter by status"
          className="bg-eten-panel border-eten-line text-eten-ink focus:border-eten-accent rounded-lg border px-3 py-2 text-sm outline-none"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="deactivated">Deactivated</option>
        </select>

        <select
          value={role}
          onChange={(e) => {
            setRole(e.target.value as RoleFilter);
            setPage(1);
          }}
          aria-label="Filter by role"
          className="bg-eten-panel border-eten-line text-eten-ink focus:border-eten-accent rounded-lg border px-3 py-2 text-sm outline-none"
        >
          <option value="all">All roles</option>
          <option value="member">Members</option>
          <option value="operations">Operations</option>
        </select>
      </div>

      {error && (
        <p className="border-destructive/30 bg-destructive/10 text-destructive mb-4 rounded-lg border p-3 text-sm">
          {error}
        </p>
      )}

      <div className="bg-eten-panel border-eten-line overflow-hidden rounded-2xl border">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-sm">
            <thead>
              <tr className="border-eten-line-soft border-b text-left">
                <Th>Member</Th>
                <Th>Status</Th>
                <Th>Role</Th>
                <Th>Pods</Th>
                <Th>Joined</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-eten-faint px-4 py-10 text-center"
                  >
                    No members match your filters.
                  </td>
                </tr>
              ) : (
                pageRows.map((m) => {
                  const isBusy = pending && busyId === m.id;
                  const isOps = m.role === "operations";
                  const initial = (m.fullName ?? m.email ?? "?")
                    .trim()
                    .charAt(0)
                    .toUpperCase();
                  return (
                    <tr
                      key={m.id}
                      className="border-eten-line-soft hover:bg-eten-hover border-b last:border-0"
                    >
                      <td className="px-4 py-3 align-top">
                        <Link
                          href={`/admin/members/${m.id}`}
                          className="group flex items-center gap-3"
                        >
                          <span className="from-eten-accent grid size-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br to-[#3257b8] text-xs font-bold text-white">
                            {initial}
                          </span>
                          <span className="min-w-0">
                            <span className="text-eten-ink block font-semibold group-hover:underline">
                              {m.fullName ?? "—"}
                            </span>
                            {m.email && (
                              <span className="text-eten-faint block text-xs">
                                {m.email}
                              </span>
                            )}
                            {!m.claimedAt && (
                              <span className="text-eten-faint/70 block text-xs italic">
                                not yet activated
                              </span>
                            )}
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <span
                          className={
                            "inline-block rounded-full px-2.5 py-1 text-xs font-semibold capitalize " +
                            STATUS_STYLE[m.status]
                          }
                        >
                          {m.status}
                        </span>
                      </td>
                      <td className="text-eten-ink-muted px-4 py-3 align-top capitalize">
                        {m.role}
                      </td>
                      <td className="px-4 py-3 align-top">
                        {m.pods.length === 0 ? (
                          <span className="text-eten-faint/70 text-xs">—</span>
                        ) : (
                          <span className="flex flex-wrap gap-1">
                            {m.pods.slice(0, 2).map((p) => (
                              <span
                                key={p}
                                className="bg-eten-panel-hi border-eten-line text-eten-ink-muted rounded-full border px-2 py-0.5 text-[11.5px] font-medium"
                              >
                                {p}
                              </span>
                            ))}
                            {m.pods.length > 2 && (
                              <span className="text-eten-faint text-[11.5px]">
                                +{m.pods.length - 2}
                              </span>
                            )}
                          </span>
                        )}
                      </td>
                      <td className="text-eten-ink-muted px-4 py-3 align-top text-xs whitespace-nowrap tabular-nums">
                        {formatDate(m.createdAt)}
                      </td>
                      <td className="px-4 py-3 align-top">
                        {isOps ? (
                          <span className="text-eten-faint/60 text-xs">
                            Protected
                          </span>
                        ) : isBusy ? (
                          <Loader2 className="text-eten-faint size-4 animate-spin" />
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {m.status !== "active" && (
                              <ActionButton
                                onClick={() => act(m.id, "active")}
                                disabled={pending}
                                Icon={RotateCcw}
                              >
                                Reactivate
                              </ActionButton>
                            )}
                            {m.status === "active" && (
                              <ActionButton
                                onClick={() => act(m.id, "suspended")}
                                disabled={pending}
                                Icon={Ban}
                              >
                                Suspend
                              </ActionButton>
                            )}
                            {m.status !== "deactivated" && (
                              <ActionButton
                                onClick={() => act(m.id, "deactivated")}
                                disabled={pending}
                                Icon={UserX}
                                danger
                              >
                                Deactivate
                              </ActionButton>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-eten-faint text-xs">
          {filtered.length === 0
            ? "0 results"
            : `Showing ${start + 1}–${Math.min(start + PAGE_SIZE, filtered.length)} of ${filtered.length}`}
        </p>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage(current - 1)}
              disabled={current <= 1}
              className="border-eten-line text-eten-ink-muted hover:bg-eten-hover grid size-8 place-items-center rounded-lg border disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="text-eten-ink-muted text-xs tabular-nums">
              {current} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage(current + 1)}
              disabled={current >= totalPages}
              className="border-eten-line text-eten-ink-muted hover:bg-eten-hover grid size-8 place-items-center rounded-lg border disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ActionButton({
  onClick,
  disabled,
  Icon,
  danger,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  Icon: typeof Ban;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant={danger ? "destructive" : "etenOutline"}
      size="sm"
      disabled={disabled}
      onClick={onClick}
    >
      <Icon className="size-3.5" />
      {children}
    </Button>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="text-eten-faint px-4 py-3 font-mono text-[11px] font-bold tracking-wider uppercase">
      {children}
    </th>
  );
}
