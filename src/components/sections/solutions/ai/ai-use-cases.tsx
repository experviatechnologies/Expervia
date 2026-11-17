import {
  Landmark,
  Stethoscope,
  Factory,
  ShoppingBag,
  Building2,
  Zap,
  type LucideIcon,
} from "lucide-react";
import {
  IconBadge,
  Section,
  SectionIntro,
  cardClass,
} from "@/components/site/ui";
import { cn } from "@/lib/utils";

const useCases: { icon: LucideIcon; sector: string; useCase: string }[] = [
  {
    icon: Landmark,
    sector: "Financial Services",
    useCase: "Real-time fraud detection and credit risk scoring.",
  },
  {
    icon: Stethoscope,
    sector: "Healthcare",
    useCase: "Clinical document intelligence and diagnostic support.",
  },
  {
    icon: Factory,
    sector: "Manufacturing",
    useCase: "Predictive maintenance and automated quality inspection.",
  },
  {
    icon: ShoppingBag,
    sector: "Retail & Commerce",
    useCase: "Personalization engines and demand forecasting.",
  },
  {
    icon: Building2,
    sector: "Government",
    useCase: "Citizen-service assistants and document automation.",
  },
  {
    icon: Zap,
    sector: "Energy & Utilities",
    useCase: "Grid optimization and consumption forecasting.",
  },
];

export function AiUseCases() {
  return (
    <Section id="use-cases" labelledBy="ai-uses-heading" tone="lavender">
      <SectionIntro
        id="ai-uses-heading"
        eyebrow="AI in Action"
        title="Outcomes Across Every Industry"
        intro="We pair deep technical expertise with sector knowledge to apply AI where it creates measurable value."
      />
      <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {useCases.map(({ icon, sector, useCase }) => (
          <li key={sector} className={cn(cardClass, "flex gap-4")}>
            <IconBadge icon={icon} />
            <div>
              <h3 className="font-jakarta text-brand-950 text-lg font-bold">
                {sector}
              </h3>
              <p className="text-ink/75 mt-1 leading-relaxed">{useCase}</p>
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}
