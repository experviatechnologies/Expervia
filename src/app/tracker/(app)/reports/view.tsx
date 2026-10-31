"use client";

/**
 * Reports (PRD FR-028, FR-031): operational KPIs for the presales process with
 * their definitions, numerators and denominators, filterable by date range and
 * pod, plus CSV export. Only data recorded in the tracker is used.
 */
import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { useSession } from "@/lib/tracker/store";
import { computeMetrics } from "@/lib/tracker/metrics";
import { DEFAULT_TZ, addDaysToDate, zonedDate } from "@/lib/tracker/time";
import { downloadCsv, toCsv } from "@/lib/csv";
import {
  Btn,
  Card,
  Field,
  Notice,
  PageHeader,
  inputClass,
} from "@/components/tracker/ui";
import { BarList } from "@/components/tracker/bits";

export function ReportsView() {
  const { data, now } = useSession();
  const today = zonedDate(now, DEFAULT_TZ);
  const [from, setFrom] = useState(addDaysToDate(today, -90));
  const [to, setTo] = useState(addDaysToDate(today, 30));
  const [pod, setPod] = useState("");
  const { metrics, byPod, byMonth } = useMemo(
    () => computeMetrics(data, { from, to, podId: pod || undefined }, now),
    [data, from, to, pod, now],
  );
  const podName = data.pods.find((p) => p.id === pod)?.name ?? "All pods";

  const exportCsv = () => {
    const csv = toCsv(
      [
        "Metric",
        "Value",
        "Numerator",
        "Denominator",
        "Definition",
        "From",
        "To",
        "Pod",
      ],
      [
        ...metrics.map((m) => [
          m.label,
          m.value,
          m.numerator ?? "",
          m.denominator ?? "",
          m.definition,
          from,
          to,
          podName,
        ]),
        ...byPod.map((r) => [
          `Requests: ${r.label}`,
          r.value,
          "",
          "",
          "Requests routed to the pod",
          from,
          to,
          podName,
        ]),
        ...byMonth.map((r) => [
          `Meetings: ${r.label}`,
          r.value,
          "",
          "",
          "Confirmed and completed meetings",
          from,
          to,
          podName,
        ]),
      ],
    );
    downloadCsv(`eten-presales-report-${today}.csv`, csv);
  };

  return (
    <>
      <PageHeader
        title="Reports"
        description="Operational measures for the ETEN presales process. Only data recorded in this application is used."
        actions={
          <Btn onClick={exportCsv}>
            <Download className="size-4" /> Export CSV
          </Btn>
        }
      />
      <div className="mb-5">
        <Notice tone="warning" title="Demo data">
          These figures are calculated from generated demo records. They are not
          real Expervia metrics.
        </Notice>
      </div>
      <Card className="mb-6">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="From">
            {(id) => (
              <input
                id={id}
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className={inputClass}
              />
            )}
          </Field>
          <Field label="To">
            {(id) => (
              <input
                id={id}
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className={inputClass}
              />
            )}
          </Field>
          <Field label="Pod">
            {(id) => (
              <select
                id={id}
                value={pod}
                onChange={(e) => setPod(e.target.value)}
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
        </div>
        <p className="text-eten-faint mt-2 text-[12.5px]">
          Request measures use the meeting date. Member measures reflect the
          current roster.
        </p>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {metrics.map((m) => (
          <div
            key={m.key}
            id={m.key}
            className="border-eten-line bg-eten-panel scroll-mt-24 rounded-2xl border p-4"
          >
            <p className="text-eten-faint text-[11.5px] font-bold tracking-[0.08em] uppercase">
              {m.label}
            </p>
            <p className="mt-2 text-[28px] leading-none font-extrabold tracking-[-0.02em]">
              {m.value}
            </p>
            <p className="text-eten-ink-muted mt-1.5 text-[13px]">{m.sub}</p>
            <details className="mt-2 text-[12.5px]">
              <summary className="text-eten-accent cursor-pointer font-semibold">
                How this is calculated
              </summary>
              <p className="text-eten-ink-muted mt-1">{m.definition}</p>
            </details>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card
          title="Requests by pod"
          description="Number of requests routed to each pod in the period. A request routed to several pods counts once per pod."
        >
          <BarList rows={byPod} />
        </Card>
        <Card
          title="Meetings by month"
          description="Confirmed and completed meetings, grouped by the month the meeting takes place."
        >
          {byMonth.length === 0 ? (
            <p className="text-eten-faint text-[14px]">
              No meetings in this period.
            </p>
          ) : (
            <BarList rows={byMonth} />
          )}
        </Card>
      </div>
    </>
  );
}
