import { NetworkGraphic } from "@/components/site/network-graphic";

/**
 * Closing call-to-action panel from the Join ETEN design: a rounded indigo
 * gradient card with faint network illustrations, on a white band.
 */
export function CtaPanel({
  id,
  title,
  intro,
  children,
  footer,
}: {
  /** Heading id; also namespaces the background graphics. */
  id: string;
  title: React.ReactNode;
  intro?: React.ReactNode;
  /** The buttons. */
  children: React.ReactNode;
  /** Optional small content under the buttons. */
  footer?: React.ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      className="bg-white px-4 py-20 sm:px-6 sm:py-24 lg:px-8"
    >
      <div className="from-brand-950 via-brand-900 to-brand-700 relative isolate mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-gradient-to-br px-6 py-16 text-center text-white shadow-[0_40px_80px_-40px_rgba(33,0,93,0.9)] sm:px-12 sm:py-20">
        <NetworkGraphic
          idPrefix={`${id}-a`}
          className="absolute -top-20 -left-24 -z-10 w-[420px] opacity-30"
        />
        <NetworkGraphic
          idPrefix={`${id}-b`}
          className="absolute -right-24 -bottom-24 -z-10 w-[420px] rotate-180 opacity-30"
        />
        <h2
          id={id}
          className="font-jakarta mx-auto max-w-3xl text-3xl leading-tight font-extrabold tracking-tight text-balance sm:text-5xl"
        >
          {title}
        </h2>
        {intro && (
          <p className="text-brand-100/90 mx-auto mt-6 max-w-2xl text-lg leading-relaxed">
            {intro}
          </p>
        )}
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          {children}
        </div>
        {footer}
      </div>
    </section>
  );
}
