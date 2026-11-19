"use client";

import { useState } from "react";
import { Section } from "@/components/site/ui";
import { ConsultationFocus, consultationOptions } from "./consultation-focus";
import { ContactForm } from "./contact-form";

export function ContactFormSection() {
  const [focus, setFocus] = useState(consultationOptions[0].label);
  return (
    <Section id="contact-form" labelledBy="consultation-heading">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <ConsultationFocus selected={focus} onSelect={setFocus} />
        </div>
        <div className="lg:col-span-7">
          <ContactForm focus={focus} />
        </div>
      </div>
    </Section>
  );
}
