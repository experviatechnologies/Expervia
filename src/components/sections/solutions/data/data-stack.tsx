import {
  Layers,
  Database,
  ChartColumn,
  Cpu,
  type LucideIcon,
} from "lucide-react";
import {
  IconBadge,
  Section,
  SectionIntro,
  cardClass,
} from "@/components/site/ui";

const stack: { icon: LucideIcon; name: string; body: string }[] = [
  {
    icon: Layers,
    name: "Microsoft Fabric",
    body: "An end-to-end, unified analytics platform from data ingestion to BI.",
  },
  {
    icon: Database,
    name: "Azure Synapse",
    body: "Enterprise data warehousing and big-data analytics at massive scale.",
  },
  {
    icon: ChartColumn,
    name: "Power BI",
    body: "Self-service dashboards and reporting trusted across the organization.",
  },
  {
    icon: Cpu,
    name: "Azure Databricks",
    body: "Lakehouse engineering and machine learning on a collaborative platform.",
  },
];

export function DataStack() {
  return (
    <Section id="stack" labelledBy="data-stack-heading" tone="lavender">
      <SectionIntro
        id="data-stack-heading"
        eyebrow="Platform Expertise"
        title="The Data Platform We Master"
        intro="As a Microsoft AI Cloud Partner, we build on a modern, integrated data stack: scalable, governed, and AI-ready."
      />
      <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stack.map(({ icon, name, body }) => (
          <li key={name} className={cardClass}>
            <IconBadge icon={icon} />
            <h3 className="font-jakarta text-brand-950 mt-5 text-lg font-bold">
              {name}
            </h3>
            <p className="text-ink/75 mt-2.5 leading-relaxed">{body}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}
