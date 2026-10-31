"use client";

/**
 * Presales requests list: every client meeting that needs ETEN expertise, from
 * draft to outcome, filterable by lifecycle tab, workflow stage, pod, owner
 * and free text.
 */
import Link from "next/link";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useSession } from "@/lib/tracker/store";
import { has, isActive, lookup, teamSummary } from "@/lib/tracker/selectors";
import {
  ACTIVE_STATUSES,
  REQUEST_STATUS,
  ROUTING_STATUS,
} from "@/lib/tracker/labels";
import { fmtRange } from "@/lib/tracker/time";
import type { RequestStatus } from "@/lib/tracker/types";
import {
  Btn,
  Card,
  EmptyState,
  Field,
  PageHeader,
  Pill,
  Table,
  Tabs,
  Toggle,
  inputClass,
  td,
  th,
} from "@/components/tracker/ui";
import { StatusPill, requestHref } from "@/components/tracker/bits";
import { BASE } from "@/components/tracker/shell";

type Tab = "active" | "draft" | "confirmed" | "completed" | "cancelled" | "all";
const PAGE = 15;

export function RequestsView({ initialStage }: { initialStage: string }) {
  const { data, me } = useSession();
  const L = lookup(data);
  const canCreate = has(me, "sales_manager") || has(me, "admin");
  const [tab, setTab] = useState<Tab>(
    initialStage && !ACTIVE_STATUSES.includes(initialStage as RequestStatus)
      ? "all"
      : "active",
  );
  const [stage, setStage] = useState(
    ACTIVE_STATUSES.includes(initialStage as RequestStatus) ? initialStage : "",
  );
  const [pod, setPod] = useState("");
  const [mine, setMine] = useState(false);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);

  const inTab = (s: RequestStatus) =>
    tab === "all"
      ? true
      : tab === "active"
        ? ACTIVE_STATUSES.includes(s)
        : tab === "draft"
          ? s === "draft"
          : s === tab;

  const visible = data.requests.filter(
    (r) =>
      has(me, "management") ||
      has(me, "admin") ||
      r.status !== "draft" ||
      r.ownerId === me.id,
  );
  const needle = q.trim().toLowerCase();
  const rows = visible
    .filter((r) => inTab(r.status))
    .filter((r) => !stage || r.status === stage)
    .filter((r) => !pod || r.routing.some((x) => x.podId === pod))
    .filter((r) => !mine || r.ownerId === me.id)
    .filter(
      (r) =>
        !needle ||
        [r.ref, r.title, r.client].join(" ").toLowerCase().includes(needle),
    )
    .sort((a, b) =>
      tab === "completed" || tab === "cancelled"
        ? b.startUtc.localeCompare(a.startUtc)
        : a.startUtc.localeCompare(b.startUtc),
    );

  const count = (t: Tab) =>
    visible.filter((r) =>
      t === "all" ? true : t === "active" ? isActive(r) : r.status === t,
    ).length;
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const current = Math.min(page, pages - 1);
  const shown = rows.slice(current * PAGE, (current + 1) * PAGE);

  return (
    <>
      <PageHeader
        title="Presales requests"
        description="Every client meeting that needs ETEN expertise, from draft to outcome."
        actions={
          canCreate && (
            <Btn href={`${BASE}/requests/new`} variant="primary">
              <Plus className="size-4" /> New request
            </Btn>
          )
        }
      />

      <Tabs<Tab>
        label="Request status"
        value={tab}
        onChange={(v) => {
          setTab(v);
          setStage("");
          setPage(0);
        }}
        tabs={[
          { id: "active", label: "Active", count: count("active") },
          { id: "draft", label: "Drafts", count: count("draft") },
          { id: "confirmed", label: "Confirmed", count: count("confirmed") },
          { id: "completed", label: "Completed", count: count("completed") },
          { id: "cancelled", label: "Cancelled", count: count("cancelled") },
          { id: "all", label: "All", count: count("all") },
        ]}
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_auto]">
        <Field label="Search requests">
          {(id) => (
            <input
              id={id}
              type="search"
              value={q}
              onChange={(e) => (setQ(e.target.value), setPage(0))}
              placeholder="Search by reference, title or client"
              className={inputClass}
            />
          )}
        </Field>
        <Field label="Workflow stage">
          {(id) => (
            <select
              id={id}
              value={stage}
              disabled={tab !== "active"}
              onChange={(e) => (setStage(e.target.value), setPage(0))}
              className={inputClass}
            >
              <option value="">All active stages</option>
              {ACTIVE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {REQUEST_STATUS[s].label}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Pod">
          {(id) => (
            <select
              id={id}
              value={pod}
              onChange={(e) => (setPod(e.target.value), setPage(0))}
              className={inputClass}
            >
              <option value="">All pods</option>
              {data.pods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
        </Field>
        {canCreate && (
          <div className="flex items-end pb-2.5">
            <Toggle checked={mine} onChange={(v) => (setMine(v), setPage(0))}>
              Only my requests
            </Toggle>
          </div>
        )}
      </div>

      <Card bodyClassName="">
        {shown.length === 0 ? (
          <EmptyState
            title="No requests here"
            action={
              canCreate ? (
                <Btn href={`${BASE}/requests/new`} variant="primary">
                  Create a request
                </Btn>
              ) : undefined
            }
          >
            Try another tab or clear the filters.
          </EmptyState>
        ) : (
          <Table label="Presales requests">
            <thead className="border-eten-line border-b">
              <tr>
                <th className={th}>Request</th>
                <th className={th}>Meeting</th>
                <th className={th}>Pods</th>
                <th className={th}>Status</th>
                <th className={th}>Team</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => {
                const t = teamSummary(data, r);
                return (
                  <tr
                    key={r.id}
                    className="border-eten-line-soft hover:bg-eten-hover/50 border-b last:border-0"
                  >
                    <td className={td}>
                      <Link
                        href={requestHref(r.id)}
                        className="hover:text-eten-accent font-semibold"
                      >
                        {r.title}
                      </Link>
                      <p className="text-eten-faint text-[12.5px]">
                        {r.ref} · {r.client} · {L.memberName(r.ownerId)}
                      </p>
                      <div className="mt-1 flex gap-1">
                        {r.urgency === "urgent" && (
                          <Pill tone="danger">Urgent</Pill>
                        )}
                        {r.access !== "standard" && (
                          <Pill tone="warning">
                            {r.access === "confidential"
                              ? "Confidential"
                              : "Restricted"}
                          </Pill>
                        )}
                      </div>
                    </td>
                    <td className={`${td} text-[13px] whitespace-nowrap`}>
                      {fmtRange(r.startUtc, r.endUtc, r.timezone)}
                    </td>
                    <td className={td}>
                      <div className="flex flex-col gap-1">
                        {r.routing.map((x) => (
                          <span
                            key={x.podId}
                            className="flex items-center gap-1.5 text-[12.5px]"
                          >
                            <span className="bg-eten-line-soft rounded px-1.5 py-0.5 font-mono text-[11px] font-bold">
                              {L.pod(x.podId)?.code}
                            </span>
                            {r.status !== "draft" && (
                              <span className="text-eten-faint">
                                {ROUTING_STATUS[x.status].label}
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className={td}>
                      <StatusPill status={r.status} />
                    </td>
                    <td className={`${td} text-[13px] whitespace-nowrap`}>
                      {t.accepted}/{r.needed} accepted
                      <span className="text-eten-faint block">
                        {t.selected} selected · {t.nominated} nominated
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
        <div className="border-eten-line flex items-center justify-between gap-3 border-t px-5 py-3 text-[13.5px]">
          <span className="text-eten-faint">
            Showing {rows.length ? current * PAGE + 1 : 0}–
            {Math.min(rows.length, (current + 1) * PAGE)} of {rows.length}
          </span>
          <span className="flex gap-2">
            <Btn
              size="sm"
              disabled={current === 0}
              onClick={() => setPage(current - 1)}
            >
              <ChevronLeft className="size-4" /> Previous
            </Btn>
            <Btn
              size="sm"
              disabled={current >= pages - 1}
              onClick={() => setPage(current + 1)}
            >
              Next <ChevronRight className="size-4" />
            </Btn>
          </span>
        </div>
      </Card>
    </>
  );
}
