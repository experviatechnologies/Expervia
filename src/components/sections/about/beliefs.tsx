import { Container } from "@/components/shared/container";

export function Beliefs() {
  return (
    <section className="bg-surface-container-lowest py-section">
      <Container className="text-center">
        <div className="mx-auto max-w-3xl space-y-6">
          <h2 className="font-display text-on-surface text-headline-lg font-bold">
            What We Believe
          </h2>
          <div className="bg-primary mx-auto h-1 w-24 rounded-full" />
          <p className="font-display text-headline-lg text-on-surface/90 leading-relaxed font-light italic">
            &ldquo;Technology alone does not transform organizations.{" "}
            <span className="text-primary font-bold">Strategy does.</span> We
            combine deep technical rigor with strategic foresight to ensure
            every byte of code drives business value.&rdquo;
          </p>
        </div>
      </Container>
    </section>
  );
}
