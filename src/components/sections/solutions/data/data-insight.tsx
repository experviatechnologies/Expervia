import {
  Target,
  Gauge,
  Zap,
  BadgeCheck,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { Container } from "@/components/shared/container";
import { SectionLabel } from "@/components/shared/section-label";

const pillars: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Target,
    title: "Single Source of Truth",
    body: "One trusted, governed dataset everyone reports from — no more conflicting numbers.",
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

// Hand-built BI dashboard mock — no stock imagery.
const bars = [42, 65, 50, 78, 60, 92];

export function DataInsight() {
  return (
    <section className="bg-surface py-section">
      <Container>
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
          {/* BI dashboard mock */}
          <div className="glass-card order-last rounded-3xl p-6 lg:order-first">
            <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <div className="font-display text-on-surface text-sm font-semibold">
                  Revenue Overview
                </div>
                <div className="text-on-surface-variant text-[11px]">
                  Last 6 months
                </div>
              </div>
              <span className="text-label-sm inline-flex items-center gap-1 font-mono tracking-wider text-emerald-400 uppercase">
                <TrendingUp className="size-3.5" />
                +18.4%
              </span>
            </div>

            <div className="mb-4 grid grid-cols-3 gap-3">
              {[
                { value: "₦4.2B", label: "Revenue" },
                { value: "12.8K", label: "Customers" },
                { value: "94%", label: "Retention" },
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

            <div className="bg-surface-container rounded-xl p-4">
              <div className="flex h-32 items-end justify-between gap-2">
                {bars.map((h, i) => (
                  <div
                    key={i}
                    className="from-primary/40 to-primary w-full rounded-t bg-gradient-to-t"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
              <div className="text-on-surface-variant mt-2 flex justify-between font-mono text-[10px]">
                {["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((m) => (
                  <span key={m}>{m}</span>
                ))}
              </div>
            </div>
          </div>

          <div>
            <SectionLabel className="mb-4">Insight That Moves</SectionLabel>
            <h2 className="font-display text-on-surface text-headline-lg mb-4 font-bold">
              Insight Your Whole Team Can Trust
            </h2>
            <p className="text-on-surface-variant text-body-lg mb-8">
              Data only creates value when people act on it. We deliver insight
              that&apos;s trusted, accessible, and timely — so decisions across
              the business are grounded in evidence, not gut feel.
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
