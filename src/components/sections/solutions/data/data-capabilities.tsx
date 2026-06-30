import {
  Database,
  Workflow,
  LayoutDashboard,
  TrendingUp,
  ShieldCheck,
  Compass,
  type LucideIcon,
} from "lucide-react";
import { Container } from "@/components/shared/container";
import { SectionLabel } from "@/components/shared/section-label";
import { cn } from "@/lib/utils";

type Capability = {
  name: string;
  icon: LucideIcon;
  description: string;
  span: string;
  eyebrow?: string;
  featured?: boolean;
  tags?: string[];
};

const capabilities: Capability[] = [
  {
    name: "Modern Data Platform",
    icon: Database,
    eyebrow: "One source of truth",
    description:
      "Unify warehouses, lakes, and streams into a governed lakehouse on Microsoft Fabric and Azure — ready for analytics and AI.",
    span: "lg:col-span-2",
    featured: true,
    tags: ["Lakehouse", "Microsoft Fabric", "Azure Synapse"],
  },
  {
    name: "Data Engineering & Pipelines",
    icon: Workflow,
    description:
      "Reliable, automated pipelines that ingest and transform data from every source, at any scale.",
    span: "lg:col-span-1",
  },
  {
    name: "Business Intelligence & Dashboards",
    icon: LayoutDashboard,
    description:
      "Self-service Power BI dashboards that put trusted, real-time metrics in every decision-maker's hands.",
    span: "lg:col-span-1",
  },
  {
    name: "Advanced & Predictive Analytics",
    icon: TrendingUp,
    description:
      "Forecasting, segmentation, and ML models that turn historical data into forward-looking decisions.",
    span: "lg:col-span-1",
  },
  {
    name: "Data Governance & Quality",
    icon: ShieldCheck,
    description:
      "Cataloging, lineage, and quality controls with Microsoft Purview — trustworthy data, by design.",
    span: "lg:col-span-1",
  },
  {
    name: "Data Strategy & Architecture",
    icon: Compass,
    eyebrow: "Built on outcomes",
    description:
      "We start with the decisions you need to make, then design the data architecture and roadmap to support them.",
    span: "lg:col-span-3",
  },
];

export function DataCapabilities() {
  return (
    <section className="bg-surface-container-low py-section">
      <Container>
        <div className="mb-16 text-center">
          <SectionLabel className="mb-4">What We Deliver</SectionLabel>
          <h2 className="font-display text-on-surface text-headline-lg font-bold">
            End-to-End Data Capabilities
          </h2>
        </div>

        <div className="gap-gutter grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {capabilities.map(
            ({
              name,
              icon: Icon,
              description,
              span,
              eyebrow,
              featured,
              tags,
            }) => (
              <article
                key={name}
                className={cn(
                  "glass-card hover:border-primary/50 relative flex flex-col overflow-hidden rounded-2xl p-8 transition-all",
                  span,
                  featured &&
                    "from-primary/10 bg-gradient-to-br to-transparent",
                )}
              >
                <div className="relative z-10 flex grow flex-col">
                  <div className="bg-primary/10 text-primary mb-6 flex size-12 items-center justify-center rounded-lg">
                    <Icon className="size-6" />
                  </div>
                  {eyebrow && (
                    <span className="text-label-sm text-primary mb-2 font-mono tracking-wider uppercase">
                      {eyebrow}
                    </span>
                  )}
                  <h3
                    className={cn(
                      "font-display text-on-surface mb-2 font-semibold",
                      featured ? "text-headline-lg" : "text-headline-md",
                    )}
                  >
                    {name}
                  </h3>
                  <p className="text-on-surface-variant max-w-md">
                    {description}
                  </p>

                  {tags && (
                    <div className="mt-auto flex flex-wrap gap-2 pt-6">
                      {tags.map((t) => (
                        <span
                          key={t}
                          className="rounded-full bg-white/5 px-3 py-1 font-mono text-[10px] tracking-wider uppercase"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            ),
          )}
        </div>
      </Container>
    </section>
  );
}
