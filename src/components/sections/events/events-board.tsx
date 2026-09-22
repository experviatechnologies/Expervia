import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Clock,
  MonitorPlay,
  PlayCircle,
  Radio,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/container";
import { getPublishedEvents, type PublicEvent } from "@/lib/eten/events";

type Status = "live" | "upcoming" | "past";
type EventWithStatus = PublicEvent & { status: Status };

const WAT = "Africa/Lagos";

function statusOf(e: PublicEvent, now: number): Status {
  if (!e.start) return "upcoming"; // announced, date to be confirmed
  const start = new Date(e.start).getTime();
  // No explicit end → assume the session runs ~2h from its start.
  const end = e.end ? new Date(e.end).getTime() : start + 2 * 60 * 60 * 1000;
  if (now < start) return "upcoming";
  if (now > end) return "past";
  return "live";
}

function startMs(e: PublicEvent): number {
  return e.start ? new Date(e.start).getTime() : Number.MAX_SAFE_INTEGER;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: WAT,
  });
}

function formatTimeRange(startIso: string, endIso: string | null): string {
  const opts: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
    timeZone: WAT,
  };
  const s = new Date(startIso).toLocaleTimeString("en-US", opts);
  if (!endIso) return `${s} (WAT)`;
  const e = new Date(endIso).toLocaleTimeString("en-US", opts);
  return `${s} – ${e} (WAT)`;
}

export async function EventsBoard() {
  const events = await getPublishedEvents();

  // Server component, rendered per request/revalidation (see `revalidate` on
  // the events page) — reading the clock here is deterministic for the render,
  // not a client re-render, so the purity rule doesn't apply.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const withStatus: EventWithStatus[] = events.map((e) => ({
    ...e,
    status: statusOf(e, now),
  }));

  const liveUpcoming = withStatus
    .filter((e) => e.status !== "past")
    .sort((a, b) => startMs(a) - startMs(b));
  const past = withStatus
    .filter((e) => e.status === "past")
    .sort((a, b) => startMs(b) - startMs(a))
    .slice(0, 4);

  const [featured, ...moreUpcoming] = liveUpcoming;

  return (
    <section id="upcoming" className="py-section">
      <Container>
        <div className="mb-10 max-w-2xl">
          <span className="border-primary/20 bg-primary/10 text-primary text-label-sm mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono tracking-wider uppercase">
            <Radio className="size-4" />
            What&apos;s on
          </span>
          <h2 className="font-display text-on-surface text-3xl font-extrabold tracking-tight sm:text-4xl">
            Upcoming &amp; live sessions
          </h2>
          <p className="text-body-md text-on-surface-variant mt-3">
            Live and upcoming ETEN sessions. Join links open when a session goes
            live.
          </p>
        </div>

        {featured ? <FeaturedEvent event={featured} /> : <EmptyState />}

        {moreUpcoming.length > 0 && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {moreUpcoming.map((e) => (
              <CompactEvent key={e.id} event={e} />
            ))}
          </div>
        )}

        {past.length > 0 && (
          <div className="mt-12">
            <h3 className="text-label-sm text-on-surface-variant/70 mb-4 font-mono tracking-wider uppercase">
              Recent events
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {past.map((e) => (
                <CompactEvent key={e.id} event={e} />
              ))}
            </div>
          </div>
        )}
      </Container>
    </section>
  );
}

function StatusBadge({ status }: { status: Status }) {
  if (status === "live") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-400">
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-red-500" />
        </span>
        Live now
      </span>
    );
  }
  if (status === "upcoming") {
    return (
      <span className="border-primary/30 bg-primary/10 text-primary inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold">
        <CalendarDays className="size-3.5" />
        Upcoming
      </span>
    );
  }
  return (
    <span className="border-outline-variant/50 text-on-surface-variant/70 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold">
      Ended
    </span>
  );
}

function FeaturedEvent({ event }: { event: EventWithStatus }) {
  return (
    <div className="glass-card grid gap-8 rounded-3xl p-6 sm:p-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] lg:items-center lg:gap-10">
      {event.image && (
        <div className="border-outline-variant/40 bg-surface-container relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-2xl border">
          <Image
            src={event.image}
            alt={`Event flyer: ${event.title}`}
            fill
            sizes="(max-width: 1024px) 90vw, 40vw"
            className="object-contain"
            priority
          />
        </div>
      )}

      <div className="min-w-0">
        <StatusBadge status={event.status} />
        <h3 className="font-display text-on-surface mt-4 text-2xl leading-snug font-bold text-balance">
          {event.title}
        </h3>
        {event.blurb && (
          <p className="text-body-md text-on-surface-variant mt-3">
            {event.blurb}
          </p>
        )}

        <dl className="mt-6 flex flex-col gap-3">
          {event.speaker && (
            <Detail Icon={UserRound} label="Speaker">
              {event.speaker}
              {event.speakerTitle && (
                <span className="text-on-surface-variant">
                  {" "}
                  — {event.speakerTitle}
                </span>
              )}
            </Detail>
          )}
          {event.start && (
            <>
              <Detail Icon={CalendarDays} label="Date">
                {formatDate(event.start)}
              </Detail>
              <Detail Icon={Clock} label="Time">
                {formatTimeRange(event.start, event.end)}
              </Detail>
            </>
          )}
          {event.platform && (
            <Detail Icon={MonitorPlay} label="Where">
              {event.platform}
            </Detail>
          )}
        </dl>

        {event.joinUrl && event.status !== "past" && (
          <div className="mt-8">
            <Button asChild variant="brand" size="pill" className="font-bold">
              <Link
                href={event.joinUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {event.status === "live" ? "Join now" : "Join the session"}
                <ArrowRight />
              </Link>
            </Button>
            <p className="text-on-surface-variant/70 mt-3 text-sm">
              Please join a few minutes early. Opens in your meeting app or
              browser.
            </p>
          </div>
        )}

        {event.status === "past" && event.recordingUrl && (
          <div className="mt-8">
            <Button asChild variant="brand" size="pill" className="font-bold">
              <Link
                href={event.recordingUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <PlayCircle />
                Watch the recording
              </Link>
            </Button>
            <p className="text-on-surface-variant/70 mt-3 text-sm">
              Missed it live? Watch the full session on YouTube.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function CompactEvent({ event }: { event: EventWithStatus }) {
  return (
    <div className="glass-card flex flex-col gap-3 rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3">
        <StatusBadge status={event.status} />
        {event.start && (
          <span className="text-on-surface-variant/70 text-xs whitespace-nowrap">
            {formatDate(event.start)}
          </span>
        )}
      </div>
      <h4 className="font-display text-on-surface font-bold text-balance">
        {event.title}
      </h4>
      <p className="text-on-surface-variant text-sm">
        {event.start ? `${formatTimeRange(event.start, event.end)} · ` : ""}
        {event.platform}
      </p>
      {event.joinUrl && event.status !== "past" && (
        <Link
          href={event.joinUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary mt-1 inline-flex items-center gap-1.5 text-sm font-semibold hover:underline"
        >
          {event.status === "live" ? "Join now" : "Join the session"}
          <ArrowRight className="size-4" />
        </Link>
      )}
      {event.status === "past" && event.recordingUrl && (
        <Link
          href={event.recordingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary mt-1 inline-flex items-center gap-1.5 text-sm font-semibold hover:underline"
        >
          <PlayCircle className="size-4" />
          Watch the recording
        </Link>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="glass-card flex flex-col items-center gap-4 rounded-3xl p-12 text-center">
      <span className="bg-primary/10 text-primary flex size-14 items-center justify-center rounded-full">
        <CalendarDays className="size-7" />
      </span>
      <div>
        <p className="text-on-surface font-semibold">
          No sessions scheduled right now.
        </p>
        <p className="text-on-surface-variant mx-auto mt-1 max-w-sm text-sm">
          New webinars, workshops and meetups are announced here. Register your
          interest below so you don&apos;t miss the next one.
        </p>
      </div>
      <Button asChild variant="brandOutline" size="pill" className="font-bold">
        <Link href="#register">
          Register your interest
          <ArrowRight />
        </Link>
      </Button>
    </div>
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
