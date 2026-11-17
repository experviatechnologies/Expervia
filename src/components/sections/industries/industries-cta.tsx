import Link from "next/link";
import { ButtonLink } from "@/components/site/ui";
import { CtaPanel } from "@/components/site/cta-panel";

export function IndustriesCta() {
  return (
    <CtaPanel
      id="industries-cta-heading"
      title="Building the Intelligent Enterprise Across Every Industry"
      intro="Technology is reshaping every sector. Partner with Expervia to lead your industry's digital evolution."
      footer={
        <Link
          href="/contact"
          className="text-brand-200 mt-7 inline-block text-xs font-bold tracking-[0.2em] uppercase transition-colors hover:text-white"
        >
          Request an Assessment
        </Link>
      }
    >
      <ButtonLink href="/contact" variant="light" arrow>
        Book an Industry Consultation
      </ButtonLink>
      <ButtonLink href="/contact" variant="outlineLight">
        Speak with an Expert
      </ButtonLink>
    </CtaPanel>
  );
}
