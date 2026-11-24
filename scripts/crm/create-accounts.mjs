#!/usr/bin/env node
/**
 * CRM step 3: create platform accounts for CRM contacts who have none.
 *
 * Who gets one: ETEN contacts (not customer leads) with an email, no linked
 * account and no open review flag (phone matches wait for a human).
 *
 * How: admin.createUser with NO password and an UNCONFIRMED email, metadata
 * origin = 'migrated'. The signup trigger (SQL 05) then creates the members +
 * profiles rows with claimed_at = null, exactly like the earlier member
 * migration. Nothing is emailed: Supabase's admin API sends no mail. The
 * person activates later through the existing Admin > Members "resend invite"
 * flow (a recovery link to set a password), which claims the account.
 *
 * Modes:
 *   node scripts/crm/create-accounts.mjs            dry run: counts only
 *   node scripts/crm/create-accounts.mjs --test     one throwaway example.com
 *                                                   account: create, check,
 *                                                   then delete it
 *   node scripts/crm/create-accounts.mjs --apply    create for everyone eligible
 *
 * Safe to re-run: contacts already linked are skipped, and an email that
 * already has an account is linked instead of created.
 */
import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const MODE = process.argv.includes("--apply")
  ? "apply"
  : process.argv.includes("--test")
    ? "test"
    : "dry-run";
const DELAY_MS = 250;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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
if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.",
  );
  process.exit(1);
}
const sb = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

async function must(promise, what) {
  const { data, error } = await promise;
  if (error) throw new Error(`${what}: ${error.message}`);
  return data;
}

async function existingUserIdByEmail() {
  const map = new Map();
  for (let page = 1; ; page++) {
    const { data, error } = await sb.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error) throw new Error(`list users: ${error.message}`);
    for (const u of data.users)
      if (u.email) map.set(u.email.toLowerCase(), u.id);
    if (data.users.length < 1000) return map;
  }
}

async function eligibleContacts() {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const page = await must(
      sb
        .from("crm_contacts")
        .select("id, first_name, last_name, email, phone, city, country")
        .eq("audience", "eten")
        .is("member_id", null)
        .is("review_reason", null)
        .not("email", "is", null)
        .order("first_seen_at")
        .range(from, from + 999),
      "read contacts",
    );
    rows.push(...page);
    if (page.length < 1000) return rows;
  }
}

/** Create one unclaimed account; returns its id. Sends no email. */
async function createAccount(c) {
  const fullName = `${c.first_name} ${c.last_name}`.trim();
  const { data, error } = await sb.auth.admin.createUser({
    email: c.email,
    email_confirm: false,
    user_metadata: {
      full_name: fullName,
      origin: "migrated",
      provisioned_by: "crm_import",
    },
  });
  if (error || !data?.user)
    throw new Error(error?.message ?? "createUser failed");
  const id = data.user.id;

  const location = [c.city, c.country].filter(Boolean).join(", ") || null;
  if (location) {
    await must(
      sb.from("profiles").update({ location }).eq("member_id", id),
      "profile location",
    );
  }
  if (c.phone) {
    await must(
      sb
        .from("member_contact")
        .upsert(
          { member_id: id, phone: c.phone },
          { onConflict: "member_id", ignoreDuplicates: true },
        ),
      "member phone",
    );
  }
  return id;
}

/** Link a contact to an account and note it on their timeline. */
async function linkContact(contactId, memberId, created) {
  await must(
    sb.from("crm_contacts").update({ member_id: memberId }).eq("id", contactId),
    "link contact",
  );
  await must(
    sb.from("crm_activities").upsert(
      {
        contact_id: contactId,
        type: "system",
        product: "expervia",
        event: created ? "account_provisioned" : "account_linked",
        subject: created
          ? "Platform account created (waiting for activation)"
          : "Linked to their existing platform account",
        payload: { member_id: memberId },
        dedupe_key: `account:${contactId}`,
      },
      { onConflict: "dedupe_key", ignoreDuplicates: true },
    ),
    "timeline entry",
  );
}

// ------------------------------------------------------------------ test mode
async function runTest() {
  const email = `crm-provision-test-${Date.now()}@example.com`;
  console.log(`Test account: ${email}`);
  const id = await createAccount({
    first_name: "CRM",
    last_name: "Test",
    email,
    phone: "+2340000000000",
    city: "Lagos",
    country: "Nigeria",
  });

  const checks = [];
  const check = (label, ok, detail = "") => {
    checks.push(ok);
    console.log(
      `  ${ok ? "PASS" : "FAIL"}  ${label}${detail ? `  (${detail})` : ""}`,
    );
  };
  try {
    const { data: u } = await sb.auth.admin.getUserById(id);
    const member = await must(
      sb
        .from("members")
        .select("origin, claimed_at, status, role")
        .eq("id", id)
        .single(),
      "read member",
    );
    const profile = await must(
      sb
        .from("profiles")
        .select("full_name, location")
        .eq("member_id", id)
        .single(),
      "read profile",
    );
    const contact = await must(
      sb.from("member_contact").select("phone").eq("member_id", id).single(),
      "read member_contact",
    );

    check("account exists", Boolean(u?.user));
    check("email NOT confirmed", !u?.user?.email_confirmed_at);
    check("never signed in", !u?.user?.last_sign_in_at);
    check(
      "no confirmation/invite email sent",
      !u?.user?.confirmation_sent_at && !u?.user?.invited_at,
    );
    check("member row: origin migrated", member.origin === "migrated");
    check("member row: unclaimed", member.claimed_at === null);
    check(
      "member row: plain member, active status",
      member.role === "member" && member.status === "active",
    );
    check(
      "profile name filled",
      profile.full_name === "CRM Test",
      profile.full_name,
    );
    check("profile location filled", profile.location === "Lagos, Nigeria");
    check("phone saved", contact.phone === "+2340000000000");

    // The activation path step 4 will use: a recovery link (not emailed here).
    const { data: link, error: linkErr } = await sb.auth.admin.generateLink({
      type: "recovery",
      email,
    });
    check(
      "activation link can be generated",
      !linkErr && Boolean(link?.properties?.hashed_token),
      linkErr?.message,
    );
    const { data: after } = await sb
      .from("members")
      .select("claimed_at")
      .eq("id", id)
      .single();
    check(
      "still unclaimed after generating the link",
      after?.claimed_at === null,
    );
  } finally {
    const { error } = await sb.auth.admin.deleteUser(id);
    const { data: gone } = await sb
      .from("members")
      .select("id")
      .eq("id", id)
      .maybeSingle();
    console.log(
      `  ${!error && !gone ? "PASS" : "FAIL"}  test account deleted (member rows removed too)`,
    );
    if (error || gone) checks.push(false);
  }
  const failed = checks.filter((ok) => !ok).length;
  console.log(failed ? `\n${failed} check(s) FAILED.` : "\nAll checks passed.");
  if (failed) process.exit(1);
}

// ----------------------------------------------------------------------- run
async function main() {
  if (MODE === "test") return runTest();

  const [contacts, userIds] = await Promise.all([
    eligibleContacts(),
    existingUserIdByEmail(),
  ]);
  const toLink = contacts.filter((c) => userIds.has(c.email));
  const toCreate = contacts.filter((c) => !userIds.has(c.email));
  console.log(`Mode: ${MODE}`);
  console.log(`Eligible contacts: ${contacts.length}`);
  console.log(`  already have an account (link only): ${toLink.length}`);
  console.log(`  new accounts to create: ${toCreate.length}`);
  if (MODE !== "apply") {
    console.log("\nDry run only. Use --test or --apply.");
    return;
  }

  for (const c of toLink) await linkContact(c.id, userIds.get(c.email), false);

  let created = 0;
  const failed = [];
  for (const c of toCreate) {
    try {
      const id = await createAccount(c);
      await linkContact(c.id, id, true);
      created++;
      if (created % 50 === 0)
        console.log(`  created ${created}/${toCreate.length}`);
    } catch (e) {
      failed.push({ contact: c.id, error: e.message });
    }
    await sleep(DELAY_MS);
  }
  console.log(
    `\nLinked ${toLink.length}, created ${created}, failed ${failed.length}.`,
  );
  for (const f of failed)
    console.log(`  failed contact ${f.contact}: ${f.error}`);
  if (failed.length) process.exit(1);
}

main().catch((e) => {
  console.error(`Failed: ${e.message}`);
  process.exit(1);
});
