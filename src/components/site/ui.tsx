/**
 * Building blocks for the new public-site look (Join ETEN design, Nov 2026).
 * Pages being moved to the new design compose these instead of repeating the
 * classes, so every redesigned page shares one rhythm:
 * white / lavender / indigo bands, an eyebrow + Plus Jakarta heading, pill CTAs
 * and soft-ringed icon badges.
 */
import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type Tone = "white" | "lavender" | "indigo";

const toneClass: Record<Tone, string> = {
  white: "bg-white text-ink",
  lavender: "bg-lavender text-ink",
  indigo: "bg-brand-950 text-white overflow-hidden",
};

/** A full-width page band with the design's vertical rhythm. */
export function Section({
  id,
  labelledBy,
  tone = "white",
  className,
  children,
}: {
  id?: string;
  labelledBy?: string;
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cn(
        "relative scroll-mt-36 py-20 sm:py-24 lg:py-28",
        toneClass[tone],
        className,
      )}
    >
      {tone === "indigo" && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_500px_at_100%_0%,rgba(100,38,220,0.55),transparent_60%),radial-gradient(700px_400px_at_0%_100%,rgba(100,38,220,0.3),transparent_60%)]"
        />
      )}
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </section>
  );
}

/** Eyebrow + heading (+ optional intro) at the top of a section. */
export function SectionIntro({
  id,
  eyebrow,
  title,
  intro,
  center = false,
  dark = false,
  className,
}: {
  id?: string;
  eyebrow: string;
  title: React.ReactNode;
  intro?: React.ReactNode;
  center?: boolean;
  dark?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn("max-w-3xl", center && "mx-auto text-center", className)}
    >
      <p
        className={cn(
          "text-xs font-bold tracking-[0.2em] uppercase",
          dark ? "text-brand-200" : "text-brand-600",
        )}
      >
        {eyebrow}
      </p>
      <h2
        id={id}
        className={cn(
          "font-jakarta mt-4 text-3xl leading-tight font-extrabold tracking-tight text-balance sm:text-4xl lg:text-[2.75rem]",
          dark ? "text-white" : "text-brand-950",
        )}
      >
        {title}
      </h2>
      {intro && (
        <p
          className={cn(
            "mt-5 text-lg leading-relaxed",
            dark ? "text-brand-100/85" : "text-ink/75",
          )}
        >
          {intro}
        </p>
      )}
    </div>
  );
}

type ButtonVariant = "primary" | "light" | "outlineLight" | "outline";

const buttonVariant: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-700 text-white shadow-[0_10px_30px_-10px_rgba(100,38,220,0.7)] hover:bg-brand-600",
  light:
    "bg-white text-brand-950 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.5)] hover:bg-lavender",
  outlineLight:
    "border border-white/30 bg-white/5 text-white backdrop-blur hover:border-white/60 hover:bg-white/10",
  outline:
    "border border-brand-200 bg-white text-brand-800 hover:border-brand-400 hover:bg-lavender",
};

export const buttonClass = (variant: ButtonVariant = "primary") =>
  cn(
    "group inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold tracking-[0.08em] uppercase transition duration-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-400 motion-safe:hover:-translate-y-0.5",
    buttonVariant[variant],
  );

/** Pill CTA link. `arrow` adds the trailing arrow from the design. */
export function ButtonLink({
  href,
  variant = "primary",
  arrow = false,
  className,
  children,
  ...rest
}: React.ComponentProps<typeof Link> & {
  variant?: ButtonVariant;
  arrow?: boolean;
}) {
  return (
    <Link href={href} className={cn(buttonClass(variant), className)} {...rest}>
      {children}
      {arrow && (
        <ArrowRight
          aria-hidden
          className="size-4 transition-transform group-hover:translate-x-0.5"
        />
      )}
    </Link>
  );
}

/** Rounded icon tile. `dark` is the variant used on indigo surfaces. */
export function IconBadge({
  icon: Icon,
  dark = false,
  className,
}: {
  icon: LucideIcon;
  dark?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex size-12 shrink-0 items-center justify-center rounded-2xl",
        dark
          ? "text-brand-100 bg-white/10 ring-1 ring-white/15"
          : "from-brand-50 to-brand-100 text-brand-700 ring-brand-200/70 bg-gradient-to-br ring-1",
        className,
      )}
    >
      <Icon aria-hidden className="size-6" />
    </span>
  );
}

/** White card with the design's lift-on-hover. */
export const cardClass =
  "rounded-3xl border border-brand-100 bg-white p-7 transition duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-[0_24px_40px_-24px_rgba(33,0,93,0.35)]";

/**
 * Sticky "on this page" bar that sits under the fixed site header (80px).
 * `label` is the short name shown on the left (e.g. "ETEN").
 */
export function PageSubnav({
  label,
  links,
}: {
  label: string;
  links: readonly { id: string; label: string }[];
}) {
  return (
    <div className="border-brand-100 sticky top-20 z-40 border-b bg-white">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        <span className="font-jakarta text-brand-950 hidden shrink-0 text-sm font-extrabold tracking-tight md:block">
          {label}
        </span>
        <nav
          aria-label="On this page"
          className="min-w-0 flex-1 [scrollbar-width:none] overflow-x-auto [&::-webkit-scrollbar]:hidden"
        >
          <ul className="flex items-center gap-1 whitespace-nowrap">
            {links.map((l) => (
              <li key={l.id}>
                <a
                  href={`#${l.id}`}
                  className="text-ink/70 hover:bg-lavender hover:text-brand-800 focus-visible:ring-brand-400 inline-block rounded-full px-3 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}
