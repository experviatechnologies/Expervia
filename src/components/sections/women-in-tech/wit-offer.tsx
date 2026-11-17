import {
  BookOpen,
  HeartHandshake,
  Network,
  Megaphone,
  Crown,
  Users,
  DoorOpen,
  ShieldCheck,
  BrainCircuit,
  Cloud,
  Code2,
  BarChart3,
  Palette,
  ClipboardList,
  Workflow,
  Rocket,
  GraduationCap,
  Compass,
  Sprout,
  Briefcase,
  Lightbulb,
  Star,
  type LucideIcon,
} from "lucide-react";
import { Container } from "@/components/shared/container";
import { SectionHeading } from "./section-heading";

type Item = { icon: LucideIcon; title: string; description: string };

const benefits: Item[] = [
  {
    icon: BookOpen,
    title: "Practical Learning",
    description:
      "Build real, job-relevant skills through sessions, workshops and shared resources.",
  },
  {
    icon: HeartHandshake,
    title: "Mentorship and Guidance",
    description:
      "Learn from experienced women and practitioners who have walked the path.",
  },
  {
    icon: Network,
    title: "Professional Network",
    description:
      "Form lasting relationships with peers, role models and industry professionals.",
  },
  {
    icon: Megaphone,
    title: "Visibility",
    description:
      "Share your work and ideas, and get recognised for what you bring to technology.",
  },
  {
    icon: Crown,
    title: "Leadership Development",
    description:
      "Grow the confidence and capability to lead teams, projects and conversations.",
  },
  {
    icon: Users,
    title: "Collaboration",
    description:
      "Work with other members on ideas, projects and community initiatives.",
  },
  {
    icon: DoorOpen,
    title: "Access to Opportunities",
    description:
      "Hear about learning, career and collaboration opportunities as they become available.",
  },
  {
    icon: Sprout,
    title: "A Supportive Space",
    description:
      "An inclusive, encouraging community where every stage of the journey is respected.",
  },
];

const focusAreas: { icon: LucideIcon; title: string }[] = [
  { icon: BrainCircuit, title: "Artificial Intelligence" },
  { icon: BarChart3, title: "Data and Analytics" },
  { icon: ShieldCheck, title: "Cybersecurity" },
  { icon: Cloud, title: "Cloud Computing" },
  { icon: Code2, title: "Software Engineering" },
  { icon: Palette, title: "Product and UX Design" },
  { icon: ClipboardList, title: "Product and Project Management" },
  { icon: Workflow, title: "Digital Transformation" },
  { icon: Rocket, title: "Entrepreneurship and Innovation" },
  { icon: Crown, title: "Technology Leadership" },
];

const audiences: Item[] = [
  {
    icon: GraduationCap,
    title: "Students and Undergraduates",
    description:
      "Explore technology pathways, meet role models and start learning early.",
  },
  {
    icon: Compass,
    title: "Beginners and Career Explorers",
    description:
      "Curious about tech? No advanced technical background is required to join.",
  },
  {
    icon: Sprout,
    title: "Emerging Professionals",
    description:
      "Build skills, confidence, your network and a clear career direction.",
  },
  {
    icon: Briefcase,
    title: "Experienced Professionals",
    description:
      "Share your expertise, grow your visibility and support the next generation.",
  },
  {
    icon: Lightbulb,
    title: "Entrepreneurs and Innovators",
    description:
      "Connect with peers, test ideas and explore collaboration and partnerships.",
  },
  {
    icon: Star,
    title: "Technology Leaders and Experts",
    description:
      "Help develop talent and take part in shaping the community as a leader.",
  },
];

export function WitWhyJoin() {
  return (
    <section id="why-join" className="py-section scroll-mt-36">
      <Container className="max-w-7xl">
        <SectionHeading
          label="Why Join"
          title={
            <>
              Your Growth Deserves the{" "}
              <span className="gradient-text">Right Support System.</span>
            </>
          }
          intro="Everything in ETEN Women in Tech is built around helping you learn, connect and move forward with confidence."
        />
        <ul className="gap-gutter grid sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map(({ icon: Icon, title, description }) => (
            <li key={title} className="glass-card rounded-2xl p-6">
              <span className="bg-primary/10 text-primary mb-5 inline-flex size-11 items-center justify-center rounded-xl">
                <Icon className="size-5" aria-hidden />
              </span>
              <h3 className="font-display text-on-surface mb-2 text-lg font-bold">
                {title}
              </h3>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                {description}
              </p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

export function WitFocusAreas() {
  return (
    <section
      id="focus-areas"
      className="bg-surface-container-low py-section scroll-mt-36"
    >
      <Container className="max-w-7xl">
        <SectionHeading
          label="Focus Areas"
          title={
            <>
              Find Your Place in the{" "}
              <span className="gradient-text">Technology Ecosystem.</span>
            </>
          }
          intro="Technology is far bigger than code. Our community spans the technical, product, business and leadership disciplines that shape it."
        />
        <ul className="gap-gutter grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
          {focusAreas.map(({ icon: Icon, title }) => (
            <li
              key={title}
              className="border-outline-variant/20 hover:border-primary/50 bg-surface flex items-center gap-4 rounded-xl border p-5 transition-colors lg:flex-col lg:items-start lg:gap-3"
            >
              <Icon className="text-primary size-6 shrink-0" aria-hidden />
              <span className="text-on-surface font-semibold">{title}</span>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

export function WitWhoShouldJoin() {
  return (
    <section id="who-should-join" className="py-section scroll-mt-36">
      <Container className="max-w-7xl">
        <SectionHeading
          label="Who Should Join"
          title={
            <>
              There Is a <span className="gradient-text">Place for You</span>{" "}
              Here.
            </>
          }
          intro="Wherever you are in your technology journey, you belong in this community."
        />
        <ul className="gap-gutter grid sm:grid-cols-2 lg:grid-cols-3">
          {audiences.map(({ icon: Icon, title, description }) => (
            <li
              key={title}
              className="border-outline-variant/20 bg-surface-container-low flex gap-4 rounded-2xl border p-6"
            >
              <span className="bg-brand/15 text-primary inline-flex size-11 shrink-0 items-center justify-center rounded-full">
                <Icon className="size-5" aria-hidden />
              </span>
              <div>
                <h3 className="font-display text-on-surface mb-1.5 text-lg font-bold">
                  {title}
                </h3>
                <p className="text-on-surface-variant text-sm leading-relaxed">
                  {description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
