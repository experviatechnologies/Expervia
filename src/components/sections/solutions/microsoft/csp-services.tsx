import {
  Wallet,
  Headset,
  UserCog,
  Lightbulb,
  type LucideIcon,
} from "lucide-react";
import { Container } from "@/components/shared/container";
import { SectionLabel } from "@/components/shared/section-label";

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
    <section className="bg-surface py-section">
      <Container>
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
          <div>
            <SectionLabel className="mb-4">
              Microsoft Cloud Solutions Partner
            </SectionLabel>
            <h2 className="font-display text-on-surface text-headline-lg mb-4 font-bold">
              Streamline Your Cloud Operations
            </h2>
            <p className="text-on-surface-variant text-body-lg mb-8">
              Avoid the complexity of direct billing and fragmented support.
              Expervia provides unified licensing management and technical
              expertise tailored to your business needs.
            </p>
            <ul className="space-y-6">
              {benefits.map(({ icon: Icon, title, body }) => (
                <li key={title} className="flex items-start gap-4">
                  <span className="bg-primary/20 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
                    <Icon className="size-5" />
                  </span>
                  <div>
                    <div className="text-on-surface font-bold">{title}</div>
                    <div className="text-on-surface-variant">{body}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Hand-built dashboard visual (no external image). */}
          <div className="relative">
            <div className="bg-primary/10 absolute -inset-4 rounded-3xl blur-2xl" />
            <div
              className="glass-panel relative rounded-3xl p-8 md:p-10"
              role="img"
              aria-label="Illustrative Expervia cloud management dashboard showing 94% license utilization and $12.4k in cost saved"
            >
              <div className="mb-8 flex items-center justify-between">
                <div className="text-primary font-bold">Expervia Dashboard</div>
                <div className="text-on-surface-variant flex items-center gap-2 text-xs">
                  <span className="size-2 rounded-full bg-emerald-400" />
                  Cloud Health: Optimal
                </div>
              </div>
              <div className="space-y-6">
                <div className="bg-surface-container-high h-2 w-full overflow-hidden rounded-full">
                  <div className="bg-primary h-full w-3/4 rounded-full" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl border border-white/5 bg-white/5 p-4">
                    <div className="text-on-surface-variant text-xs">
                      License Utilization
                    </div>
                    <div className="text-on-surface text-2xl font-bold">
                      94%
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-white/5 p-4">
                    <div className="text-on-surface-variant text-xs">
                      Cost Saved
                    </div>
                    <div className="text-primary text-2xl font-bold">
                      $12.4k
                    </div>
                  </div>
                </div>
                <div className="border-primary/20 bg-primary/5 rounded-xl border p-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Lightbulb className="text-primary size-4" />
                    Optimization Recommendation
                  </div>
                  <div className="text-on-surface-variant mt-1 text-xs">
                    3 underutilized Azure VMs detected. Recommending downsizing.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
