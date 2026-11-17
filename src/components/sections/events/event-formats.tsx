import { Monitor, MapPin, Check, type LucideIcon } from "lucide-react";
import { IconBadge, Section, SectionIntro } from "@/components/site/ui";

type Format = {
  icon: LucideIcon;
  title: string;
  tagline: string;
  items: string[];
};

const formats: Format[] = [
  {
    icon: Monitor,
    title: "Online",
    tagline: "Join from anywhere across the continent.",
    items: [
      "Webinars",
      "Masterclasses",
      "Demos",
      "Q&A",
      "Panels",
      "Networking",
    ],
  },
  {
    icon: MapPin,
    title: "In Person",
    tagline: "Meet the community face to face.",
    items: [
      "Meetups",
      "Workshops",
      "Roundtables",
      "Conferences",
      "Networking",
      "Industry sessions",
    ],
  },
];

export function EventFormats() {
  return (
    <Section id="formats" labelledBy="formats-heading" tone="indigo">
      <SectionIntro
        id="formats-heading"
        eyebrow="How We Gather"
        title="Two Ways to Take Part"
        center
        dark
      />
      <ul className="mt-14 grid gap-5 md:grid-cols-2">
        {formats.map(({ icon, title, tagline, items }) => (
          <li
            key={title}
            className="flex flex-col rounded-3xl border border-white/10 bg-white/[0.04] p-7 backdrop-blur sm:p-9"
          >
            <IconBadge icon={icon} dark />
            <h3 className="font-jakarta mt-5 text-2xl font-bold text-white">
              {title}
            </h3>
            <p className="text-brand-100/80 mt-1.5">{tagline}</p>
            <ul className="mt-7 grid grid-cols-2 gap-3 border-t border-white/10 pt-6">
              {items.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2 text-sm font-medium text-white"
                >
                  <Check
                    aria-hidden
                    className="text-brand-200 size-4 shrink-0"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </Section>
  );
}
