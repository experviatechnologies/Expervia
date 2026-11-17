import {
  Sparkles,
  TrendingUp,
  Eye,
  MessagesSquare,
  Workflow,
  ShieldCheck,
} from "lucide-react";
import {
  CapabilityBento,
  type Capability,
} from "@/components/site/capability-bento";

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
    <CapabilityBento
      id="capabilities"
      title="Enterprise AI Capabilities"
      items={capabilities}
    />
  );
}
