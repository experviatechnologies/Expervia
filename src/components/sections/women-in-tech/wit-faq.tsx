"use client";

import { Section, SectionIntro } from "@/components/site/ui";
import { FaqList } from "@/components/site/faq-list";
import { trackEvent } from "@/lib/analytics";
import { witFaqs } from "@/config/women-in-tech";

export function WitFaq() {
  return (
    <Section id="faqs" labelledBy="wit-faq-heading">
      <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <SectionIntro
          id="wit-faq-heading"
          eyebrow="FAQs"
          title="Frequently Asked Questions"
          intro="Quick answers about joining, contributing and what to expect from ETEN Women in Tech."
        />
        <FaqList
          items={witFaqs}
          onOpen={(i) =>
            trackEvent("women_in_tech_faq_open", { question: i + 1 })
          }
        />
      </div>
    </Section>
  );
}
