import Link from "next/link";
import {
  Gauge,
  DatabaseZap,
  LayoutDashboard,
  ClipboardCheck,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { Container } from "@/components/shared/container";
import { SectionLabel } from "@/components/shared/section-label";

const assessments: { icon: LucideIcon; title: string; body: string }[] = [
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
    <section className="bg-surface-container-low py-section">
      <Container>
        <div className="mb-16 max-w-3xl">
          <SectionLabel className="mb-4">Get Started</SectionLabel>
          <h2 className="font-display text-on-surface text-headline-lg mb-4 font-bold">
            Complimentary Data Assessments
          </h2>
          <p className="text-on-surface-variant text-body-lg">
            Get expert eyes on your data estate and a prioritized roadmap to
            unlock its value faster.
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
