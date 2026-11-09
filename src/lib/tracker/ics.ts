/**
 * iCalendar (RFC 5545) invites for confirmed presales meetings, emailed as an
 * attachment so the meeting lands in any calendar without OAuth (PRD
 * section 9's manual fallback until Outlook/Google sync arrives).
 *
 * One UID per participant seat (the assignment's idempotency key), so a
 * re-sent, updated or cancelled invite replaces the same calendar event
 * instead of creating a duplicate (FR-024). SEQUENCE increases on every send.
 */

const pad = (n: number) => String(n).padStart(2, "0");

/** UTC timestamp in iCalendar form: 20261103T140000Z. */
function stamp(d: Date) {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

/** Escape TEXT values (backslash, semicolon, comma, newlines). */
function text(v: string) {
  return v
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** Fold content lines longer than 75 characters (continuation starts with a space). */
function fold(line: string) {
  const out: string[] = [];
  let rest = line;
  while (rest.length > 75) {
    out.push(rest.slice(0, 75));
    rest = " " + rest.slice(75);
  }
  out.push(rest);
  return out.join("\r\n");
}

export function buildIcs(e: {
  uid: string;
  /** PUBLISH is a plain "add to calendar" event with no RSVP (mentorship). */
  method: "REQUEST" | "CANCEL" | "PUBLISH";
  start: string;
  end: string;
  summary: string;
  description: string;
  location?: string;
  url?: string;
  organizerEmail?: string;
  /** Which product the event comes from (calendar metadata and UID domain). */
  app?: "tracker" | "mentorship";
}): string {
  const app =
    e.app === "mentorship"
      ? {
          name: "ETEN Mentorship",
          domain: "mentorship.experviatechnologies.com",
        }
      : {
          name: "ETEN Availability Tracker",
          domain: "tracker.experviatechnologies.com",
        };
  const now = new Date();
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//Expervia Technologies//${app.name}//EN`,
    "CALSCALE:GREGORIAN",
    `METHOD:${e.method}`,
    "BEGIN:VEVENT",
    `UID:${e.uid}@${app.domain}`,
    // Seconds since epoch only ever grows, so each send supersedes the last.
    `SEQUENCE:${Math.floor(now.getTime() / 1000)}`,
    `DTSTAMP:${stamp(now)}`,
    `DTSTART:${stamp(new Date(e.start))}`,
    `DTEND:${stamp(new Date(e.end))}`,
    `SUMMARY:${text(e.summary)}`,
    `DESCRIPTION:${text(e.description)}`,
    ...(e.location ? [`LOCATION:${text(e.location)}`] : []),
    ...(e.url ? [`URL:${e.url}`] : []),
    ...(e.organizerEmail
      ? [`ORGANIZER;CN=${app.name}:mailto:${e.organizerEmail}`]
      : []),
    `STATUS:${e.method === "CANCEL" ? "CANCELLED" : "CONFIRMED"}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}
