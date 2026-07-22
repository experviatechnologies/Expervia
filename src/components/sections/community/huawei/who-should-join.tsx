import {
  Cloud,
  Network,
  HardDrive,
  Zap,
  Radio,
  type LucideIcon,
} from "lucide-react";
import { Container } from "@/components/shared/container";
import { SectionLabel } from "@/components/shared/section-label";

type Pillar = {
  icon: LucideIcon;
  title: string;
  tagline: string;
  tags: string[];
};

const pillars: Pillar[] = [
  {
    icon: Cloud,
    title: "Cloud & Computing",
    tagline: "Architecting the enterprise backbone.",
    tags: [
      "HCIA / HCIP / HCIE",
      "Huawei Cloud Architects",
      "Cloud Service Engineers",
      "Data Center Facility Experts",
    ],
  },
  {
    icon: Network,
    title: "IP Networking",
    tagline: "Master the backbone of digital connection.",
    tags: ["Datacom Engineers", "WLAN Specialists", "Network Security"],
  },
  {
    icon: HardDrive,
    title: "Storage",
    tagline: "Reliable data architecture.",
    tags: ["OceanStor Data Management"],
  },
  {
    icon: Zap,
    title: "Digital Power",
    tagline: "Powering resilient infrastructure.",
    tags: ["Solar / PV Engineers", "DC Energy Specialists"],
  },
  {
    icon: Radio,
    title: "Wireless",
    tagline: "eLTE / 5G & Microwave.",
    tags: [],
  },
];

export function WhoShouldJoin() {
  return (
    <section className="bg-surface-container-low py-section">
      <Container>
        <div className="mb-16 text-center">
          <SectionLabel className="mb-4">Who Should Join</SectionLabel>
          <h2 className="font-display text-on-surface text-headline-lg font-bold">
            Five Technical Pillars
          </h2>
        </div>

        <div className="gap-gutter grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {pillars.map(({ icon: Icon, title, tagline, tags }) => (
            <article
              key={title}
              className="glass-card hover:border-primary/50 flex flex-col rounded-2xl p-8 transition-all"
            >
              <div className="bg-primary/10 text-primary mb-6 flex size-12 items-center justify-center rounded-lg">
                <Icon className="size-6" />
              </div>
              <h3 className="font-display text-on-surface text-headline-md mb-2 font-semibold">
                {title}
              </h3>
              <p className="text-on-surface-variant text-sm">{tagline}</p>

              {tags.length > 0 && (
                <div className="mt-auto flex flex-wrap gap-2 pt-6">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-white/5 px-3 py-1 font-mono text-[10px] tracking-wider uppercase"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
