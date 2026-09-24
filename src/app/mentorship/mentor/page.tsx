import { MntDashShell } from "@/components/mentorship/mnt-dash-shell";

export const metadata = { title: "Mentor dashboard" };

const lbl =
  "text-mnt-faint font-mono text-[10.5px] tracking-[0.13em] uppercase";

const CIRCLES = [
  {
    t: "Cloud Security Circle",
    meta: "5 mentees · Session 3 of 6",
    pct: "40%",
    grad: "2 / 5 on track to graduate",
  },
  {
    t: "Azure Foundations Circle",
    meta: "4 mentees · Session 5 of 6",
    pct: "80%",
    grad: "3 / 4 on track to graduate",
  },
];

const REVIEWS = [
  {
    initials: "AO",
    tone: "bg-mnt-brand/16 text-mnt-brand",
    name: "Amara Okoye",
    work: "NSG baseline policy · Cloud Security",
  },
  {
    initials: "TB",
    tone: "bg-mnt-blue/16 text-mnt-blue",
    name: "Tunde Bello",
    work: "Threat-detection lab · Cloud Security",
  },
];

export default function MentorDashboardPage() {
  const footer = (
    <div className="border-mnt-green/30 rounded-xl border p-3.5 [background:rgba(52,211,153,0.06)]">
      <div className="flex items-center gap-2">
        <span className="bg-mnt-green size-2 rounded-full" />
        <span className="text-mnt-green font-mono text-[10.5px] tracking-[0.1em] uppercase">
          Verified Mentor
        </span>
      </div>
      <p className="text-mnt-ink-muted mt-2 text-[12px] leading-relaxed">
        Cloud and Security · Verified 12 Sep 2026
      </p>
    </div>
  );

  return (
    <MntDashShell
      user={{ initials: "CN", name: "Chidi Nwosu", role: "Mentor · V4" }}
      nav={[
        { label: "Dashboard", href: "/mentorship/mentor", active: true },
        { label: "My Circles" },
        { label: "Reviews" },
        { label: "Mentees" },
        { label: "Profile" },
      ]}
      footer={footer}
    >
      <div className="px-6 py-8 md:px-9">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className={lbl}>Mentor workspace</div>
            <h1 className="font-display mt-1.5 text-[26px] font-extrabold">
              Good evening, Chidi
            </h1>
          </div>
          <button
            type="button"
            className="bg-mnt-brand text-mnt-on-brand rounded-[10px] px-4 py-2.5 text-[13px] font-bold"
          >
            + New Circle
          </button>
        </div>

        {/* stat tiles */}
        <div className="mt-6 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
          <Tile label="Active Circles" value="2" />
          <Tile label="Mentees" value="9" />
          <Tile label="Pending reviews" value="4" tone="text-mnt-amber" dot />
          <Tile label="Circle graduates" value="7" tone="text-mnt-green" />
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.15fr]">
          {/* circles I lead */}
          <div className="bg-mnt-panel border-mnt-line rounded-2xl border p-[18px]">
            <div className={`${lbl} mb-3.5`}>Circles I lead</div>
            <div className="flex flex-col gap-3">
              {CIRCLES.map((c) => (
                <div
                  key={c.t}
                  className="bg-mnt-panel-2 border-mnt-line rounded-xl border p-3.5"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-display text-[15px] font-bold">
                      {c.t}
                    </h4>
                    <span className="text-mnt-green bg-mnt-green/12 rounded-full px-2.5 py-1 font-mono text-[10px]">
                      Active
                    </span>
                  </div>
                  <div className="text-mnt-faint mt-1.5 text-[12px]">
                    {c.meta}
                  </div>
                  <div className="mt-2.5 h-1.5 overflow-hidden rounded-full [background:#0e1420]">
                    <div
                      className="bg-mnt-brand h-full"
                      style={{ width: c.pct }}
                    />
                  </div>
                  <div className="text-mnt-faint mt-1.5 text-[11px]">
                    {c.grad}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* review queue */}
          <div className="bg-mnt-panel border-mnt-line rounded-2xl border p-[18px]">
            <div className="mb-3.5 flex items-center justify-between">
              <div className={lbl}>Pending evidence reviews</div>
              <span className="text-mnt-amber bg-mnt-amber/12 rounded-full px-2.5 py-1 font-mono text-[10px]">
                4 waiting
              </span>
            </div>
            <div className="flex flex-col gap-2.5">
              {REVIEWS.map((r) => (
                <div
                  key={r.name}
                  className="bg-mnt-panel-2 border-mnt-line rounded-xl border p-3.5"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`grid size-[30px] place-items-center rounded-lg text-[12px] font-bold ${r.tone}`}
                    >
                      {r.initials}
                    </span>
                    <div className="flex-1">
                      <div className="text-[13.5px] font-semibold">
                        {r.name}
                      </div>
                      <div className="text-mnt-faint text-[11.5px]">
                        {r.work}
                      </div>
                    </div>
                  </div>
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
                      Approve
                    </button>
                  </div>
                </div>
              ))}
              <div className="bg-mnt-panel-2 border-mnt-line flex items-center justify-between rounded-xl border px-3.5 py-3">
                <div className="flex items-center gap-2.5">
                  <span className="bg-mnt-amber/14 text-mnt-amber grid size-[30px] place-items-center rounded-lg text-[12px] font-bold">
                    KE
                  </span>
                  <div>
                    <div className="text-[13.5px] font-semibold">Kemi Eze</div>
                    <div className="text-mnt-faint text-[11.5px]">
                      Landing-zone runbook
                    </div>
                  </div>
                </div>
                <span className="text-mnt-faint text-[11px]">+2 more</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MntDashShell>
  );
}

function Tile({
  label,
  value,
  tone,
  dot,
}: {
  label: string;
  value: string;
  tone?: string;
  dot?: boolean;
}) {
  return (
    <div className="bg-mnt-panel border-mnt-line relative rounded-2xl border p-4">
      <div className={lbl}>{label}</div>
      <div
        className={`font-display mt-2 text-[26px] font-extrabold ${tone ?? ""}`}
      >
        {value}
      </div>
      {dot && (
        <span className="bg-mnt-amber absolute top-3.5 right-3.5 size-2.5 rounded-full" />
      )}
    </div>
  );
}
