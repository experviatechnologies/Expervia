import { ButtonLink } from "@/components/site/ui";
import { PageHero } from "@/components/site/page-hero";

export function ContactHero() {
  return (
    <PageHero
      id="contact-hero-heading"
      eyebrow="Get In Touch"
      title={
        <>
          Let&apos;s Build the{" "}
          <span className="text-brand-200">Future Together</span>
        </>
      }
      actions={
        <ButtonLink href="#contact-form" variant="light" arrow>
          Book a Consultation
        </ButtonLink>
      }
    >
      <p className="font-jakarta mt-6 text-xl font-bold text-white sm:text-2xl">
        Transform Your Business with AI, Cloud, Cybersecurity &amp; Digital
        Innovation
      </p>
      <p className="text-brand-100/85 mt-4 max-w-2xl text-lg leading-relaxed">
        Every successful transformation begins with a conversation. At Expervia
        Technologies, we partner with governments, enterprises, and healthcare
        organizations to solve complex challenges.
      </p>
    </PageHero>
  );
}
