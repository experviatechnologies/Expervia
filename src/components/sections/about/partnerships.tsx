import { Cloud, RadioTower, type LucideIcon } from "lucide-react";
import {
  IconBadge,
  Section,
  SectionIntro,
  cardClass,
} from "@/components/site/ui";

const partners: {
  icon: LucideIcon;
  title: string;
  body: string;
  tags: string[];
}[] = [
  {
    icon: Cloud,
    title: "Microsoft Solutions",
    body: "Advanced deployment of Azure Cloud, M365 Modern Workplace, and enterprise Security solutions.",
    tags: ["Azure AI", "Dynamics 365", "Sentinel"],
  },
  {
    icon: RadioTower,
    title: "Huawei Technologies",
    body: "Cutting-edge Cloud Stack, high-performance Data Storage, and Intelligent Networking infrastructure.",
    tags: ["Cloud Stack 8.x", "OceanStor", "AirEngine"],
  },
];

export function Partnerships() {
  return (
    <Section id="partnerships" labelledBy="partnerships-heading">
      <SectionIntro
        id="partnerships-heading"
        eyebrow="Our ecosystem"
        title="Strategic Ecosystem Partnerships"
        intro="We leverage world-class technology stacks to deliver local impact."
        center
      />
      <ul className="mt-14 grid gap-5 md:grid-cols-2">
        {partners.map(({ icon, title, body, tags }) => (
          <li key={title} className={`${cardClass} sm:p-9`}>
            <div className="flex items-center gap-4">
              <IconBadge icon={icon} />
              <h3 className="font-jakarta text-brand-950 text-xl font-bold">
                {title}
              </h3>
            </div>
            <p className="text-ink/75 mt-5 text-lg leading-relaxed">{body}</p>
            <ul
              aria-label={`${title} technologies`}
              className="mt-6 flex flex-wrap gap-2"
            >
              {tags.map((tag) => (
                <li
                  key={tag}
                  className="bg-lavender text-brand-800 rounded-full px-3 py-1 text-sm font-semibold"
                >
                  {tag}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </Section>
  );
}
