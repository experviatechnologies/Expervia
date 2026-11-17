import {
  Gauge,
  DatabaseZap,
  LayoutDashboard,
  ClipboardCheck,
} from "lucide-react";
import {
  AssessmentGrid,
  type Assessment,
} from "@/components/site/assessment-grid";

const assessments: Assessment[] = [
  {
    icon: Gauge,
    title: "Data Maturity Assessment",
    body: "Benchmark your data capabilities and chart the path to becoming data-driven.",
  },
  {
    icon: DatabaseZap,
    title: "Platform Modernization Review",
    body: "Evaluate your stack and plan the move to a modern, AI-ready data platform.",
  },
  {
    icon: LayoutDashboard,
    title: "BI & Reporting Audit",
    body: "Review your dashboards and metrics for accuracy, adoption, and impact.",
  },
  {
    icon: ClipboardCheck,
    title: "Data Governance Review",
    body: "Assess quality, lineage, and compliance against best practice and NDPR.",
  },
];

export function DataAssessments() {
  return (
    <AssessmentGrid
      id="data-assessments"
      title="Complimentary Data Assessments"
      intro="Get expert eyes on your data estate and a prioritized roadmap to unlock its value faster."
      items={assessments}
    />
  );
}
