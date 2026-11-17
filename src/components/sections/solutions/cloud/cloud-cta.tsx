import { ButtonLink } from "@/components/site/ui";
import { CtaPanel } from "@/components/site/cta-panel";

export function CloudCta() {
  return (
    <CtaPanel
      id="cloud-cta-heading"
      title="Ready to Move to the Cloud?"
      intro="Let's map your path to a secure, scalable, cost-efficient cloud, starting with a free assessment."
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
