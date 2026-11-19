import {
  BrainCircuit,
  ShieldCheck,
  Waypoints,
  type LucideIcon,
} from "lucide-react";
import { IconBadge, Section, SectionIntro } from "@/components/site/ui";

const tracks: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: BrainCircuit,
    title: "AI & Intelligent Twins",
    body: "Deploying cognitive industrial models and predictive infrastructure across pan-African enterprise sectors.",
  },
  {
    icon: ShieldCheck,
    title: "Zero Trust Security",
    body: "Architecting resilient, borderless security frameworks for the modern hybrid workspace and government agencies.",
  },
  {
    icon: Waypoints,
    title: "Cloud-Network Synergy",
    body: "Optimizing the friction between compute power and network delivery for high-availability mission-critical apps.",
  },
];

export function SpecializationTracks() {
  return (
    <Section id="tracks" labelledBy="tracks-heading" tone="indigo">
      <SectionIntro
        id="tracks-heading"
        eyebrow="Specialization Tracks"
        title="Go Deeper Where It Matters"
        center
        dark
      />
      <ul className="mt-14 grid gap-5 lg:grid-cols-3">
        {tracks.map(({ icon, title, body }) => (
          <li
            key={title}
            className="rounded-3xl border border-white/10 bg-white/[0.04] p-7 backdrop-blur transition duration-300 hover:border-white/25 hover:bg-white/[0.08]"
          >
            <IconBadge icon={icon} dark />
            <h3 className="font-jakarta mt-5 text-xl font-bold text-white">
              {title}
            </h3>
            <p className="text-brand-100/80 mt-2 leading-relaxed">{body}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}
