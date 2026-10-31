"use client";

/**
 * Nominations. Pod Leaders see requests routed to the pods they lead
 * (awaiting / responded / closed) and open one to nominate. Sales Managers see
 * nomination activity across active requests and open one to compare and
 * select.
 */
import Link from "next/link";
import { useState } from "react";
import { useSession } from "@/lib/tracker/store";
import {
  has,
  isActive,
  isSales,
  lookup,
  podsLedBy,
} from "@/lib/tracker/selectors";
import { ROUTING_STATUS } from "@/lib/tracker/labels";
import { fmtAgo, fmtRange } from "@/lib/tracker/time";
import {
  Card,
  EmptyState,
  PageHeader,
  Pill,
  Tabs,
} from "@/components/tracker/ui";
import {
  DueBadge,
  RefLink,
  StatusPill,
  requestHref,
} from "@/components/tracker/bits";

type Tab = "awaiting" | "responded" | "closed";

export function NominationsView() {
  const { me } = useSession();
  return (
    <>
      <PageHeader
        title="Nominations"
        description={
          has(me, "pod_leader") && !isSales(me)
            ? "Requests routed to the pods you lead. Nominate engineers who fit the skills, time, format and location."
            : "Nominations from Pod Leaders across active requests. Open a request to compare candidates and select."
        }
      />
      {has(me, "pod_leader") && !isSales(me) ? (
        <LeaderInbox />
      ) : (
        <SalesOverview />
      )}
    </>
  );
}

function LeaderInbox() {
  const { data, me } = useSession();
  const L = lookup(data);
  const [tab, setTab] = useState<Tab>("awaiting");
  const podIds = podsLedBy(data, me).map((p) => p.id);
  const items = data.requests
    .filter((r) => r.status !== "draft" && r.access !== "restricted")
    .flatMap((r) =>
      r.routing.filter((x) => podIds.includes(x.podId)).map((x) => ({ r, x })),
    );
  const bucket = (i: (typeof items)[number]): Tab =>
    !isActive(i.r)
      ? "closed"
      : i.x.status === "awaiting"
        ? "awaiting"
        : "responded";
  const shown = items
    .filter((i) => bucket(i) === tab)
    .sort((a, b) =>
      tab === "awaiting"
        ? a.x.deadline.localeCompare(b.x.deadline)
        : b.r.startUtc.localeCompare(a.r.startUtc),
    );
  const count = (t: Tab) => items.filter((i) => bucket(i) === t).length;

  return (
    <>
      <Tabs<Tab>
        label="Nomination status"
        value={tab}
        onChange={setTab}
        tabs={[
          {
            id: "awaiting",
            label: "Awaiting your nominations",
            count: count("awaiting"),
          },
          { id: "responded", label: "Responded", count: count("responded") },
          { id: "closed", label: "Closed", count: count("closed") },
        ]}
      />
      <Card bodyClassName="">
        {shown.length === 0 ? (
          <EmptyState title="Nothing here yet">
            You will be notified when the Sales Manager routes a request to your
            pod.
          </EmptyState>
        ) : (
          <ul>
            {shown.map(({ r, x }) => {
              const mine = data.nominations.filter(
                (n) =>
                  n.requestId === r.id &&
                  n.podId === x.podId &&
                  n.status !== "withdrawn",
              ).length;
              return (
                <li
                  key={`${r.id}-${x.podId}`}
                  className="border-eten-line-soft flex flex-wrap items-center gap-3 border-b px-5 py-4 last:border-0"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <RefLink req={r} />
                      {r.urgency === "urgent" && (
                        <Pill tone="danger">Urgent</Pill>
                      )}
                      <Pill tone={ROUTING_STATUS[x.status].tone}>
                        {ROUTING_STATUS[x.status].label}
                      </Pill>
                      {tab === "closed" && <StatusPill status={r.status} />}
                    </div>
                    <Link
                      href={requestHref(r.id, "nominations")}
                      className="hover:text-eten-accent mt-1 block font-bold"
                    >
                      {r.title}
                    </Link>
                    <p className="text-eten-ink-muted text-[13px]">
                      {r.access === "confidential"
                        ? "Confidential client"
                        : r.client}{" "}
                      · {L.pod(x.podId)?.name} · needs {r.needed} ·{" "}
                      {fmtRange(r.startUtc, r.endUtc, r.timezone)}
                    </p>
                    {mine > 0 && (
                      <p className="text-eten-faint text-[12.5px]">
                        {mine} nominated from your pod
                      </p>
                    )}
                  </div>
                  {tab === "awaiting" && <DueBadge due={x.deadline} />}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}

function SalesOverview() {
  const { data } = useSession();
  const L = lookup(data);
  const active = data.requests
    .filter(isActive)
    .sort((a, b) => (b.submittedAt ?? "").localeCompare(a.submittedAt ?? ""));
  return (
    <Card title="Active requests" bodyClassName="">
      {active.length === 0 ? (
        <EmptyState title="No active nominations">
          Submitted requests appear here as Pod Leaders respond.
        </EmptyState>
      ) : (
        <ul>
          {active.map((r) => {
            const noms = data.nominations.filter(
              (n) => n.requestId === r.id && n.status !== "withdrawn",
            );
            return (
              <li
                key={r.id}
                className="border-eten-line-soft flex flex-wrap items-center gap-3 border-b px-5 py-4 last:border-0"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <RefLink req={r} />
                    <StatusPill status={r.status} />
                  </div>
                  <Link
                    href={requestHref(r.id, "nominations")}
                    className="hover:text-eten-accent mt-1 block font-bold"
                  >
                    {r.title}
                  </Link>
                  <p className="text-eten-ink-muted text-[13px]">
                    {r.client} · submitted{" "}
                    {r.submittedAt ? fmtAgo(r.submittedAt) : "not yet"}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {r.routing.map((x) => (
                      <Pill key={x.podId} tone={ROUTING_STATUS[x.status].tone}>
                        {L.pod(x.podId)?.code}: {ROUTING_STATUS[x.status].label}
                      </Pill>
                    ))}
                  </div>
                </div>
                <span className="text-[14px] font-bold">
                  {noms.length} nominated
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
