import { Compass, Target } from "lucide-react";
import { Container } from "@/components/shared/container";
import { SectionLabel } from "@/components/shared/section-label";

const pillars = ["Learn", "Connect", "Grow", "Lead"];

/** About (#about) plus Vision and Mission (#vision-mission). */
export function WitAbout() {
  return (
    <>
      <section id="about" className="py-section scroll-mt-36">
        <Container className="max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
            <div>
              <SectionLabel className="mb-4">About the Community</SectionLabel>
              <h2 className="font-display text-on-surface text-headline-lg font-bold text-balance">
                More Than a Community. A Network for{" "}
                <span className="gradient-text">
                  Growth, Opportunity and Impact.
                </span>
              </h2>
            </div>
            <div className="text-on-surface-variant text-body-lg space-y-5">
              <p>
                ETEN Women in Tech is a women-focused professional community
                within the Expervia Technologies Expert Network (ETEN). It
                brings together women who are learning, working and leading
                across technology.
              </p>
              <p>
                Members come together to build practical skills, find
                mentorship, form meaningful professional relationships, grow
                their visibility and collaborate on ideas that matter, with
                access to resources and opportunities as they become available.
              </p>
              <ul className="flex flex-wrap gap-3 pt-2" aria-label="What we do">
                {pillars.map((p) => (
                  <li
                    key={p}
                    className="border-primary/25 text-on-surface rounded-full border px-4 py-1.5 text-sm font-semibold"
                  >
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </section>

      <section
        id="vision-mission"
        className="bg-surface-container-low py-section scroll-mt-36"
      >
        <Container className="max-w-7xl">
          <div className="gap-gutter grid md:grid-cols-2">
            <article className="glass-card rounded-2xl p-8 md:p-10">
              <span className="bg-primary/10 text-primary mb-6 inline-flex size-12 items-center justify-center rounded-xl">
                <Compass className="size-6" aria-hidden />
              </span>
              <h2 className="font-display text-on-surface text-headline-md mb-4 font-bold">
                Our Vision
              </h2>
              <p className="text-on-surface-variant text-body-lg">
                A connected and empowered network of women who are actively
                shaping the future of technology, innovation and digital
                transformation.
              </p>
            </article>
            <article className="glass-card rounded-2xl p-8 md:p-10">
              <span className="bg-primary/10 text-primary mb-6 inline-flex size-12 items-center justify-center rounded-xl">
                <Target className="size-6" aria-hidden />
              </span>
              <h2 className="font-display text-on-surface text-headline-md mb-4 font-bold">
                Our Mission
              </h2>
              <p className="text-on-surface-variant text-body-lg">
                To create opportunities for women to learn, develop professional
                skills, access mentorship, build relationships and advance their
                careers through technology education, collaboration and
                community engagement.
              </p>
            </article>
          </div>
        </Container>
      </section>
    </>
  );
}
