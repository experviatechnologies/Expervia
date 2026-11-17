import {
  Target,
  Gauge,
  Zap,
  BadgeCheck,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { IconBadge, Section, SectionIntro } from "@/components/site/ui";

const pillars: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Target,
    title: "Single Source of Truth",
    body: "One trusted, governed dataset everyone reports from. No more conflicting numbers.",
  },
  {
    icon: Gauge,
    title: "Self-Service BI",
    body: "Teams answer their own questions without waiting on a report queue.",
  },
  {
    icon: Zap,
    title: "Real-Time Insight",
    body: "Live dashboards that reflect the business as it happens, not last month.",
  },
  {
    icon: BadgeCheck,
    title: "Trusted & Governed",
    body: "Lineage, quality, and access controls so leaders can decide with confidence.",
  },
];

// Hand-built BI dashboard mock (no stock imagery).
const bars = [42, 65, 50, 78, 60, 92];

export function DataInsight() {
  return (
    <Section id="insight" labelledBy="insight-heading" tone="indigo">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        {/* BI dashboard mock (illustrative). */}
        <div
          aria-hidden
          className="order-last rounded-3xl border border-white/10 bg-white/[0.05] p-6 backdrop-blur lg:order-first"
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <div className="font-jakarta text-sm font-bold text-white">
                Revenue Overview
              </div>
              <div className="text-brand-100/70 text-[11px]">Last 6 months</div>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-bold tracking-[0.12em] text-emerald-300 uppercase">
              <TrendingUp className="size-3.5" />
              +18.4%
            </span>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { value: "₦4.2B", label: "Revenue" },
              { value: "12.8K", label: "Customers" },
              { value: "94%", label: "Retention" },
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

          <div className="mt-4 rounded-2xl bg-white/[0.06] p-4">
            <div className="flex h-32 items-end justify-between gap-2">
              {bars.map((h, i) => (
                <div
                  key={i}
                  className="from-brand-500 to-brand-200 w-full rounded-t-md bg-gradient-to-t"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
            <div className="text-brand-100/60 mt-2 flex justify-between text-[10px] font-medium">
              {["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((m) => (
                <span key={m}>{m}</span>
              ))}
            </div>
          </div>
        </div>

        <div>
          <SectionIntro
            id="insight-heading"
            eyebrow="Insight That Moves"
            title="Insight Your Whole Team Can Trust"
            intro="Data only creates value when people act on it. We deliver insight that's trusted, accessible, and timely, so decisions across the business are grounded in evidence, not gut feel."
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
