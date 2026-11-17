import {
  CloudUpload,
  Network,
  Container as ContainerIcon,
  ServerCog,
  ShieldCheck,
  PiggyBank,
} from "lucide-react";
import {
  CapabilityBento,
  type Capability,
} from "@/components/site/capability-bento";

const capabilities: Capability[] = [
  {
    name: "Cloud Strategy & Migration",
    icon: CloudUpload,
    eyebrow: "Zero-downtime cutovers",
    description:
      "Assess, plan, and execute seamless migrations (rehost, replatform, or refactor) onto secure, well-governed landing zones.",
    span: "lg:col-span-2",
    featured: true,
    tags: ["Azure Migrate", "Landing Zones", "Modernization"],
  },
  {
    name: "Hybrid & Multi-Cloud",
    icon: Network,
    description:
      "Unify workloads across Azure, Huawei Cloud, and on-prem with consistent governance and identity.",
    span: "lg:col-span-1",
  },
  {
    name: "Cloud-Native & Kubernetes",
    icon: ContainerIcon,
    description:
      "Containerize and modernize applications with AKS, microservices, and automated CI/CD.",
    span: "lg:col-span-1",
  },
  {
    name: "Managed Cloud Operations",
    icon: ServerCog,
    description:
      "24/7 monitoring, patching, and SRE practices that keep your platform fast and always-on.",
    span: "lg:col-span-1",
  },
  {
    name: "Cloud Security & Compliance",
    icon: ShieldCheck,
    description:
      "Zero-Trust architecture, identity, and compliance baked into every landing zone.",
    span: "lg:col-span-1",
  },
  {
    name: "FinOps & Cost Optimization",
    icon: PiggyBank,
    eyebrow: "Eliminate waste",
    description:
      "Continuous cost visibility, rightsizing, and reserved-capacity strategy so you only pay for what you use.",
    span: "lg:col-span-3",
  },
];

export function CloudCapabilities() {
  return (
    <CapabilityBento
      id="capabilities"
      eyebrow="What We Deliver"
      title="End-to-End Cloud Capabilities"
      items={capabilities}
    />
  );
}
