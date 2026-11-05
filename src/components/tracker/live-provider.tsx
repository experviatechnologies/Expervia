"use client";

/**
 * Live tracker session (Phase 4). Fills the same TrackerContext the demo store
 * fills, but from data the server loaded for the signed-in member (see
 * src/lib/tracker/server/data.ts), so the existing screens render live data
 * unchanged. Writes go through role-checked server actions followed by
 * router.refresh(), which reloads the data in the (live) layout.
 *
 * Actions not switched on yet show a short notice instead of pretending to
 * save; each Phase 4 to 6 step replaces its stubs with real server actions.
 */
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { TrackerContext, type TrackerContextValue } from "@/lib/tracker/store";
import { isSales, podsLedBy } from "@/lib/tracker/selectors";
import type { TrackerData } from "@/lib/tracker/types";
import {
  deleteAvailabilityException,
  markAvailabilityReviewed,
  saveAvailabilityException,
  saveMeetingPreferences,
  saveWeeklyAvailability,
} from "@/app/tracker/(live)/availability/actions";
import { saveExpertiseProfile } from "@/app/tracker/(live)/settings/actions";
import { disconnectCalendar } from "@/app/tracker/(live)/calendar/actions";
import {
  cancelRequest as cancelRequestAction,
  rescheduleRequest,
  saveRequest as saveRequestAction,
} from "@/app/tracker/(live)/requests/actions";
import {
  markNoneSuitable,
  nominate as nominateAction,
  withdrawNomination as withdrawNominationAction,
} from "@/app/tracker/(live)/nominations/actions";
import {
  respondToInvitation,
  selectParticipants as selectParticipantsAction,
} from "@/app/tracker/(live)/selection/actions";
import {
  confirmMeeting as confirmMeetingAction,
  recheckAvailability,
  replaceParticipant as replaceParticipantAction,
} from "@/app/tracker/(live)/confirmation/actions";
import {
  markAllPresalesNotificationsRead,
  markPresalesNotificationRead,
} from "@/app/tracker/(live)/notifications/actions";
import { recordOutcome as recordOutcomeAction } from "@/app/tracker/(live)/outcomes/actions";
import { useToast } from "./ui";

export function LiveTrackerProvider({
  data,
  meId,
  enabledPages,
  children,
}: {
  data: TrackerData;
  meId: string;
  enabledPages: string[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const toast = useToast();
  const [now, setNow] = useState(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const value = useMemo<TrackerContextValue>(() => {
    const me = data.members.find((m) => m.id === meId) ?? null;
    const notYet = () =>
      toast("This part of the tracker goes live in a later step.");
    /** Run a server action, report a failure, then reload the live data. */
    const run = (action: Promise<{ ok: true } | { error: string }>) => {
      void action
        .then((res) => {
          if ("error" in res) toast(res.error);
        })
        .catch(() => toast("Something went wrong. Please try again."))
        .finally(() => router.refresh());
    };
    return {
      ready: now > 0,
      now,
      data,
      me,
      base: "/tracker",
      live: true,
      enabledPages,
      isSales: isSales(me),
      ledPods: me ? podsLedBy(data, me) : [],
      signIn: () => {},
      signOut: () => {
        void createSupabaseBrowserClient()
          .auth.signOut()
          .finally(() => router.push("/signin"));
      },
      reset: () => {},
      // Availability (step 4.2)
      saveWeekly: (windows) => run(saveWeeklyAvailability(windows)),
      markReviewed: () => run(markAvailabilityReviewed()),
      saveException: (ex) => run(saveAvailabilityException(ex)),
      deleteException: (exceptionId) =>
        run(deleteAvailabilityException(exceptionId)),
      // Meeting preferences (availability page) or the expertise profile.
      saveProfile: (patch) =>
        patch.formats
          ? run(
              saveMeetingPreferences({
                formats: patch.formats,
                cities: patch.cities,
                willingToTravel: patch.willingToTravel,
                travelNotes: patch.travelNotes,
                timezone: patch.timezone,
              }),
            )
          : run(
              saveExpertiseProfile({
                phone: patch.phone,
                timezone: patch.timezone,
                bio: patch.bio,
                seniority: patch.seniority,
                years: patch.years,
                skills: patch.skills,
                specialisations: patch.specialisations,
                industries: patch.industries,
                optedIn: patch.optedIn,
              }),
            ),
      // Connecting is a redirect to the provider (Settings > Calendar links to
      // /api/tracker/calendar/<provider>/start); only disconnect runs here.
      setCalendar: (status) =>
        status === "none" ? run(disconnectCalendar()) : notYet(),
      // Workflow (Phase 5)
      saveRequest: async (input, submit, existingId) => {
        try {
          const res = await saveRequestAction(input, submit, existingId);
          if ("error" in res) {
            toast(res.error);
            return "";
          }
          router.refresh();
          return res.id;
        } catch {
          toast("Something went wrong. Please try again.");
          return "";
        }
      },
      cancelRequest: (id, reason) => run(cancelRequestAction(id, reason)),
      reschedule: (id, startUtc, endUtc) =>
        run(rescheduleRequest(id, startUtc, endUtc)),
      nominate: (requestId, podId, picks) =>
        run(nominateAction(requestId, podId, picks)),
      noneSuitable: (requestId, podId, reason) =>
        run(markNoneSuitable(requestId, podId, reason)),
      withdrawNomination: (id) => run(withdrawNominationAction(id)),
      selectParticipants: (requestId, memberIds, rationale, overrideReason) =>
        run(
          selectParticipantsAction(
            requestId,
            memberIds,
            rationale,
            overrideReason,
          ),
        ),
      respond: (assignmentId, accept, reason) =>
        run(respondToInvitation(assignmentId, accept, reason)),
      replaceParticipant: (id) => run(replaceParticipantAction(id)),
      recheck: (requestId) => run(recheckAvailability(requestId)),
      confirmMeeting: (requestId, manualReason) =>
        run(confirmMeetingAction(requestId, manualReason)),
      recordOutcome: (requestId, attendance, outcome) =>
        run(recordOutcomeAction(requestId, attendance, outcome)),
      markRead: (id) => run(markPresalesNotificationRead(id)),
      markAllRead: () => run(markAllPresalesNotificationsRead()),
      // Administration lives in the admin console for now.
      updateUser: notYet,
      inviteUser: notYet,
      importMembers: notYet,
      savePod: notYet,
      saveSkill: notYet,
      saveMeetingType: notYet,
      savePolicies: notYet,
      retryJob: notYet,
    };
  }, [data, meId, enabledPages, now, router, toast]);

  return (
    <TrackerContext.Provider value={value}>{children}</TrackerContext.Provider>
  );
}
