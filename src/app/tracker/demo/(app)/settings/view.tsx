"use client";

/**
 * Settings. Everyone: profile and expertise, calendar connection and
 * notification preferences. System Administrators also get users and roles,
 * CSV import, pods / skills / meeting types, policies, system health and the
 * audit log (PRD FR-002, FR-005, FR-007, FR-029, FR-030).
 */
import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  RefreshCw,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/tracker/store";
import { has, lookup } from "@/lib/tracker/selectors";
import {
  CALENDAR_STATUS,
  LEVEL_LABEL,
  ROLE_LABEL,
  SENIORITY_LABEL,
} from "@/lib/tracker/labels";
import { TIMEZONES, WEEKDAYS, fmtAgo, fmtDateTime } from "@/lib/tracker/time";
import type {
  AccountStatus,
  Member,
  Pod,
  Policies,
  Role,
  Seniority,
  Skill,
  SkillLevel,
  Weekday,
} from "@/lib/tracker/types";
import {
  Btn,
  Card,
  ChipToggle,
  DefList,
  Dialog,
  EmptyState,
  Field,
  Notice,
  PageHeader,
  Pill,
  Table,
  Tabs,
  Toggle,
  inputClass,
  td,
  th,
  useToast,
} from "@/components/tracker/ui";

type Tab =
  | "profile"
  | "calendar"
  | "notifications"
  | "users"
  | "import"
  | "pods"
  | "policies"
  | "health"
  | "audit";

export function SettingsView({ initialTab }: { initialTab: string }) {
  const { me } = useSession();
  const admin = has(me, "admin");
  const tabs: { id: Tab; label: string }[] = [
    { id: "profile", label: "Profile" },
    ...(me.roles.includes("member")
      ? [{ id: "calendar" as Tab, label: "Calendar" }]
      : []),
    { id: "notifications", label: "Notifications" },
    ...(admin
      ? ([
          { id: "users", label: "Users" },
          { id: "import", label: "Import" },
          { id: "pods", label: "Pods and skills" },
          { id: "policies", label: "Policies" },
          { id: "health", label: "System health" },
          { id: "audit", label: "Audit log" },
        ] as { id: Tab; label: string }[])
      : []),
  ];
  const [tab, setTab] = useState<Tab>(
    tabs.some((t) => t.id === initialTab) ? (initialTab as Tab) : "profile",
  );

  return (
    <>
      <PageHeader
        title="Settings"
        description={
          admin
            ? "Your own profile and preferences, plus administration of users, reference data and system policies."
            : "Your profile, calendar connection and notification preferences."
        }
      />
      <Tabs<Tab>
        label="Settings sections"
        tabs={tabs}
        value={tab}
        onChange={setTab}
      />
      {tab === "profile" && <ProfileTab />}
      {tab === "calendar" && <CalendarTab />}
      {tab === "notifications" && <NotificationsTab />}
      {tab === "users" && <UsersTab />}
      {tab === "import" && <ImportTab />}
      {tab === "pods" && <PodsTab />}
      {tab === "policies" && <PoliciesTab />}
      {tab === "health" && <HealthTab />}
      {tab === "audit" && <AuditTab />}
    </>
  );
}

const splitList = (s: string) =>
  s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

// ------------------------------------------------------------------ profile

function ProfileTab() {
  const t = useSession();
  const { data, me } = t;
  const toast = useToast();
  const L = lookup(data);
  const engineer = me.roles.includes("member");
  const [p, setP] = useState(() => ({
    phone: me.phone ?? "",
    timezone: me.timezone,
    bio: me.bio,
    seniority: me.seniority,
    years: me.years,
    extraPodIds: me.extraPodIds,
    skills: me.skills,
    specialisations: me.specialisations.join(", "),
    certifications: me.certifications.join(", "),
    industries: me.industries.join(", "),
  }));
  const [addingSkill, setAddingSkill] = useState("");
  return (
    <div className="grid max-w-[920px] gap-6">
      <Card
        title="Account"
        description="Managed by your administrator. Contact them to change your name, email or roles."
      >
        <DefList
          items={[
            ["Name", me.name],
            ["Email", me.email],
            ["Roles", me.roles.map((r) => ROLE_LABEL[r]).join(", ")],
            ["Member code", me.code],
            ...(engineer
              ? ([["Primary pod", L.pod(me.podId)?.name ?? ""]] as [
                  string,
                  string,
                ][])
              : []),
            [
              "Last sign-in",
              me.lastSignInAt ? fmtDateTime(me.lastSignInAt) : "Never",
            ],
          ]}
        />
      </Card>
      <Card
        title={engineer ? "Expertise profile" : "Contact details"}
        description={
          engineer
            ? "Sales Managers and Pod Leaders use this to match you to client meetings."
            : undefined
        }
      >
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            t.saveProfile({
              phone: p.phone,
              timezone: p.timezone,
              bio: p.bio,
              seniority: p.seniority,
              years: Number(p.years),
              extraPodIds: p.extraPodIds,
              skills: p.skills,
              specialisations: splitList(p.specialisations),
              certifications: splitList(p.certifications),
              industries: splitList(p.industries),
            });
            toast("Profile saved.");
          }}
        >
          <Field label="Phone">
            {(id) => (
              <input
                id={id}
                value={p.phone}
                onChange={(e) => setP({ ...p, phone: e.target.value })}
                className={inputClass}
              />
            )}
          </Field>
          <Field label="Time zone" required>
            {(id) => (
              <select
                id={id}
                value={p.timezone}
                onChange={(e) => setP({ ...p, timezone: e.target.value })}
                className={inputClass}
              >
                {TIMEZONES.map((z) => (
                  <option key={z}>{z}</option>
                ))}
              </select>
            )}
          </Field>
          {engineer && (
            <>
              <Field
                label="Short biography"
                className="sm:col-span-2"
                hint={`${p.bio.length}/1200`}
              >
                {(id) => (
                  <textarea
                    id={id}
                    rows={3}
                    maxLength={1200}
                    value={p.bio}
                    onChange={(e) => setP({ ...p, bio: e.target.value })}
                    className={cn(inputClass, "h-auto py-2")}
                  />
                )}
              </Field>
              <Field label="Seniority">
                {(id) => (
                  <select
                    id={id}
                    value={p.seniority}
                    onChange={(e) =>
                      setP({ ...p, seniority: e.target.value as Seniority })
                    }
                    className={inputClass}
                  >
                    {(Object.keys(SENIORITY_LABEL) as Seniority[]).map((s) => (
                      <option key={s} value={s}>
                        {SENIORITY_LABEL[s]}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
              <Field label="Years of experience">
                {(id) => (
                  <input
                    id={id}
                    type="number"
                    min={0}
                    max={50}
                    value={p.years}
                    onChange={(e) =>
                      setP({ ...p, years: Number(e.target.value) })
                    }
                    className={inputClass}
                  />
                )}
              </Field>
              <div className="sm:col-span-2">
                <p className="mb-1.5 text-[13px] font-semibold">
                  Additional pods
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {data.pods
                    .filter((x) => x.id !== me.podId)
                    .map((x) => (
                      <ChipToggle
                        key={x.id}
                        on={p.extraPodIds.includes(x.id)}
                        onClick={() =>
                          setP({
                            ...p,
                            extraPodIds: p.extraPodIds.includes(x.id)
                              ? p.extraPodIds.filter((y) => y !== x.id)
                              : [...p.extraPodIds, x.id],
                          })
                        }
                      >
                        {x.name}
                      </ChipToggle>
                    ))}
                </div>
                <p className="text-eten-faint mt-1 text-[12.5px]">
                  Pods you can also support, besides your primary pod.
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="mb-1.5 text-[13px] font-semibold">Skills</p>
                <p className="text-eten-faint mb-2 text-[12.5px]">
                  Choose from the approved list, then set your level for each.
                </p>
                <ul className="space-y-2">
                  {p.skills.map((s) => (
                    <li
                      key={s.skillId}
                      className="border-eten-line flex flex-wrap items-center gap-2 rounded-xl border px-3 py-2"
                    >
                      <span className="min-w-[180px] flex-1 font-semibold">
                        {L.skillName(s.skillId)}
                      </span>
                      <select
                        aria-label={`Level for ${L.skillName(s.skillId)}`}
                        value={s.level}
                        onChange={(e) =>
                          setP({
                            ...p,
                            skills: p.skills.map((x) =>
                              x.skillId === s.skillId
                                ? { ...x, level: e.target.value as SkillLevel }
                                : x,
                            ),
                          })
                        }
                        className={cn(inputClass, "h-9 w-auto")}
                      >
                        {(Object.keys(LEVEL_LABEL) as SkillLevel[]).map((l) => (
                          <option key={l} value={l}>
                            {LEVEL_LABEL[l]}
                          </option>
                        ))}
                      </select>
                      <Btn
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setP({
                            ...p,
                            skills: p.skills.filter(
                              (x) => x.skillId !== s.skillId,
                            ),
                          })
                        }
                      >
                        Remove
                      </Btn>
                    </li>
                  ))}
                </ul>
                <div className="mt-2 flex gap-2">
                  <select
                    aria-label="Add a skill"
                    value={addingSkill}
                    onChange={(e) => setAddingSkill(e.target.value)}
                    className={cn(inputClass, "sm:max-w-[320px]")}
                  >
                    <option value="">Add a skill…</option>
                    {data.skills
                      .filter(
                        (s) =>
                          s.active && !p.skills.some((x) => x.skillId === s.id),
                      )
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                  </select>
                  <Btn
                    disabled={!addingSkill}
                    onClick={() => {
                      setP({
                        ...p,
                        skills: [
                          ...p.skills,
                          { skillId: addingSkill, level: "working" },
                        ],
                      });
                      setAddingSkill("");
                    }}
                  >
                    Add
                  </Btn>
                </div>
              </div>
              <Field label="Specialisations" hint="Separate with commas.">
                {(id) => (
                  <input
                    id={id}
                    value={p.specialisations}
                    onChange={(e) =>
                      setP({ ...p, specialisations: e.target.value })
                    }
                    className={inputClass}
                  />
                )}
              </Field>
              <Field label="Certifications" hint="Separate with commas.">
                {(id) => (
                  <input
                    id={id}
                    value={p.certifications}
                    onChange={(e) =>
                      setP({ ...p, certifications: e.target.value })
                    }
                    className={inputClass}
                  />
                )}
              </Field>
              <Field
                label="Industries"
                className="sm:col-span-2"
                hint="Separate with commas."
              >
                {(id) => (
                  <input
                    id={id}
                    value={p.industries}
                    onChange={(e) => setP({ ...p, industries: e.target.value })}
                    className={inputClass}
                  />
                )}
              </Field>
            </>
          )}
          <div className="flex justify-end sm:col-span-2">
            <Btn type="submit" variant="primary">
              Save profile
            </Btn>
          </div>
        </form>
      </Card>
    </div>
  );
}

// ------------------------------------------------------------------ calendar

function CalendarTab() {
  const t = useSession();
  const { me, data } = t;
  const toast = useToast();
  const s = CALENDAR_STATUS[me.calendar];
  const provider =
    me.calendarProvider === "google"
      ? "Google Calendar"
      : me.calendarProvider === "microsoft"
        ? "Microsoft Outlook"
        : "Demo calendar";
  return (
    <div className="grid max-w-[760px] gap-6">
      <Card
        title="Calendar"
        description="Calendar connection is only needed for ETEN Members who can be selected for meetings."
      >
        <div className="flex flex-wrap items-center gap-2">
          <Pill tone={s.tone}>{s.label}</Pill>
          {me.calendar !== "none" && (
            <span className="text-eten-ink-muted text-[14px]">{provider}</span>
          )}
        </div>
        {["expired", "revoked", "error"].includes(me.calendar) && (
          <div className="mt-3">
            <Notice tone="warning">
              Your calendar authorisation is no longer valid. Reconnect to
              restore conflict checks.
            </Notice>
          </div>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          {me.calendar === "none" ? (
            <>
              <Btn
                variant="primary"
                disabled={!data.policies.outlookEnabled}
                onClick={() => (
                  t.setCalendar("connected", "microsoft"),
                  toast("Microsoft Outlook connected (demo).")
                )}
              >
                Connect Microsoft Outlook
              </Btn>
              <Btn
                disabled={!data.policies.googleEnabled}
                onClick={() => (
                  t.setCalendar("connected", "google"),
                  toast("Google Calendar connected (demo).")
                )}
              >
                Connect Google Calendar
              </Btn>
            </>
          ) : (
            <>
              {me.calendar !== "connected" && (
                <Btn
                  variant="primary"
                  onClick={() => (
                    t.setCalendar("connected"),
                    toast("Calendar reconnected.")
                  )}
                >
                  <RefreshCw className="size-4" /> Reconnect
                </Btn>
              )}
              <Btn
                variant="danger"
                onClick={() => (
                  t.setCalendar("none"),
                  toast("Calendar disconnected.")
                )}
              >
                Disconnect calendar
              </Btn>
            </>
          )}
        </div>
      </Card>
      <Card title="What we access">
        <ul className="text-eten-ink-muted list-disc space-y-1.5 pl-5 text-[14px]">
          <li>
            Only whether you are free or busy. Titles, attendees and
            descriptions of your other events are never read or shown to anyone.
          </li>
          <li>
            Confirmed ETEN meetings are written to your calendar. Rescheduling
            or cancelling updates that same event.
          </li>
          <li>
            Permissions requested: Calendars.ReadBasic and Calendars.ReadWrite
            for events created by ETEN only (Microsoft), or free/busy and events
            (Google).
          </li>
          <li>
            Tokens are encrypted on the server and never sent to the browser.
            You can disconnect at any time.
          </li>
        </ul>
      </Card>
    </div>
  );
}

// ------------------------------------------------------------------ notifications

function NotificationsTab() {
  const t = useSession();
  const toast = useToast();
  const [prefs, setPrefs] = useState(t.me.prefs);
  return (
    <Card
      title="Notification preferences"
      description="Critical messages, such as invitations, cancellations and missed deadlines, are always sent."
      className="max-w-[760px]"
    >
      <div className="space-y-4">
        <Notice tone="neutral">
          Email not configured in the demo. Notifications are shown in the app.
        </Notice>
        <Toggle
          checked={prefs.weeklyReminder}
          onChange={(v) => setPrefs({ ...prefs, weeklyReminder: v })}
        >
          <span className="font-semibold">
            Weekly availability review reminder
          </span>
          <span className="text-eten-faint block text-[13px]">
            A reminder to check your availability is still correct.
          </span>
        </Toggle>
        <Toggle
          checked={prefs.meetingReminders}
          onChange={(v) => setPrefs({ ...prefs, meetingReminders: v })}
        >
          <span className="font-semibold">Meeting reminders</span>
          <span className="text-eten-faint block text-[13px]">
            24 hours and 1 hour before meetings you are confirmed for.
          </span>
        </Toggle>
        <Toggle
          checked={prefs.digest}
          onChange={(v) => setPrefs({ ...prefs, digest: v })}
        >
          <span className="font-semibold">
            Daily email digest instead of individual non-urgent emails
          </span>
        </Toggle>
        <div className="flex justify-end">
          <Btn
            variant="primary"
            onClick={() => (
              t.saveProfile({ prefs }),
              toast("Preferences saved.")
            )}
          >
            Save preferences
          </Btn>
        </div>
      </div>
    </Card>
  );
}

// ------------------------------------------------------------------ users

const ROLES: Role[] = [
  "member",
  "pod_leader",
  "sales_manager",
  "management",
  "admin",
];
const STATUSES: AccountStatus[] = [
  "invited",
  "active",
  "suspended",
  "deactivated",
];
const STATUS_TONE = {
  invited: "info",
  active: "success",
  suspended: "warning",
  deactivated: "neutral",
} as const;

function UsersTab() {
  const { data } = useSession();
  const L = lookup(data);
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<Member | null>(null);
  const [inviting, setInviting] = useState(false);
  const rows = useMemo(
    () =>
      data.members
        .filter(
          (m) =>
            !q ||
            `${m.name} ${m.email}`.toLowerCase().includes(q.toLowerCase()),
        )
        .filter((m) => !role || m.roles.includes(role as Role))
        .filter((m) => !status || m.status === status)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [data.members, q, role, status],
  );
  const PAGE = 20;
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const cur = Math.min(page, pages - 1);

  return (
    <Card
      title="Users and roles"
      description="Invite people, change roles and suspend or deactivate accounts. Every change needs a reason and is recorded in the audit log."
      action={
        <Btn variant="primary" size="sm" onClick={() => setInviting(true)}>
          <Plus className="size-4" /> Invite user
        </Btn>
      }
      bodyClassName=""
    >
      <div className="grid gap-3 px-5 pt-4 sm:grid-cols-3">
        <Field label="Search">
          {(id) => (
            <input
              id={id}
              type="search"
              value={q}
              onChange={(e) => (setQ(e.target.value), setPage(0))}
              placeholder="Name or email"
              className={inputClass}
            />
          )}
        </Field>
        <Field label="Role">
          {(id) => (
            <select
              id={id}
              value={role}
              onChange={(e) => (setRole(e.target.value), setPage(0))}
              className={inputClass}
            >
              <option value="">All roles</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Status">
          {(id) => (
            <select
              id={id}
              value={status}
              onChange={(e) => (setStatus(e.target.value), setPage(0))}
              className={inputClass}
            >
              <option value="">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s[0].toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          )}
        </Field>
      </div>
      <div className="mt-4">
        {rows.length === 0 ? (
          <EmptyState title="No users match these filters" />
        ) : (
          <Table label="Users">
            <thead className="border-eten-line border-y">
              <tr>
                <th className={th}>Name</th>
                <th className={th}>Roles</th>
                <th className={th}>Pod</th>
                <th className={th}>Status</th>
                <th className={th}>Last sign-in</th>
                <th className={th}>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(cur * PAGE, (cur + 1) * PAGE).map((m) => (
                <tr
                  key={m.id}
                  className="border-eten-line-soft border-b last:border-0"
                >
                  <td className={td}>
                    <span className="font-semibold">{m.name}</span>
                    <span className="text-eten-faint block text-[12.5px]">
                      {m.email}
                    </span>
                  </td>
                  <td className={`${td} text-[13px]`}>
                    {m.roles.map((r) => ROLE_LABEL[r]).join(", ")}
                  </td>
                  <td className={`${td} font-mono text-[12.5px]`}>
                    {m.roles.includes("member") ? L.pod(m.podId)?.code : "n/a"}
                  </td>
                  <td className={td}>
                    <Pill tone={STATUS_TONE[m.status]}>
                      {m.status[0].toUpperCase() + m.status.slice(1)}
                    </Pill>
                  </td>
                  <td className={`${td} text-[13px]`}>
                    {m.lastSignInAt ? fmtAgo(m.lastSignInAt) : "Never"}
                  </td>
                  <td className={`${td} text-right`}>
                    <Btn
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditing(m)}
                    >
                      Edit
                    </Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>
      <div className="border-eten-line flex items-center justify-between border-t px-5 py-3 text-[13.5px]">
        <span className="text-eten-faint">
          {rows.length} users · page {cur + 1} of {pages}
        </span>
        <span className="flex gap-2">
          <Btn size="sm" disabled={cur === 0} onClick={() => setPage(cur - 1)}>
            <ChevronLeft className="size-4" /> Previous
          </Btn>
          <Btn
            size="sm"
            disabled={cur >= pages - 1}
            onClick={() => setPage(cur + 1)}
          >
            Next <ChevronRight className="size-4" />
          </Btn>
        </span>
      </div>
      {editing && (
        <EditUserDialog member={editing} onClose={() => setEditing(null)} />
      )}
      {inviting && <InviteDialog onClose={() => setInviting(false)} />}
    </Card>
  );
}

function EditUserDialog({
  member,
  onClose,
}: {
  member: Member;
  onClose: () => void;
}) {
  const t = useSession();
  const toast = useToast();
  const [roles, setRoles] = useState<Role[]>(member.roles);
  const [status, setStatus] = useState<AccountStatus>(member.status);
  const [reason, setReason] = useState("");
  const changed =
    roles.join() !== member.roles.join() || status !== member.status;
  return (
    <Dialog
      open
      onClose={onClose}
      title={`Edit ${member.name}`}
      description={member.email}
      footer={
        <>
          <Btn onClick={onClose}>Cancel</Btn>
          <Btn
            variant="primary"
            disabled={!changed || !reason.trim() || roles.length === 0}
            onClick={() => {
              t.updateUser(member.id, { roles, status }, reason.trim());
              toast("User updated and recorded in the audit log.");
              onClose();
            }}
          >
            Save
          </Btn>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <p className="mb-1.5 text-[13px] font-semibold">Roles</p>
          <div className="grid grid-cols-2 gap-2">
            {ROLES.map((r) => (
              <Toggle
                key={r}
                checked={roles.includes(r)}
                onChange={(v) =>
                  setRoles((x) => (v ? [...x, r] : x.filter((y) => y !== r)))
                }
              >
                {ROLE_LABEL[r]}
              </Toggle>
            ))}
          </div>
          {roles.some((r) =>
            ["sales_manager", "management", "admin"].includes(r),
          ) && (
            <p className="text-eten-faint mt-2 text-[12.5px]">
              Privileged roles must use multi-factor authentication.
            </p>
          )}
        </div>
        <Field label="Account status">
          {(id) => (
            <select
              id={id}
              value={status}
              onChange={(e) => setStatus(e.target.value as AccountStatus)}
              className={inputClass}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s[0].toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Reason for the change" required>
          {(id) => (
            <input
              id={id}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className={inputClass}
            />
          )}
        </Field>
      </div>
    </Dialog>
  );
}

function InviteDialog({ onClose }: { onClose: () => void }) {
  const t = useSession();
  const toast = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [podId, setPodId] = useState(t.data.pods[0]?.id ?? "");
  const [roles, setRoles] = useState<Role[]>(["member"]);
  const exists = t.data.members.some(
    (m) => m.email.toLowerCase() === email.trim().toLowerCase(),
  );
  const valid =
    name.trim() && /^\S+@\S+\.\S+$/.test(email) && !exists && roles.length > 0;
  return (
    <Dialog
      open
      onClose={onClose}
      title="Invite user"
      description="They receive an email invitation to activate their account."
      footer={
        <>
          <Btn onClick={onClose}>Cancel</Btn>
          <Btn
            variant="primary"
            disabled={!valid}
            onClick={() => {
              t.inviteUser({
                name: name.trim(),
                email: email.trim(),
                podId,
                roles,
              });
              toast(`Invitation recorded for ${name.trim()}.`);
              onClose();
            }}
          >
            Send invitation
          </Btn>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Full name" required>
          {(id) => (
            <input
              id={id}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
          )}
        </Field>
        <Field
          label="Email"
          required
          error={
            exists ? "A member with this email already exists." : undefined
          }
        >
          {(id) => (
            <input
              id={id}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          )}
        </Field>
        <Field label="Primary pod">
          {(id) => (
            <select
              id={id}
              value={podId}
              onChange={(e) => setPodId(e.target.value)}
              className={inputClass}
            >
              {t.data.pods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
        </Field>
        <div className="grid grid-cols-2 gap-2">
          {ROLES.map((r) => (
            <Toggle
              key={r}
              checked={roles.includes(r)}
              onChange={(v) =>
                setRoles((x) => (v ? [...x, r] : x.filter((y) => y !== r)))
              }
            >
              {ROLE_LABEL[r]}
            </Toggle>
          ))}
        </div>
      </div>
    </Dialog>
  );
}

// ------------------------------------------------------------------ import

type ImportRow = {
  full_name: string;
  email: string;
  primary_pod: string;
  result: "create" | "exists" | "error";
  note?: string;
};

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(cell);
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((x) => x.trim()));
}

function ImportTab() {
  const t = useSession();
  const toast = useToast();
  const [rows, setRows] = useState<ImportRow[] | null>(null);
  const [fileError, setFileError] = useState("");

  const onFile = async (file: File | undefined) => {
    setFileError("");
    setRows(null);
    if (!file) return;
    if (file.size > 2 * 1024 * 1024)
      return setFileError("The file is larger than 2 MB.");
    const parsed = parseCsv(await file.text());
    const header = parsed[0]?.map((h) => h.trim().toLowerCase()) ?? [];
    const idx = (k: string) => header.indexOf(k);
    if (idx("full_name") < 0 || idx("email") < 0 || idx("primary_pod") < 0)
      return setFileError("Required columns: full_name, email, primary_pod.");
    const seen = new Set<string>();
    setRows(
      parsed.slice(1).map((r) => {
        const row = {
          full_name: r[idx("full_name")]?.trim() ?? "",
          email: r[idx("email")]?.trim() ?? "",
          primary_pod: r[idx("primary_pod")]?.trim() ?? "",
        };
        const pod = t.data.pods.find(
          (p) => p.code.toLowerCase() === row.primary_pod.toLowerCase(),
        );
        const verdict = (): Pick<ImportRow, "result" | "note"> => {
          if (!row.full_name || !/^\S+@\S+\.\S+$/.test(row.email))
            return { result: "error", note: "Missing name or invalid email." };
          if (!pod)
            return {
              result: "error",
              note: `Unknown pod "${row.primary_pod}".`,
            };
          if (seen.has(row.email.toLowerCase()))
            return { result: "error", note: "Duplicate row in this file." };
          if (
            t.data.members.some(
              (m) => m.email.toLowerCase() === row.email.toLowerCase(),
            )
          )
            return {
              result: "exists",
              note: "A member with this email already exists. Their profile will not be changed.",
            };
          return { result: "create" };
        };
        seen.add(row.email.toLowerCase());
        return { ...row, ...verdict() };
      }),
    );
  };

  const creatable = rows?.filter((r) => r.result === "create") ?? [];
  const sample =
    "full_name,email,primary_pod\nAmaka Obi,amaka.obi@example.com,CLD\nKunle Ade,kunle.ade@example.com,SEC\n";

  return (
    <Card
      title="Import members from CSV"
      description="Upload a file, review every row, then confirm. Nothing is created until you confirm. Existing emails are skipped, never overwritten."
      className="max-w-[960px]"
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <label
            className={cn(
              "border-eten-line hover:bg-eten-hover inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border px-4 text-[14px] font-semibold",
            )}
          >
            <Upload className="size-4" /> Choose a CSV file
            <input
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
          </label>
          <button
            type="button"
            className="text-eten-accent text-[13.5px] font-semibold underline"
            onClick={() =>
              onFile(new File([sample], "sample.csv", { type: "text/csv" }))
            }
          >
            Try a sample file
          </button>
        </div>
        <p className="text-eten-faint text-[12.5px]">
          Required columns: full_name, email, primary_pod (pod code). Up to 2
          MB.
        </p>
        {fileError && <Notice tone="danger">{fileError}</Notice>}
        {rows && (
          <>
            <div className="flex flex-wrap gap-2 text-[13px]">
              <Pill tone="success">{creatable.length} will be created</Pill>
              <Pill tone="info">
                {rows.filter((r) => r.result === "exists").length} already exist
              </Pill>
              <Pill tone="danger">
                {rows.filter((r) => r.result === "error").length} errors
              </Pill>
            </div>
            <div className="border-eten-line rounded-xl border">
              <Table label="Import preview">
                <thead className="border-eten-line border-b">
                  <tr>
                    <th className={th}>Name</th>
                    <th className={th}>Email</th>
                    <th className={th}>Pod</th>
                    <th className={th}>Preview</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr
                      key={i}
                      className="border-eten-line-soft border-b last:border-0"
                    >
                      <td className={td}>{r.full_name}</td>
                      <td className={`${td} text-[13px]`}>{r.email}</td>
                      <td className={`${td} font-mono text-[12.5px]`}>
                        {r.primary_pod}
                      </td>
                      <td className={td}>
                        <Pill
                          tone={
                            r.result === "create"
                              ? "success"
                              : r.result === "exists"
                                ? "info"
                                : "danger"
                          }
                        >
                          {r.result === "create"
                            ? "Will be created"
                            : r.result === "exists"
                              ? "Already exists"
                              : "Error"}
                        </Pill>
                        {r.note && (
                          <span className="text-eten-faint mt-1 block text-[12px]">
                            {r.note}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
            <div className="flex justify-end gap-2">
              <Btn onClick={() => setRows(null)}>Discard</Btn>
              <Btn
                variant="primary"
                disabled={creatable.length === 0}
                onClick={() => {
                  t.importMembers(creatable);
                  toast(
                    `${creatable.length} member${creatable.length === 1 ? "" : "s"} invited.`,
                  );
                  setRows(null);
                }}
              >
                Import {creatable.length} member
                {creatable.length === 1 ? "" : "s"}
              </Btn>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}

// ------------------------------------------------------------------ pods & skills

function PodsTab() {
  const t = useSession();
  const { data } = t;
  const L = lookup(data);
  const toast = useToast();
  const [pod, setPod] = useState<Pod | null>(null);
  const [skill, setSkill] = useState<Skill | null>(null);
  const [newType, setNewType] = useState("");
  const leaders = data.members
    .filter((m) => m.roles.includes("member") && m.status === "active")
    .sort((a, b) => a.name.localeCompare(b.name));
  return (
    <div className="space-y-6">
      <Card
        title="Pods"
        description="Each pod needs a leader. The backup leader can nominate when the leader is away."
        action={
          <Btn
            size="sm"
            onClick={() =>
              setPod({
                id: "",
                code: "",
                name: "",
                description: "",
                leaderId: leaders[0]?.id ?? "",
                active: true,
              })
            }
          >
            <Plus className="size-4" /> Add pod
          </Btn>
        }
        bodyClassName=""
      >
        <Table label="Pods">
          <thead className="border-eten-line border-b">
            <tr>
              {["Code", "Name", "Leader", "Backup", "Status", ""].map((h) => (
                <th key={h} className={th}>
                  {h || <span className="sr-only">Actions</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.pods.map((p) => (
              <tr
                key={p.id}
                className="border-eten-line-soft border-b last:border-0"
              >
                <td className={`${td} font-mono text-[12.5px] font-bold`}>
                  {p.code}
                </td>
                <td className={td}>{p.name}</td>
                <td className={td}>{L.memberName(p.leaderId)}</td>
                <td className={td}>
                  {p.backupLeaderId ? (
                    L.memberName(p.backupLeaderId)
                  ) : (
                    <span className="text-eten-faint">Not set</span>
                  )}
                </td>
                <td className={td}>
                  <Pill tone={p.active ? "success" : "neutral"}>
                    {p.active ? "Active" : "Inactive"}
                  </Pill>
                </td>
                <td className={`${td} text-right`}>
                  <Btn size="sm" variant="ghost" onClick={() => setPod(p)}>
                    Edit
                  </Btn>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      <Card
        title="Skills"
        description="The approved skill list members choose from. Deactivating a skill hides it from new selections but keeps it on existing profiles."
        action={
          <Btn
            size="sm"
            onClick={() =>
              setSkill({
                id: "",
                name: "",
                category: "",
                podId: data.pods[0]?.id ?? "",
                active: true,
              })
            }
          >
            <Plus className="size-4" /> Add skill
          </Btn>
        }
        bodyClassName=""
      >
        <div className="max-h-[480px] overflow-y-auto">
          <Table label="Skills">
            <thead className="border-eten-line bg-eten-panel sticky top-0 border-b">
              <tr>
                {["Skill", "Category", "Usual pod", "Status", ""].map((h) => (
                  <th key={h} className={th}>
                    {h || <span className="sr-only">Actions</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.skills.map((s) => (
                <tr
                  key={s.id}
                  className="border-eten-line-soft border-b last:border-0"
                >
                  <td className={td}>{s.name}</td>
                  <td className={`${td} text-[13px]`}>{s.category}</td>
                  <td className={`${td} font-mono text-[12.5px]`}>
                    {L.pod(s.podId)?.code}
                  </td>
                  <td className={td}>
                    <Pill tone={s.active ? "success" : "neutral"}>
                      {s.active ? "Active" : "Inactive"}
                    </Pill>
                  </td>
                  <td className={`${td} text-right`}>
                    <Btn size="sm" variant="ghost" onClick={() => setSkill(s)}>
                      Edit
                    </Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </Card>

      <Card title="Meeting types">
        <ul className="flex flex-wrap gap-1.5">
          {data.meetingTypes.map((m) => (
            <li key={m.id}>
              <Pill tone="brand">{m.name}</Pill>
            </li>
          ))}
        </ul>
        <form
          className="mt-4 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (
              !newType.trim() ||
              data.meetingTypes.some(
                (m) => m.name.toLowerCase() === newType.trim().toLowerCase(),
              )
            )
              return;
            t.saveMeetingType(newType.trim());
            setNewType("");
            toast("Meeting type saved.");
          }}
        >
          <input
            aria-label="New meeting type"
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
            placeholder="New meeting type"
            className={cn(inputClass, "max-w-[320px]")}
          />
          <Btn type="submit">Add meeting type</Btn>
        </form>
      </Card>

      {pod && (
        <PodDialog value={pod} leaders={leaders} onClose={() => setPod(null)} />
      )}
      {skill && <SkillDialog value={skill} onClose={() => setSkill(null)} />}
    </div>
  );
}

function PodDialog({
  value,
  leaders,
  onClose,
}: {
  value: Pod;
  leaders: Member[];
  onClose: () => void;
}) {
  const t = useSession();
  const toast = useToast();
  const [p, setP] = useState(value);
  const valid = p.code.trim() && p.name.trim() && p.leaderId;
  return (
    <Dialog
      open
      onClose={onClose}
      title={value.id ? `Edit ${value.name}` : "Add pod"}
      footer={
        <>
          <Btn onClick={onClose}>Cancel</Btn>
          <Btn
            variant="primary"
            disabled={!valid}
            onClick={() => (
              t.savePod({ ...p, code: p.code.toUpperCase() }),
              toast("Pod saved."),
              onClose()
            )}
          >
            Save
          </Btn>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-[120px_1fr]">
        <Field label="Code" required>
          {(id) => (
            <input
              id={id}
              maxLength={4}
              value={p.code}
              onChange={(e) => setP({ ...p, code: e.target.value })}
              className={inputClass}
            />
          )}
        </Field>
        <Field label="Name" required>
          {(id) => (
            <input
              id={id}
              value={p.name}
              onChange={(e) => setP({ ...p, name: e.target.value })}
              className={inputClass}
            />
          )}
        </Field>
        <Field label="Description" className="sm:col-span-2">
          {(id) => (
            <input
              id={id}
              value={p.description}
              onChange={(e) => setP({ ...p, description: e.target.value })}
              className={inputClass}
            />
          )}
        </Field>
        {(["leaderId", "backupLeaderId"] as const).map((k) => (
          <Field
            key={k}
            label={k === "leaderId" ? "Pod Leader" : "Backup leader"}
            className="sm:col-span-2"
          >
            {(id) => (
              <select
                id={id}
                value={p[k] ?? ""}
                onChange={(e) =>
                  setP({ ...p, [k]: e.target.value || undefined })
                }
                className={inputClass}
              >
                {k === "backupLeaderId" && <option value="">Not set</option>}
                {leaders.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.code})
                  </option>
                ))}
              </select>
            )}
          </Field>
        ))}
        <div className="sm:col-span-2">
          <Toggle
            checked={p.active}
            onChange={(v) => setP({ ...p, active: v })}
          >
            Active
          </Toggle>
        </div>
      </div>
    </Dialog>
  );
}

function SkillDialog({
  value,
  onClose,
}: {
  value: Skill;
  onClose: () => void;
}) {
  const t = useSession();
  const toast = useToast();
  const [s, setS] = useState(value);
  const categories = Array.from(new Set(t.data.skills.map((x) => x.category)));
  const dup =
    !value.id &&
    t.data.skills.some(
      (x) => x.name.toLowerCase() === s.name.trim().toLowerCase(),
    );
  return (
    <Dialog
      open
      onClose={onClose}
      title={value.id ? `Edit ${value.name}` : "Add skill"}
      footer={
        <>
          <Btn onClick={onClose}>Cancel</Btn>
          <Btn
            variant="primary"
            disabled={!s.name.trim() || !s.category.trim() || dup}
            onClick={() => (
              t.saveSkill({
                ...s,
                name: s.name.trim(),
                category: s.category.trim(),
              }),
              toast("Skill saved."),
              onClose()
            )}
          >
            Save
          </Btn>
        </>
      }
    >
      <div className="space-y-4">
        <Field
          label="Skill"
          required
          error={dup ? "This skill already exists." : undefined}
        >
          {(id) => (
            <input
              id={id}
              value={s.name}
              onChange={(e) => setS({ ...s, name: e.target.value })}
              className={inputClass}
            />
          )}
        </Field>
        <Field
          label="Category"
          required
          hint="Choose an existing category or type a new one."
        >
          {(id) => (
            <>
              <input
                id={id}
                list="trk-skill-categories"
                value={s.category}
                onChange={(e) => setS({ ...s, category: e.target.value })}
                className={inputClass}
              />
              <datalist id="trk-skill-categories">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </>
          )}
        </Field>
        <Field
          label="Usual pod"
          hint="Used to suggest which pods a new request should go to."
        >
          {(id) => (
            <select
              id={id}
              value={s.podId}
              onChange={(e) => setS({ ...s, podId: e.target.value })}
              className={inputClass}
            >
              {t.data.pods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Toggle checked={s.active} onChange={(v) => setS({ ...s, active: v })}>
          Active
        </Toggle>
      </div>
    </Dialog>
  );
}

// ------------------------------------------------------------------ policies

function PoliciesTab() {
  const t = useSession();
  const toast = useToast();
  const [p, setP] = useState<Policies>(t.data.policies);
  const [hDate, setHDate] = useState("");
  const [hName, setHName] = useState("");
  const dirty = JSON.stringify(p) !== JSON.stringify(t.data.policies);
  const num = (k: keyof Policies, label: string) => (
    <Field label={label}>
      {(id) => (
        <input
          id={id}
          type="number"
          min={1}
          value={p[k] as number}
          onChange={(e) => setP({ ...p, [k]: Number(e.target.value) })}
          className={inputClass}
        />
      )}
    </Field>
  );
  return (
    <div className="max-w-[920px] space-y-6">
      <Card
        title="Deadlines and freshness"
        description="Nomination deadlines count working hours only, using the business hours and holidays below."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {num("standardHours", "Standard nomination target (working hours)")}
          {num("urgentHours", "Urgent nomination target (working hours)")}
          {num("responseHours", "Invitation response window (hours)")}
          {num("freshDays", "Availability counts as fresh for (days)")}
          <Field label="Weekly availability reminder day">
            {(id) => (
              <select
                id={id}
                value={p.reminderDay}
                onChange={(e) =>
                  setP({ ...p, reminderDay: Number(e.target.value) as Weekday })
                }
                className={inputClass}
              >
                {WEEKDAYS.map((d) => (
                  <option key={d.day} value={d.day}>
                    {d.label}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Default time zone">
            {(id) => (
              <select
                id={id}
                value={p.timezone}
                onChange={(e) => setP({ ...p, timezone: e.target.value })}
                className={inputClass}
              >
                {TIMEZONES.map((z) => (
                  <option key={z}>{z}</option>
                ))}
              </select>
            )}
          </Field>
          <div className="sm:col-span-2">
            <Toggle
              checked={p.allowDirectSelection}
              onChange={(v) => setP({ ...p, allowDirectSelection: v })}
            >
              <span className="font-semibold">
                Sales Managers may select members who were not nominated
              </span>
              <span className="text-eten-faint block text-[13px]">
                Each override needs a written reason and notifies the Pod
                Leader.
              </span>
            </Toggle>
          </div>
        </div>
      </Card>
      <Card title="Business hours and holidays">
        <div className="space-y-4">
          <div>
            <p className="mb-1.5 text-[13px] font-semibold">Working days</p>
            <div className="flex flex-wrap gap-1.5">
              {WEEKDAYS.map((d) => (
                <ChipToggle
                  key={d.day}
                  on={p.workingDays.includes(d.day)}
                  onClick={() =>
                    setP({
                      ...p,
                      workingDays: p.workingDays.includes(d.day)
                        ? p.workingDays.filter((x) => x !== d.day)
                        : [...p.workingDays, d.day].sort(),
                    })
                  }
                >
                  {d.short}
                </ChipToggle>
              ))}
            </div>
          </div>
          <div className="grid max-w-[360px] grid-cols-2 gap-3">
            <Field label="Opens">
              {(id) => (
                <input
                  id={id}
                  type="time"
                  value={p.opens}
                  onChange={(e) => setP({ ...p, opens: e.target.value })}
                  className={inputClass}
                />
              )}
            </Field>
            <Field label="Closes">
              {(id) => (
                <input
                  id={id}
                  type="time"
                  value={p.closes}
                  onChange={(e) => setP({ ...p, closes: e.target.value })}
                  className={inputClass}
                />
              )}
            </Field>
          </div>
          <div>
            <p className="mb-1.5 text-[13px] font-semibold">Public holidays</p>
            <ul className="space-y-1.5">
              {p.holidays.map((h) => (
                <li
                  key={h.date}
                  className="flex items-center gap-3 text-[14px]"
                >
                  <span className="font-mono text-[13px]">{h.date}</span> ·{" "}
                  {h.name}
                  <button
                    type="button"
                    className="text-trk-danger text-[12.5px] font-semibold"
                    onClick={() =>
                      setP({
                        ...p,
                        holidays: p.holidays.filter((x) => x.date !== h.date),
                      })
                    }
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex flex-wrap gap-2">
              <input
                aria-label="Holiday date"
                type="date"
                value={hDate}
                onChange={(e) => setHDate(e.target.value)}
                className={cn(inputClass, "w-auto")}
              />
              <input
                aria-label="Holiday name"
                value={hName}
                onChange={(e) => setHName(e.target.value)}
                placeholder="Name"
                className={cn(inputClass, "w-auto")}
              />
              <Btn
                disabled={!hDate || !hName.trim()}
                onClick={() => {
                  setP({
                    ...p,
                    holidays: [
                      ...p.holidays,
                      { date: hDate, name: hName.trim() },
                    ].sort((a, b) => a.date.localeCompare(b.date)),
                  });
                  setHDate("");
                  setHName("");
                }}
              >
                Add holiday
              </Btn>
            </div>
          </div>
        </div>
      </Card>
      <Card
        title="Integrations"
        description="Credentials are configured on the server and are never shown here."
      >
        <div className="space-y-3">
          <Toggle
            checked={p.outlookEnabled}
            onChange={(v) => setP({ ...p, outlookEnabled: v })}
          >
            <span className="font-semibold">
              Allow members to connect Microsoft Outlook
            </span>
            <span className="text-eten-faint block text-[13px]">
              Server credentials are not configured. Members get the demo
              adapter until they are.
            </span>
          </Toggle>
          <Toggle
            checked={p.googleEnabled}
            onChange={(v) => setP({ ...p, googleEnabled: v })}
          >
            <span className="font-semibold">
              Allow members to connect Google Calendar
            </span>
            <span className="text-eten-faint block text-[13px]">
              Server credentials are not configured. Members get the demo
              adapter until they are.
            </span>
          </Toggle>
          <p className="text-eten-faint text-[13px]">
            Email delivery: not configured in the demo. Notifications are in-app
            only.
          </p>
        </div>
      </Card>
      <div className="flex justify-end gap-2">
        <Btn disabled={!dirty} onClick={() => setP(t.data.policies)}>
          Discard changes
        </Btn>
        <Btn
          variant="primary"
          disabled={!dirty}
          onClick={() => (t.savePolicies(p), toast("Policies saved."))}
        >
          Save policies
        </Btn>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ health & audit

function HealthTab() {
  const t = useSession();
  const { data } = t;
  const toast = useToast();
  const calIssues = data.members.filter(
    (m) =>
      m.status === "active" &&
      ["expired", "revoked", "error"].includes(m.calendar),
  );
  return (
    <div className="space-y-6">
      <Card
        title="Background jobs"
        description="Calendar sync, email and reminder jobs. Failures never corrupt presales records and can be retried safely."
        bodyClassName=""
      >
        <Table label="Background jobs">
          <thead className="border-eten-line border-b">
            <tr>
              {["Job", "Status", "Last run", "Attempts", ""].map((h) => (
                <th key={h} className={th}>
                  {h || <span className="sr-only">Actions</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.jobs.map((j) => (
              <tr
                key={j.id}
                className="border-eten-line-soft border-b last:border-0"
              >
                <td className={td}>
                  {j.label}
                  {j.error && (
                    <span className="text-trk-danger block text-[12.5px]">
                      {j.error}
                    </span>
                  )}
                </td>
                <td className={td}>
                  <Pill tone={j.status === "failed" ? "danger" : "success"}>
                    {j.status === "failed" ? "Failed" : "Succeeded"}
                  </Pill>
                </td>
                <td className={`${td} text-[13px]`}>{fmtAgo(j.at)}</td>
                <td className={td}>{j.attempts}</td>
                <td className={`${td} text-right`}>
                  {j.status === "failed" && (
                    <Btn
                      size="sm"
                      onClick={() => {
                        t.retryJob(j.id);
                        toast(
                          /expired/i.test(j.error ?? "")
                            ? "Retry failed again: the member must reconnect their calendar."
                            : "Retried successfully.",
                        );
                      }}
                    >
                      Retry
                    </Btn>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
      <Card
        title={`Calendar connection issues (${calIssues.length})`}
        description="Members whose calendar authorisation has expired, been revoked or errored. Their conflicts cannot be verified."
        bodyClassName=""
      >
        {calIssues.length === 0 ? (
          <EmptyState title="No calendar issues" />
        ) : (
          <ul className="max-h-[360px] overflow-y-auto">
            {calIssues.map((m) => (
              <li
                key={m.id}
                className="border-eten-line-soft flex items-center justify-between gap-3 border-b px-5 py-2.5 last:border-0"
              >
                <span>
                  <span className="font-semibold">{m.name}</span>{" "}
                  <span className="text-eten-faint text-[12.5px]">
                    {m.code}
                  </span>
                </span>
                <Pill tone={CALENDAR_STATUS[m.calendar].tone}>
                  {CALENDAR_STATUS[m.calendar].label}
                </Pill>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function AuditTab() {
  const { data } = useSession();
  const L = lookup(data);
  return (
    <Card
      title="Audit log"
      description="Profile, permission, nomination, selection and scheduling changes. Entries cannot be edited."
      bodyClassName=""
    >
      <Table label="Audit log">
        <thead className="border-eten-line border-b">
          <tr>
            {["When", "Who", "Action", "Target", "Reason"].map((h) => (
              <th key={h} className={th}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.audit.map((e) => (
            <tr
              key={e.id}
              className="border-eten-line-soft border-b last:border-0"
            >
              <td className={`${td} text-[13px] whitespace-nowrap`}>
                {fmtDateTime(e.at)}
              </td>
              <td className={td}>{L.memberName(e.actorId)}</td>
              <td className={td}>{e.action}</td>
              <td className={`${td} text-[13px]`}>{e.target}</td>
              <td className={`${td} text-eten-ink-muted text-[13px]`}>
                {e.reason ?? ""}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Card>
  );
}
