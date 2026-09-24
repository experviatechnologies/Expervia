import Link from "next/link";

export const metadata = { title: "Cloud Security Circle" };

const lbl =
  "text-mnt-faint font-mono text-[10.5px] tracking-[0.13em] uppercase";

const MENTEES = [
  { name: "Amara Okoye", goal: "V2 to V3 · Landing-zone design" },
  { name: "Tunde Bello", goal: "V1 to V2 · Threat detection" },
  { name: "Kemi Eze", goal: "V2 to V3 · IAM hardening" },
  { name: "Femi Adé", goal: "V1 to V2 · Network security" },
];

const SESSIONS = [
  {
    t: "Session 1 · Kickoff and goals",
    date: "04 Sep",
    att: ["y", "y", "y", "n"],
  },
  {
    t: "Session 2 · Landing-zone patterns",
    date: "11 Sep",
    att: ["y", "y", "n", "y"],
  },
  {
    t: "Session 3 · NSG and policy",
    date: "18 Sep",
    att: ["y", "y", "y", "y"],
  },
];
const INITIALS = ["AO", "TB", "KE", "FA"];

export default function MentorshipCircleDetailPage() {
  return (
    <div className="mx-auto max-w-[1140px] px-6 py-8">
      <Link
        href="/mentorship/mentor"
        className="text-mnt-faint hover:text-mnt-ink text-[13px]"
      >
        ← My Circles
      </Link>

      {/* HEADER */}
      <div className="bg-mnt-panel border-mnt-line mt-3 rounded-2xl border p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-extrabold">
              Cloud Security Circle
            </h1>
            <div className="text-mnt-ink-muted mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[13.5px]">
              <span className="inline-flex items-center gap-2">
                <span className="bg-mnt-green/14 text-mnt-green grid size-[26px] place-items-center rounded-[7px] text-[11px] font-bold">
                  CN
                </span>
                Mentor: Chidi Nwosu · V4
              </span>
              <span>5 mentees</span>
              <span>Weekly · Thu 7:00pm WAT</span>
              <span className="text-mnt-faint">18 Sep to 30 Oct 2026</span>
            </div>
          </div>
          <span className="text-mnt-green bg-mnt-green/12 rounded-full px-2.5 py-1 font-mono text-[10px]">
            Active
          </span>
        </div>
        <div className="border-mnt-line mt-5 grid gap-7 border-t pt-[18px] sm:grid-cols-2">
          <Progress
            label="Sessions attended"
            value="3/5"
            pct="60%"
            bar="bg-mnt-brand"
          />
          <Progress
            label="Assignments approved"
            value="2/3"
            pct="66%"
            bar="bg-mnt-green"
          />
        </div>
      </div>

      {/* MENTEES */}
      <div className="mt-[18px]">
        <div className={`${lbl} mb-2.5`}>Mentees · 5</div>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {MENTEES.map((m) => (
            <div
              key={m.name}
              className="bg-mnt-panel border-mnt-line flex items-center justify-between gap-3 rounded-xl border px-3.5 py-3"
            >
              <span className="text-[13.5px] font-semibold">{m.name}</span>
              <span className="text-mnt-faint text-[11.5px]">
                Goal · {m.goal}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-[18px] grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        {/* SESSIONS */}
        <div className="bg-mnt-panel border-mnt-line rounded-2xl border p-[18px]">
          <div className="mb-3.5 flex items-center justify-between">
            <div className={lbl}>Sessions · 3</div>
            <button
              type="button"
              className="border-mnt-line-strong text-mnt-ink rounded-lg border px-2.5 py-1.5 text-[12px] font-semibold"
            >
              + Add session
            </button>
          </div>
          <div className="flex flex-col gap-2.5">
            {SESSIONS.map((s) => (
              <div
                key={s.t}
                className="bg-mnt-panel-2 border-mnt-line rounded-xl border p-3.5"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-display text-[14px] font-bold">{s.t}</h4>
                  <span className="text-mnt-faint text-[11.5px]">{s.date}</span>
                </div>
                <div className="mt-2.5 flex gap-1.5">
                  {s.att.map((a, i) => (
                    <span
                      key={i}
                      className={
                        "rounded-full px-2 py-0.5 font-mono text-[10px] " +
                        (a === "y"
                          ? "bg-mnt-green/12 text-mnt-green"
                          : "bg-mnt-panel text-mnt-faint")
                      }
                    >
                      {INITIALS[i]} {a === "y" ? "✓" : "–"}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ASSIGNMENTS + REVIEW */}
        <div className="bg-mnt-panel border-mnt-line rounded-2xl border p-[18px]">
          <div className="mb-3.5 flex items-center justify-between">
            <div className={lbl}>Assignments · 3</div>
            <button
              type="button"
              className="border-mnt-line-strong text-mnt-ink rounded-lg border px-2.5 py-1.5 text-[12px] font-semibold"
            >
              + Post assignment
            </button>
          </div>

          <div className="bg-mnt-panel-2 border-mnt-line rounded-xl border p-3.5">
            <div className="flex items-center justify-between">
              <h4 className="font-display text-[14.5px] font-bold">
                Write an NSG baseline policy
              </h4>
              <span className="text-mnt-faint text-[11.5px]">Due 26 Sep</span>
            </div>
            <div className="text-mnt-ink-muted mt-1.5 text-[12px]">
              3/5 submitted
            </div>
            <div className="bg-mnt-panel border-mnt-line mt-3 rounded-[10px] border p-3">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold">Amara Okoye</span>
                <span className="text-mnt-amber bg-mnt-amber/12 rounded-full px-2.5 py-0.5 font-mono text-[10px]">
                  Submitted
                </span>
              </div>
              <p className="text-mnt-ink-muted mt-2 text-[12px] leading-relaxed">
                Attached my baseline as a deny-by-default NSG set with
                justification per rule, link in the doc.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  className="border-mnt-line-strong text-mnt-ink rounded-lg border px-3 py-1.5 text-[12px] font-semibold"
                >
                  Request revision
                </button>
                <button
                  type="button"
                  className="bg-mnt-brand text-mnt-on-brand rounded-lg px-3 py-1.5 text-[12px] font-bold"
                >
                  Approve to passport
                </button>
              </div>
            </div>
          </div>

          <div className="bg-mnt-panel-2 border-mnt-line mt-2.5 rounded-xl border p-3.5">
            <div className="flex items-center justify-between">
              <h4 className="font-display text-[14.5px] font-bold">
                Design a hub-and-spoke topology
              </h4>
              <span className="text-mnt-green bg-mnt-green/12 rounded-full px-2.5 py-0.5 font-mono text-[10px]">
                All approved
              </span>
            </div>
            <div className="text-mnt-ink-muted mt-1.5 text-[12px]">
              5/5 approved · added to capability passports
            </div>
          </div>
        </div>
      </div>

      {/* COMPLETION BAND */}
      <div className="border-mnt-line mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-[18px] [background:linear-gradient(120deg,rgba(167,140,250,0.08),rgba(52,211,153,0.06))]">
        <div className="text-mnt-ink-muted text-[13px] leading-relaxed">
          <b className="text-mnt-ink">Completion:</b> a mentee graduates with at
          least one approved assignment and 50% or more attendance. Graduates
          earn <span className="text-mnt-green">+50 Expert Score</span> and the
          Circle Graduate badge.
        </div>
        <button
          type="button"
          className="bg-mnt-brand text-mnt-on-brand rounded-[10px] px-4 py-2.5 text-[13px] font-bold whitespace-nowrap"
        >
          Complete Circle
        </button>
      </div>
    </div>
  );
}

function Progress({
  label,
  value,
  pct,
  bar,
}: {
  label: string;
  value: string;
  pct: string;
  bar: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-[12px]">
        <span className={lbl}>{label}</span>
        <span className="font-bold">{value}</span>
      </div>
      <div className="bg-mnt-panel-2 mt-2 h-[7px] overflow-hidden rounded-full">
        <div className={`h-full rounded-full ${bar}`} style={{ width: pct }} />
      </div>
    </div>
  );
}
