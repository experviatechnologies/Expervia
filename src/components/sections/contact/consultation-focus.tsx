"use client";

import {
  Bot,
  Cloud,
  ShieldCheck,
  Database,
  type LucideIcon,
} from "lucide-react";
import { SectionIntro } from "@/components/site/ui";
import { cn } from "@/lib/utils";

export const consultationOptions: { icon: LucideIcon; label: string }[] = [
  { icon: Bot, label: "AI & Automation Advisory" },
  { icon: Cloud, label: "Cloud Infrastructure (Azure/AWS)" },
  { icon: ShieldCheck, label: "Cybersecurity Governance" },
  { icon: Database, label: "Microsoft Copilot Readiness" },
];

/** Focus picker beside the contact form; the choice is sent with the form. */
export function ConsultationFocus({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (label: string) => void;
}) {
  return (
    <div className="lg:sticky lg:top-32">
      <SectionIntro
        id="consultation-heading"
        eyebrow="Talk to us"
        title="Strategic Consultation"
        intro="Select your area of strategic focus for a dedicated advisory session with our specialists."
      />
      <div
        role="radiogroup"
        aria-labelledby="consultation-heading"
        className="mt-8 space-y-3"
      >
        {consultationOptions.map(({ icon: Icon, label }) => {
          const active = selected === label;
          return (
            <button
              key={label}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onSelect(label)}
              className={cn(
                "focus-visible:ring-brand-300 flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition focus-visible:ring-4 focus-visible:outline-none",
                active
                  ? "border-brand-600 bg-brand-50 shadow-[0_16px_30px_-20px_rgba(33,0,93,0.45)]"
                  : "border-brand-100 hover:border-brand-300 bg-white",
              )}
            >
              <span
                className={cn(
                  "inline-flex size-11 shrink-0 items-center justify-center rounded-xl",
                  active
                    ? "bg-brand-700 text-white"
                    : "from-brand-50 to-brand-100 text-brand-700 ring-brand-200/70 bg-gradient-to-br ring-1",
                )}
              >
                <Icon aria-hidden className="size-5" />
              </span>
              <span className="font-jakarta text-brand-950 font-bold">
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
