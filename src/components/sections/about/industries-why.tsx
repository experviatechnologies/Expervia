import {
  Landmark,
  Factory,
  Zap,
  Truck,
  Building2,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";
import { Container } from "@/components/shared/container";

const industries: { icon: LucideIcon; label: string }[] = [
  { icon: Landmark, label: "Financial Services" },
  { icon: Factory, label: "Manufacturing" },
  { icon: Zap, label: "Energy & Utilities" },
  { icon: Truck, label: "Logistics" },
  { icon: Building2, label: "Public Sector" },
  { icon: Stethoscope, label: "Healthcare" },
];

const reasons = [
  {
    title: "Deep Local Context",
    body: "We understand the unique connectivity and regulatory landscape of the African market.",
  },
  {
    title: "Vendor Neutrality",
    body: "We choose the best-fit technology for your specific business case, not the vendor's quota.",
  },
  {
    title: "Elite Technical Talent",
    body: "Our engineers hold top-tier certifications across AI, Cyber, and Cloud disciplines.",
  },
];

export function IndustriesWhy() {
  return (
    <section className="bg-surface-container-high py-section relative overflow-hidden">
      <div className="bg-primary/5 absolute top-0 right-0 -z-10 size-[500px] blur-[120px]" />
      <Container>
        <div className="grid grid-cols-1 gap-20 lg:grid-cols-2">
          {/* Industries */}
          <div>
            <h2 className="font-display text-on-surface text-headline-lg mb-8 font-bold">
              Industries We Empower
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {industries.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="bg-surface border-outline-variant flex items-center gap-3 rounded-xl border p-4"
                >
                  <Icon className="text-primary size-6 shrink-0" />
                  <span className="text-body-md">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Why Expervia */}
          <div>
            <h2 className="font-display text-on-surface text-headline-lg mb-8 font-bold">
              Why Expervia?
            </h2>
            <div className="space-y-6">
              {reasons.map((r, i) => (
                <div key={r.title} className="flex gap-4">
                  <div className="bg-primary/20 text-primary flex size-10 shrink-0 items-center justify-center rounded-full font-bold">
                    {i + 1}
                  </div>
                  <div>
                    <h4 className="font-display text-on-surface text-headline-md mb-1 font-semibold">
                      {r.title}
                    </h4>
                    <p className="text-body-md text-on-surface-variant">
                      {r.body}
                    </p>
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
