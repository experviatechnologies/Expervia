import { NetworkGraphic } from "@/components/site/network-graphic";
import { cn } from "@/lib/utils";

/**
 * Indigo page hero from the Join ETEN design, shared by the redesigned pages.
 * Sits under the fixed 80px site header. Pass `aside` for a right-hand column
 * (cards, image); without it the network illustration fills the right side
 * on large screens.
 */
export function PageHero({
  id,
  eyebrow,
  title,
  intro,
  children,
  actions,
  aside,
  graphic = true,
}: {
  /** Heading id; also used to namespace the background graphic. */
  id: string;
  eyebrow: string;
  title: React.ReactNode;
  intro?: React.ReactNode;
  /** Extra content between the intro and the actions (chips, subtitle). */
  children?: React.ReactNode;
  actions?: React.ReactNode;
  aside?: React.ReactNode;
  graphic?: boolean;
}) {
  return (
    <section
      aria-labelledby={id}
      className="bg-brand-950 relative isolate overflow-hidden pt-20 text-white"
    >
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(1200px_600px_at_85%_-10%,rgba(100,38,220,0.65),transparent_60%),radial-gradient(800px_500px_at_-10%_110%,rgba(124,77,255,0.35),transparent_60%),linear-gradient(160deg,#21005D_0%,#2D006B_55%,#1A0049_100%)]"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)] bg-[size:56px_56px]"
      />
      {graphic && !aside && (
        <NetworkGraphic
          idPrefix={`${id}-net`}
          className="absolute top-24 -right-16 -z-10 hidden w-[520px] opacity-50 lg:block"
        />
      )}
      <div
        className={cn(
          "mx-auto max-w-7xl px-4 pt-16 pb-20 sm:px-6 sm:pt-20 lg:px-8 lg:pt-24 lg:pb-28",
          aside &&
            "grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14",
        )}
      >
        <div className={cn(!aside && "max-w-3xl")}>
          <p className="text-brand-100 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold tracking-[0.18em] uppercase">
            <span aria-hidden className="bg-brand-300 size-1.5 rounded-full" />
            {eyebrow}
          </p>
          <h1
            id={id}
            className="font-jakarta mt-6 text-[2.4rem] leading-[1.05] font-extrabold tracking-tight text-balance sm:text-5xl lg:text-[3.6rem]"
          >
            {title}
          </h1>
          {intro && (
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/90 sm:text-xl">
              {intro}
            </p>
          )}
          {children}
          {actions && (
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {actions}
            </div>
          )}
        </div>
        {aside}
      </div>
    </section>
  );
}

/** Rounded chips under a hero intro (e.g. capability names). */
export function HeroChips({
  items,
  label,
}: {
  items: readonly string[];
  label: string;
}) {
  return (
    <ul aria-label={label} className="mt-7 flex flex-wrap gap-2">
      {items.map((c) => (
        <li
          key={c}
          className="text-brand-50 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium backdrop-blur"
        >
          {c}
        </li>
      ))}
    </ul>
  );
}
