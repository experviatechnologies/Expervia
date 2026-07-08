import {
  Landmark,
  Building2,
  Stethoscope,
  GraduationCap,
  Factory,
  RadioTower,
  Zap,
  Briefcase,
  ShoppingCart,
  type LucideIcon,
} from "lucide-react";
import { Container } from "@/components/shared/container";
import { SectionLabel } from "@/components/shared/section-label";

const industries: { icon: LucideIcon; label: string }[] = [
  { icon: Landmark, label: "Financial Services" },
  { icon: Building2, label: "Government" },
  { icon: Stethoscope, label: "Healthcare" },
  { icon: GraduationCap, label: "Education" },
  { icon: Factory, label: "Manufacturing" },
  { icon: RadioTower, label: "Telecommunications" },
  { icon: Zap, label: "Energy & Utilities" },
  { icon: Briefcase, label: "Professional Services" },
  { icon: ShoppingCart, label: "Retail & Commerce" },
];

export function Industries() {
  return (
    <section id="industries" className="bg-surface py-section">
      <Container>
        <div className="mb-16 max-w-2xl">
          <SectionLabel className="mb-2">Industry Expertise</SectionLabel>
          <h2 className="font-display text-on-surface text-headline-lg font-bold">
            Industries We Serve
          </h2>
          <p className="text-on-surface-variant mt-4">
            We deliver vertical-specific digital solutions that address the
            unique challenges of major sectors across Africa.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {industries.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="border-outline-variant/20 hover:border-primary/50 bg-surface-container-low flex items-center gap-4 rounded-xl border p-6 transition-colors"
            >
              <Icon className="text-primary size-6 shrink-0" />
              <span className="min-w-0 font-bold break-words">{label}</span>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
