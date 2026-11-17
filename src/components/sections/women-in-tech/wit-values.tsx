import { Container } from "@/components/shared/container";
import { SectionHeading } from "./section-heading";

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
    <section
      id="community-values"
      className="bg-surface-container-low py-section scroll-mt-36"
    >
      <Container className="max-w-7xl">
        <SectionHeading
          label="Community Philosophy"
          title={
            <>
              The Values That <span className="gradient-text">Guide Us.</span>
            </>
          }
        />
        <ol className="gap-gutter grid sm:grid-cols-2 lg:grid-cols-3">
          {values.map((v, i) => (
            <li
              key={v.title}
              className="border-outline-variant/20 bg-surface rounded-2xl border p-6"
            >
              <span
                aria-hidden
                className="text-primary/60 mb-3 block font-mono text-sm"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="font-display text-on-surface mb-2 text-lg font-bold">
                {v.title}
              </h3>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                {v.description}
              </p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
