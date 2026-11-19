import { Section, SectionIntro } from "@/components/site/ui";
import { FaqList } from "@/components/site/faq-list";

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
    <Section id="faqs" labelledBy="contact-faq-heading">
      <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <SectionIntro
          id="contact-faq-heading"
          eyebrow="FAQs"
          title="Frequently Asked Questions"
          intro="Finding answers to common queries regarding our engagement models and services."
        />
        <FaqList items={faqs} />
      </div>
    </Section>
  );
}
