import { Container } from "@/components/shared/container";
import { SectionLabel } from "@/components/shared/section-label";

export function WhatIsEmpc() {
  return (
    <section id="foundation" className="bg-surface py-section">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <SectionLabel className="mb-4">What is EMPC?</SectionLabel>
          <h2 className="font-display text-on-surface text-headline-lg mb-8 font-bold">
            The Expervia Microsoft Professionals Community
          </h2>
          <p className="text-body-lg text-on-surface-variant mb-4">
            A Pan-African professional growth and opportunity ecosystem designed
            for technical excellence and strategic commercial advancement.
          </p>
          <p className="text-body-lg text-on-surface-variant">
            We aren&apos;t just a group or a membership list; we are an elite
            workforce engine that connects certified talent with high-value
            enterprise projects, consulting engagements, and training
            assignments across the continent.
          </p>
        </div>
      </Container>
    </section>
  );
}
