import type { Metadata } from "next";
import { EventsHero } from "@/components/sections/events/events-hero";
import { WhyAttend } from "@/components/sections/events/why-attend";
import { EventTopics } from "@/components/sections/events/event-topics";
import { EventFormats } from "@/components/sections/events/event-formats";
import { GetInvolved } from "@/components/sections/events/get-involved";
import { RegistrationForm } from "@/components/sections/events/registration-form";

export const metadata: Metadata = {
  title: "Events",
  description:
    "Join the Expervia Technology Experts Network (ETEN) — webinars, masterclasses, workshops, and meetups across Africa on Microsoft, Cloud, AI, Cybersecurity, Data, and Digital Transformation.",
};

export default function EventsPage() {
  return (
    <>
      <EventsHero />
      <WhyAttend />
      <EventTopics />
      <EventFormats />
      <GetInvolved />
      <RegistrationForm />
    </>
  );
}
