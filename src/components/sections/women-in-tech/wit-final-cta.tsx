import Link from "next/link";
import { ArrowRight, Mail, Phone } from "lucide-react";
import { buttonClass } from "@/components/site/ui";
import { NetworkGraphic } from "@/components/site/network-graphic";
import { siteConfig } from "@/config/site";
import { WIT_JOIN_HREF } from "@/config/women-in-tech";
import { TrackedLink } from "./tracking";

const MENTORSHIP_HREF = process.env.NEXT_PUBLIC_MENTORSHIP_HOST
  ? `https://${process.env.NEXT_PUBLIC_MENTORSHIP_HOST}`
  : "/mentorship";

export function WitFinalCta() {
  const { emails, phones } = siteConfig.contact;
  return (
    <section
      aria-labelledby="wit-final-heading"
      className="bg-white px-4 pb-20 sm:px-6 sm:pb-24 lg:px-8"
    >
      <div className="from-brand-950 via-brand-900 to-brand-700 relative isolate mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-gradient-to-br px-6 py-16 text-center text-white shadow-[0_40px_80px_-40px_rgba(33,0,93,0.9)] sm:px-12 sm:py-20">
        <NetworkGraphic
          idPrefix="wit-cta-a"
          className="absolute -top-20 -left-24 -z-10 w-[420px] opacity-30"
        />
        <NetworkGraphic
          idPrefix="wit-cta-b"
          className="absolute -right-24 -bottom-24 -z-10 w-[420px] rotate-180 opacity-30"
        />
        <p className="text-brand-200 text-xs font-bold tracking-[0.2em] uppercase">
          Connect. Empower. Lead.
        </p>
        <h2
          id="wit-final-heading"
          className="font-jakarta mx-auto mt-4 max-w-3xl text-3xl leading-tight font-extrabold tracking-tight sm:text-5xl"
        >
          Your Journey. Your Voice. Your Future.
        </h2>
        <p className="text-brand-100/90 mx-auto mt-6 max-w-2xl text-lg leading-relaxed">
          Join a community of women learning, connecting and leading in
          technology, or share your experience to help others rise.
        </p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <TrackedLink
            href={WIT_JOIN_HREF}
            event="women_in_tech_join_click"
            location="final_cta"
            className={buttonClass("light")}
          >
            Join ETEN Women in Tech
            <ArrowRight
              aria-hidden
              className="size-4 transition-transform group-hover:translate-x-0.5"
            />
          </TrackedLink>
          <TrackedLink
            href="#contribute"
            event="women_in_tech_contributor_click"
            location="final_cta"
            className={buttonClass("outlineLight")}
          >
            Become a Contributor
          </TrackedLink>
        </div>

        <div className="text-brand-100 mt-12 flex flex-col items-center justify-center gap-x-8 gap-y-3 text-sm sm:flex-row sm:flex-wrap">
          <a
            href={`mailto:${emails.general}?subject=${encodeURIComponent("ETEN Women in Tech")}`}
            className="inline-flex items-center gap-2 transition-colors hover:text-white"
          >
            <Mail aria-hidden className="size-4" />
            {emails.general}
          </a>
          {phones.map((p) => (
            <a
              key={p}
              href={`tel:${p.replace(/\s+/g, "")}`}
              className="inline-flex items-center gap-2 transition-colors hover:text-white"
            >
              <Phone aria-hidden className="size-4" />
              {p}
            </a>
          ))}
        </div>
        <p className="text-brand-200 mt-6 text-sm">
          Part of the Expervia Technologies Expert Network (ETEN). Explore{" "}
          <Link
            href="/join-eten"
            className="font-semibold text-white underline-offset-4 hover:underline"
          >
            ETEN
          </Link>
          ,{" "}
          <Link
            href={MENTORSHIP_HREF}
            className="font-semibold text-white underline-offset-4 hover:underline"
          >
            ETEN Mentorship
          </Link>{" "}
          or learn more{" "}
          <Link
            href="/about"
            className="font-semibold text-white underline-offset-4 hover:underline"
          >
            about Expervia
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
