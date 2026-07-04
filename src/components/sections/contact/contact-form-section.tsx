import { Container } from "@/components/shared/container";
import { ConsultationFocus } from "./consultation-focus";
import { ContactForm } from "./contact-form";

export function ContactFormSection() {
  return (
    <section id="contact-form" className="py-section scroll-mt-24">
      <Container>
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <ConsultationFocus />
          </div>
          <div className="lg:col-span-7">
            <ContactForm />
          </div>
        </div>
      </Container>
    </section>
  );
}
