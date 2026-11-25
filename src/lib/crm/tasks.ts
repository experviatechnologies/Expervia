import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase";
import { isUuid } from "@/lib/crm/record";
import { dateTime } from "@/lib/crm/labels";

/**
 * CRM tasks (SQL 67). "Today" is the Lagos day. Callers must have checked
 * getCrmSession() first (service-role reads).
 */

export const TASK_TYPES = [
  "todo",
  "call",
  "email",
  "meeting",
  "follow_up",
] as const;
export type TaskType = (typeof TASK_TYPES)[number];

export const TASK_PRIORITIES = ["low", "medium", "high"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const TASK_VIEWS = ["mine", "due", "upcoming", "open", "done"] as const;
export type TaskView = (typeof TASK_VIEWS)[number];

export type TaskRow = {
  id: string;
  title: string;
  notes: string | null;
  type: TaskType;
  priority: TaskPriority;
  dueAt: string | null;
  doneAt: string | null;
  assigneeId: string | null;
  assigneeName: string | null;
  doneByName: string | null;
  contact: { id: string; name: string } | null;
  company: { id: string; name: string } | null;
  /** Due before today started (Lagos). */
  overdue: boolean;
  /** Due some time today (Lagos). */
  dueToday: boolean;
  /** Formatted on the server (Lagos time) so the browser never re-formats. */
  dueLabel: string | null;
  doneLabel: string | null;
};

/** Thrown when SQL 67 has not been run; pages show a setup message. */
export class TasksNotReady extends Error {}

function check(error: { message: string; code?: string } | null) {
  if (!error) return;
  if (error.code === "42P01" || /crm_tasks/.test(error.message)) {
    throw new TasksNotReady(error.message);
  }
  throw new Error(error.message);
}

/** Start of today and start of tomorrow in Lagos (UTC+1, no DST). */
export function lagosDayBounds(now = Date.now()) {
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const start = Date.parse(`${ymd}T00:00:00+01:00`);
  return { start, end: start + 86_400_000 };
}

const COLUMNS =
  "id, title, notes, type, priority, due_at, done_at, assignee_id, done_by, contact_id, company_id, crm_contacts(id, first_name, last_name), crm_companies(id, name)";

type Raw = {
  id: string;
  title: string;
  notes: string | null;
  type: TaskType;
  priority: TaskPriority;
  due_at: string | null;
  done_at: string | null;
  assignee_id: string | null;
  done_by: string | null;
  crm_contacts:
    | { id: string; first_name: string; last_name: string }
    | { id: string; first_name: string; last_name: string }[]
    | null;
  crm_companies:
    | { id: string; name: string }
    | { id: string; name: string }[]
    | null;
};

const one = <T>(v: T | T[] | null): T | null =>
  Array.isArray(v) ? (v[0] ?? null) : v;

async function staffNames(ids: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (!unique.length) return new Map();
  const { data } = await getSupabaseAdmin()
    .from("profiles")
    .select("member_id, full_name")
    .in("member_id", unique);
  return new Map((data ?? []).map((p) => [p.member_id, p.full_name]));
}

async function toRows(raw: Raw[]): Promise<TaskRow[]> {
  const names = await staffNames(
    raw.flatMap((t) => [t.assignee_id ?? "", t.done_by ?? ""]),
  );
  const { start, end } = lagosDayBounds();
  return raw.map((t) => {
    const c = one(t.crm_contacts);
    const co = one(t.crm_companies);
    const due = t.due_at ? Date.parse(t.due_at) : null;
    return {
      id: t.id,
      title: t.title,
      notes: t.notes,
      type: t.type,
      priority: t.priority,
      dueAt: t.due_at,
      doneAt: t.done_at,
      assigneeId: t.assignee_id,
      assigneeName: t.assignee_id
        ? (names.get(t.assignee_id) ?? "Staff member")
        : null,
      doneByName: t.done_by ? (names.get(t.done_by) ?? "Staff member") : null,
      contact: c
        ? {
            id: c.id,
            name: `${c.first_name} ${c.last_name}`.trim() || "No name",
          }
        : null,
      company: co ? { id: co.id, name: co.name } : null,
      overdue: !t.done_at && due !== null && due < start,
      dueToday: !t.done_at && due !== null && due >= start && due < end,
      dueLabel: t.due_at ? dateTime(t.due_at) : null,
      doneLabel: t.done_at ? dateTime(t.done_at) : null,
    };
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Query = any;

function viewQuery(view: TaskView, viewerId: string): Query {
  const { end } = lagosDayBounds();
  const endIso = new Date(end).toISOString();
  let q: Query = getSupabaseAdmin()
    .from("crm_tasks")
    .select(COLUMNS, { count: "exact" });
  switch (view) {
    case "mine":
      q = q.is("done_at", null).eq("assignee_id", viewerId);
      break;
    case "due":
      q = q
        .is("done_at", null)
        .eq("assignee_id", viewerId)
        .lt("due_at", endIso);
      break;
    case "upcoming":
      q = q
        .is("done_at", null)
        .eq("assignee_id", viewerId)
        .gte("due_at", endIso);
      break;
    case "open":
      q = q.is("done_at", null);
      break;
    case "done":
      return q
        .not("done_at", "is", null)
        .order("done_at", { ascending: false });
  }
  // Soonest first; tasks with no due date go last.
  return q
    .order("due_at", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });
}

export async function listTasks(view: TaskView, viewerId: string) {
  const { data, count, error } = await viewQuery(view, viewerId).limit(200);
  check(error);
  return { rows: await toRows((data ?? []) as Raw[]), total: count ?? 0 };
}

export async function taskViewCounts(
  viewerId: string,
): Promise<Record<TaskView, number | null>> {
  const results = await Promise.all(
    TASK_VIEWS.map((v) => viewQuery(v, viewerId).limit(1)),
  );
  return Object.fromEntries(
    TASK_VIEWS.map((v, i) => [
      v,
      results[i].error ? null : (results[i].count ?? 0),
    ]),
  ) as Record<TaskView, number | null>;
}

/** My overdue and due-today tasks (sidebar badge). Null if unavailable. */
export async function myDueCount(viewerId: string): Promise<number | null> {
  const { count, error } = await viewQuery("due", viewerId).limit(1);
  return error ? null : (count ?? 0);
}

/** Open tasks first, then the latest done ones, for a contact or company. */
export async function tasksFor(target: {
  kind: "contact" | "company";
  id: string;
}): Promise<TaskRow[] | null> {
  if (!isUuid(target.id)) return [];
  const col = target.kind === "contact" ? "contact_id" : "company_id";
  const admin = getSupabaseAdmin();
  const [open, done] = await Promise.all([
    admin
      .from("crm_tasks")
      .select(COLUMNS)
      .eq(col, target.id)
      .is("done_at", null)
      .order("due_at", { ascending: true, nullsFirst: false })
      .limit(50),
    admin
      .from("crm_tasks")
      .select(COLUMNS)
      .eq(col, target.id)
      .not("done_at", "is", null)
      .order("done_at", { ascending: false })
      .limit(5),
  ]);
  if (open.error || done.error) return null; // SQL 67 not run yet
  return toRows([...(open.data ?? []), ...(done.data ?? [])] as Raw[]);
}
