import { ButtonLink } from "@/components/site/ui";
import { CtaPanel } from "@/components/site/cta-panel";

export function DataCta() {
  return (
    <CtaPanel
      id="data-cta-heading"
      title="Ready to Unlock Your Data?"
      intro="Let's turn your data into a competitive advantage, starting with a free maturity assessment."
    >
      <ButtonLink href="/contact" variant="light" arrow>
        Book a Consultation
      </ButtonLink>
      <ButtonLink href="/contact" variant="outlineLight">
        Request an Assessment
      </ButtonLink>
    </CtaPanel>
  );
}
