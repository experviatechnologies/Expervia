import {
  Radar,
  Fingerprint,
  CloudCog,
  Bug,
  Lock,
  GraduationCap,
} from "lucide-react";
import {
  CapabilityBento,
  type Capability,
} from "@/components/site/capability-bento";

const capabilities: Capability[] = [
  {
    name: "Managed Detection & Response",
    icon: Radar,
    eyebrow: "24/7 SOC",
    description:
      "A managed Security Operations Center that monitors, hunts, and responds to threats in real time, so an attack is contained before it becomes a breach.",
    span: "lg:col-span-2",
    featured: true,
    tags: ["SIEM", "Threat Hunting", "Incident Response"],
  },
  {
    name: "Identity & Access Management",
    icon: Fingerprint,
    description:
      "Zero-Trust identity with MFA, conditional access, and least-privilege across every user and device.",
    span: "lg:col-span-1",
  },
  {
    name: "Cloud & Infrastructure Security",
    icon: CloudCog,
    description:
      "Harden Azure, Huawei Cloud, and hybrid estates with posture management and continuous protection.",
    span: "lg:col-span-1",
  },
  {
    name: "Threat & Vulnerability Management",
    icon: Bug,
    description:
      "Penetration testing, vulnerability scanning, and remediation that close gaps before attackers find them.",
    span: "lg:col-span-1",
  },
  {
    name: "Data Protection & Compliance",
    icon: Lock,
    description:
      "Encryption, DLP, and governance aligned to ISO 27001, SOC 2, and Nigeria's NDPR.",
    span: "lg:col-span-1",
  },
  {
    name: "Security Awareness & Governance",
    icon: GraduationCap,
    eyebrow: "Your people, hardened",
    description:
      "Phishing simulations, staff training, and GRC programs that turn your workforce into a resilient first line of defense.",
    span: "lg:col-span-3",
  },
];

export function CyberCapabilities() {
  return (
    <CapabilityBento
      id="capabilities"
      eyebrow="What We Deliver"
      title="End-to-End Security Capabilities"
      items={capabilities}
    />
  );
}
