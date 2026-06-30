import Link from "next/link";
import {
  ShieldAlert,
  Swords,
  Fingerprint,
  ClipboardCheck,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { Container } from "@/components/shared/container";
import { SectionLabel } from "@/components/shared/section-label";

const assessments: { icon: LucideIcon; title: string; body: string }[] = [
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
    <section className="bg-surface-container-low py-section">
      <Container>
        <div className="mb-16 max-w-3xl">
          <SectionLabel className="mb-4">Get Started</SectionLabel>
          <h2 className="font-display text-on-surface text-headline-lg mb-4 font-bold">
            Complimentary Security Assessments
          </h2>
          <p className="text-on-surface-variant text-body-lg">
            Get expert eyes on your environment and a prioritized roadmap to
            close your most critical risks first.
          </p>
        </div>
        <div className="gap-gutter grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {assessments.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="glass-card flex h-full flex-col rounded-2xl p-8 transition-all hover:bg-white/5"
            >
              <Icon className="text-primary mb-6 size-9" />
              <h3 className="font-display text-on-surface text-headline-md mb-2 font-semibold">
                {title}
              </h3>
              <p className="text-on-surface-variant mb-6 grow text-sm">
                {body}
              </p>
              <Link
                href="/contact"
                className="text-primary inline-flex items-center gap-2 font-bold hover:gap-3"
              >
                Request
                <ArrowRight className="size-4 transition-all" />
              </Link>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
