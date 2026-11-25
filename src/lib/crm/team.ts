import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase";
import { fetchAllRows } from "@/lib/fetch-all";
import type { CrmRole } from "@/lib/crm/session";

/**
 * CRM staff and setup status, for the Team & access page. Callers must have
 * checked getCrmSession() first.
 */

export type StaffMember = {
  id: string;
  name: string;
  email: string | null;
  roles: CrmRole[];
  contactsOwned: number;
  openDeals: number | null;
  openTasks: number | null;
  lastSignInAt: string | null;
};

export async function listCrmStaff(): Promise<StaffMember[]> {
  const admin = getSupabaseAdmin();
  const [ops, staff] = await Promise.all([
    admin
      .from("members")
      .select("id")
      .eq("role", "operations")
      .eq("status", "active"),
    admin.from("member_roles").select("member_id, role"),
  ]);
  const roles = new Map<string, Set<CrmRole>>();
  for (const m of ops.data ?? [])
    roles.set(m.id, new Set<CrmRole>(["operations"]));
  for (const r of staff.data ?? []) {
    if (r.role !== "sales_manager" && r.role !== "management") continue;
    const set = roles.get(r.member_id) ?? new Set<CrmRole>();
    set.add(r.role);
    roles.set(r.member_id, set);
  }
  const ids = [...roles.keys()];
  if (ids.length === 0) return [];

  const [profiles, users, contacts, deals, tasks] = await Promise.all([
    admin.from("profiles").select("member_id, full_name").in("member_id", ids),
    Promise.all(ids.map((id) => admin.auth.admin.getUserById(id))),
    fetchAllRows<{ owner_id: string }>((a, b) =>
      admin
        .from("crm_contacts")
        .select("owner_id")
        .in("owner_id", ids)
        .order("id")
        .range(a, b),
    ),
    fetchAllRows<{ owner_id: string; stage: string }>((a, b) =>
      admin
        .from("crm_deals")
        .select("owner_id, stage")
        .in("owner_id", ids)
        .not("stage", "in", "(won,lost)")
        .order("id")
        .range(a, b),
    ),
    fetchAllRows<{ assignee_id: string }>((a, b) =>
      admin
        .from("crm_tasks")
        .select("assignee_id")
        .in("assignee_id", ids)
        .is("done_at", null)
        .order("id")
        .range(a, b),
    ),
  ]);
  const name = new Map(
    (profiles.data ?? []).map((p) => [p.member_id, p.full_name]),
  );
  const count = <T>(rows: T[] | null, key: (r: T) => string) => {
    const m = new Map<string, number>();
    for (const r of rows ?? []) m.set(key(r), (m.get(key(r)) ?? 0) + 1);
    return m;
  };
  const owned = count(contacts.data, (r) => r.owner_id);
  const dealCount = deals.error ? null : count(deals.data, (r) => r.owner_id);
  const taskCount = tasks.error
    ? null
    : count(tasks.data, (r) => r.assignee_id);

  return ids
    .map((id, i) => {
      const u = users[i].data?.user;
      return {
        id,
        name: name.get(id)?.trim() || u?.email?.split("@")[0] || "Staff member",
        email: u?.email ?? null,
        roles: [...(roles.get(id) ?? [])],
        contactsOwned: owned.get(id) ?? 0,
        openDeals: dealCount ? (dealCount.get(id) ?? 0) : null,
        openTasks: taskCount ? (taskCount.get(id) ?? 0) : null,
        lastSignInAt: u?.last_sign_in_at ?? null,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export type SetupItem = { file: string; what: string; done: boolean };

/**
 * Which CRM SQL files are live, checked against the database itself.
 * (A file counts as done when the thing it creates exists.)
 */
export async function setupStatus(): Promise<SetupItem[]> {
  const admin = getSupabaseAdmin();
  // A normal read, not a count-only (HEAD) request: Supabase answers a HEAD
  // request for a table that doesn't exist with an empty success.
  const table = async (name: string) =>
    !(await admin.from(name).select("*").limit(1)).error;
  const rpcExists = async (fn: string, args: Record<string, unknown>) => {
    const { error } = await admin.rpc(fn, args);
    // Missing function: PGRST202 / "Could not find the function".
    return !(
      error &&
      (error.code === "PGRST202" ||
        /could not find the function/i.test(error.message))
    );
  };
  const zero = "00000000-0000-0000-0000-000000000000";
  const [c64, c65, c66, c67, c68, c69, c70, c71] = await Promise.all([
    table("crm_contacts"),
    // Merging a contact into itself is refused by the function if it exists.
    rpcExists("crm_merge_contacts", {
      p_source: zero,
      p_target: zero,
      p_actor: null,
    }),
    table("crm_lists"),
    table("crm_tasks"),
    table("crm_deals"),
    rpcExists("crm_sync_member", { p_member_id: zero }),
    rpcExists("crm_member_name", { p_member: zero }),
    table("crm_campaigns"),
  ]);
  return [
    {
      file: "64_crm_core.sql",
      what: "Contacts, companies and timelines",
      done: c64,
    },
    {
      file: "65_crm_merge_contacts.sql",
      what: "Merging duplicates (re-run after 66, 67 and 68)",
      done: c65,
    },
    { file: "66_crm_lists.sql", what: "Lists", done: c66 },
    { file: "67_crm_tasks.sql", what: "Tasks", done: c67 },
    { file: "68_crm_deals.sql", what: "Deals", done: c68 },
    {
      file: "69_crm_signup_sync.sql",
      what: "New sign-ups added to the CRM automatically",
      done: c69,
    },
    {
      file: "70_crm_mentorship_events.sql",
      what: "Mentorship activity on timelines",
      done: c70,
    },
    { file: "71_crm_campaigns.sql", what: "Email campaigns", done: c71 },
  ];
}
