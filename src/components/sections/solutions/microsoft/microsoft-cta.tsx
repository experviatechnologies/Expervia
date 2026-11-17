import { ButtonLink } from "@/components/site/ui";
import { CtaPanel } from "@/components/site/cta-panel";

export function MicrosoftCta() {
  return (
    <CtaPanel
      id="microsoft-cta-heading"
      title="Ready to Unlock the Full Power of Microsoft?"
      intro="Join hundreds of organizations who have modernized their infrastructure with Expervia."
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
