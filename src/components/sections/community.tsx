import { Users } from "lucide-react";
import { ButtonLink, Section } from "@/components/site/ui";

/** Home: invitation into the ETEN community. */
export function Community() {
  return (
    <Section id="resources" labelledBy="community-heading">
      <div className="from-brand-900 to-brand-700 relative overflow-hidden rounded-[2rem] bg-gradient-to-br px-6 py-14 text-center text-white shadow-[0_30px_60px_-30px_rgba(33,0,93,0.7)] sm:px-12 md:py-20">
        <div
          aria-hidden
          className="absolute -top-20 -right-20 size-72 rounded-full bg-white/10 blur-3xl"
        />
        <div
          aria-hidden
          className="bg-brand-400/30 absolute -bottom-24 -left-24 size-72 rounded-full blur-3xl"
        />
        <div className="relative">
          <span className="mx-auto inline-flex size-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
            <Users aria-hidden className="size-6" />
          </span>
          <p className="text-brand-200 mt-6 text-xs font-bold tracking-[0.2em] uppercase">
            Empowering Africa
          </p>
          <h2
            id="community-heading"
            className="font-jakarta mx-auto mt-4 max-w-3xl text-3xl leading-tight font-extrabold tracking-tight text-balance sm:text-4xl lg:text-5xl"
          >
            Building Africa&apos;s Next Generation of{" "}
            <span className="text-brand-200">
              AI &amp; Cloud Professionals.
            </span>
          </h2>
          <p className="text-brand-100/90 mx-auto mt-6 max-w-3xl text-lg leading-relaxed">
            Join the Expervia AI &amp; Cloud Community. We are dedicated to
            bridging the digital skills gap by providing world-class training,
            mentorship, and opportunities to talent across the continent.
          </p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink href="/join-eten" variant="light" arrow>
              Join the Community
            </ButtonLink>
            <ButtonLink href="/contact" variant="outlineLight">
              View Training Programs
            </ButtonLink>
          </div>
        </div>
      </div>
    </Section>
  );
}
