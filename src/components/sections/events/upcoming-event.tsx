import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Clock,
  MonitorPlay,
  Radio,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/container";

const WEBINAR = {
  title:
    "Building Secure & Reliable Azure Infrastructure for Enterprise Applications",
  blurb:
    "A practical session on how to design and manage secure, scalable, resilient and reliable Azure infrastructure for enterprise workloads.",
  speaker: "Chukwu Chizaram Christian",
  speakerTitle: "Cloud Engineer",
  date: "Friday, 18 September 2026",
  time: "3:00 PM – 4:00 PM (WAT)",
  platform: "Online via Microsoft Teams",
  joinUrl: "https://teams.live.com/meet/9369700220516?p=zEqro7FHYIidPlKkAX",
  image: "/expervia_webinar.jpg",
};

export function UpcomingEvent() {
  return (
    <section id="upcoming" className="py-section">
      <Container>
        <div className="mb-10 max-w-2xl">
          <span className="border-primary/20 bg-primary/10 text-primary text-label-sm mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono tracking-wider uppercase">
            <Radio className="size-4" />
            Upcoming Webinar
          </span>
          <h2 className="font-display text-on-surface text-3xl font-extrabold tracking-tight sm:text-4xl">
            Next up in the ETEN community
          </h2>
        </div>

        <div className="glass-card grid gap-8 rounded-3xl p-6 sm:p-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] lg:items-center lg:gap-10">
          {/* Flyer */}
          <div className="border-outline-variant/40 bg-surface-container relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-2xl border">
            <Image
              src={WEBINAR.image}
              alt={`Webinar flyer: ${WEBINAR.title}`}
              fill
              sizes="(max-width: 1024px) 90vw, 40vw"
              className="object-contain"
              priority
            />
          </div>

          {/* Details */}
          <div className="min-w-0">
            <h3 className="font-display text-on-surface text-2xl leading-snug font-bold text-balance">
              {WEBINAR.title}
            </h3>
            <p className="text-body-md text-on-surface-variant mt-3">
              {WEBINAR.blurb}
            </p>

            <dl className="mt-6 flex flex-col gap-3">
              <Detail Icon={UserRound} label="Speaker">
                {WEBINAR.speaker}
                <span className="text-on-surface-variant">
                  {" "}
                  — {WEBINAR.speakerTitle}
                </span>
              </Detail>
              <Detail Icon={CalendarDays} label="Date">
                {WEBINAR.date}
              </Detail>
              <Detail Icon={Clock} label="Time">
                {WEBINAR.time}
              </Detail>
              <Detail Icon={MonitorPlay} label="Where">
                {WEBINAR.platform}
              </Detail>
            </dl>

            <div className="mt-8">
              <Button asChild variant="brand" size="pill" className="font-bold">
                <Link
                  href={WEBINAR.joinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Join the Webinar
                  <ArrowRight />
                </Link>
              </Button>
              <p className="text-on-surface-variant/70 mt-3 text-sm">
                Please join a few minutes early so we can start promptly. Opens
                in Microsoft Teams (join from the app or your browser).
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

function Detail({
  Icon,
  label,
  children,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="bg-primary/10 text-primary mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg">
        <Icon className="size-4" />
      </span>
      <div>
        <dt className="text-label-sm text-on-surface-variant/70 font-mono tracking-wider uppercase">
          {label}
        </dt>
        <dd className="text-on-surface text-sm font-medium">{children}</dd>
      </div>
    </div>
  );
}
