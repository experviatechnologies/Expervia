# ETEN Phase 1 — Relational Data Model

**Step M0.1** · Status: **draft for approval** · Basis: ETEN Phase 1 PRD v1.0 (§10–11) + current Expervia codebase

This is a product-level schema design, not the final SQL. Its job is to lock the shape of the data
**once**, so M0.3 (create tables + RLS) and everything after it build on a stable foundation, and so
the Phase-3 Expert Directory and Phase-4 Opportunity Marketplace can extend it without a rewrite
(PRD §13). Nothing is created until this doc is approved.

Legend: `PK` primary key · `FK` foreign key · `UQ` unique · `?` nullable · `[]` array · `enum` see §Enums.

---

## 1. Design decisions (please confirm these before we build)

These are the calls that ripple through the whole schema. I've picked a recommended option for each;
flag any you'd change.

1. **Identity is rooted in Supabase `auth.users`.** We add a `members` row 1:1 with each auth user
   (same UUID). Auth (password, email, verification, SSO) stays managed by Supabase; `members` holds
   only ETEN-specific identity (status, platform role). This reuses the auth infrastructure already in
   the app.

2. **Member vs. Profile kept as two tables** (per PRD §10). `members` = identity/status/role;
   `profiles` = the presentational profile, 1:1. _Alternative:_ fold into one table. Recommendation:
   keep separate — cleaner RLS (public can read profile fields, never the member's status/role row).

3. **Pod leadership is per-pod, not a global role.** The PRD lists "Pod Lead" alongside a global role,
   but a person leads _a specific pod_. So the platform-level `role` enum is just `member` /
   `operations`, and pod leadership lives on `pod_memberships.role_in_pod`
   (`member`/`lead`/`co_lead`). This matches FR-POD-05 and avoids a person being globally "a pod lead"
   with no pod attached.

4. **The Main Community is a pod row** (`pods.is_main = true`). This lets post targeting, feeds and
   membership use one uniform mechanism instead of special-casing "Main vs. pod" everywhere.

5. **A post can target the Main feed and/or several pods** (FR-FEED-10) → a `post_targets` join table,
   one row per destination pod. No "primary pod" concept; a post simply appears in each target's feed.

6. **Post tags reuse the skills taxonomy** (FR-FEED-09 says tags come "from the taxonomy"). So there is
   one controlled vocabulary — `skills` — used for profile skill tags _and_ post tags. No separate tag
   table.

7. **Moderated content is soft-deleted** (`is_removed` + who/why), never hard-deleted, so the audit
   trail (PRD §9) survives. Member-requested data deletion (NDPA, M4.4) is the one true-delete path.

8. **Reactions and reports are polymorphic** (a `target_type` + `target_id`) so one table serves posts
   and comments (reactions) or posts/comments/messages/members (reports). _Trade-off:_ no database-level
   FK on the target. Recommendation: accept it here — the alternative (a table per target type) triples
   the surface for a low-value integrity gain. Flag if you'd rather have strict FKs.

---

## 2. Entities

### Identity & profile

**`members`** — root ETEN identity, 1:1 with `auth.users`.
| column | type | notes |
|---|---|---|
| id | uuid `PK` | = `auth.users.id` (`FK`) |
| status | enum `member_status` | `active` / `suspended` / `deactivated`, default `active` (FR-AUTH-07) |
| role | enum `platform_role` | `member` / `operations`, default `member` |
| origin | enum `member_origin` | `self_signup` / `migrated` — how the account came to exist |
| claimed_at | timestamptz? | when the person activated (set a password / used their invite link). **null = pre-provisioned, not yet activated.** |
| created_at | timestamptz | default now() |

`claimed_at` is the switch that makes a migrated account "real": a pre-built account is created with
`claimed_at = null`, its **profile stays private until it is set** (upholds FR-AUTH-03, "email verified
before a profile is published"), and it flips to `now()` the moment the person clicks their invite link
and sets a password. See §5 for the migration/invite flow this supports.

**`profiles`** — presentational profile, 1:1 with `members` (FR-PROF-01/02).
| column | type | notes |
|---|---|---|
| member_id | uuid `PK` `FK`→members | |
| full_name | text | |
| headline | text? | professional headline |
| photo_url | text? | avatar (storage) |
| location | text? | |
| bio | text? | |
| languages | text[]? | |
| availability_status | text? | free-text in P1; becomes structured in Phase 3 |
| job_title | text? | job title (named `current_role` in early drafts; renamed — `current_role` is a reserved SQL keyword) |
| years_experience | int? | |
| industry_experience | text? | |
| primary_specialization_pod_id | uuid? `FK`→pods | one of the six pods (FR-SKILL-01) |
| updated_at | timestamptz | |

Public profile view (FR-PROF-07) = a defined subset of these columns exposed via RLS/a view; the member's
`status`/`role` are never public.

**`certifications`** — many:1 with member. **This is the seed of the Phase-3 talent database** (PRD §10).
| column | type | notes |
|---|---|---|
| id | uuid `PK` | |
| member_id | uuid `FK`→members | |
| name | text | e.g. "AZ-104" |
| credential_id | text? | issuer's certification ID |
| issuer | text? | |
| date_obtained | date? | |
| expiry_date | date? | |
| verification_status | enum `verification_status` | `unverified` / `verified` / `rejected`, default `unverified` (FR-PROF-06) |
| verified_by | uuid? `FK`→members | ops user who verified |
| verified_at | timestamptz? | |
| certificate_path | text? | private storage object (FR-PROF-05) |
| created_at / updated_at | timestamptz | |

### Taxonomy & pods

**`pods`** — fixed set: Main Community + 6 specialist pods (PRD Appendix B).
| column | type | notes |
|---|---|---|
| id | uuid `PK` | |
| slug | text `UQ` | e.g. `data-ai` |
| name | text | |
| description | text? | |
| is_main | boolean | true for the Main Community |
| created_at | timestamptz | |

Member count is a derived read (count of memberships), not a stored column, to avoid drift.

**`skills`** — admin-managed controlled taxonomy (FR-SKILL-02/03); doubles as the post-tag vocabulary.
| column | type | notes |
|---|---|---|
| id | uuid `PK` | |
| slug | text `UQ` | |
| name | text | e.g. "Power BI" |
| pod_id | uuid `FK`→pods | parent pod category |
| is_active | boolean | default true |
| sort | int? | display order |

**`member_skills`** — member ↔ skill, secondary skill tags (FR-SKILL-02).
`(member_id, skill_id)` `PK` composite.

**`pod_memberships`** — member ↔ pod (FR-POD-02/04); carries pod-level role (FR-POD-05).
| column | type | notes |
|---|---|---|
| id | uuid `PK` | |
| pod_id | uuid `FK`→pods | |
| member_id | uuid `FK`→members | |
| role_in_pod | enum `pod_role` | `member` / `lead` / `co_lead`, default `member` |
| joined_at | timestamptz | |
| | | `UQ (pod_id, member_id)` |

### Feed

**`posts`** (FR-FEED-01…)
| column | type | notes |
|---|---|---|
| id | uuid `PK` | |
| author_id | uuid `FK`→members | |
| body | text | |
| created_at / updated_at | timestamptz | |
| is_removed | boolean | soft-delete (FR-FEED-13) |
| removed_by | uuid? `FK`→members | |
| removed_reason | text? | |

**`post_targets`** — where a post appears (FR-FEED-10). `(post_id, pod_id)` `UQ`.
Main-feed posts target the `is_main` pod; pod posts target that pod. One post → many rows.

**`post_attachments`** (FR-FEED-02/03/04)
| column | type | notes |
|---|---|---|
| id | uuid `PK` | |
| post_id | uuid `FK`→posts | |
| kind | enum `attachment_kind` | `image` / `document` / `link` / `video` |
| storage_path | text? | for image/document (private storage) |
| url | text? | for link/video |
| filename / mime | text? | |
| meta | jsonb? | link-preview card data, video embed info |

**`post_tags`** — `(post_id, skill_id)` `PK`, tags drawn from `skills` (FR-FEED-09).

**`comments`** (FR-FEED-06) — one level of threading: a comment with a `parent_comment_id` may not
itself be a parent (enforced in app + a check).
| column | type | notes |
|---|---|---|
| id | uuid `PK` | |
| post_id | uuid `FK`→posts | |
| author_id | uuid `FK`→members | |
| parent_comment_id | uuid? `FK`→comments | null = top-level |
| body | text | |
| created_at | timestamptz | |
| is_removed / removed_by / removed_reason | | soft-delete |

**`reactions`** (FR-FEED-07) — polymorphic (see decision 8).
`id`, `member_id` `FK`, `target_type` enum(`post`/`comment`), `target_id` uuid, `reaction_type`
enum `reaction_type`, `created_at`. `UQ (member_id, target_type, target_id)` — one reaction per member
per item.

_Mentions (FR-FEED-08)_ are resolved at write time into `notifications` (type `mention`); no separate
mentions table in Phase 1.

### Messaging

**`conversations`** (FR-MSG-01/02) — `id`, `is_group` bool, `title?` (group), `created_by` `FK`,
`created_at`.

**`conversation_participants`** — `(conversation_id, member_id)` `UQ`; `joined_at`, `last_read_at?`
(drives unread counts / read status FR-MSG-05).

**`messages`** — `id`, `conversation_id` `FK`, `sender_id` `FK`, `body`, `created_at`.

**`message_attachments`** (FR-MSG-03) — `id`, `message_id` `FK`, `storage_path`, `filename`, `mime`.

**`blocks`** (FR-MSG-06) — `blocker_id` `FK`, `blocked_id` `FK`, `created_at`; `UQ (blocker_id, blocked_id)`.

### Notifications, reports, audit

**`notifications`** (FR-NOTIF-01) — `id`, `recipient_id` `FK`, `type` enum `notification_type`
(`mention`/`comment`/`reaction`/`message`/`pod_activity`), `actor_id?` `FK`, `target_type?`,
`target_id?`, `is_read` bool, `created_at`.

**`notification_preferences`** (FR-NOTIF-03) — `(member_id, category)` `PK`, `mode` enum
`notification_mode` (`realtime`/`digest`/`off`). Category mirrors notification types.

**`reports`** (FR-FEED-12) — polymorphic. `id`, `reporter_id` `FK`, `target_type`
(`post`/`comment`/`message`/`member`), `target_id`, `reason` text, `status` enum `report_status`
(`open`/`actioned`/`dismissed`), `resolved_by?` `FK`, `resolved_at?`, `resolution_note?`, `created_at`.
Feeds the moderation console (M4.2).

**`audit_log`** (PRD §9, built in M4.3 but defined now) — `id`, `actor_id` `FK`, `action` text,
`target_type?`, `target_id?`, `reason?`, `metadata jsonb?`, `created_at`.

### Deferred to their milestone (defined, not built in M0)

- **Polls** (FR-FEED-05, Should): `polls` / `poll_options` / `poll_votes` — added in M2.11.
- **SSO identities** are handled inside Supabase Auth; no extra table needed (FR-AUTH-02).

---

## 3. Enums

| enum                  | values                                                               |
| --------------------- | -------------------------------------------------------------------- |
| `member_status`       | active · suspended · deactivated                                     |
| `member_origin`       | self_signup · migrated                                               |
| `platform_role`       | member · operations                                                  |
| `pod_role`            | member · lead · co_lead                                              |
| `verification_status` | unverified · verified · rejected                                     |
| `attachment_kind`     | image · document · link · video                                      |
| `reaction_type`       | like · insightful · celebrate · support _(finalize set with design)_ |
| `notification_type`   | mention · comment · reaction · message · pod_activity                |
| `notification_mode`   | realtime · digest · off                                              |
| `report_status`       | open · actioned · dismissed                                          |

---

## 4. RLS strategy (high level — policies written in M0.3)

Every table ships with row-level security on and explicit policies (no service-role-only tables except
`audit_log`, which is server-written). The shape:

- **`members`** — a member reads/updates only their own row; ops reads all; status/role changes are ops-only.
- **`profiles`** — public fields readable by any authenticated member (public profile, FR-PROF-07); a
  member writes only their own.
- **`certifications`** — readable only by the owner and ops (FR-PROF-05); `verification_status` writable
  by ops only.
- **`pods` / `skills`** — readable by all members; writable by ops only (admin-managed taxonomy).
- **`pod_memberships`** — a member creates/deletes their own membership (join/leave); `role_in_pod`
  writable by ops only (FR-POD-05).
- **`posts` / `comments` / `reactions`** — readable by members who can see a target pod; author writes
  their own; `is_removed` settable by the author, ops, or a lead/co_lead of a target pod (FR-FEED-13).
- **messaging tables** — visible only to conversation participants; blocked pairs cannot message.
- **`reports`** — reporter creates; only ops (and, for pod content, the relevant lead) read/resolve.
- **`notifications` / `notification_preferences`** — a member sees only their own.

---

## 5. Existing registrants → members (M0.2 — DECIDED: migrate + invite)

**Decision:** existing registrants get a **ready-made profile + a secure invite** ("Model 1"). We
pre-build their account from the data they already gave, then email them a single-use link to activate
it. This is Option B (migrate), run as a **one-time bulk provisioning at launch** rather than lazily on
sign-up.

The two source tables:

- **`community_applications`** — `id, created_at, vendor, full_name, email, phone, linkedin, location,
solution_area, certifications, availability, resume_path`. A **proto Profile + Certification** row.
- **`event_registrations`** — event sign-up, incl. a `membership_status` field (`Yes` /
  `I would like to join` / `No`) and a `consent` boolean.

### Provisioning flow (built in M0.4, run in M5.1)

1. **Dedupe by email** across both tables (a person may appear in both, or in both Huawei and Microsoft
   community tracks). One member per unique email.
2. For each email, create: an invited `auth.users` (email pre-marked verified), a `members` row with
   `origin = migrated` and `claimed_at = null`, a `profiles` row seeded from their data (name, headline
   from role, location, expertise → `primary_specialization`), and `certifications` rows from their
   cert/résumé fields, all `verification_status = unverified`. Move `resume_path` objects into the
   certificate storage path.
3. **Send a branded invite email** via the existing Resend channel: _"Your ETEN profile is ready — set
   your password to activate it,"_ with a single-use, time-limited link (Supabase invite / magic-link).
   The copy states plainly the profile was built from their earlier application/registration.
4. On click → they set a password (or continue passwordless / SSO) → `claimed_at` is set → profile
   becomes visible → they're dropped into onboarding to finish (join pods, confirm skills).
5. **Unclaimed accounts** (`claimed_at IS NULL`) stay private and invisible to other members; send a
   reminder after N days. They are never a security or privacy exposure because they cannot be logged
   into without the invite link.

### Segmentation (respectful + NDPA-clean)

- Community applicants and event registrants with `membership_status` in (`Yes`,
  `I would like to join`) → **pre-built profile + invite** (they clearly opted in).
- Event registrants with `membership_status = No` → **plain "ETEN is live" invitation** instead of a
  pre-built account (no presumption; they can register fresh if they choose).
- All export/delete rights are handled by M4.4 (NDPA).

_The legacy tables are kept intact after migration — they remain the source-of-record for the funnel and
the email→member link._

---

## 6. Phase 3/4 readiness check (PRD §13)

- `certifications` and `skills`/`member_skills` are first-class, indexable, and filterable → the Expert
  Directory (Phase 3) queries them directly, no migration.
- `posts`/`pods` carry no assumptions that block new pod types or algorithmic ranking later (ranking is
  an ordering concern, not a schema one).
- No payment/opportunity entities exist yet (correctly out of scope; Phase 4).

---

_Approve this and M0.2 is the data decision above (§5); M0.3 turns the approved model into SQL + RLS._
