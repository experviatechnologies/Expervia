import { NextResponse, type NextRequest } from "next/server";
import { getCurrentManager } from "@/lib/supabase-server";
import { getCurrentMember, isOperations } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { writeAudit } from "@/lib/eten/audit";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Clean up never-activated accounts (Ops-only, POST). "Unconfirmed" = members
 * with claimed_at null (migrated people who never set a password, or signups
 * who never confirmed their email). To avoid removing real recent leads or
 * staff, the purge ONLY targets accounts that are:
 *   - older than `graceDays` (default 14), AND
 *   - not an @experviatechnologies.com (staff) address, AND
 *   - not an operations account.
 *
 * mode:"preview" returns the count + a sample without deleting. mode:"purge"
 * requires confirm === PURGE_CONFIRM and deletes them (deleteUser cascades to
 * members/profiles). Audit-logged.
 */
const PURGE_CONFIRM = "PURGE-UNCONFIRMED";
const STAFF_DOMAIN = "@experviatechnologies.com";

async function allAuthUsers(admin: ReturnType<typeof getSupabaseAdmin>) {
  const map = new Map<string, string>(); // id -> email
  let page = 1;
  for (;;) {
    const { data } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    const users = data?.users ?? [];
    for (const u of users) if (u.email) map.set(u.id, u.email.toLowerCase());
    if (users.length < 1000) break;
    page++;
  }
  return map;
}

/**
 * Remove leftover migration-source rows for the given (lower-cased) emails.
 * The migration "to invite" list is built from community_applications +
 * event_registrations, so if we purge an account but leave its application row
 * behind, that person reappears as a candidate to invite. Deleting their source
 * rows here keeps the migration preview in sync with the accounts that exist.
 */
async function cleanupSourceRows(
  admin: ReturnType<typeof getSupabaseAdmin>,
  emails: Set<string>,
): Promise<number> {
  if (emails.size === 0) return 0;
  let removed = 0;
  for (const table of ["community_applications", "event_registrations"]) {
    const { data } = await admin.from(table).select("id, email");
    const ids = (data ?? [])
      .filter((r) => {
        const e = (r.email ?? "").trim().toLowerCase();
        return e.length > 0 && emails.has(e);
      })
      .map((r) => r.id);
    if (ids.length > 0) {
      const { error } = await admin.from(table).delete().in("id", ids);
      if (!error) removed += ids.length;
    }
  }
  return removed;
}

export async function POST(request: NextRequest) {
  const manager = await getCurrentManager();
  if (!manager) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await isOperations())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { graceDays?: unknown; mode?: unknown; confirm?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const graceDays = Math.min(
    Math.max(Math.round(Number(body.graceDays ?? 14)) || 14, 0),
    365,
  );
  const mode = body.mode === "purge" ? "purge" : "preview";
  const cutoff = Date.now() - graceDays * 86_400_000;

  const admin = getSupabaseAdmin();

  const { data: members } = await admin
    .from("members")
    .select("id, role, created_at")
    .is("claimed_at", null);

  const emailById = await allAuthUsers(admin);

  const targets = (members ?? []).filter((m) => {
    const email = emailById.get(m.id) ?? "";
    if (m.role === "operations") return false;
    if (email.endsWith(STAFF_DOMAIN)) return false;
    return Date.parse(m.created_at) < cutoff;
  });

  const sample = targets
    .slice(0, 25)
    .map((m) => emailById.get(m.id) ?? "(no email)");

  if (mode === "preview") {
    return NextResponse.json({
      graceDays,
      count: targets.length,
      sample,
    });
  }

  // mode === "purge"
  if (body.confirm !== PURGE_CONFIRM) {
    return NextResponse.json(
      { error: `Type ${PURGE_CONFIRM} to confirm.` },
      { status: 400 },
    );
  }

  let deleted = 0;
  const purgedEmails = new Set<string>();
  for (const m of targets) {
    const { error } = await admin.auth.admin.deleteUser(m.id);
    if (!error) {
      deleted++;
      const email = emailById.get(m.id); // already lower-cased
      if (email) purgedEmails.add(email);
    }
  }

  // Also clear their leftover application/event source rows so they don't
  // resurface in the migration "to invite" list.
  const sourceRowsRemoved = await cleanupSourceRows(admin, purgedEmails);

  const me = await getCurrentMember();
  await writeAudit({
    actorId: me?.id ?? null,
    action: "members.purged_unconfirmed",
    targetType: "member",
    targetId: null,
    metadata: { deleted, sourceRowsRemoved, graceDays },
  });

  const { count: remaining } = await admin
    .from("members")
    .select("id", { count: "exact", head: true })
    .is("claimed_at", null);

  return NextResponse.json({
    graceDays,
    deleted,
    sourceRowsRemoved,
    remaining,
  });
}
