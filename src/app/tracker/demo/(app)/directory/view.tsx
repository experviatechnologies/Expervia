"use client";

/**
 * ETEN Directory (PRD FR-006..FR-008): search engineers by name, skill, pod,
 * format, location and experience; Sales and Pod Leaders can also check who is
 * free for a specific meeting window using the availability rules.
 */
import { useMemo, useState } from "react";
import { CalendarSearch, ChevronLeft, ChevronRight } from "lucide-react";
import { useSession } from "@/lib/tracker/store";
import { engineers, has, isSales, lookup } from "@/lib/tracker/selectors";
import {
  evaluateMember,
  effectiveWindows,
  isFresh,
  weeklyMinutes,
  type Evaluation,
} from "@/lib/tracker/availability";
import {
  CALENDAR_STATUS,
  FORMAT_LABEL,
  LEVEL_LABEL,
  SENIORITY_LABEL,
} from "@/lib/tracker/labels";
import {
  DEFAULT_TZ,
  WEEKDAYS,
  fmtAgo,
  fromMinutes,
  zonedDate,
  zonedToUtc,
  addDaysToDate,
} from "@/lib/tracker/time";
import type { MeetingFormat, Member } from "@/lib/tracker/types";
import {
  Avatar,
  Btn,
  Card,
  DefList,
  Dialog,
  EmptyState,
  Field,
  PageHeader,
  Pill,
  Table,
  Toggle,
  inputClass,
  td,
  th,
} from "@/components/tracker/ui";
import { AvailabilityVerdict } from "@/components/tracker/bits";

const PAGE = 25;

export function DirectoryView({
  initialQuery,
  initialPod,
  initialRecord,
}: {
  initialQuery: string;
  initialPod: string;
  initialRecord: string;
}) {
  const { data, me } = useSession();
  const L = lookup(data);
  const privileged =
    isSales(me) || has(me, "pod_leader") || has(me, "management");

  const [q, setQ] = useState(initialQuery);
  const [pod, setPod] = useState(initialPod);
  const [skill, setSkill] = useState("");
  const [format, setFormat] = useState<"" | MeetingFormat>("");
  const [location, setLocation] = useState("");
  const [minYears, setMinYears] = useState(0);
  const [record, setRecord] = useState(initialRecord);
  const [sort, setSort] = useState<"name" | "pod" | "experience" | "reviewed">(
    "name",
  );
  const [page, setPage] = useState(0);
  const [profile, setProfile] = useState<Member | null>(null);

  const [windowOpen, setWindowOpen] = useState(false);
  const [wDate, setWDate] = useState(() =>
    addDaysToDate(zonedDate(Date.now(), DEFAULT_TZ), 1),
  );
  const [wStart, setWStart] = useState("10:00");
  const [wEnd, setWEnd] = useState("11:00");
  const [wFormat, setWFormat] = useState<MeetingFormat>("online");
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const windowValid = windowOpen && wDate && wStart < wEnd;

  const evals = useMemo(() => {
    if (!windowValid) return null;
    const startUtc = zonedToUtc(wDate, wStart, DEFAULT_TZ).toISOString();
    const endUtc = zonedToUtc(wDate, wEnd, DEFAULT_TZ).toISOString();
    const map = new Map<string, Evaluation>();
    for (const m of engineers(data))
      map.set(
        m.id,
        evaluateMember(
          m,
          { startUtc, endUtc, format: wFormat, location },
          data,
        ),
      );
    return map;
  }, [windowValid, wDate, wStart, wEnd, wFormat, location, data]);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let list = engineers(data).filter((m) => {
      if (pod && m.podId !== pod && !m.extraPodIds.includes(pod)) return false;
      if (skill && !m.skills.some((s) => s.skillId === skill)) return false;
      if (format && !m.formats.includes(format)) return false;
      if (
        location &&
        !m.cities.some((c) =>
          c.toLowerCase().includes(location.toLowerCase()),
        ) &&
        !m.willingToTravel
      )
        return false;
      if (m.years < minYears) return false;
      if (record === "fresh" && !isFresh(m, data.policies)) return false;
      if (record === "stale" && isFresh(m, data.policies)) return false;
      if (needle) {
        const hay = [
          m.name,
          m.code,
          ...m.skills.map((s) => L.skillName(s.skillId)),
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      if (evals && onlyAvailable && evals.get(m.id)?.state !== "available")
        return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      if (sort === "pod")
        return (
          (L.pod(a.podId)?.name ?? "").localeCompare(
            L.pod(b.podId)?.name ?? "",
          ) || a.name.localeCompare(b.name)
        );
      if (sort === "experience") return b.years - a.years;
      if (sort === "reviewed")
        return (b.reviewedAt ?? "").localeCompare(a.reviewedAt ?? "");
      return a.name.localeCompare(b.name);
    });
    if (evals) {
      const rank = {
        available: 0,
        partial: 1,
        conflict: 2,
        unavailable: 3,
        inactive: 4,
      };
      list.sort(
        (a, b) => rank[evals.get(a.id)!.state] - rank[evals.get(b.id)!.state],
      );
    }
    return list;
  }, [
    data,
    q,
    pod,
    skill,
    format,
    location,
    minYears,
    record,
    sort,
    evals,
    onlyAvailable,
    L,
  ]);

  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const current = Math.min(page, pages - 1);
  const shown = rows.slice(current * PAGE, current * PAGE + PAGE);
  const reset = () => {
    setQ("");
    setPod("");
    setSkill("");
    setFormat("");
    setLocation("");
    setMinYears(0);
    setRecord("");
    setOnlyAvailable(false);
    setPage(0);
  };
  const set =
    <T,>(fn: (v: T) => void) =>
    (v: T) => {
      fn(v);
      setPage(0);
    };

  return (
    <>
      <PageHeader
        title="ETEN Directory"
        description={
          privileged
            ? "Search engineers by skill, pod, location and meeting format, and check who is free for a specific meeting window."
            : "Find fellow ETEN engineers by name, pod and skill. Contact and availability details are visible to Pod Leaders and the Sales Manager."
        }
      />

      <Card className="mb-5">
        <form
          onSubmit={(e) => e.preventDefault()}
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          <Field label="Name, member ID or skill" className="sm:col-span-2">
            {(id) => (
              <input
                id={id}
                type="search"
                value={q}
                onChange={(e) => set(setQ)(e.target.value)}
                className={inputClass}
                placeholder="e.g. Azure Migration"
              />
            )}
          </Field>
          <Field label="Pod">
            {(id) => (
              <select
                id={id}
                value={pod}
                onChange={(e) => set(setPod)(e.target.value)}
                className={inputClass}
              >
                <option value="">All pods</option>
                {data.pods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Skill">
            {(id) => (
              <select
                id={id}
                value={skill}
                onChange={(e) => set(setSkill)(e.target.value)}
                className={inputClass}
              >
                <option value="">Any skill</option>
                {data.skills
                  .filter((s) => s.active)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
              </select>
            )}
          </Field>
          <Field label="Meeting format">
            {(id) => (
              <select
                id={id}
                value={format}
                onChange={(e) =>
                  set(setFormat)(e.target.value as MeetingFormat | "")
                }
                className={inputClass}
              >
                <option value="">Any format</option>
                {(["online", "physical", "hybrid"] as MeetingFormat[]).map(
                  (f) => (
                    <option key={f} value={f}>
                      {FORMAT_LABEL[f]}
                    </option>
                  ),
                )}
              </select>
            )}
          </Field>
          {privileged && (
            <Field label="Location">
              {(id) => (
                <input
                  id={id}
                  value={location}
                  onChange={(e) => set(setLocation)(e.target.value)}
                  className={inputClass}
                  placeholder="City"
                />
              )}
            </Field>
          )}
          <Field label="Minimum experience">
            {(id) => (
              <select
                id={id}
                value={minYears}
                onChange={(e) => set(setMinYears)(Number(e.target.value))}
                className={inputClass}
              >
                <option value={0}>Any</option>
                {[3, 5, 8, 12].map((y) => (
                  <option key={y} value={y}>
                    {y}+ years
                  </option>
                ))}
              </select>
            )}
          </Field>
          {privileged && (
            <Field label="Availability record">
              {(id) => (
                <select
                  id={id}
                  value={record}
                  onChange={(e) => set(setRecord)(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Any</option>
                  <option value="fresh">Recently reviewed</option>
                  <option value="stale">Stale</option>
                </select>
              )}
            </Field>
          )}
          <Field label="Sort by">
            {(id) => (
              <select
                id={id}
                value={sort}
                onChange={(e) => setSort(e.target.value as typeof sort)}
                className={inputClass}
              >
                <option value="name">Name</option>
                <option value="pod">Pod</option>
                <option value="experience">Experience</option>
                {privileged && <option value="reviewed">Last reviewed</option>}
              </select>
            )}
          </Field>
          <div className="flex flex-wrap items-end gap-2 sm:col-span-2 lg:col-span-4">
            {privileged && (
              <Btn
                variant={windowOpen ? "subtle" : "secondary"}
                onClick={() => setWindowOpen((v) => !v)}
              >
                <CalendarSearch className="size-4" />{" "}
                {windowOpen
                  ? "Hide meeting window"
                  : "Check availability for a meeting window"}
              </Btn>
            )}
            <Btn variant="ghost" onClick={reset}>
              Clear filters
            </Btn>
          </div>
          {windowOpen && (
            <div className="border-eten-line bg-eten-canvas grid gap-3 rounded-xl border p-3 sm:col-span-2 sm:grid-cols-2 lg:col-span-4 lg:grid-cols-5">
              <Field label="Date">
                {(id) => (
                  <input
                    id={id}
                    type="date"
                    value={wDate}
                    onChange={(e) => setWDate(e.target.value)}
                    className={inputClass}
                  />
                )}
              </Field>
              <Field label="Start (WAT)">
                {(id) => (
                  <input
                    id={id}
                    type="time"
                    value={wStart}
                    onChange={(e) => setWStart(e.target.value)}
                    className={inputClass}
                  />
                )}
              </Field>
              <Field
                label="End (WAT)"
                error={
                  wStart >= wEnd
                    ? "Meeting end must be after the start."
                    : undefined
                }
              >
                {(id) => (
                  <input
                    id={id}
                    type="time"
                    value={wEnd}
                    onChange={(e) => setWEnd(e.target.value)}
                    className={inputClass}
                  />
                )}
              </Field>
              <Field label="Format">
                {(id) => (
                  <select
                    id={id}
                    value={wFormat}
                    onChange={(e) =>
                      setWFormat(e.target.value as MeetingFormat)
                    }
                    className={inputClass}
                  >
                    {(["online", "physical", "hybrid"] as MeetingFormat[]).map(
                      (f) => (
                        <option key={f} value={f}>
                          {FORMAT_LABEL[f]}
                        </option>
                      ),
                    )}
                  </select>
                )}
              </Field>
              <div className="flex items-end pb-2">
                <Toggle
                  checked={onlyAvailable}
                  onChange={(v) => set(setOnlyAvailable)(v)}
                >
                  Only fully available
                </Toggle>
              </div>
            </div>
          )}
        </form>
      </Card>

      <Card
        title={`${rows.length} engineer${rows.length === 1 ? "" : "s"}`}
        description={
          evals
            ? "Sorted by availability for the chosen meeting window. Unverified calendars are never shown as free."
            : undefined
        }
        bodyClassName=""
      >
        {shown.length === 0 ? (
          <EmptyState
            title="No engineers match these filters"
            action={<Btn onClick={reset}>Clear filters</Btn>}
          />
        ) : (
          <Table label="ETEN engineers">
            <thead className="border-eten-line border-b">
              <tr>
                <th className={th}>Engineer</th>
                <th className={th}>Pod</th>
                <th className={th}>Skills</th>
                <th className={th}>Experience</th>
                <th className={th}>Formats</th>
                {privileged && (
                  <th className={th}>
                    {evals ? "Meeting window" : "Availability record"}
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {shown.map((m) => (
                <tr
                  key={m.id}
                  className="border-eten-line-soft hover:bg-eten-hover/50 border-b last:border-0"
                >
                  <td className={td}>
                    <button
                      type="button"
                      onClick={() => setProfile(m)}
                      className="flex items-center gap-2.5 text-left"
                    >
                      <Avatar name={m.name} size={34} />
                      <span>
                        <span className="hover:text-eten-accent block font-semibold">
                          {m.name}
                        </span>
                        <span className="text-eten-faint text-[12.5px]">
                          {m.code}
                        </span>
                      </span>
                    </button>
                  </td>
                  <td className={`${td} text-[13.5px]`}>
                    {L.pod(m.podId)?.name}
                  </td>
                  <td className={td}>
                    <div className="flex max-w-[280px] flex-wrap gap-1">
                      {m.skills.slice(0, 3).map((s) => (
                        <Pill
                          key={s.skillId}
                          tone={s.skillId === skill ? "brand" : "neutral"}
                        >
                          {L.skillName(s.skillId)}
                        </Pill>
                      ))}
                      {m.skills.length > 3 && (
                        <Pill>+{m.skills.length - 3}</Pill>
                      )}
                    </div>
                  </td>
                  <td className={`${td} text-[13.5px] whitespace-nowrap`}>
                    {SENIORITY_LABEL[m.seniority]}
                    <span className="text-eten-faint block">
                      {m.years} years
                    </span>
                  </td>
                  <td className={`${td} text-[13.5px]`}>
                    {m.formats.map((f) => FORMAT_LABEL[f]).join(", ")}
                  </td>
                  {privileged && (
                    <td className={td}>
                      {evals ? (
                        <AvailabilityVerdict ev={evals.get(m.id)!} compact />
                      ) : (
                        <span className="text-[13px]">
                          <Pill
                            tone={
                              isFresh(m, data.policies) ? "success" : "warning"
                            }
                          >
                            {isFresh(m, data.policies) ? "Up to date" : "Stale"}
                          </Pill>
                          <span className="text-eten-faint mt-1 block">
                            {m.reviewedAt
                              ? `Reviewed ${fmtAgo(m.reviewedAt)}`
                              : "Never reviewed"}
                          </span>
                        </span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        <div className="border-eten-line flex items-center justify-between gap-3 border-t px-5 py-3 text-[13.5px]">
          <span className="text-eten-faint">
            Showing {rows.length ? current * PAGE + 1 : 0}–
            {Math.min(rows.length, (current + 1) * PAGE)} of {rows.length}
          </span>
          <span className="flex gap-2">
            <Btn
              size="sm"
              disabled={current === 0}
              onClick={() => setPage(current - 1)}
            >
              <ChevronLeft className="size-4" /> Previous
            </Btn>
            <Btn
              size="sm"
              disabled={current >= pages - 1}
              onClick={() => setPage(current + 1)}
            >
              Next <ChevronRight className="size-4" />
            </Btn>
          </span>
        </div>
      </Card>

      <ProfileDialog
        member={profile}
        privileged={privileged}
        evaluation={profile && evals ? evals.get(profile.id) : undefined}
        onClose={() => setProfile(null)}
      />
    </>
  );
}

function ProfileDialog({
  member,
  privileged,
  evaluation,
  onClose,
}: {
  member: Member | null;
  privileged: boolean;
  evaluation?: Evaluation;
  onClose: () => void;
}) {
  const { data, now } = useSession();
  if (!member) return null;
  const L = lookup(data);
  const m = member;
  const today = zonedDate(now, m.timezone);
  const upcomingEx = m.exceptions.filter((e) => e.date >= today).slice(0, 4);
  return (
    <Dialog
      open
      onClose={onClose}
      title={m.name}
      description={`${m.code} · ${L.pod(m.podId)?.name} · ${SENIORITY_LABEL[m.seniority]}, ${m.years} years`}
      wide
    >
      <div className="space-y-5">
        {evaluation && <AvailabilityVerdict ev={evaluation} />}
        <p className="text-[14px]">{m.bio}</p>
        <DefList
          items={[
            ["Primary pod", L.pod(m.podId)?.name ?? ""],
            [
              "Additional pods",
              m.extraPodIds.map((p) => L.pod(p)?.name).join(", ") || "None",
            ],
            [
              "Meeting formats",
              m.formats.map((f) => FORMAT_LABEL[f]).join(", "),
            ],
            [
              "In-person cities",
              `${m.cities.join(", ") || "None"}${m.willingToTravel ? " (willing to travel)" : ""}`,
            ],
            ["Certifications", m.certifications.join(", ") || "None recorded"],
            ["Industries", m.industries.join(", ") || "None recorded"],
            ...(privileged
              ? ([
                  ["Email", m.email],
                  ["Phone", m.phone ?? "Not provided"],
                  ["Calendar", CALENDAR_STATUS[m.calendar].label],
                  ["Time zone", m.timezone],
                ] as [string, string][])
              : []),
          ]}
        />
        <div>
          <p className="mb-2 text-[13px] font-bold">Skills</p>
          <div className="flex flex-wrap gap-1.5">
            {m.skills.map((s) => (
              <Pill key={s.skillId} tone="brand">
                {L.skillName(s.skillId)} · {LEVEL_LABEL[s.level]}
              </Pill>
            ))}
          </div>
        </div>
        {privileged && (
          <div>
            <p className="mb-2 text-[13px] font-bold">
              Weekly availability{" "}
              <span className="text-eten-faint font-normal">
                ({Math.round(weeklyMinutes(m) / 6) / 10} h, {m.timezone})
              </span>
            </p>
            {m.weekly.length === 0 ? (
              <p className="text-eten-faint text-[13.5px]">
                No weekly availability declared.
              </p>
            ) : (
              <ul className="grid gap-1 text-[13.5px] sm:grid-cols-2">
                {WEEKDAYS.map((d) => {
                  // 5 Jan 2026 is a Monday: any week works for the recurring pattern.
                  const ws = effectiveWindows(
                    { ...m, exceptions: [] },
                    `2026-01-${String(4 + d.day).padStart(2, "0")}`,
                  );
                  return (
                    <li key={d.day}>
                      <span className="inline-block w-10 font-semibold">
                        {d.short}
                      </span>
                      {ws.length ? (
                        ws
                          .map(
                            (w) =>
                              `${fromMinutes(w.start)}–${fromMinutes(w.end)}`,
                          )
                          .join(", ")
                      ) : (
                        <span className="text-eten-faint">Unavailable</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            {upcomingEx.length > 0 && (
              <p className="text-eten-faint mt-2 text-[12.5px]">
                {upcomingEx.length} upcoming exception
                {upcomingEx.length > 1 ? "s" : ""}:{" "}
                {upcomingEx.map((e) => e.date).join(", ")}
              </p>
            )}
          </div>
        )}
      </div>
    </Dialog>
  );
}
