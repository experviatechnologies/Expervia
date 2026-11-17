import { Section } from "@/components/site/ui";

export function Beliefs() {
  return (
    <Section labelledBy="beliefs-heading">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-brand-600 text-xs font-bold tracking-[0.2em] uppercase">
          Our philosophy
        </p>
        <h2
          id="beliefs-heading"
          className="font-jakarta text-brand-950 mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl"
        >
          What We Believe
        </h2>
        <div
          aria-hidden
          className="from-brand-900 via-brand-600 to-brand-300 mx-auto mt-6 h-1 w-24 rounded-full bg-gradient-to-r"
        />
        <blockquote className="font-jakarta text-ink/85 mt-8 text-2xl leading-relaxed font-medium sm:text-3xl">
          &ldquo;Technology alone does not transform organizations.{" "}
          <span className="text-brand-700 font-extrabold">Strategy does.</span>{" "}
          We combine deep technical rigor with strategic foresight to ensure
          every byte of code drives business value.&rdquo;
        </blockquote>
      </div>
    </Section>
  );
}
