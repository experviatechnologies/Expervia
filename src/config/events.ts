/**
 * ETEN events shown on the public /events page. Add upcoming sessions here —
 * the events board computes each one's state (upcoming / live now / ended)
 * from its start/end automatically, so nothing needs hand-editing as dates
 * pass. Times are stored with the WAT (+01:00) offset so state is correct for
 * every visitor regardless of their own timezone.
 */

export type EtenEvent = {
  id: string;
  title: string;
  blurb: string;
  speaker?: string;
  speakerTitle?: string;
  /** ISO 8601 with offset, e.g. "2026-09-18T15:00:00+01:00". */
  start: string;
  end: string;
  platform: string;
  /** Direct join / registration URL (opens in a new tab). */
  joinUrl?: string;
  /** Path under /public, e.g. "/expervia_webinar.jpg". */
  image?: string;
};

export const EVENTS: EtenEvent[] = [
  {
    id: "azure-secure-infra-2026-09-18",
    title:
      "Building Secure & Reliable Azure Infrastructure for Enterprise Applications",
    blurb:
      "A practical session on how to design and manage secure, scalable, resilient and reliable Azure infrastructure for enterprise workloads.",
    speaker: "Chukwu Chizaram Christian",
    speakerTitle: "Cloud Engineer",
    start: "2026-09-18T15:00:00+01:00",
    end: "2026-09-18T16:00:00+01:00",
    platform: "Online via Microsoft Teams",
    joinUrl: "https://teams.live.com/meet/9369700220516?p=zEqro7FHYIidPlKkAX",
    image: "/expervia_webinar.jpg",
  },
];
