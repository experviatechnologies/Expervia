import { ShieldAlert, Swords, Fingerprint, ClipboardCheck } from "lucide-react";
import {
  AssessmentGrid,
  type Assessment,
} from "@/components/site/assessment-grid";

const assessments: Assessment[] = [
  {
    icon: ShieldAlert,
    title: "Security Posture Assessment",
    body: "A clear-eyed view of your risks, gaps, and the fastest path to resilience.",
  },
  {
    icon: Swords,
    title: "Penetration Testing",
    body: "Ethical hackers probe your defenses to find weaknesses before adversaries do.",
  },
  {
    icon: Fingerprint,
    title: "Identity & Zero-Trust Review",
    body: "Evaluate access, MFA, and privilege against Zero-Trust best practice.",
  },
  {
    icon: ClipboardCheck,
    title: "Compliance Readiness",
    body: "Benchmark your controls against ISO 27001, SOC 2, and NDPR requirements.",
  },
];

export function CyberAssessments() {
  return (
    <AssessmentGrid
      id="cyber-assessments"
      title="Complimentary Security Assessments"
      intro="Get expert eyes on your environment and a prioritized roadmap to close your most critical risks first."
      items={assessments}
    />
  );
}
