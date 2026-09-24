import { MntDashShell } from "@/components/mentorship/mnt-dash-shell";

export const metadata = { title: "Dashboard" };

const lbl =
  "text-mnt-faint font-mono text-[10.5px] tracking-[0.13em] uppercase";

const ASSIGNMENTS = [
  {
    t: "Design a hub-and-spoke topology",
    meta: "Due 22 Sep",
    status: "Approved",
    tone: "text-mnt-green",
  },
  {
    t: "Write an NSG baseline policy",
    meta: "Due 26 Sep",
    status: "In review",
    tone: "text-mnt-amber",
  },
  {
    t: "Document a landing-zone runbook",
    meta: "Not started",
    status: "submit",
    tone: "",
  },
];

export default function MenteeDashboardPage() {
  const footer = (
    <div className="border-mnt-amber/30 rounded-xl border p-3.5 [background:rgba(245,177,61,0.06)]">
      <div className="flex items-center gap-2">
        <span className="bg-mnt-amber size-2 rounded-full" />
        <span className="text-mnt-amber font-mono text-[10.5px] tracking-[0.1em] uppercase">
          Prospect
        </span>
      </div>
      <p className="text-mnt-ink-muted mt-2 mb-2.5 text-[12px] leading-relaxed">
        Validate with ETEN membership to join live Circles.
      </p>
      <button
        type="button"
        className="bg-mnt-amber w-full rounded-[9px] py-2 text-[12.5px] font-bold text-[#241a05]"
      >
        Validate now
      </button>
    </div>
  );

  return (
    <MntDashShell
      user={{ initials: "AO", name: "Amara Okoye", role: "Mentee" }}
      nav={[
        { label: "Dashboard", href: "/mentorship/dashboard", active: true },
        { label: "My Circle" },
        { label: "Assignments" },
        { label: "Progress" },
        { label: "Profile" },
      ]}
      footer={footer}
    >
      <div className="px-6 py-8 md:px-9">
        <div className="flex items-end justify-between">
          <div>
            <div className={lbl}>Wednesday · 24 Sep</div>
            <h1 className="font-display mt-1.5 text-[26px] font-extrabold">
              Welcome back, Amara
            </h1>
          </div>
        </div>

        {/* validate banner */}
        <div className="border-mnt-amber/30 mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 [background:linear-gradient(120deg,rgba(245,177,61,0.10),rgba(245,177,61,0.03))]">
          <div className="flex items-center gap-3">
            <span className="bg-mnt-amber/18 text-mnt-amber grid size-[26px] place-items-center rounded-lg font-bold">
              !
            </span>
            <div>
              <div className="text-[14px] font-bold">
                You are a Prospect, one step from going live
              </div>
              <div className="text-mnt-ink-muted mt-0.5 text-[12.5px]">
                Validate through ETEN membership to be placed in a live Circle
                and count toward recognition.
              </div>
            </div>
          </div>
          <button
            type="button"
            className="bg-mnt-amber rounded-[10px] px-4 py-2.5 text-[13px] font-bold whitespace-nowrap text-[#241a05]"
          >
            Validate account
          </button>
        </div>

        {/* top stat cards */}
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-[1.15fr_1fr_1fr]">
          <div className="bg-mnt-panel border-mnt-line rounded-2xl border p-[18px]">
            <div className={lbl}>My goal</div>
            <div className="mt-3 flex items-center gap-2.5">
              <span className="font-display text-xl font-extrabold">V2</span>
              <span className="text-mnt-faint">→</span>
              <span className="text-mnt-brand font-display text-xl font-extrabold">
                V3
              </span>
            </div>
            <div className="text-mnt-ink-muted mt-2 text-[13px]">
              Azure landing-zone design
            </div>
          </div>
          <Stat
            label="Sessions attended"
            value="3"
            total="/5"
            pct="60%"
            bar="bg-mnt-brand"
          />
          <Stat
            label="Assignments approved"
            value="2"
            total="/3"
            pct="66%"
            bar="bg-mnt-green"
          />
        </div>

        {/* circle + assignments */}
        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.25fr]">
          <div className="bg-mnt-panel border-mnt-line rounded-2xl border p-[18px]">
            <div className="flex items-center justify-between">
              <div className={lbl}>My Circle</div>
              <span className="text-mnt-green bg-mnt-green/12 rounded-full px-2.5 py-1 font-mono text-[10px]">
                Active
              </span>
            </div>
            <h3 className="font-display mt-3 text-[17px] font-bold">
              Cloud Security Circle
            </h3>
            <div className="mt-3 flex items-center gap-2.5">
              <span className="bg-mnt-green/14 text-mnt-green grid size-[34px] place-items-center rounded-[9px] text-[13px] font-bold">
                CN
              </span>
              <div>
                <div className="text-[13.5px] font-semibold">Chidi Nwosu</div>
                <div className="text-mnt-faint text-[11.5px]">
                  Verified Mentor · V4
                </div>
              </div>
            </div>
            <div className="border-mnt-line text-mnt-ink-muted mt-3.5 flex justify-between border-t pt-3.5 text-[12.5px]">
              <span>5 mentees</span>
              <span>Weekly · Thu 7pm</span>
            </div>
            <div className="bg-mnt-panel-2 border-mnt-line mt-3.5 rounded-xl border p-3">
              <div className="text-mnt-faint text-[11.5px]">Next session</div>
              <div className="mt-0.5 text-[13.5px] font-semibold">
                Session 4 · Thu 25 Sep, 7:00pm WAT
              </div>
            </div>
          </div>

          <div className="bg-mnt-panel border-mnt-line rounded-2xl border p-[18px]">
            <div className="flex items-center justify-between">
              <div className={lbl}>Assignments</div>
              <span className="text-mnt-faint text-[12px]">3 total</span>
            </div>
            <div className="mt-3.5 flex flex-col gap-2.5">
              {ASSIGNMENTS.map((a) => (
                <div
                  key={a.t}
                  className="bg-mnt-panel-2 border-mnt-line flex items-center gap-3 rounded-xl border p-3"
                >
                  <div className="flex-1">
                    <div className="text-[13.5px] font-semibold">{a.t}</div>
                    <div className="text-mnt-faint mt-0.5 text-[11.5px]">
                      {a.meta}
                    </div>
                  </div>
                  {a.status === "submit" ? (
                    <button
                      type="button"
                      className="bg-mnt-brand text-mnt-on-brand rounded-lg px-3 py-1.5 text-[12px] font-bold"
                    >
                      Submit
                    </button>
                  ) : (
                    <span className={`font-mono text-[10.5px] ${a.tone}`}>
                      {a.status}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MntDashShell>
  );
}

function Stat({
  label,
  value,
  total,
  pct,
  bar,
}: {
  label: string;
  value: string;
  total: string;
  pct: string;
  bar: string;
}) {
  return (
    <div className="bg-mnt-panel border-mnt-line rounded-2xl border p-[18px]">
      <div className={lbl}>{label}</div>
      <div className="mt-3 flex items-baseline">
        <span className="font-display text-[22px] font-extrabold">{value}</span>
        <span className="text-mnt-faint text-[15px]">{total}</span>
      </div>
      <div className="bg-mnt-panel-2 mt-2.5 h-[7px] overflow-hidden rounded-full">
        <div className={`h-full rounded-full ${bar}`} style={{ width: pct }} />
      </div>
    </div>
  );
}
