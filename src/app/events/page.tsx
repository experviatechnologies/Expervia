import { EventsHero } from "@/components/sections/events/events-hero";
import { EventsBoard } from "@/components/sections/events/events-board";
import { WhyAttend } from "@/components/sections/events/why-attend";
import { EventTopics } from "@/components/sections/events/event-topics";
import { EventFormats } from "@/components/sections/events/event-formats";
import { GetInvolved } from "@/components/sections/events/get-involved";
import { RegistrationForm } from "@/components/sections/events/registration-form";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta("/events");

// Re-generate periodically so the events board's live / upcoming / ended state
// stays current without a redeploy.
export const revalidate = 600;

export default function EventsPage() {
  return (
    <>
      <EventsHero />
      <EventsBoard />
      <WhyAttend />
      <EventTopics />
      <EventFormats />
      <GetInvolved />
      <RegistrationForm />
    </>
  );
}
