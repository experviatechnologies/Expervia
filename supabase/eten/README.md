# ETEN Phase 1 — database (step M0.3)

SQL that turns the approved data model (`docs/eten/phase1-data-model.md`) into
real Postgres. Run the files **in order, once each**, in the Supabase SQL Editor
of the same project that holds `community_applications` / `event_registrations`.

| #   | file               | what it does                                                       |
| --- | ------------------ | ------------------------------------------------------------------ |
| 1   | `01_schema.sql`    | enums, 23 tables, indexes, triggers; enables RLS (no policies yet) |
| 2   | `02_functions.sql` | `security definer` helper functions the policies call              |
| 3   | `03_rls.sql`       | every table's RLS policies + the cert-verification guard trigger   |
| 4   | `04_seed.sql`      | the Main Community + 6 specialist pods                             |

Every file is **idempotent** — safe to re-run. Nothing here touches the existing
marketing tables.

## Access model (how RLS is set up)

- **anon** (public key, no login) → no policy matches → denied on every ETEN table.
- **authenticated** (a member's SSR session) → the policies in `03_rls.sql`.
- **service_role** (server key, never in the browser) → bypasses RLS. Used for
  signup/migration provisioning (M0.4), writing `notifications`, and `audit_log`.

`members` and `profiles` rows are created **server-side** at signup/provisioning
with the service_role key, so there is deliberately no member-facing INSERT
policy for `members`. Ops staff are just members with `role = 'operations'`; the
`is_operations()` helper is what unlocks their extra reach in the policies.

## Deliberately deferred (built in their milestone, not here)

- **Storage policies** for certificate files, profile photos, and post/message
  attachments — added when those upload features are built (they extend the
  existing private-bucket + signed-URL pattern).
- **Pod-lead read access to reports** on their pod's content — added with the M4
  moderation console; Phase-1 report reads are reporter + ops.
- **Polls** (`polls` / `poll_options` / `poll_votes`) — M2.11.

## Assumptions locked here (flag if any are wrong)

- **Pods are open in Phase 1**: any active member can read any pod's feed (so a
  pod is discoverable before you join). Change `can_see_pod()` alone to make pods
  private later.
- **No hard deletes** of posts/comments through the app — removal is soft
  (`is_removed`); true deletion is the NDPA path via service_role (M4.4).
