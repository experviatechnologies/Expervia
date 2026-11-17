import { Gauge, Database, Sparkles, ShieldCheck } from "lucide-react";
import {
  AssessmentGrid,
  type Assessment,
} from "@/components/site/assessment-grid";

const assessments: Assessment[] = [
  {
    icon: Gauge,
    title: "AI Readiness",
    body: "Benchmark your data, infrastructure, and skills against AI deployment requirements.",
  },
  {
    icon: Database,
    title: "Data Foundation",
    body: "Evaluate data quality, pipelines, and governance for analytics and ML.",
  },
  {
    icon: Sparkles,
    title: "Generative AI Readiness",
    body: "Audit your environment and permissions for secure, grounded GenAI rollout.",
  },
  {
    icon: ShieldCheck,
    title: "Responsible-AI Audit",
    body: "Review models and processes against fairness, privacy, and compliance standards.",
  },
];

export function AiAssessments() {
  return (
    <AssessmentGrid
      id="ai-assessments"
      title="Complimentary AI Assessments"
      intro="Get expert eyes on your environment and a clear, prioritized roadmap to production AI."
      items={assessments}
    />
  );
}
