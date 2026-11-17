import {
  BrainCircuit,
  ShieldCheck,
  Factory,
  LineChart,
  type LucideIcon,
} from "lucide-react";
import {
  IconBadge,
  Section,
  SectionIntro,
  cardClass,
} from "@/components/site/ui";

const values: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: BrainCircuit,
    title: "AI & Cloud Specialists",
    body: "Deep expertise in Azure OpenAI and custom LLM deployments for the enterprise.",
  },
  {
    icon: ShieldCheck,
    title: "Security-First Approach",
    body: "Zero-Trust architectures built into every cloud environment we deploy.",
  },
  {
    icon: Factory,
    title: "Industry-Focused",
    body: "Customized solutions for manufacturing, finance, and healthcare sectors.",
  },
  {
    icon: LineChart,
    title: "Data-Driven Growth",
    body: "Leveraging the full Power Platform to turn raw data into strategic decisions.",
  },
];

export function WhyPartner() {
  return (
    <Section id="why-partner" labelledBy="why-partner-heading">
      <div className="grid gap-12 lg:grid-cols-3 lg:gap-16">
        <SectionIntro
          id="why-partner-heading"
          eyebrow="Why Expervia"
          title="Your Trusted Microsoft Partner"
          intro="We don't just implement software; we engineer competitive advantages using the world's most powerful ecosystem."
        />
        <ul className="grid gap-5 sm:grid-cols-2 lg:col-span-2">
          {values.map(({ icon, title, body }) => (
            <li key={title} className={cardClass}>
              <IconBadge icon={icon} />
              <h3 className="font-jakarta text-brand-950 mt-5 text-lg font-bold">
                {title}
              </h3>
              <p className="text-ink/75 mt-2.5 leading-relaxed">{body}</p>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
