import {
  GraduationCap,
  Wrench,
  Users,
  Compass,
  RefreshCw,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { Container } from "@/components/shared/container";
import { SectionLabel } from "@/components/shared/section-label";

const benefits: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: GraduationCap,
    title: "Learn From Practitioners",
    body: "Sessions led by engineers and architects who ship real systems — not theory decks.",
  },
  {
    icon: Wrench,
    title: "Practical Knowledge",
    body: "Hands-on workshops and live demos you can put to work the very next morning.",
  },
  {
    icon: Users,
    title: "Build Your Network",
    body: "Connect with peers, mentors, and hiring teams across the African tech ecosystem.",
  },
  {
    icon: Compass,
    title: "Discover Opportunities",
    body: "Surface roles, projects, and partnerships opening up inside the network.",
  },
  {
    icon: RefreshCw,
    title: "Stay Current",
    body: "Keep pace with Microsoft, cloud, AI, and security as the landscape evolves.",
  },
  {
    icon: TrendingUp,
    title: "Grow Your Career",
    body: "Turn your certifications into commercial momentum, visibility, and reputation.",
  },
];

export function WhyAttend() {
  return (
    <section className="bg-surface py-section">
      <Container>
        <div className="mb-16 text-center">
          <SectionLabel className="mb-4">
            More Than Just Another Webinar
          </SectionLabel>
          <h2 className="font-display text-on-surface text-headline-lg font-bold">
            Where Technology Professionals Connect and Grow
          </h2>
        </div>

        <div className="gap-gutter grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="bg-surface-container hover:border-primary/40 space-y-4 rounded-xl border border-white/5 p-8 transition-colors"
            >
              <div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-lg">
                <Icon className="size-6" />
              </div>
              <h3 className="font-display text-on-surface text-headline-md font-semibold">
                {title}
              </h3>
              <p className="text-on-surface-variant text-sm">{body}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
