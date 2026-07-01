import { Container } from "@/components/shared/container";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What industries does Expervia serve?",
    answer:
      "Expervia Technologies specializes in serving complex, high-compliance sectors including Government Agencies, Financial Institutions, Healthcare Providers, Large-Scale Utilities, Retail, and Professional Services across Africa and beyond.",
  },
  {
    question: "How does your Microsoft licensing work?",
    answer:
      "As a Microsoft Cloud Solutions Partner, we offer flexible monthly or annual billing, centralized license management, and expert technical support to optimize your Microsoft 365 and Azure investment.",
  },
  {
    question: "What is the typical engagement process?",
    answer:
      "Our process begins with a Discovery Session, followed by a detailed Maturity Assessment. From there, we develop a strategic roadmap and move into Proof of Concept (PoC) before full-scale implementation.",
  },
];

export function Faq() {
  return (
    <section className="bg-surface py-section">
      <Container>
        <div className="flex flex-col gap-16 lg:flex-row">
          <div className="lg:w-1/3">
            <h2 className="font-display text-on-surface text-headline-lg mb-6 font-bold">
              Frequently Asked Questions
            </h2>
            <p className="text-on-surface-variant">
              Finding answers to common queries regarding our engagement models
              and services.
            </p>
          </div>
          <div className="lg:w-2/3">
            <Accordion
              type="single"
              collapsible
              defaultValue="faq-0"
              className="space-y-4"
            >
              {faqs.map((faq, i) => (
                <AccordionItem
                  key={faq.question}
                  value={`faq-${i}`}
                  className="glass-card rounded-xl border-none px-6"
                >
                  <AccordionTrigger className="font-display text-on-surface text-headline-md py-6 font-semibold hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-on-surface-variant border-t border-white/5 pt-4 text-base">
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
