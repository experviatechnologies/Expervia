import {
  BrainCircuit,
  ShieldCheck,
  Waypoints,
  type LucideIcon,
} from "lucide-react";
import { Container } from "@/components/shared/container";
import { SectionLabel } from "@/components/shared/section-label";

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
    <section className="bg-surface py-section">
      <Container>
        <div className="mb-16 text-center">
          <SectionLabel className="mb-4">Specialization Tracks</SectionLabel>
          <h2 className="font-display text-on-surface text-headline-lg font-bold">
            Go Deeper Where It Matters
          </h2>
        </div>

        <div className="gap-gutter grid grid-cols-1 lg:grid-cols-3">
          {tracks.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="bg-surface-container hover:border-primary/40 space-y-4 rounded-xl border border-white/5 p-8 transition-colors"
            >
              <Icon className="text-primary size-8" />
              <h3 className="font-display text-on-surface text-headline-md font-semibold">
                {title}
              </h3>
              <p className="text-on-surface-variant">{body}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
