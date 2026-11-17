import { Gauge, CloudUpload, PiggyBank, ClipboardCheck } from "lucide-react";
import {
  AssessmentGrid,
  type Assessment,
} from "@/components/site/assessment-grid";

const assessments: Assessment[] = [
  {
    icon: Gauge,
    title: "Cloud Readiness",
    body: "Evaluate your infrastructure, apps, and skills for a successful cloud move.",
  },
  {
    icon: CloudUpload,
    title: "Migration Assessment",
    body: "Map workloads and dependencies into a phased, low-risk migration plan.",
  },
  {
    icon: PiggyBank,
    title: "FinOps & Cost Review",
    body: "Find waste and savings opportunities across your current cloud spend.",
  },
  {
    icon: ClipboardCheck,
    title: "Well-Architected Review",
    body: "Benchmark your environment against security, reliability, and cost pillars.",
  },
];

export function CloudAssessments() {
  return (
    <AssessmentGrid
      id="cloud-assessments"
      title="Complimentary Cloud Assessments"
      intro="Get expert eyes on your environment and a clear, prioritized roadmap to a modern cloud."
      items={assessments}
    />
  );
}
