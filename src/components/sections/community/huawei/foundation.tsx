import { Section, SectionIntro } from "@/components/site/ui";

export function Foundation() {
  return (
    <Section id="foundation" labelledBy="foundation-heading">
      <SectionIntro
        id="foundation-heading"
        eyebrow="Our Foundation"
        title="Bridging the Gap Between Certification and Commercial Opportunity."
        intro="We are building a Pan-African network of Huawei Cloud, AI, Security, and Intelligent Infrastructure professionals. Our goal is to unify technical excellence with high-stakes enterprise projects across the continent."
        center
      />
    </Section>
  );
}
