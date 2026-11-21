import { Section, SectionIntro } from "@/components/site/ui";

export function WhatIsEmpc() {
  return (
    <Section id="foundation" labelledBy="empc-heading">
      <SectionIntro
        id="empc-heading"
        eyebrow="What is EMPC?"
        title="The Expervia Microsoft Professionals Community"
        intro="A Pan-African professional growth and opportunity ecosystem designed for technical excellence and strategic commercial advancement."
        center
      />
      <p className="text-ink/75 mx-auto mt-5 max-w-3xl text-center text-lg leading-relaxed">
        We aren&apos;t just a group or a membership list; we are an elite
        workforce engine that connects certified talent with high-value
        enterprise projects, consulting engagements, and training assignments
        across the continent.
      </p>
    </Section>
  );
}
