import {
  Sparkles,
  TrendingUp,
  Eye,
  MessagesSquare,
  Workflow,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { IconBadge, Section, SectionIntro } from "@/components/site/ui";
import { cn } from "@/lib/utils";

type Capability = {
  name: string;
  icon: LucideIcon;
  description: string;
  span: string;
  eyebrow?: string;
  featured?: boolean;
  tags?: string[];
};

const capabilities: Capability[] = [
  {
    name: "Generative AI & LLMs",
    icon: Sparkles,
    eyebrow: "Grounded in your data",
    description:
      "Custom copilots, retrieval-augmented generation over your knowledge base, and Azure OpenAI deployments that stay secure and on-brand.",
    span: "lg:col-span-2",
    featured: true,
    tags: ["Azure OpenAI", "RAG", "Copilots"],
  },
  {
    name: "Predictive Analytics & ML",
    icon: TrendingUp,
    description:
      "Forecasting, demand planning, churn and risk models that anticipate what happens next.",
    span: "lg:col-span-1",
  },
  {
    name: "Computer Vision",
    icon: Eye,
    description:
      "Automated quality inspection, OCR, and object detection that bring intelligence to the physical world.",
    span: "lg:col-span-1",
  },
  {
    name: "Natural Language Processing",
    icon: MessagesSquare,
    description:
      "Document intelligence, conversational assistants, and sentiment analysis at enterprise scale.",
    span: "lg:col-span-1",
  },
  {
    name: "Intelligent Automation",
    icon: Workflow,
    description:
      "Combine AI with workflow automation to remove manual toil across end-to-end processes.",
    span: "lg:col-span-1",
  },
  {
    name: "AI Strategy & Governance",
    icon: ShieldCheck,
    eyebrow: "Scale with confidence",
    description:
      "Use-case roadmaps, MLOps foundations, and responsible-AI frameworks that turn pilots into production at scale.",
    span: "lg:col-span-3",
  },
];

export function AiCapabilities() {
  return (
    <Section id="capabilities" labelledBy="ai-cap-heading" tone="lavender">
      <SectionIntro
        id="ai-cap-heading"
        eyebrow="What We Build"
        title="Enterprise AI Capabilities"
        center
      />
      <ul className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {capabilities.map(
          ({ name, icon, description, span, eyebrow, featured, tags }) => (
            <li
              key={name}
              className={cn(
                "relative flex flex-col overflow-hidden rounded-3xl p-7 sm:p-9",
                span,
                featured
                  ? "bg-brand-900 text-white shadow-[0_24px_50px_-28px_rgba(33,0,93,0.8)] md:col-span-2"
                  : "border-brand-100 hover:border-brand-200 border bg-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_40px_-24px_rgba(33,0,93,0.35)]",
              )}
            >
              {featured && (
                <div
                  aria-hidden
                  className="bg-brand-600/40 absolute -right-24 -bottom-24 size-72 rounded-full blur-3xl"
                />
              )}
              <div className="relative flex grow flex-col">
                <IconBadge icon={icon} dark={featured} />
                {eyebrow && (
                  <p
                    className={cn(
                      "mt-6 text-xs font-bold tracking-[0.2em] uppercase",
                      featured ? "text-brand-200" : "text-brand-600",
                    )}
                  >
                    {eyebrow}
                  </p>
                )}
                <h3
                  className={cn(
                    "font-jakarta font-bold",
                    eyebrow ? "mt-2" : "mt-5",
                    featured
                      ? "text-2xl text-white sm:text-3xl"
                      : "text-brand-950 text-xl",
                  )}
                >
                  {name}
                </h3>
                <p
                  className={cn(
                    "mt-3 max-w-xl leading-relaxed",
                    featured ? "text-brand-100/90 text-lg" : "text-ink/75",
                  )}
                >
                  {description}
                </p>
                {tags && (
                  <ul className="mt-auto flex flex-wrap gap-2 pt-7">
                    {tags.map((t) => (
                      <li
                        key={t}
                        className="text-brand-50 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold"
                      >
                        {t}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          ),
        )}
      </ul>
    </Section>
  );
}
