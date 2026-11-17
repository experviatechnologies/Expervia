import { Section, SectionIntro, cardClass } from "@/components/site/ui";

const values = [
  {
    title: "Inclusion",
    description:
      "Every background, discipline and career stage has a place here.",
  },
  {
    title: "Respect",
    description:
      "We listen, encourage and treat every member and contributor with dignity.",
  },
  {
    title: "Growth",
    description:
      "We stay curious, keep learning and celebrate progress at every step.",
  },
  {
    title: "Collaboration",
    description:
      "We achieve more by sharing knowledge, ideas and opportunities.",
  },
  {
    title: "Integrity",
    description:
      "We are honest about what we offer and act with professionalism.",
  },
  {
    title: "Lifting Others",
    description:
      "As we rise, we open doors and make the path easier for the next woman.",
  },
];

export function WitValues() {
  return (
    <Section
      id="community-values"
      labelledBy="wit-values-heading"
      tone="lavender"
    >
      <SectionIntro
        id="wit-values-heading"
        eyebrow="Community Philosophy"
        title="The Values That Guide Us."
        center
      />
      <ol className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {values.map((v, i) => (
          <li key={v.title} className={cardClass}>
            <span
              aria-hidden
              className="font-jakarta text-brand-300 text-sm font-bold"
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <h3 className="font-jakarta text-brand-950 mt-3 text-lg font-bold">
              {v.title}
            </h3>
            <p className="text-ink/75 mt-2 leading-relaxed">{v.description}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
