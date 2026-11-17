import Link from "next/link";
import { ArrowRight, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/container";
import { siteConfig } from "@/config/site";
import { WIT_JOIN_HREF } from "@/config/women-in-tech";
import { TrackedLink } from "./tracking";

const MENTORSHIP_HREF = process.env.NEXT_PUBLIC_MENTORSHIP_HOST
  ? `https://${process.env.NEXT_PUBLIC_MENTORSHIP_HOST}`
  : "/mentorship";

export function WitFinalCta() {
  const { emails, phones } = siteConfig.contact;
  return (
    <section aria-labelledby="wit-final-heading" className="pb-section">
      <Container className="max-w-7xl">
        <div className="from-brand/30 relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br via-fuchsia-600/15 to-transparent px-6 py-14 text-center sm:px-12 md:py-20">
          <div
            aria-hidden
            className="bg-brand/30 absolute -top-24 left-1/2 size-[420px] -translate-x-1/2 rounded-full blur-[120px]"
          />
          <div className="relative">
            <p className="text-primary mb-4 font-mono text-sm tracking-widest uppercase">
              Connect. Empower. Lead.
            </p>
            <h2
              id="wit-final-heading"
              className="font-display text-on-surface md:text-display-lg mb-5 text-4xl leading-tight font-extrabold tracking-tight text-balance"
            >
              Your Journey. Your Voice. Your Future.
            </h2>
            <p className="text-on-surface-variant text-body-lg mx-auto mb-10 max-w-2xl">
              Join a community of women learning, connecting and leading in
              technology, or share your experience to help others rise.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Button asChild variant="brand" size="pill" className="font-bold">
                <TrackedLink
                  href={WIT_JOIN_HREF}
                  event="women_in_tech_join_click"
                  location="final_cta"
                >
                  Join ETEN Women in Tech
                  <ArrowRight aria-hidden />
                </TrackedLink>
              </Button>
              <Button
                asChild
                variant="brandOutline"
                size="pill"
                className="font-bold"
              >
                <TrackedLink
                  href="#contribute"
                  event="women_in_tech_contributor_click"
                  location="final_cta"
                >
                  Become a Contributor
                </TrackedLink>
              </Button>
            </div>

            <div className="text-on-surface-variant mt-12 flex flex-col items-center justify-center gap-x-8 gap-y-3 text-sm sm:flex-row sm:flex-wrap">
              <a
                href={`mailto:${emails.general}?subject=${encodeURIComponent("ETEN Women in Tech")}`}
                className="hover:text-primary inline-flex items-center gap-2 transition-colors"
              >
                <Mail className="size-4" aria-hidden />
                {emails.general}
              </a>
              {phones.map((p) => (
                <a
                  key={p}
                  href={`tel:${p.replace(/\s+/g, "")}`}
                  className="hover:text-primary inline-flex items-center gap-2 transition-colors"
                >
                  <Phone className="size-4" aria-hidden />
                  {p}
                </a>
              ))}
            </div>
            <p className="text-on-surface-variant/80 mt-6 text-sm">
              Part of the Expervia Technologies Expert Network (ETEN). Looking
              for one-to-one guidance? Explore{" "}
              <Link
                href={MENTORSHIP_HREF}
                className="text-primary hover:underline"
              >
                ETEN Mentorship
              </Link>{" "}
              or learn more{" "}
              <Link href="/about" className="text-primary hover:underline">
                about Expervia
              </Link>
              .
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
