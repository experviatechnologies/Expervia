import {
  Wallet,
  Headset,
  UserCog,
  Lightbulb,
  type LucideIcon,
} from "lucide-react";
import { IconBadge, Section, SectionIntro } from "@/components/site/ui";

const benefits: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Wallet,
    title: "Cost Optimization",
    body: "Consolidated billing and monthly usage audits to eliminate waste.",
  },
  {
    icon: Headset,
    title: "Priority Support",
    body: "Direct access to Expervia's certified architects for rapid resolution.",
  },
  {
    icon: UserCog,
    title: "Subscription Management",
    body: "Full lifecycle management of your Microsoft 365 and Azure licenses.",
  },
];

export function CspServices() {
  return (
    <Section id="csp" labelledBy="csp-heading" tone="indigo">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <SectionIntro
            id="csp-heading"
            eyebrow="Microsoft Cloud Solutions Partner"
            title="Streamline Your Cloud Operations"
            intro="Avoid the complexity of direct billing and fragmented support. Expervia provides unified licensing management and technical expertise tailored to your business needs."
            dark
          />
          <ul className="mt-10 space-y-6">
            {benefits.map(({ icon, title, body }) => (
              <li key={title} className="flex items-start gap-4">
                <IconBadge icon={icon} dark className="size-11" />
                <div>
                  <h3 className="font-jakarta font-bold text-white">{title}</h3>
                  <p className="text-brand-100/80 mt-1 leading-relaxed">
                    {body}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Hand-built dashboard visual (illustrative, no external image). */}
        <div
          role="img"
          aria-label="Illustrative Expervia cloud management dashboard showing 94% license utilization and $12.4k in cost saved"
          className="rounded-3xl border border-white/10 bg-white/[0.05] p-7 backdrop-blur md:p-9"
        >
          <div className="flex items-center justify-between">
            <p className="font-jakarta font-bold text-white">
              Expervia Dashboard
            </p>
            <p className="text-brand-100/80 flex items-center gap-2 text-xs">
              <span className="size-2 rounded-full bg-emerald-300" />
              Cloud Health: Optimal
            </p>
          </div>
          <div className="mt-7 h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div className="from-brand-400 to-brand-200 h-full w-3/4 rounded-full bg-gradient-to-r" />
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-white/[0.06] p-4">
              <p className="text-brand-100/70 text-xs">License Utilization</p>
              <p className="font-jakarta mt-1 text-2xl font-extrabold text-white">
                94%
              </p>
            </div>
            <div className="rounded-2xl bg-white/[0.06] p-4">
              <p className="text-brand-100/70 text-xs">Cost Saved</p>
              <p className="font-jakarta text-brand-200 mt-1 text-2xl font-extrabold">
                $12.4k
              </p>
            </div>
          </div>
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-white">
              <Lightbulb className="text-brand-200 size-4" />
              Optimization Recommendation
            </p>
            <p className="text-brand-100/75 mt-1 text-xs">
              3 underutilized Azure VMs detected. Recommending downsizing.
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
}
