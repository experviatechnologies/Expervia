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
import { ButtonLink, Section } from "@/components/site/ui";
import { cn } from "@/lib/utils";
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
  // the events page). Reading the clock here is deterministic for the render,
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
    <Section id="upcoming" labelledBy="upcoming-heading">
      <div className="mb-10 max-w-2xl">
        <p className="text-brand-600 inline-flex items-center gap-2 text-xs font-bold tracking-[0.2em] uppercase">
          <Radio aria-hidden className="size-4" />
          What&apos;s on
        </p>
        <h2
          id="upcoming-heading"
          className="font-jakarta text-brand-950 mt-4 text-3xl leading-tight font-extrabold tracking-tight sm:text-4xl lg:text-[2.75rem]"
        >
          Upcoming &amp; live sessions
        </h2>
        <p className="text-ink/75 mt-4 text-lg leading-relaxed">
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
          <h3 className="text-ink/55 mb-4 text-xs font-bold tracking-[0.18em] uppercase">
            Recent events
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {past.map((e) => (
              <CompactEvent key={e.id} event={e} />
            ))}
          </div>
        </div>
      )}
    </Section>
  );
}

function StatusBadge({ status }: { status: Status }) {
  if (status === "live") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full rounded-full bg-red-400 opacity-75 motion-safe:animate-ping" />
          <span className="relative inline-flex size-2 rounded-full bg-red-500" />
        </span>
        Live now
      </span>
    );
  }
  if (status === "upcoming") {
    return (
      <span className="border-brand-200 bg-lavender text-brand-800 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold">
        <CalendarDays aria-hidden className="size-3.5" />
        Upcoming
      </span>
    );
  }
  return (
    <span className="border-brand-100 text-ink/55 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold">
      Ended
    </span>
  );
}

function FeaturedEvent({ event }: { event: EventWithStatus }) {
  return (
    <div className="border-brand-100 bg-lavender grid gap-8 rounded-[2rem] border p-6 shadow-[0_30px_60px_-40px_rgba(33,0,93,0.5)] sm:p-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] lg:items-center lg:gap-10">
      {event.image && (
        <div className="border-brand-100 relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-2xl border bg-white">
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
        <h3 className="font-jakarta text-brand-950 mt-4 text-2xl leading-snug font-extrabold text-balance sm:text-3xl">
          {event.title}
        </h3>
        {event.blurb && (
          <p className="text-ink/75 mt-3 leading-relaxed">{event.blurb}</p>
        )}

        <dl className="mt-6 flex flex-col gap-3">
          {event.speaker && (
            <Detail Icon={UserRound} label="Speaker">
              {event.speaker}
              {event.speakerTitle && (
                <span className="text-ink/60">
                  {", "}
                  {event.speakerTitle}
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
            <ButtonLink
              href={event.joinUrl}
              target="_blank"
              rel="noopener noreferrer"
              arrow
            >
              {event.status === "live" ? "Join now" : "Join the session"}
            </ButtonLink>
            <p className="text-ink/60 mt-3 text-sm">
              Please join a few minutes early. Opens in your meeting app or
              browser.
            </p>
          </div>
        )}

        {event.status === "past" && event.recordingUrl && (
          <div className="mt-8">
            <ButtonLink
              href={event.recordingUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <PlayCircle aria-hidden className="size-4" />
              Watch the recording
            </ButtonLink>
            <p className="text-ink/60 mt-3 text-sm">
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
    <div
      className={cn(
        "border-brand-100 flex flex-col gap-3 rounded-3xl border bg-white p-6",
        event.status === "past" && "bg-white/70",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <StatusBadge status={event.status} />
        {event.start && (
          <span className="text-ink/55 text-xs font-medium whitespace-nowrap">
            {formatDate(event.start)}
          </span>
        )}
      </div>
      <h4 className="font-jakarta text-brand-950 text-lg font-bold text-balance">
        {event.title}
      </h4>
      <p className="text-ink/70 text-sm">
        {event.start ? `${formatTimeRange(event.start, event.end)} · ` : ""}
        {event.platform}
      </p>
      {event.joinUrl && event.status !== "past" && (
        <Link
          href={event.joinUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-700 mt-1 inline-flex items-center gap-1.5 text-sm font-semibold underline-offset-2 hover:underline"
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
          className="text-brand-700 mt-1 inline-flex items-center gap-1.5 text-sm font-semibold underline-offset-2 hover:underline"
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
    <div className="border-brand-200 bg-lavender flex flex-col items-center gap-4 rounded-[2rem] border border-dashed p-12 text-center">
      <span className="text-brand-700 ring-brand-200/70 flex size-14 items-center justify-center rounded-full bg-white ring-1">
        <CalendarDays aria-hidden className="size-7" />
      </span>
      <div>
        <p className="font-jakarta text-brand-950 text-lg font-bold">
          No sessions scheduled right now.
        </p>
        <p className="text-ink/70 mx-auto mt-1 max-w-sm">
          New webinars, workshops and meetups are announced here. Register your
          interest below so you don&apos;t miss the next one.
        </p>
      </div>
      <ButtonLink href="#register" variant="outline" arrow>
        Register your interest
      </ButtonLink>
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
      <span className="text-brand-700 ring-brand-200/70 mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-white ring-1">
        <Icon className="size-4" />
      </span>
      <div>
        <dt className="text-ink/55 text-xs font-bold tracking-[0.16em] uppercase">
          {label}
        </dt>
        <dd className="text-brand-950 font-semibold">{children}</dd>
      </div>
    </div>
  );
}
