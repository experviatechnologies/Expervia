import { Cloud, Bot, Users, Lock, Briefcase, Workflow } from "lucide-react";
import {
  CapabilityBento,
  type Capability,
} from "@/components/site/capability-bento";

const products: Capability[] = [
  {
    name: "Microsoft Azure",
    icon: Cloud,
    eyebrow: "Build, Innovate & Scale",
    description:
      "Cloud strategy, seamless migration, and multi-layered security architecture on the world's most trusted cloud.",
    span: "lg:col-span-2",
    featured: true,
    tags: ["Migration", "IaaS / PaaS", "Azure OpenAI"],
  },
  {
    name: "Microsoft Copilot",
    icon: Bot,
    description:
      "Transform productivity with AI through readiness assessments and strategic implementation.",
    span: "lg:col-span-1",
    features: ["AI Adoption Roadmap", "Data Governance"],
  },
  {
    name: "Microsoft 365",
    icon: Users,
    description:
      "Empower your workforce with Teams, SharePoint, and Defender for advanced, secure collaboration.",
    span: "lg:col-span-1",
  },
  {
    name: "Microsoft Security",
    icon: Lock,
    description:
      "Security built for the modern enterprise, featuring Defender, Sentinel, and Purview.",
    span: "lg:col-span-1",
    tags: ["Defender", "Sentinel", "Purview"],
  },
  {
    name: "Dynamics 365",
    icon: Briefcase,
    description:
      "Unify CRM and ERP across sales, service, and operations with intelligent business applications.",
    span: "lg:col-span-1",
  },
  {
    name: "Power Platform",
    icon: Workflow,
    eyebrow: "Automate & Analyze",
    description:
      "Low-code apps, automated workflows, and Power BI analytics that turn raw data into decisions.",
    span: "lg:col-span-3",
  },
];

export function Capabilities() {
  return (
    <CapabilityBento
      id="capabilities"
      eyebrow="Enterprise Ecosystem"
      title="Future-Proof Microsoft Solutions"
      items={products}
    />
  );
}
