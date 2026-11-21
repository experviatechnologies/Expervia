import { ContactHero } from "@/components/sections/contact/contact-hero";
import { ContactChannels } from "@/components/sections/contact/contact-channels";
import { ContactFormSection } from "@/components/sections/contact/contact-form-section";
import { Assessments } from "@/components/sections/contact/assessments";
import { Faq } from "@/components/sections/contact/faq";
import { CommunityCta } from "@/components/sections/contact/community-cta";
import { ContactFinalCta } from "@/components/sections/contact/contact-final-cta";
import { pageMeta } from "@/lib/seo";
import { ServingAfrica } from "@/components/site/internal-links";

export const metadata = pageMeta("/contact");

export default function ContactPage() {
  return (
    <>
      <ContactHero />
      <ContactChannels />
      <ContactFormSection />
      <Assessments />
      <Faq />
      <CommunityCta />
      <ServingAfrica tone="lavender" />
      <ContactFinalCta />
    </>
  );
}
