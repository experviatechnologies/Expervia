import { ButtonLink } from "@/components/site/ui";
import { CtaPanel } from "@/components/site/cta-panel";

export function AiCta() {
  return (
    <CtaPanel
      id="ai-cta-heading"
      title="Ready to Put AI to Work?"
      intro="Let's find your highest-value use case and prove it in weeks, not years."
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
