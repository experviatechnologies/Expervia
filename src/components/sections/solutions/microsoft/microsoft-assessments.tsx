import { Zap, CloudUpload, Bot, ShieldAlert } from "lucide-react";
import {
  AssessmentGrid,
  type Assessment,
} from "@/components/site/assessment-grid";

const assessments: Assessment[] = [
  {
    icon: Zap,
    title: "AI Readiness",
    body: "Evaluate your data infrastructure and security posture for Azure OpenAI integration.",
  },
  {
    icon: CloudUpload,
    title: "Cloud Readiness",
    body: "Identify legacy workloads ready for migration and modernization on Azure.",
  },
  {
    icon: Bot,
    title: "Copilot Readiness",
    body: "Audit your Microsoft 365 environment and data permissions for secure AI deployment.",
  },
  {
    icon: ShieldAlert,
    title: "Cyber Risk",
    body: "A deep dive into your current security landscape and threat exposure.",
  },
];

export function MicrosoftAssessments() {
  return (
    <AssessmentGrid
      id="microsoft-assessments"
      title="Complimentary Executive Assessments"
      intro="Get expert eyes on your environment. Our strategic assessments provide you with a detailed roadmap for modernization."
      items={assessments}
    />
  );
}
