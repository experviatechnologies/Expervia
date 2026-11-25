import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase";
import { fetchAllRows } from "@/lib/fetch-all";
import {
  PIPELINES,
  formatAmount,
  stageOf,
  type PipelineId,
} from "@/lib/crm/pipelines";
import { listOwners } from "@/lib/crm/record";

/**
 * CRM reports. Every read pages past Supabase's 1,000-row limit. Money is
 * formatted here so pages and exports show the same text. Deals and tasks
 * sections are null until SQL 68 / 67 have been run. Callers must have
 * checked getCrmSession() first.
 */

const DAY = 86_400_000;

// --------------------------------------------------------------- conversion
export type SourceRow = {
  source: string;
  contacts: number;
  withAccount: number;
  activated: number;
  /** activated / contacts, 0..1 */
  rate: number;
};

export type ConversionReport = {
  sources: SourceRow[];
  totals: SourceRow;
  leadStatus: { status: string; count: number }[];
};

type ContactRaw = {
  source: string | null;
  lead_status: string;
  member_id: string | null;
  account:
    | { claimed_at: string | null; role: string }
    | { claimed_at: string | null; role: string }[]
    | null;
};

export async function conversionReport(): Promise<ConversionReport> {
  const { data, error } = await fetchAllRows<ContactRaw>((a, b) =>
    getSupabaseAdmin()
      .from("crm_contacts")
      .select(
        "source, lead_status, member_id, account:members!crm_contacts_member_id_fkey(claimed_at, role)",
      )
      .order("id")
      .range(a, b),
  );
  if (error) throw new Error(`Could not load contacts: ${error.message}`);

  const bySource = new Map<string, SourceRow>();
  const status = new Map<string, number>();
  const blank = (source: string): SourceRow => ({
    source,
    contacts: 0,
    withAccount: 0,
    activated: 0,
    rate: 0,
  });
  const totals = blank("All sources");
  for (const c of data) {
    const acc = Array.isArray(c.account) ? c.account[0] : c.account;
    if (acc?.role === "operations") continue; // staff logins aren't leads
    const row =
      bySource.get(c.source ?? "Unknown") ?? blank(c.source ?? "Unknown");
    for (const r of [row, totals]) {
      r.contacts += 1;
      if (c.member_id) r.withAccount += 1;
      if (acc?.claimed_at) r.activated += 1;
    }
    bySource.set(row.source, row);
    status.set(c.lead_status, (status.get(c.lead_status) ?? 0) + 1);
  }
  const finish = (r: SourceRow) => ({
    ...r,
    rate: r.contacts ? r.activated / r.contacts : 0,
  });
  return {
    sources: [...bySource.values()]
      .map(finish)
      .sort((x, y) => y.contacts - x.contacts),
    totals: finish(totals),
    leadStatus: [...status.entries()]
      .map(([s, count]) => ({ status: s, count }))
      .sort((x, y) => y.count - x.count),
  };
}

// -------------------------------------------------------------------- sales
export type SalesReport = {
  pipelines: {
    id: PipelineId;
    label: string;
    stages: {
      label: string;
      count: number;
      values: string[];
      ngnMinor: number;
    }[];
  }[];
  months: {
    month: string;
    label: string;
    won: number;
    lost: number;
    wonValue: string[];
  }[];
  /** Won / (won + lost) over the last 90 days; null if nothing closed. */
  winRate90: number | null;
  closed90: number;
  averageWon: string[];
  leaderboard: {
    ownerId: string | null;
    name: string;
    open: number;
    won: number;
    lost: number;
    wonValue: string[];
    openValue: string[];
  }[];
};

type DealRaw = {
  pipeline: PipelineId;
  stage: string;
  amount_minor: number;
  currency: string;
  owner_id: string | null;
  closed_at: string | null;
};

function sumByCurrency(rows: { amount_minor: number; currency: string }[]) {
  const m = new Map<string, number>();
  for (const r of rows)
    m.set(r.currency, (m.get(r.currency) ?? 0) + Number(r.amount_minor));
  return [...m.entries()]
    .filter(([, v]) => v > 0)
    .map(([c, v]) => formatAmount(v, c));
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export async function salesReport(): Promise<SalesReport | null> {
  const { data, error } = await fetchAllRows<DealRaw>((a, b) =>
    getSupabaseAdmin()
      .from("crm_deals")
      .select("pipeline, stage, amount_minor, currency, owner_id, closed_at")
      .order("id")
      .range(a, b),
  );
  if (error) return null; // SQL 68 not run yet
  const outcome = (d: DealRaw) =>
    stageOf(d.pipeline, d.stage)?.outcome ?? "open";

  // Last 6 calendar months (Lagos), oldest first.
  const now = new Date(Date.now() + 3_600_000); // UTC+1
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (5 - i), 1),
    );
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    return {
      month: key,
      label: `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`,
      won: 0,
      lost: 0,
      rows: [] as DealRaw[],
    };
  });
  const byMonth = new Map(months.map((m) => [m.month, m]));

  let won90 = 0;
  let lost90 = 0;
  const wonRows: DealRaw[] = [];
  for (const d of data) {
    const o = outcome(d);
    if (o === "open" || !d.closed_at) continue;
    const t = Date.parse(d.closed_at);
    const key = new Date(t + 3_600_000).toISOString().slice(0, 7);
    const m = byMonth.get(key);
    if (m) {
      if (o === "won") {
        m.won += 1;
        m.rows.push(d);
      } else m.lost += 1;
    }
    if (Date.now() - t <= 90 * DAY) {
      if (o === "won") won90 += 1;
      else lost90 += 1;
    }
    if (o === "won") wonRows.push(d);
  }

  const owners = await listOwners();
  const ownerName = (id: string | null) =>
    id
      ? (owners.find((o) => o.id === id)?.name ?? "Former staff member")
      : "No owner";
  const byOwner = new Map<string, DealRaw[]>();
  for (const d of data) {
    const k = d.owner_id ?? "";
    byOwner.set(k, [...(byOwner.get(k) ?? []), d]);
  }

  // Average won deal size, per currency.
  const avg = new Map<string, { sum: number; n: number }>();
  for (const d of wonRows) {
    const a = avg.get(d.currency) ?? { sum: 0, n: 0 };
    avg.set(d.currency, { sum: a.sum + Number(d.amount_minor), n: a.n + 1 });
  }

  return {
    pipelines: (Object.keys(PIPELINES) as PipelineId[]).map((p) => ({
      id: p,
      label: PIPELINES[p].label,
      stages: PIPELINES[p].stages.map((s) => {
        const rows = data.filter((d) => d.pipeline === p && d.stage === s.id);
        return {
          label: s.label,
          count: rows.length,
          values: sumByCurrency(rows),
          ngnMinor: rows
            .filter((r) => r.currency === "NGN")
            .reduce((n, r) => n + Number(r.amount_minor), 0),
        };
      }),
    })),
    months: months.map(({ rows, ...m }) => ({
      ...m,
      wonValue: sumByCurrency(rows),
    })),
    winRate90: won90 + lost90 ? won90 / (won90 + lost90) : null,
    closed90: won90 + lost90,
    averageWon: [...avg.entries()].map(([c, a]) =>
      formatAmount(Math.round(a.sum / a.n), c),
    ),
    leaderboard: [...byOwner.entries()]
      .map(([id, rows]) => ({
        ownerId: id || null,
        name: ownerName(id || null),
        open: rows.filter((r) => outcome(r) === "open").length,
        won: rows.filter((r) => outcome(r) === "won").length,
        lost: rows.filter((r) => outcome(r) === "lost").length,
        wonValue: sumByCurrency(rows.filter((r) => outcome(r) === "won")),
        openValue: sumByCurrency(rows.filter((r) => outcome(r) === "open")),
        wonNgn: rows
          .filter((r) => outcome(r) === "won" && r.currency === "NGN")
          .reduce((n, r) => n + Number(r.amount_minor), 0),
      }))
      .sort((a, b) => b.wonNgn - a.wonNgn || b.won - a.won || b.open - a.open)
      .map(({ wonNgn: _w, ...r }) => {
        void _w;
        return r;
      }),
  };
}

// ------------------------------------------------------------------- team
export type TeamRow = {
  memberId: string;
  name: string;
  notes: number;
  calls: number;
  meetings: number;
  emails: number;
  updates: number;
  tasksDone: number;
  tasksOverdue: number | null;
};

export async function teamReport(): Promise<TeamRow[]> {
  const since = new Date(Date.now() - 30 * DAY).toISOString();
  const admin = getSupabaseAdmin();
  const [owners, acts, done, open] = await Promise.all([
    listOwners(),
    fetchAllRows<{ actor_id: string; type: string }>((a, b) =>
      admin
        .from("crm_activities")
        .select("actor_id, type")
        .not("actor_id", "is", null)
        .gte("occurred_at", since)
        .order("id")
        .range(a, b),
    ),
    fetchAllRows<{ done_by: string }>((a, b) =>
      admin
        .from("crm_tasks")
        .select("done_by")
        .gte("done_at", since)
        .not("done_by", "is", null)
        .order("id")
        .range(a, b),
    ),
    fetchAllRows<{ assignee_id: string }>((a, b) =>
      admin
        .from("crm_tasks")
        .select("assignee_id")
        .is("done_at", null)
        .lt("due_at", new Date().toISOString())
        .not("assignee_id", "is", null)
        .order("id")
        .range(a, b),
    ),
  ]);
  const tasksReady = !done.error && !open.error;

  const rows = new Map<string, TeamRow>(
    owners.map((o) => [
      o.id,
      {
        memberId: o.id,
        name: o.name,
        notes: 0,
        calls: 0,
        meetings: 0,
        emails: 0,
        updates: 0,
        tasksDone: 0,
        tasksOverdue: tasksReady ? 0 : null,
      },
    ]),
  );
  const get = (id: string) => rows.get(id);
  for (const a of acts.data ?? []) {
    const r = get(a.actor_id);
    if (!r) continue;
    if (a.type === "note") r.notes += 1;
    else if (a.type === "call") r.calls += 1;
    else if (a.type === "meeting") r.meetings += 1;
    else if (a.type === "email") r.emails += 1;
    else r.updates += 1;
  }
  if (tasksReady) {
    for (const t of done.data ?? []) {
      const r = get(t.done_by);
      if (r) r.tasksDone += 1;
    }
    for (const t of open.data ?? []) {
      const r = get(t.assignee_id);
      if (r && r.tasksOverdue !== null) r.tasksOverdue += 1;
    }
  }
  const total = (r: TeamRow) =>
    r.notes + r.calls + r.meetings + r.emails + r.tasksDone;
  return [...rows.values()].sort(
    (a, b) => total(b) - total(a) || a.name.localeCompare(b.name),
  );
}
