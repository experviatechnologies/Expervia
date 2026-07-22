import { Container } from "@/components/shared/container";
import { SectionLabel } from "@/components/shared/section-label";

export function Foundation() {
  return (
    <section id="foundation" className="bg-surface-container-low py-section">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <SectionLabel className="mb-4">Our Foundation</SectionLabel>
          <h2 className="font-display text-on-surface text-headline-lg mb-8 font-bold">
            Bridging the Gap Between Certification and Commercial Opportunity.
          </h2>
          <p className="text-body-lg text-on-surface-variant">
            We are building a Pan-African network of Huawei Cloud, AI, Security,
            and Intelligent Infrastructure professionals. Our goal is to unify
            technical excellence with high-stakes enterprise projects across the
            continent.
          </p>
        </div>
      </Container>
    </section>
  );
}
