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
import {
  ButtonLink,
  IconBadge,
  Section,
  SectionIntro,
} from "@/components/site/ui";

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
    <Section id="industries" labelledBy="industries-heading" tone="lavender">
      <SectionIntro
        id="industries-heading"
        eyebrow="Industry Expertise"
        title="Industries We Serve"
        intro="We deliver vertical-specific digital solutions that address the unique challenges of major sectors across Africa."
      />
      <ul className="mt-14 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {industries.map(({ icon, label }) => (
          <li
            key={label}
            className="border-brand-100 hover:border-brand-300 flex items-center gap-4 rounded-2xl border bg-white p-5 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_36px_-24px_rgba(33,0,93,0.35)]"
          >
            <IconBadge icon={icon} className="size-11" />
            <span className="font-jakarta text-brand-950 min-w-0 font-bold break-words">
              {label}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-10">
        <ButtonLink href="/industries" variant="outline" arrow>
          Explore Industries
        </ButtonLink>
      </div>
    </Section>
  );
}
