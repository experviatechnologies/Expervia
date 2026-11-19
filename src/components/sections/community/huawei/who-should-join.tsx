import {
  Cloud,
  Network,
  HardDrive,
  Zap,
  Radio,
  type LucideIcon,
} from "lucide-react";
import {
  IconBadge,
  Section,
  SectionIntro,
  cardClass,
} from "@/components/site/ui";

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
    <Section id="pillars" labelledBy="pillars-heading">
      <SectionIntro
        id="pillars-heading"
        eyebrow="Who Should Join"
        title="Five Technical Pillars"
        center
      />
      <ul className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {pillars.map(({ icon, title, tagline, tags }) => (
          <li key={title} className={`${cardClass} flex flex-col`}>
            <IconBadge icon={icon} />
            <h3 className="font-jakarta text-brand-950 mt-5 text-xl font-bold">
              {title}
            </h3>
            <p className="text-ink/75 mt-1.5">{tagline}</p>
            {tags.length > 0 && (
              <ul className="mt-auto flex flex-wrap gap-2 pt-6">
                {tags.map((t) => (
                  <li
                    key={t}
                    className="bg-lavender text-brand-800 rounded-full px-3 py-1 text-xs font-semibold"
                  >
                    {t}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </Section>
  );
}
