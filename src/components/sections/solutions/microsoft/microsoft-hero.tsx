import { ButtonLink } from "@/components/site/ui";
import { HeroChips, PageHero } from "@/components/site/page-hero";

const products = [
  "Azure",
  "Microsoft 365",
  "Copilot",
  "Dynamics 365",
  "Power Platform",
  "Security",
];

export function MicrosoftHero() {
  return (
    <PageHero
      id="microsoft-hero-heading"
      eyebrow="Microsoft AI Cloud Partner"
      title={
        <>
          Accelerate <span className="text-brand-200">Innovation</span> with
          Microsoft Technologies
        </>
      }
      intro="AI. Cloud. Security. Productivity. Transformation. As a Microsoft AI Cloud Partner and Microsoft Cloud Solutions Partner, Expervia helps organizations modernize securely and intelligently."
      actions={
        <>
          <ButtonLink href="/contact" variant="light" arrow>
            Speak with a Specialist
          </ButtonLink>
          <ButtonLink href="/contact" variant="outlineLight">
            Book a Consultation
          </ButtonLink>
        </>
      }
    >
      <HeroChips items={products} label="Microsoft products" />
    </PageHero>
  );
}
