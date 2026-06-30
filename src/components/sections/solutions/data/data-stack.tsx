import {
  Layers,
  Database,
  ChartColumn,
  Cpu,
  type LucideIcon,
} from "lucide-react";
import { Container } from "@/components/shared/container";
import { SectionLabel } from "@/components/shared/section-label";

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
    <section className="bg-surface-container-lowest py-section">
      <Container>
        <div className="mb-16 max-w-2xl">
          <SectionLabel className="mb-4">Platform Expertise</SectionLabel>
          <h2 className="font-display text-on-surface text-headline-lg mb-4 font-bold">
            The Data Platform We Master
          </h2>
          <p className="text-on-surface-variant text-body-lg">
            As a Microsoft AI Cloud Partner, we build on a modern, integrated
            data stack — scalable, governed, and AI-ready.
          </p>
        </div>
        <div className="gap-gutter grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {stack.map(({ icon: Icon, name, body }) => (
            <div
              key={name}
              className="bg-surface-container hover:border-primary/40 rounded-xl border border-white/5 p-8 transition-colors"
            >
              <Icon className="text-primary mb-6 size-8" />
              <h3 className="font-display text-on-surface text-headline-md mb-2 font-semibold">
                {name}
              </h3>
              <p className="text-on-surface-variant text-sm">{body}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
