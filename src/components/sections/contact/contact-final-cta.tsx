import { ButtonLink } from "@/components/site/ui";
import { CtaPanel } from "@/components/site/cta-panel";

export function ContactFinalCta() {
  return (
    <CtaPanel
      id="contact-cta-heading"
      title="Ready to Start Your Transformation Journey?"
    >
      <ButtonLink href="#contact-form" variant="light" arrow>
        Book a Consultation
      </ButtonLink>
      <ButtonLink href="#contact-form" variant="outlineLight">
        Request an Assessment
      </ButtonLink>
    </CtaPanel>
  );
}
