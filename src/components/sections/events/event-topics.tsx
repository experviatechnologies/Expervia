import {
  Cloud,
  BrainCircuit,
  ShieldCheck,
  LayoutGrid,
  BarChart3,
  Boxes,
  Rocket,
  Compass,
  type LucideIcon,
} from "lucide-react";
import { IconBadge, Section, SectionIntro } from "@/components/site/ui";

const topics: { icon: LucideIcon; label: string }[] = [
  { icon: Cloud, label: "Microsoft Azure" },
  { icon: BrainCircuit, label: "AI & Copilot" },
  { icon: ShieldCheck, label: "Cybersecurity" },
  { icon: LayoutGrid, label: "Microsoft 365" },
  { icon: BarChart3, label: "Data & Analytics" },
  { icon: Boxes, label: "Business Applications" },
  { icon: Rocket, label: "Digital Transformation" },
  { icon: Compass, label: "Technology Leadership" },
];

export function EventTopics() {
  return (
    <Section id="topics" labelledBy="topics-heading">
      <SectionIntro
        id="topics-heading"
        eyebrow="What We Cover"
        title="Every Session, Grounded in Real Technology"
        intro="From cloud architecture to AI adoption and security governance, ETEN events span the technologies driving the modern African enterprise."
        center
      />
      <ul className="mt-14 grid grid-cols-2 gap-4 md:grid-cols-4">
        {topics.map(({ icon, label }) => (
          <li
            key={label}
            className="border-brand-100 hover:border-brand-300 flex flex-col items-center gap-4 rounded-3xl border bg-white p-6 text-center transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_36px_-24px_rgba(33,0,93,0.35)]"
          >
            <IconBadge icon={icon} />
            <span className="font-jakarta text-brand-950 font-bold">
              {label}
            </span>
          </li>
        ))}
      </ul>
    </Section>
  );
}
