import Link from "next/link";
import { Mic, Handshake, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/container";
import { SectionLabel } from "@/components/shared/section-label";

export function GetInvolved() {
  return (
    <section id="get-involved" className="bg-surface-container-low py-section">
      <Container>
        <div className="mb-16 text-center">
          <SectionLabel className="mb-4">Get Involved</SectionLabel>
          <h2 className="font-display text-on-surface text-headline-lg font-bold">
            Shape the Conversation
          </h2>
        </div>

        <div className="gap-gutter grid grid-cols-1 lg:grid-cols-2">
          {/* Experts */}
          <article className="glass-card flex flex-col rounded-2xl p-8 md:p-10">
            <div className="bg-primary/10 text-primary mb-6 flex size-12 items-center justify-center rounded-lg">
              <Mic className="size-6" />
            </div>
            <h3 className="font-display text-on-surface text-headline-md mb-3 font-semibold">
              Are You a Technology Expert?
            </h3>
            <p className="text-on-surface-variant mb-8 text-sm">
              Share your expertise with the community. Speak on a panel, run a
              hands-on workshop, or lead a masterclass — and get featured across
              the ETEN network.
            </p>
            <Button
              asChild
              variant="brand"
              size="pill"
              className="mt-auto self-start font-bold"
            >
              <Link href="#register">
                Apply to Speak
                <ArrowRight />
              </Link>
            </Button>
          </article>

          {/* Partners */}
          <article className="glass-card flex flex-col rounded-2xl p-8 md:p-10">
            <div className="bg-primary/10 text-primary mb-6 flex size-12 items-center justify-center rounded-lg">
              <Handshake className="size-6" />
            </div>
            <h3 className="font-display text-on-surface text-headline-md mb-3 font-semibold">
              Bring Your Challenges to the Conversation
            </h3>
            <p className="text-on-surface-variant mb-8 text-sm">
              Partner with us to host sessions, sponsor events, and engage with
              top technology talent and experts across Africa.
            </p>
            <Button
              asChild
              variant="brandOutline"
              size="pill"
              className="mt-auto self-start font-bold"
            >
              <Link href="/contact">
                Partner With Us
                <ArrowRight />
              </Link>
            </Button>
          </article>
        </div>
      </Container>
    </section>
  );
}
