import { ButtonLink } from "@/components/site/ui";
import { HeroChips, PageHero } from "@/components/site/page-hero";

const chips = [
  "Zero Trust",
  "Managed SOC",
  "Threat Detection",
  "Identity",
  "Incident Response",
  "Compliance",
];

export function CyberHero() {
  return (
    <PageHero
      id="cyber-hero-heading"
      eyebrow="Cybersecurity"
      title={
        <>
          Defend Your Enterprise Against an Evolving{" "}
          <span className="text-brand-200">Threat Landscape</span>
        </>
      }
      intro="Security-first architecture that protects your people, data, and digital assets, from Zero-Trust foundations to a managed SOC that detects and responds around the clock."
      actions={
        <>
          <ButtonLink href="/contact" variant="light" arrow>
            Talk to a Security Expert
          </ButtonLink>
          <ButtonLink href="/contact" variant="outlineLight">
            Book a Consultation
          </ButtonLink>
        </>
      }
    >
      <HeroChips items={chips} label="Security capabilities" />
    </PageHero>
  );
}
