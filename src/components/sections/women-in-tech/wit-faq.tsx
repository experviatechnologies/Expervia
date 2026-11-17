"use client";

import { Container } from "@/components/shared/container";
import { SectionLabel } from "@/components/shared/section-label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { trackEvent } from "@/lib/analytics";
import { witFaqs } from "@/config/women-in-tech";

export function WitFaq() {
  return (
    <section id="faqs" className="py-section scroll-mt-36">
      <Container className="max-w-7xl">
        <div className="flex flex-col gap-12 lg:flex-row lg:gap-16">
          <div className="lg:w-1/3">
            <SectionLabel className="mb-4">FAQs</SectionLabel>
            <h2 className="font-display text-on-surface text-headline-lg mb-5 font-bold">
              Frequently Asked Questions
            </h2>
            <p className="text-on-surface-variant">
              Quick answers about joining, contributing and what to expect from
              ETEN Women in Tech.
            </p>
          </div>
          <div className="lg:w-2/3">
            <Accordion
              type="single"
              collapsible
              className="space-y-3"
              onValueChange={(value) => {
                if (value)
                  trackEvent("women_in_tech_faq_open", {
                    question: Number(value.replace("faq-", "")) + 1,
                  });
              }}
            >
              {witFaqs.map((faq, i) => (
                <AccordionItem
                  key={faq.question}
                  value={`faq-${i}`}
                  className="border-outline-variant/20 bg-surface-container-low rounded-xl border px-6 not-last:border-b"
                >
                  <AccordionTrigger className="font-display text-on-surface py-5 text-left text-base font-semibold hover:no-underline sm:text-lg">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-on-surface-variant pb-5 text-base leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </Container>
    </section>
  );
}
