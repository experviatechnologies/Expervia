import {
  Clock,
  Radar,
  Siren,
  ScrollText,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { IconBadge, Section, SectionIntro } from "@/components/site/ui";
import { cn } from "@/lib/utils";

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

// Hand-built SOC monitor visual (no stock imagery).
const feed: { label: string; status: string; tone: string }[] = [
  { label: "Endpoint protection", status: "Healthy", tone: "ok" },
  { label: "Identity / sign-ins", status: "12 blocked", tone: "warn" },
  { label: "Phishing attempt", status: "Quarantined", tone: "ok" },
  { label: "Vulnerability scan", status: "Clean", tone: "ok" },
  { label: "Anomalous traffic", status: "Investigating", tone: "warn" },
];

export function CyberSoc() {
  return (
    <Section id="soc" labelledBy="soc-heading" tone="indigo">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        {/* Live SOC monitor mock (illustrative). */}
        <div
          aria-hidden
          className="order-last rounded-3xl border border-white/10 bg-white/[0.05] p-6 backdrop-blur lg:order-first"
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="text-brand-100 flex size-9 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
                <ShieldCheck className="size-4" />
              </span>
              <span className="font-jakarta text-sm font-bold text-white">
                Expervia SOC
              </span>
            </div>
            <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.16em] text-emerald-300 uppercase">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full rounded-full bg-emerald-300 opacity-75 motion-safe:animate-ping" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-300" />
              </span>
              Live
            </span>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { value: "1.2M", label: "Events / day" },
              { value: "99.98%", label: "Uptime" },
              { value: "<5 min", label: "Response" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl bg-white/[0.06] p-3 text-center"
              >
                <div className="font-jakarta text-brand-200 text-xl font-extrabold">
                  {stat.value}
                </div>
                <div className="text-brand-100/70 text-[11px]">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          <ul className="mt-4 space-y-2">
            {feed.map((row) => (
              <li
                key={row.label}
                className="flex items-center justify-between rounded-xl bg-white/[0.06] px-4 py-3"
              >
                <span className="text-brand-100/85 text-sm">{row.label}</span>
                <span
                  className={cn(
                    "inline-flex items-center gap-2 text-xs font-bold tracking-[0.12em] uppercase",
                    row.tone === "ok" ? "text-emerald-300" : "text-amber-300",
                  )}
                >
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      row.tone === "ok" ? "bg-emerald-300" : "bg-amber-300",
                    )}
                  />
                  {row.status}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <SectionIntro
            id="soc-heading"
            eyebrow="Managed SOC"
            title="A Security Team That Never Sleeps"
            intro="Most breaches succeed in the gaps: overnight, on weekends, between alerts. Our managed SOC closes them with continuous vigilance and a response plan that's already rehearsed."
            dark
          />
          <ul className="mt-10 grid gap-6 sm:grid-cols-2">
            {pillars.map(({ icon, title, body }) => (
              <li key={title} className="flex gap-4">
                <IconBadge icon={icon} dark className="size-11" />
                <div>
                  <h3 className="font-jakarta font-bold text-white">{title}</h3>
                  <p className="text-brand-100/80 mt-1 text-sm leading-relaxed">
                    {body}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}
