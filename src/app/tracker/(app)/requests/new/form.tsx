"use client";

/**
 * New / edit presales request (PRD FR-014, FR-015): client and opportunity,
 * expertise needed, date/time/format, logistics, pod routing and deadlines.
 * "Save draft" keeps it private to the owner; "Submit for nominations"
 * notifies the Pod Leaders of every routed pod.
 */
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { useSession, type RequestInput } from "@/lib/tracker/store";
import { has } from "@/lib/tracker/selectors";
import {
  ACCESS_LABEL,
  FORMAT_LABEL,
  SENIORITY_LABEL,
} from "@/lib/tracker/labels";
import { addWorkingHours } from "@/lib/tracker/policy";
import {
  DEFAULT_TZ,
  TIMEZONES,
  addDaysToDate,
  fmtDateTime,
  toMinutes,
  zonedDate,
  zonedTime,
  zonedToUtc,
} from "@/lib/tracker/time";
import type {
  AccessLevel,
  MeetingFormat,
  Seniority,
  Urgency,
} from "@/lib/tracker/types";
import {
  Btn,
  Card,
  ChipToggle,
  Field,
  Notice,
  PageHeader,
  Toggle,
  inputClass,
  useToast,
} from "@/components/tracker/ui";
import { BASE } from "@/components/tracker/shell";
import { requestHref } from "@/components/tracker/bits";

type FormState = {
  title: string;
  client: string;
  opportunityRef: string;
  objective: string;
  meetingTypeId: string;
  access: AccessLevel;
  skillIds: string[];
  seniority: Seniority;
  needed: number;
  date: string;
  start: string;
  end: string;
  timezone: string;
  format: MeetingFormat;
  platform: string;
  joinLink: string;
  location: string;
  techPrep: string;
  prepNotes: string;
  podIds: string[];
  urgency: Urgency;
  responseHours: number;
  customDeadline: boolean;
  deadline: string;
};

export function RequestForm({ editId }: { editId?: string }) {
  const t = useSession();
  const { data, me } = t;
  const router = useRouter();
  const toast = useToast();
  const existing = editId
    ? data.requests.find((r) => r.id === editId)
    : undefined;
  const canCreate = has(me, "sales_manager") || has(me, "admin");

  const [f, setF] = useState<FormState>(() => {
    if (existing) {
      return {
        ...existing,
        date: zonedDate(existing.startUtc, existing.timezone),
        start: zonedTime(existing.startUtc, existing.timezone),
        end: zonedTime(existing.endUtc, existing.timezone),
        podIds: existing.routing.map((r) => r.podId),
        customDeadline: false,
        deadline: "",
      };
    }
    return {
      title: "",
      client: "",
      opportunityRef: "",
      objective: "",
      meetingTypeId: "",
      access: "standard",
      skillIds: [],
      seniority: "senior",
      needed: 1,
      date: addDaysToDate(zonedDate(Date.now(), DEFAULT_TZ), 5),
      start: "10:00",
      end: "11:00",
      timezone: DEFAULT_TZ,
      format: "online",
      platform: "Microsoft Teams",
      joinLink: "",
      location: "",
      techPrep: "",
      prepNotes: "",
      podIds: [],
      urgency: "standard",
      responseHours: data.policies.responseHours,
      customDeadline: false,
      deadline: "",
    };
  });
  const [podsTouched, setPodsTouched] = useState(Boolean(existing));
  const [skillFilter, setSkillFilter] = useState("");
  const [showErrors, setShowErrors] = useState(false);
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setF((x) => ({ ...x, [k]: v }));

  const defaultDeadline = useMemo(
    () =>
      addWorkingHours(
        t.now,
        f.urgency === "urgent"
          ? data.policies.urgentHours
          : data.policies.standardHours,
        data.policies,
      ),
    [t.now, f.urgency, data.policies],
  );

  const errors = useMemo(() => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!f.title.trim()) e.title = "Enter a meeting title.";
    if (!f.client.trim()) e.client = "Enter the client or organisation.";
    if (!f.objective.trim())
      e.objective = "Describe what the engineers should help achieve.";
    if (!f.meetingTypeId) e.meetingTypeId = "Choose a meeting type.";
    if (f.skillIds.length === 0) e.skillIds = "Choose at least one skill.";
    if (!f.needed || f.needed < 1)
      e.needed = "At least one participant is needed.";
    if (!f.date) e.date = "Choose a date.";
    if (!f.start || !f.end)
      e.start = "Meeting start and end must be valid times.";
    else if (toMinutes(f.end) <= toMinutes(f.start))
      e.end = "Meeting end must be after the start.";
    else if (toMinutes(f.end) - toMinutes(f.start) > 12 * 60)
      e.end = "Meetings longer than 12 hours are not supported.";
    if (f.format !== "online" && !f.location.trim())
      e.location = "Enter the meeting location.";
    if (f.format !== "physical" && !f.platform.trim())
      e.platform = "Enter the online platform.";
    if (f.podIds.length === 0)
      e.podIds = "Route the request to at least one pod.";
    if (f.customDeadline && !f.deadline)
      e.deadline = "Choose the nomination deadline.";
    return e;
  }, [f]);

  if (!canCreate) {
    return (
      <Notice
        tone="warning"
        title="Only Sales Managers can create presales requests."
      />
    );
  }
  if (editId && !existing)
    return <Notice tone="warning" title="That request could not be found." />;

  const toggleSkill = (id: string) => {
    setF((x) => {
      const skillIds = x.skillIds.includes(id)
        ? x.skillIds.filter((s) => s !== id)
        : [...x.skillIds, id];
      if (podsTouched) return { ...x, skillIds };
      const podIds = Array.from(
        new Set(
          skillIds.map((s) => data.skills.find((k) => k.id === s)!.podId),
        ),
      );
      return { ...x, skillIds, podIds };
    });
  };

  const submit = (send: boolean) => {
    const required = send
      ? errors
      : { title: errors.title, client: errors.client };
    if (Object.values(required).some(Boolean)) {
      setShowErrors(true);
      toast("Check the highlighted fields.");
      return;
    }
    const startUtc = zonedToUtc(f.date, f.start, f.timezone).toISOString();
    const endUtc = zonedToUtc(f.date, f.end, f.timezone).toISOString();
    const deadline =
      f.customDeadline && f.deadline
        ? zonedToUtc(
            f.deadline.slice(0, 10),
            f.deadline.slice(11, 16),
            DEFAULT_TZ,
          ).toISOString()
        : defaultDeadline.toISOString();
    const input: RequestInput = {
      title: f.title.trim(),
      client: f.client.trim(),
      opportunityRef: f.opportunityRef.trim(),
      objective: f.objective.trim(),
      meetingTypeId: f.meetingTypeId,
      access: f.access,
      skillIds: f.skillIds,
      seniority: f.seniority,
      needed: Number(f.needed),
      startUtc,
      endUtc,
      timezone: f.timezone,
      format: f.format,
      platform: f.format === "physical" ? "" : f.platform,
      joinLink: f.format === "physical" ? "" : f.joinLink,
      location: f.format === "online" ? "" : f.location,
      techPrep: f.techPrep,
      prepNotes: f.prepNotes,
      urgency: f.urgency,
      responseHours: Number(f.responseHours) || data.policies.responseHours,
      podIds: f.podIds,
      deadline,
    };
    const id = t.saveRequest(input, send, existing?.id);
    toast(
      send
        ? "Submitted. Pod Leaders have been notified."
        : existing
          ? "Changes saved."
          : "Draft saved.",
    );
    router.push(requestHref(id));
  };

  const err = (k: keyof FormState) => (showErrors ? errors[k] : undefined);
  const skillsShown = data.skills.filter(
    (s) =>
      s.active &&
      (!skillFilter ||
        s.name.toLowerCase().includes(skillFilter.toLowerCase())),
  );
  const categories = Array.from(new Set(skillsShown.map((s) => s.category)));
  const draftOrNew = !existing || existing.status === "draft";

  return (
    <>
      <PageHeader
        crumb={{
          href: existing ? requestHref(existing.id) : `${BASE}/requests`,
          label: existing ? existing.ref : "Presales Requests",
        }}
        title={existing ? `Edit ${existing.title}` : "New presales request"}
        description="Describe the meeting and the expertise you need. Pod Leaders nominate engineers; you make the final selection."
      />
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          submit(draftOrNew);
        }}
        className="max-w-[920px] space-y-6"
      >
        <Card title="Client and opportunity">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Meeting title" required error={err("title")}>
              {(id) => (
                <input
                  id={id}
                  value={f.title}
                  onChange={(e) => set("title", e.target.value)}
                  className={inputClass}
                />
              )}
            </Field>
            <Field
              label="Client or organisation"
              required
              error={err("client")}
            >
              {(id) => (
                <input
                  id={id}
                  value={f.client}
                  onChange={(e) => set("client", e.target.value)}
                  className={inputClass}
                />
              )}
            </Field>
            <Field
              label="Opportunity reference"
              hint="Optional. Enter the CRM reference manually if there is one."
            >
              {(id) => (
                <input
                  id={id}
                  value={f.opportunityRef}
                  onChange={(e) => set("opportunityRef", e.target.value)}
                  className={inputClass}
                />
              )}
            </Field>
            <Field label="Meeting type" required error={err("meetingTypeId")}>
              {(id) => (
                <select
                  id={id}
                  value={f.meetingTypeId}
                  onChange={(e) => set("meetingTypeId", e.target.value)}
                  className={inputClass}
                >
                  <option value="">Choose a meeting type</option>
                  {data.meetingTypes
                    .filter((m) => m.active)
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                </select>
              )}
            </Field>
            <Field
              label="Meeting objective"
              required
              className="sm:col-span-2"
              error={err("objective")}
              hint="What should the engineers help achieve? Pod Leaders use this to choose the right people."
            >
              {(id) => (
                <textarea
                  id={id}
                  rows={3}
                  value={f.objective}
                  onChange={(e) => set("objective", e.target.value)}
                  className={cn(inputClass, "h-auto py-2")}
                />
              )}
            </Field>
            <Field
              label="Access classification"
              className="sm:col-span-2"
              hint="Confidential hides the client from Pod Leaders until engineers are selected. Restricted limits client details to Sales."
            >
              {(id) => (
                <select
                  id={id}
                  value={f.access}
                  onChange={(e) => set("access", e.target.value as AccessLevel)}
                  className={cn(inputClass, "sm:max-w-[280px]")}
                >
                  {(Object.keys(ACCESS_LABEL) as AccessLevel[]).map((a) => (
                    <option key={a} value={a}>
                      {ACCESS_LABEL[a]}
                    </option>
                  ))}
                </select>
              )}
            </Field>
          </div>
        </Card>

        <Card title="Expertise needed">
          <div className="space-y-4">
            <div>
              <p className="mb-1.5 text-[13px] font-semibold">
                Required technical skills{" "}
                <span className="text-trk-danger">*</span>
                <span className="text-eten-faint ml-2 font-normal">
                  {f.skillIds.length} chosen
                </span>
              </p>
              <input
                aria-label="Filter skills"
                value={skillFilter}
                onChange={(e) => setSkillFilter(e.target.value)}
                placeholder="Filter skills"
                className={cn(inputClass, "mb-2 sm:max-w-[320px]")}
              />
              <div className="border-eten-line max-h-[260px] space-y-3 overflow-y-auto rounded-xl border p-3">
                {categories.map((c) => (
                  <div key={c}>
                    <p className="text-eten-faint mb-1.5 text-[11.5px] font-bold tracking-[0.08em] uppercase">
                      {c}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {skillsShown
                        .filter((s) => s.category === c)
                        .map((s) => (
                          <ChipToggle
                            key={s.id}
                            on={f.skillIds.includes(s.id)}
                            onClick={() => toggleSkill(s.id)}
                          >
                            {s.name}
                          </ChipToggle>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
              {err("skillIds") && (
                <p className="text-trk-danger mt-1 text-[12.5px]">
                  {err("skillIds")}
                </p>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Seniority">
                {(id) => (
                  <select
                    id={id}
                    value={f.seniority}
                    onChange={(e) =>
                      set("seniority", e.target.value as Seniority)
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
              <Field label="Participants needed" required error={err("needed")}>
                {(id) => (
                  <input
                    id={id}
                    type="number"
                    min={1}
                    max={10}
                    value={f.needed}
                    onChange={(e) => set("needed", Number(e.target.value))}
                    className={inputClass}
                  />
                )}
              </Field>
            </div>
          </div>
        </Card>

        <Card title="Date, time and format">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Date" required error={err("date")}>
              {(id) => (
                <input
                  id={id}
                  type="date"
                  value={f.date}
                  onChange={(e) => set("date", e.target.value)}
                  className={inputClass}
                />
              )}
            </Field>
            <Field label="Start" required error={err("start")}>
              {(id) => (
                <input
                  id={id}
                  type="time"
                  value={f.start}
                  onChange={(e) => set("start", e.target.value)}
                  className={inputClass}
                />
              )}
            </Field>
            <Field label="End" required error={err("end")}>
              {(id) => (
                <input
                  id={id}
                  type="time"
                  value={f.end}
                  onChange={(e) => set("end", e.target.value)}
                  className={inputClass}
                />
              )}
            </Field>
            <Field label="Time zone" required>
              {(id) => (
                <select
                  id={id}
                  value={f.timezone}
                  onChange={(e) => set("timezone", e.target.value)}
                  className={inputClass}
                >
                  {TIMEZONES.map((z) => (
                    <option key={z}>{z}</option>
                  ))}
                </select>
              )}
            </Field>
          </div>
          <div className="mt-4">
            <p className="mb-1.5 text-[13px] font-semibold">Meeting format</p>
            <div
              className="flex flex-wrap gap-1.5"
              role="radiogroup"
              aria-label="Meeting format"
            >
              {(["online", "physical", "hybrid"] as MeetingFormat[]).map(
                (x) => (
                  <ChipToggle
                    key={x}
                    on={f.format === x}
                    onClick={() => set("format", x)}
                  >
                    {FORMAT_LABEL[x]}
                  </ChipToggle>
                ),
              )}
            </div>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {f.format !== "physical" && (
              <>
                <Field label="Online platform" required error={err("platform")}>
                  {(id) => (
                    <select
                      id={id}
                      value={f.platform}
                      onChange={(e) => set("platform", e.target.value)}
                      className={inputClass}
                    >
                      {["Microsoft Teams", "Google Meet", "Zoom", "Other"].map(
                        (p) => (
                          <option key={p}>{p}</option>
                        ),
                      )}
                    </select>
                  )}
                </Field>
                <Field
                  label="Joining link"
                  hint="Shared only with selected participants."
                >
                  {(id) => (
                    <input
                      id={id}
                      type="url"
                      value={f.joinLink}
                      onChange={(e) => set("joinLink", e.target.value)}
                      placeholder="https://"
                      className={inputClass}
                    />
                  )}
                </Field>
              </>
            )}
            {f.format !== "online" && (
              <Field
                label="Location"
                required
                className="sm:col-span-2"
                error={err("location")}
                hint="Include the city last, for example: Client HQ, Victoria Island, Lagos"
              >
                {(id) => (
                  <input
                    id={id}
                    value={f.location}
                    onChange={(e) => set("location", e.target.value)}
                    className={inputClass}
                  />
                )}
              </Field>
            )}
            <Field label="Technical preparation">
              {(id) => (
                <textarea
                  id={id}
                  rows={2}
                  value={f.techPrep}
                  onChange={(e) => set("techPrep", e.target.value)}
                  className={cn(inputClass, "h-auto py-2")}
                />
              )}
            </Field>
            <Field label="Preparation instructions for participants">
              {(id) => (
                <textarea
                  id={id}
                  rows={2}
                  value={f.prepNotes}
                  onChange={(e) => set("prepNotes", e.target.value)}
                  className={cn(inputClass, "h-auto py-2")}
                />
              )}
            </Field>
          </div>
        </Card>

        <Card
          title="Routing and deadlines"
          description="Pod Leaders of the selected pods are notified when you submit."
        >
          <div className="space-y-4">
            <div>
              <p className="mb-1.5 text-[13px] font-semibold">
                Route to pods <span className="text-trk-danger">*</span>
                {!podsTouched && f.podIds.length > 0 && (
                  <span className="text-eten-faint ml-2 font-normal">
                    Suggested from the chosen skills
                  </span>
                )}
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {data.pods
                  .filter((p) => p.active)
                  .map((p) => (
                    <Toggle
                      key={p.id}
                      checked={f.podIds.includes(p.id)}
                      onChange={(v) => {
                        setPodsTouched(true);
                        set(
                          "podIds",
                          v
                            ? [...f.podIds, p.id]
                            : f.podIds.filter((x) => x !== p.id),
                        );
                      }}
                    >
                      {p.name}
                    </Toggle>
                  ))}
              </div>
              {err("podIds") && (
                <p className="text-trk-danger mt-1 text-[12.5px]">
                  {err("podIds")}
                </p>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Urgency">
                {(id) => (
                  <select
                    id={id}
                    value={f.urgency}
                    onChange={(e) => set("urgency", e.target.value as Urgency)}
                    className={inputClass}
                  >
                    <option value="standard">
                      Standard ({data.policies.standardHours} working h)
                    </option>
                    <option value="urgent">
                      Urgent ({data.policies.urgentHours} working h)
                    </option>
                  </select>
                )}
              </Field>
              <Field label="Invitation response time (hours)">
                {(id) => (
                  <input
                    id={id}
                    type="number"
                    min={1}
                    max={168}
                    value={f.responseHours}
                    onChange={(e) =>
                      set("responseHours", Number(e.target.value))
                    }
                    className={inputClass}
                  />
                )}
              </Field>
            </div>
            <Toggle
              checked={f.customDeadline}
              onChange={(v) => set("customDeadline", v)}
            >
              Set a custom nomination deadline
            </Toggle>
            {f.customDeadline ? (
              <Field label="Nomination deadline (WAT)" error={err("deadline")}>
                {(id) => (
                  <input
                    id={id}
                    type="datetime-local"
                    value={f.deadline}
                    onChange={(e) => set("deadline", e.target.value)}
                    className={cn(inputClass, "sm:max-w-[280px]")}
                  />
                )}
              </Field>
            ) : (
              <p className="text-eten-faint text-[13px]">
                Default from the service level:{" "}
                {fmtDateTime(defaultDeadline.toISOString())} (calculated in
                working hours).
              </p>
            )}
          </div>
        </Card>

        <div className="flex flex-wrap justify-end gap-2">
          <Btn
            href={existing ? requestHref(existing.id) : `${BASE}/requests`}
            variant="ghost"
          >
            Cancel
          </Btn>
          {draftOrNew && <Btn onClick={() => submit(false)}>Save draft</Btn>}
          <Btn type="submit" variant="primary">
            {draftOrNew ? "Submit for nominations" : "Save changes"}
          </Btn>
        </div>
      </form>
    </>
  );
}
