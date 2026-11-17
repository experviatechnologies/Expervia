import { CalendarCheck, Clock } from "lucide-react";
import { Container } from "@/components/shared/container";
import { cn } from "@/lib/utils";
import { witProgrammes, type ProgrammeStatus } from "@/config/women-in-tech";
import { SectionHeading } from "./section-heading";

const STATUS_LABEL: Record<ProgrammeStatus, string> = {
  proposed: "Proposed",
  upcoming: "Upcoming",
  confirmed: "Confirmed",
};

export function WitProgrammes() {
  return (
    <section
      id="programmes"
      className="bg-surface-container-low py-section scroll-mt-36"
    >
      <Container className="max-w-7xl">
        <SectionHeading
          label="Programmes and Initiatives"
          title={
            <>
              Turning Community Into{" "}
              <span className="gradient-text">Meaningful Experiences.</span>
            </>
          }
          intro="Here is what we are building. Programmes are marked as proposed or upcoming until dates are confirmed, and confirmed details will be shared with members first."
        />
        <ul className="gap-gutter grid sm:grid-cols-2 lg:grid-cols-4">
          {witProgrammes.map((p) => {
            const confirmed = p.status === "confirmed";
            return (
              <li
                key={p.title}
                className="border-outline-variant/20 bg-surface flex flex-col rounded-2xl border p-6"
              >
                <span
                  className={cn(
                    "mb-5 inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[11px] font-medium tracking-wider uppercase",
                    confirmed
                      ? "bg-emerald-500/15 text-emerald-300"
                      : p.status === "upcoming"
                        ? "bg-primary/15 text-primary"
                        : "text-on-surface-variant bg-white/5",
                  )}
                >
                  {confirmed ? (
                    <CalendarCheck className="size-3.5" aria-hidden />
                  ) : (
                    <Clock className="size-3.5" aria-hidden />
                  )}
                  {STATUS_LABEL[p.status]}
                </span>
                <h3 className="font-display text-on-surface mb-2 text-lg font-bold">
                  {p.title}
                </h3>
                <p className="text-on-surface-variant text-sm leading-relaxed">
                  {p.description}
                </p>
                {confirmed && p.date && (
                  <p className="text-primary mt-4 text-sm font-semibold">
                    {p.date}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
