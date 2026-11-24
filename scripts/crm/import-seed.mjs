#!/usr/bin/env node
/**
 * CRM import (step 2 of the CRM build).
 *
 * Fills crm_companies, crm_contacts and crm_activities (SQL 64) from:
 *   1. the cleaned seed file from the CRM prototype (lead ads, ETEN registry,
 *      pod list, certified members, Anthropic list), and
 *   2. every existing platform member who is not in that file, so the CRM
 *      holds the whole community, not only the imported leads.
 *
 * It never creates accounts and never sends email. People are linked to an
 * existing account by email. A seed person whose PHONE belongs to an account
 * with a different email is not linked: they are flagged for review
 * (review_reason = 'phone_match') with the suggested account in eten.
 *
 * Safe to re-run: rows are keyed by import_key / dedupe_key and existing rows
 * are left alone, so staff edits are never overwritten.
 *
 * Usage (from the repo root):
 *   node scripts/crm/import-seed.mjs CRM_Expervia/crm-data.json           # dry run
 *   node scripts/crm/import-seed.mjs CRM_Expervia/crm-data.json --apply   # write
 *
 * Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (.env.local).
 * The seed file holds personal data: keep it in the git-ignored CRM_Expervia/.
 */
import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const [seedPath, flag] = process.argv.slice(2);
const APPLY = flag === "--apply";
if (!seedPath || !existsSync(seedPath)) {
  console.error(
    "Usage: node scripts/crm/import-seed.mjs <crm-data.json> [--apply]",
  );
  process.exit(1);
}

// ---------------------------------------------------------------- env + client
function loadEnv(file) {
  if (!existsSync(file)) return {};
  return Object.fromEntries(
    readFileSync(file, "utf8")
      .split("\n")
      .filter((l) => /^[A-Z0-9_]+=/.test(l))
      .map((l) => {
        const i = l.indexOf("=");
        return [
          l.slice(0, i),
          l
            .slice(i + 1)
            .trim()
            .replace(/^["']|["']$/g, ""),
        ];
      }),
  );
}
const env = { ...loadEnv(".env.local"), ...process.env };
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.",
  );
  process.exit(1);
}
const sb = createClient(url, key, { auth: { persistSession: false } });

// ------------------------------------------------------------------- helpers
const lower = (s) => (s ? String(s).trim().toLowerCase() : "");
const clean = (s) => {
  const v = s == null ? "" : String(s).trim();
  return v && v !== "—" ? v : null;
};
/** Last 10 digits, so 0803..., 234803... and +234803... compare equal. */
const phoneKey = (p) => {
  let d = String(p ?? "").replace(/\D/g, "");
  if (d.startsWith("0") && d.length === 11) d = `234${d.slice(1)}`;
  return d.length >= 10 ? d.slice(-10) : "";
};
const splitName = (full) => {
  const parts = String(full ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return { first: parts[0] ?? "", last: parts.slice(1).join(" ") };
};
const gender = (g) => {
  const v = lower(g);
  return v === "female" || v === "male" ? v : null;
};
const chunk = (arr, n) => {
  const out = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
};
async function must(promise, what) {
  const { data, error } = await promise;
  if (error) throw new Error(`${what}: ${error.message}`);
  return data;
}
async function selectAll(table, columns) {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const page = await must(
      sb
        .from(table)
        .select(columns)
        .range(from, from + 999),
      `read ${table}`,
    );
    rows.push(...page);
    if (page.length < 1000) return rows;
  }
}

// ------------------------------------------------------------ platform data
async function loadPlatform() {
  const users = [];
  for (let page = 1; ; page++) {
    const { data, error } = await sb.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error) throw new Error(`list users: ${error.message}`);
    users.push(...data.users);
    if (data.users.length < 1000) break;
  }
  const members = await selectAll(
    "members",
    "id, status, role, origin, claimed_at, created_at",
  );
  const profiles = await selectAll(
    "profiles",
    "member_id, full_name, job_title, location",
  );
  const contacts = await selectAll("member_contact", "member_id, phone");

  const userById = new Map(users.map((u) => [u.id, u]));
  const profileById = new Map(profiles.map((p) => [p.member_id, p]));
  const phoneById = new Map(contacts.map((c) => [c.member_id, c.phone]));
  const memberIds = new Set(members.map((m) => m.id));

  const memberByEmail = new Map();
  const memberByPhone = new Map();
  for (const u of users) {
    if (!memberIds.has(u.id)) continue;
    if (u.email) memberByEmail.set(lower(u.email), u.id);
    const k = phoneKey(phoneById.get(u.id) ?? u.phone);
    if (k && !memberByPhone.has(k)) memberByPhone.set(k, u.id);
  }
  return {
    members,
    userById,
    profileById,
    phoneById,
    memberByEmail,
    memberByPhone,
  };
}

/** Communities a member asked to join at signup (auth metadata). */
function memberCommunities(user) {
  const c = user?.user_metadata?.community_interest;
  return typeof c === "string" && c ? [c] : [];
}

// ---------------------------------------------------------------- build rows
function buildSeedRows(seed, platform) {
  const contacts = [];
  const activities = [];
  const stats = { linked: 0, phoneReview: 0, noAccount: 0, noEmail: 0 };

  for (const c of seed.contacts) {
    const email = lower(c.email) || null;
    const importKey = email
      ? `seed:email:${email}`
      : phoneKey(c.phone)
        ? `seed:phone:${phoneKey(c.phone)}`
        : `seed:name:${lower(`${c.firstName} ${c.lastName}`).replace(/\s+/g, "-")}`;

    let memberId = null;
    let review = null;
    const extra = {};
    if (email && platform.memberByEmail.has(email)) {
      memberId = platform.memberByEmail.get(email);
      stats.linked++;
    } else if (
      phoneKey(c.phone) &&
      platform.memberByPhone.has(phoneKey(c.phone))
    ) {
      review = "phone_match";
      extra.suggested_member_id = platform.memberByPhone.get(phoneKey(c.phone));
      stats.phoneReview++;
    } else if (!email) {
      stats.noEmail++;
    } else {
      stats.noAccount++;
    }

    const e = c.eten ?? null;
    const eten = e
      ? {
          solution_area:
            e.community && e.community !== "Not yet assigned"
              ? e.community
              : null,
          pods: e.pods ?? [],
          community_role: e.role && e.role !== "Member" ? e.role : null,
          skills: e.skills ?? [],
          availability: clean(e.availability),
          partner: clean(e.partner),
          prospect: Boolean(e.prospect),
          stage: e.stage ?? null,
          ...extra,
        }
      : { ...extra };

    const user = memberId ? platform.userById.get(memberId) : null;
    contacts.push({
      import_key: importKey,
      member_id: memberId,
      first_name: clean(c.firstName) ?? "",
      last_name: clean(c.lastName) ?? "",
      email,
      phone: clean(c.phone),
      job_title: clean(c.jobTitle),
      _company: clean(c.companyName),
      audience: c.audience === "customer" ? "customer" : "eten",
      lifecycle: c.lifecycle ?? "lead",
      lead_status: c.leadStatus ?? "new",
      city: clean(c.city),
      state: clean(c.state),
      country: clean(c.country),
      gender: gender(e?.gender),
      source: clean(c.source),
      tags: [...new Set(c.tags ?? [])],
      communities: memberCommunities(user),
      eten,
      email_opt_in: c.emailOptIn !== false,
      review_reason: review,
      first_seen_at: c.createdAt ?? new Date().toISOString(),
    });

    // Timeline: one entry per source sheet, one per imported note.
    const when = c.createdAt ?? seed.generatedAt;
    [...new Set(c._sources ?? [])].forEach((s) => {
      const isLead = /lead ads|FB\/IG/i.test(s);
      activities.push({
        _key: importKey,
        type: isLead ? "form" : "system",
        product: /mentorship/i.test(s) ? "mentorship" : "expervia",
        event: isLead ? "lead_form_submitted" : "imported",
        subject: isLead ? `Lead form: ${s}` : `Imported from ${s}`,
        occurred_at: when,
        dedupe_key: `import:${importKey}:source:${s}`,
      });
    });
    (c._notes ?? []).forEach((n, i) => {
      activities.push({
        _key: importKey,
        type: "note",
        product: "expervia",
        event: "imported_note",
        body: n,
        occurred_at: when,
        dedupe_key: `import:${importKey}:note:${i}`,
      });
    });
  }
  return { contacts, activities, stats };
}

function buildMemberRows(platform, linkedMemberIds) {
  const contacts = [];
  const activities = [];
  for (const m of platform.members) {
    if (linkedMemberIds.has(m.id)) continue;
    const user = platform.userById.get(m.id);
    const profile = platform.profileById.get(m.id);
    const { first, last } = splitName(
      profile?.full_name ?? user?.user_metadata?.full_name,
    );
    const importKey = `member:${m.id}`;
    const source =
      m.origin === "migrated" ? "Migrated member" : "Platform signup";
    const tags = m.role === "operations" ? ["Staff"] : [];
    contacts.push({
      import_key: importKey,
      member_id: m.id,
      first_name: first,
      last_name: last,
      email: lower(user?.email) || null,
      phone: clean(platform.phoneById.get(m.id) ?? user?.phone),
      job_title: clean(profile?.job_title),
      _company: null,
      audience: "eten",
      lifecycle: "subscriber",
      lead_status: m.claimed_at ? "connected" : "new",
      city: clean(profile?.location),
      state: null,
      country: null,
      gender: null,
      source,
      tags,
      communities: memberCommunities(user),
      eten: {},
      email_opt_in: true,
      review_reason: null,
      first_seen_at: m.created_at,
    });
    activities.push({
      _key: importKey,
      type: "system",
      product: "expervia",
      event:
        m.origin === "migrated" ? "account_migrated" : "account_registered",
      subject:
        m.origin === "migrated"
          ? "Account created by migration"
          : "Signed up on the platform",
      occurred_at: m.created_at,
      dedupe_key: `import:${importKey}:joined`,
    });
  }
  return { contacts, activities };
}

// ---------------------------------------------------------------------- run
async function main() {
  const seed = JSON.parse(readFileSync(seedPath, "utf8"));
  const platform = await loadPlatform();

  const seedRows = buildSeedRows(seed, platform);
  const linked = new Set(
    seedRows.contacts.map((c) => c.member_id).filter(Boolean),
  );
  const memberRows = buildMemberRows(platform, linked);
  const allContacts = [...seedRows.contacts, ...memberRows.contacts];
  const allActivities = [...seedRows.activities, ...memberRows.activities];

  // Leave anything already in the CRM alone (by key or email).
  // A dry run may happen before SQL 64 is applied: treat the CRM as empty.
  const existing = await selectAll(
    "crm_contacts",
    "id, import_key, email, member_id",
  ).catch((e) => {
    if (APPLY)
      throw new Error(`${e.message} (run supabase/eten/64_crm_core.sql first)`);
    return [];
  });
  const haveKey = new Set(existing.map((r) => r.import_key));
  const haveEmail = new Set(existing.map((r) => r.email).filter(Boolean));
  const haveMember = new Set(existing.map((r) => r.member_id).filter(Boolean));
  const toInsert = allContacts.filter(
    (c) =>
      !haveKey.has(c.import_key) &&
      !(c.email && haveEmail.has(c.email)) &&
      !(c.member_id && haveMember.has(c.member_id)),
  );

  const companyNames = new Map();
  for (const c of toInsert)
    if (c._company) companyNames.set(lower(c._company), c._company);
  for (const n of seed.companies ?? [])
    if (clean(n)) companyNames.set(lower(n), clean(n));

  const audience = (a) => toInsert.filter((c) => c.audience === a).length;
  console.log(
    `Mode: ${APPLY ? "APPLY (writing)" : "dry run (nothing written)"}`,
  );
  console.log(`Seed people: ${seed.contacts.length}`);
  console.log(
    `  linked to an existing account by email: ${seedRows.stats.linked}`,
  );
  console.log(
    `  phone matches an account, flagged for review: ${seedRows.stats.phoneReview}`,
  );
  console.log(`  no account yet: ${seedRows.stats.noAccount}`);
  console.log(`  no email (CRM contact only): ${seedRows.stats.noEmail}`);
  console.log(
    `Platform members not in the seed (added as contacts): ${memberRows.contacts.length}`,
  );
  console.log(
    `  of which asked to join Women in Tech: ${memberRows.contacts.filter((c) => c.communities.includes("women-in-tech")).length}`,
  );
  console.log(
    `Contacts already in the CRM (skipped): ${allContacts.length - toInsert.length}`,
  );
  console.log(
    `Contacts to insert: ${toInsert.length} (ETEN ${audience("eten")}, customer ${audience("customer")})`,
  );
  console.log(`Companies: ${companyNames.size}`);
  console.log(
    `Timeline entries (new ones only are written): ${allActivities.length}`,
  );
  if (!APPLY) {
    console.log("\nDry run only. Re-run with --apply to write.");
    return;
  }

  // Companies first, so contacts can point at them. The unique index is on
  // lower(trim(name)), which upsert cannot target, so insert only new names.
  const companies = await selectAll("crm_companies", "id, name");
  const companyId = new Map(companies.map((c) => [lower(c.name), c.id]));
  const missing = [...companyNames.entries()].filter(
    ([k]) => !companyId.has(k),
  );
  for (const part of chunk(missing, 200)) {
    const rows = await must(
      sb
        .from("crm_companies")
        .insert(part.map(([, name]) => ({ name, type: "prospect" })))
        .select("id, name"),
      "insert companies",
    );
    for (const r of rows) companyId.set(lower(r.name), r.id);
  }

  for (const part of chunk(toInsert, 200)) {
    await must(
      sb.from("crm_contacts").insert(
        part.map(({ _company, ...row }) => ({
          ...row,
          company_id: _company
            ? (companyId.get(lower(_company)) ?? null)
            : null,
        })),
      ),
      "insert contacts",
    );
  }

  const ids = new Map(
    (await selectAll("crm_contacts", "id, import_key")).map((r) => [
      r.import_key,
      r.id,
    ]),
  );
  const activityRows = allActivities
    .filter((a) => ids.has(a._key))
    .map(({ _key, ...a }) => ({ ...a, contact_id: ids.get(_key) }));
  for (const part of chunk(activityRows, 500)) {
    await must(
      sb
        .from("crm_activities")
        .upsert(part, { onConflict: "dedupe_key", ignoreDuplicates: true }),
      "insert timeline",
    );
  }

  const [{ count: contactCount }, { count: activityCount }] = await Promise.all(
    [
      sb.from("crm_contacts").select("id", { count: "exact", head: true }),
      sb.from("crm_activities").select("id", { count: "exact", head: true }),
    ],
  );
  console.log(
    `\nDone. CRM now holds ${contactCount} contacts and ${activityCount} timeline entries.`,
  );
}

main().catch((e) => {
  console.error(`Import failed: ${e.message}`);
  process.exit(1);
});
