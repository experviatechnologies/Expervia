import { Monitor, MapPin, Check, type LucideIcon } from "lucide-react";
import { Container } from "@/components/shared/container";
import { SectionLabel } from "@/components/shared/section-label";

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
    items: ["Webinars", "Masterclasses", "Demos", "Q&A", "Panels", "Networking"],
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
    <section className="bg-surface py-section">
      <Container>
        <div className="mb-16 text-center">
          <SectionLabel className="mb-4">How We Gather</SectionLabel>
          <h2 className="font-display text-on-surface text-headline-lg font-bold">
            Two Ways to Take Part
          </h2>
        </div>

        <div className="gap-gutter grid grid-cols-1 md:grid-cols-2">
          {formats.map(({ icon: Icon, title, tagline, items }) => (
            <article
              key={title}
              className="glass-card hover:border-primary/50 flex flex-col rounded-2xl p-8 transition-all md:p-10"
            >
              <div className="bg-primary/10 text-primary mb-6 flex size-12 items-center justify-center rounded-lg">
                <Icon className="size-6" />
              </div>
              <h3 className="font-display text-on-surface text-headline-md mb-2 font-semibold">
                {title}
              </h3>
              <p className="text-on-surface-variant mb-8 text-sm">{tagline}</p>

              <ul className="mt-auto grid grid-cols-2 gap-3">
                {items.map((item) => (
                  <li
                    key={item}
                    className="text-on-surface flex items-center gap-2 text-sm"
                  >
                    <Check className="text-primary size-4 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
