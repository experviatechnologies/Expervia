import {
  Database,
  Workflow,
  LayoutDashboard,
  TrendingUp,
  ShieldCheck,
  Compass,
} from "lucide-react";
import {
  CapabilityBento,
  type Capability,
} from "@/components/site/capability-bento";

const capabilities: Capability[] = [
  {
    name: "Modern Data Platform",
    icon: Database,
    eyebrow: "One source of truth",
    description:
      "Unify warehouses, lakes, and streams into a governed lakehouse on Microsoft Fabric and Azure, ready for analytics and AI.",
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
      "Cataloging, lineage, and quality controls with Microsoft Purview: trustworthy data, by design.",
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
    <CapabilityBento
      id="capabilities"
      eyebrow="What We Deliver"
      title="End-to-End Data Capabilities"
      items={capabilities}
    />
  );
}
