// Availability rule tests for the presales tracker (PRD section 7 and the
// "Availability" and "Calendar" acceptance criteria in section 15).
// Run: npm run test:tracker
import { test } from "node:test";
import assert from "node:assert/strict";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url);
const { evaluateMember, effectiveWindows, isFresh } = await jiti.import(
  "../../src/lib/tracker/availability.ts",
);

const week = (start, end, days = [1, 2, 3, 4, 5]) =>
  days.map((day) => ({ id: `w${day}${start}`, day, start, end, formats: ["online", "physical"], active: true }));

/** A member in Lagos, Mon–Fri 09:00–12:00 and 14:00–17:00, online and in person. */
const member = (over = {}) => ({
  id: "m1",
  status: "active",
  optedIn: true,
  formats: ["online", "physical"],
  cities: ["Lagos"],
  willingToTravel: false,
  timezone: "Africa/Lagos",
  calendar: "none",
  busy: [],
  weekly: [...week("09:00", "12:00"), ...week("14:00", "17:00")],
  exceptions: [],
  ...over,
});

const NO_WORK = { assignments: [], requests: [] };
// 2026-11-09 is a Monday. Lagos is UTC+1 all year (no daylight saving).
const at = (startUtc, endUtc, extra = {}) => ({ startUtc, endUtc, format: "online", requestId: "R", ...extra });
const state = (m, mtg, ctx = NO_WORK) => evaluateMember(m, mtg, ctx).state;

test("multiple daily windows: inside either slot is available, the gap is not", () => {
  assert.equal(state(member(), at("2026-11-09T09:00:00Z", "2026-11-09T10:00:00Z")), "available"); // 10–11 local
  assert.equal(state(member(), at("2026-11-09T14:00:00Z", "2026-11-09T15:00:00Z")), "available"); // 15–16 local
  assert.equal(state(member(), at("2026-11-09T11:30:00Z", "2026-11-09T12:30:00Z")), "unavailable"); // 12:30–13:30 local
});

test("the whole meeting must fit inside one window", () => {
  // 11:30–12:30 local runs past the 12:00 end of the morning window.
  assert.equal(state(member(), at("2026-11-09T10:30:00Z", "2026-11-09T11:30:00Z")), "partial");
  // 11:00–15:00 local spans both windows and the gap between them.
  assert.equal(state(member(), at("2026-11-09T10:00:00Z", "2026-11-09T14:00:00Z")), "partial");
});

test("no window on the weekend", () => {
  // 2026-11-14 is a Saturday.
  assert.equal(state(member(), at("2026-11-14T09:00:00Z", "2026-11-14T10:00:00Z")), "unavailable");
});

test("a full-day exception overrides the weekly schedule", () => {
  const m = member({ exceptions: [{ id: "e1", date: "2026-11-09", kind: "unavailable_all", reason: "leave" }] });
  assert.deepEqual(effectiveWindows(m, "2026-11-09"), []);
  assert.equal(state(m, at("2026-11-09T09:00:00Z", "2026-11-09T10:00:00Z")), "unavailable");
  // The next day is unaffected.
  assert.equal(state(m, at("2026-11-10T09:00:00Z", "2026-11-10T10:00:00Z")), "available");
});

test("a part-day exception removes only its interval", () => {
  const m = member({
    exceptions: [{ id: "e2", date: "2026-11-09", kind: "unavailable_part", start: "10:00", end: "11:00", reason: "other" }],
  });
  assert.equal(state(m, at("2026-11-09T09:00:00Z", "2026-11-09T10:00:00Z")), "unavailable"); // 10–11 local: removed
  assert.equal(state(m, at("2026-11-09T08:30:00Z", "2026-11-09T09:30:00Z")), "partial"); // 09:30–10:30: half removed
  assert.equal(state(m, at("2026-11-09T08:00:00Z", "2026-11-09T09:00:00Z")), "available"); // 09–10 local: kept
  assert.equal(state(m, at("2026-11-09T10:00:00Z", "2026-11-09T11:00:00Z")), "available"); // 11–12 local: kept
});

test("extra availability on a date adds a window; removals win on the same date", () => {
  const extra = { id: "e3", date: "2026-11-14", kind: "extra", start: "10:00", end: "13:00" };
  assert.equal(state(member({ exceptions: [extra] }), at("2026-11-14T09:00:00Z", "2026-11-14T10:00:00Z")), "available");
  const both = member({
    exceptions: [extra, { id: "e4", date: "2026-11-14", kind: "unavailable_part", start: "10:00", end: "11:30", reason: "other" }],
  });
  // 10:00–11:00 local falls inside the removed 10:00–11:30, so nothing is left.
  assert.equal(state(both, at("2026-11-14T09:00:00Z", "2026-11-14T10:00:00Z")), "unavailable");
  // 11:30–12:30 local is in what remains of the extra window.
  assert.equal(state(both, at("2026-11-14T10:30:00Z", "2026-11-14T11:30:00Z")), "available");
});

test("time zones: the meeting is read in the member's own zone", () => {
  // 08:00Z is 09:00 in Lagos: the start of the window.
  assert.equal(state(member(), at("2026-11-09T08:00:00Z", "2026-11-09T09:00:00Z")), "available");
  // 07:30Z is 08:30 in Lagos: before the window opens.
  assert.equal(state(member(), at("2026-11-09T07:30:00Z", "2026-11-09T08:30:00Z")), "partial");
  // The same instant for a member in New York (03:00 local) is outside their day.
  assert.equal(state(member({ timezone: "America/New_York" }), at("2026-11-09T08:00:00Z", "2026-11-09T09:00:00Z")), "unavailable");
});

test("daylight saving: a London window keeps its local time across the clock change", () => {
  const london = member({ timezone: "Europe/London", weekly: week("09:00", "10:00") });
  // Monday 23 March 2026, GMT (UTC+0): 09:00 local = 09:00Z.
  assert.equal(state(london, at("2026-03-23T09:00:00Z", "2026-03-23T10:00:00Z")), "available");
  // Clocks go forward Sunday 29 March. Monday 30 March, BST (UTC+1): 09:00 local = 08:00Z.
  assert.equal(state(london, at("2026-03-30T08:00:00Z", "2026-03-30T09:00:00Z")), "available");
  assert.equal(state(london, at("2026-03-30T09:00:00Z", "2026-03-30T10:00:00Z")), "unavailable"); // 10:00 local
  // Clocks go back Sunday 25 October. Monday 26 October, GMT again.
  assert.equal(state(london, at("2026-10-26T09:00:00Z", "2026-10-26T10:00:00Z")), "available");
});

test("a meeting that crosses midnight is not squeezed into the evening window", () => {
  const late = member({ weekly: week("20:00", "23:59") });
  // 22:30–00:30 local runs past midnight.
  assert.equal(state(late, at("2026-11-09T21:30:00Z", "2026-11-09T23:30:00Z")), "partial");
});

test("an overlapping confirmed ETEN meeting is a hard conflict; a cancelled one is ignored", () => {
  const other = { id: "R2", status: "confirmed", startUtc: "2026-11-09T09:30:00Z", endUtc: "2026-11-09T10:30:00Z" };
  const seat = { id: "a1", requestId: "R2", memberId: "m1", status: "confirmed" };
  const mtg = at("2026-11-09T09:00:00Z", "2026-11-09T10:00:00Z");
  assert.equal(state(member(), mtg, { assignments: [seat], requests: [other] }), "conflict");
  assert.equal(state(member(), mtg, { assignments: [seat], requests: [{ ...other, status: "cancelled" }] }), "available");
  // A pending invitation elsewhere is a warning, not a block.
  const pending = evaluateMember(member(), mtg, { assignments: [{ ...seat, status: "invitation_pending" }], requests: [other] });
  assert.equal(pending.state, "available");
  assert.ok(pending.warnings.some((w) => /pending invitation/i.test(w)));
});

test("calendar: busy time is a conflict; an unchecked calendar is never verified free", () => {
  const mtg = at("2026-11-09T09:00:00Z", "2026-11-09T10:00:00Z");
  const busy = [{ startUtc: "2026-11-09T09:30:00Z", endUtc: "2026-11-09T09:45:00Z" }];
  const until = "2026-12-31T00:00:00Z";
  const check = (over) => evaluateMember(member(over), mtg, NO_WORK);

  assert.equal(check({ calendar: "connected", busy, busyChecked: true, busyUntil: until }).state, "conflict");
  assert.equal(check({ calendar: "connected", busy: [], busyChecked: true, busyUntil: until }).calendar, "free");
  // Not read, read beyond the synced window, expired, revoked or errored: unverified, never free.
  for (const over of [
    { calendar: "connected", busyChecked: false },
    { calendar: "connected", busyChecked: true, busyUntil: "2026-11-09T09:30:00Z" },
    { calendar: "expired" },
    { calendar: "revoked" },
    { calendar: "error" },
  ]) {
    assert.equal(check(over).calendar, "unverified", JSON.stringify(over));
  }
  assert.equal(check({ calendar: "none" }).calendar, "not_connected");
});

test("format and location constraints", () => {
  const onlineOnly = member({ formats: ["online"] });
  assert.equal(state(onlineOnly, at("2026-11-09T09:00:00Z", "2026-11-09T10:00:00Z", { format: "physical" })), "unavailable");
  const inAbuja = at("2026-11-09T09:00:00Z", "2026-11-09T10:00:00Z", { format: "physical", location: "Client office, Abuja" });
  assert.equal(state(member(), inAbuja), "unavailable");
  assert.equal(state(member({ willingToTravel: true }), inAbuja), "available");
  assert.equal(state(member(), { ...inAbuja, location: "Victoria Island, Lagos" }), "available");
});

test("inactive and opted-out members are never available", () => {
  const mtg = at("2026-11-09T09:00:00Z", "2026-11-09T10:00:00Z");
  assert.equal(state(member({ status: "suspended" }), mtg), "inactive");
  assert.equal(state(member({ optedIn: false }), mtg), "inactive");
});

test("availability goes stale after the review period", () => {
  const policies = { freshDays: 14 };
  const now = Date.parse("2026-11-09T12:00:00Z");
  assert.equal(isFresh(member({ reviewedAt: "2026-11-01T12:00:00Z" }), policies, now), true);
  assert.equal(isFresh(member({ reviewedAt: "2026-10-20T12:00:00Z" }), policies, now), false);
  assert.equal(isFresh(member({ reviewedAt: null }), policies, now), false);
});
