import { SectionLabel } from "@/components/shared/section-label";

/** Centred eyebrow + heading + optional intro used by most sections. */
export function SectionHeading({
  label,
  title,
  intro,
}: {
  label: string;
  title: React.ReactNode;
  intro?: string;
}) {
  return (
    <div className="mx-auto mb-14 max-w-3xl text-center">
      <SectionLabel className="mb-4">{label}</SectionLabel>
      <h2 className="font-display text-on-surface text-headline-lg font-bold text-balance">
        {title}
      </h2>
      {intro && (
        <p className="text-on-surface-variant text-body-lg mt-5">{intro}</p>
      )}
    </div>
  );
}
