import { CalendarCheck, Clock } from "lucide-react";
import { Section, SectionIntro } from "@/components/site/ui";
import { cn } from "@/lib/utils";
import { witProgrammes, type ProgrammeStatus } from "@/config/women-in-tech";

const STATUS_LABEL: Record<ProgrammeStatus, string> = {
  proposed: "Proposed",
  upcoming: "Upcoming",
  confirmed: "Confirmed",
};

export function WitProgrammes() {
  return (
    <Section id="programmes" labelledBy="wit-prog-heading" tone="indigo">
      <SectionIntro
        id="wit-prog-heading"
        eyebrow="Programmes and Initiatives"
        title="Turning Community Into Meaningful Experiences."
        intro="Here is what we are building. Programmes are marked as proposed or upcoming until dates are confirmed, and confirmed details will be shared with members first."
        dark
      />
      <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {witProgrammes.map((p) => {
          const confirmed = p.status === "confirmed";
          return (
            <li
              key={p.title}
              className="flex flex-col rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur transition duration-300 hover:border-white/25 hover:bg-white/[0.08]"
            >
              <span
                className={cn(
                  "inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold tracking-[0.14em] uppercase",
                  confirmed
                    ? "bg-emerald-400/15 text-emerald-200"
                    : p.status === "upcoming"
                      ? "text-brand-950 bg-brand-200"
                      : "text-brand-100 bg-white/10",
                )}
              >
                {confirmed ? (
                  <CalendarCheck aria-hidden className="size-3.5" />
                ) : (
                  <Clock aria-hidden className="size-3.5" />
                )}
                {STATUS_LABEL[p.status]}
              </span>
              <h3 className="font-jakarta mt-5 text-lg font-bold text-white">
                {p.title}
              </h3>
              <p className="text-brand-100/80 mt-2 leading-relaxed">
                {p.description}
              </p>
              {confirmed && p.date && (
                <p className="text-brand-200 mt-4 text-sm font-semibold">
                  {p.date}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
