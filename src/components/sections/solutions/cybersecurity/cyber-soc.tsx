import {
  Clock,
  Radar,
  Siren,
  ScrollText,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { Container } from "@/components/shared/container";
import { SectionLabel } from "@/components/shared/section-label";

const pillars: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Clock,
    title: "24/7 Monitoring",
    body: "Eyes on your environment every hour of every day, never off-shift.",
  },
  {
    icon: Radar,
    title: "Threat Intelligence",
    body: "Global signal and local context to spot emerging attacks early.",
  },
  {
    icon: Siren,
    title: "Rapid Response",
    body: "Defined SLAs to contain and remediate incidents in minutes, not days.",
  },
  {
    icon: ScrollText,
    title: "Continuous Compliance",
    body: "Audit-ready reporting mapped to the standards your sector demands.",
  },
];

// Hand-built SOC monitor visual — no stock imagery.
const feed: { label: string; status: string; tone: string }[] = [
  { label: "Endpoint protection", status: "Healthy", tone: "ok" },
  { label: "Identity / sign-ins", status: "12 blocked", tone: "warn" },
  { label: "Phishing attempt", status: "Quarantined", tone: "ok" },
  { label: "Vulnerability scan", status: "Clean", tone: "ok" },
  { label: "Anomalous traffic", status: "Investigating", tone: "warn" },
];

export function CyberSoc() {
  return (
    <section className="bg-surface py-section">
      <Container>
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
          {/* Live SOC monitor mock */}
          <div className="glass-card order-last rounded-3xl p-6 lg:order-first">
            <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <span className="bg-primary/20 text-primary flex size-8 items-center justify-center rounded-lg">
                  <ShieldCheck className="size-4" />
                </span>
                <span className="font-display text-on-surface text-sm font-semibold">
                  Expervia SOC
                </span>
              </div>
              <span className="text-label-sm inline-flex items-center gap-2 font-mono tracking-wider text-emerald-400 uppercase">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
                </span>
                Live
              </span>
            </div>

            <div className="mb-4 grid grid-cols-3 gap-3">
              {[
                { value: "1.2M", label: "Events / day" },
                { value: "99.98%", label: "Uptime" },
                { value: "<5 min", label: "Response" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-surface-container rounded-xl p-3 text-center"
                >
                  <div className="font-display text-primary text-headline-md font-bold">
                    {stat.value}
                  </div>
                  <div className="text-on-surface-variant text-[11px]">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            <ul className="space-y-2">
              {feed.map((row) => (
                <li
                  key={row.label}
                  className="bg-surface-container flex items-center justify-between rounded-lg px-4 py-3"
                >
                  <span className="text-on-surface-variant text-sm">
                    {row.label}
                  </span>
                  <span
                    className={
                      row.tone === "ok"
                        ? "text-label-sm inline-flex items-center gap-2 font-mono tracking-wider text-emerald-400 uppercase"
                        : "text-label-sm inline-flex items-center gap-2 font-mono tracking-wider text-amber-400 uppercase"
                    }
                  >
                    <span
                      className={
                        row.tone === "ok"
                          ? "size-1.5 rounded-full bg-emerald-400"
                          : "size-1.5 rounded-full bg-amber-400"
                      }
                    />
                    {row.status}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <SectionLabel className="mb-4">Managed SOC</SectionLabel>
            <h2 className="font-display text-on-surface text-headline-lg mb-4 font-bold">
              A Security Team That Never Sleeps
            </h2>
            <p className="text-on-surface-variant text-body-lg mb-8">
              Most breaches succeed in the gaps — overnight, on weekends,
              between alerts. Our managed SOC closes them with continuous
              vigilance and a response plan that&apos;s already rehearsed.
            </p>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {pillars.map(({ icon: Icon, title, body }) => (
                <div key={title} className="flex gap-4">
                  <span className="bg-primary/20 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
                    <Icon className="size-5" />
                  </span>
                  <div>
                    <h3 className="text-on-surface font-bold">{title}</h3>
                    <p className="text-on-surface-variant text-sm">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
