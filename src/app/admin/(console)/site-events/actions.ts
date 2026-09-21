"use server";

import { revalidatePath } from "next/cache";
import { isOperations } from "@/lib/auth";
import { getCurrentMember } from "@/lib/auth";
import { getSupabaseAdmin, EVENT_MEDIA_BUCKET } from "@/lib/supabase";

type ActionResult = { ok: true } | { error: string };

/** datetime-local "YYYY-MM-DDTHH:mm" → WAT (+01:00) ISO, or null if empty. */
function toWat(local: string | undefined): string | null | false {
  const v = local?.trim();
  if (!v) return null;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v)) return false;
  return `${v}:00+01:00`;
}

type EventInput = {
  title: string;
  blurb?: string;
  speaker?: string;
  speakerTitle?: string;
  startLocal?: string;
  endLocal?: string;
  platform?: string;
  joinUrl?: string;
  recordingUrl?: string;
  imagePath?: string | null;
  published?: boolean;
};

function buildRow(
  input: EventInput,
): { row: Record<string, unknown> } | { error: string } {
  const title = input.title?.trim();
  if (!title) return { error: "A title is required." };
  const startAt = toWat(input.startLocal);
  const endAt = toWat(input.endLocal);
  if (startAt === false || endAt === false) {
    return { error: "Please enter valid start/end times." };
  }
  return {
    row: {
      title,
      blurb: input.blurb?.trim() || null,
      speaker: input.speaker?.trim() || null,
      speaker_title: input.speakerTitle?.trim() || null,
      start_at: startAt,
      end_at: endAt,
      platform: input.platform?.trim() || null,
      join_url: input.joinUrl?.trim() || null,
      recording_url: input.recordingUrl?.trim() || null,
      image_path: input.imagePath ?? null,
      published: Boolean(input.published),
    },
  };
}

export async function createEvent(input: EventInput): Promise<ActionResult> {
  if (!(await isOperations())) {
    return { error: "You don't have permission to manage events." };
  }
  const built = buildRow(input);
  if ("error" in built) return built;
  const me = await getCurrentMember();
  const { error } = await getSupabaseAdmin()
    .from("events")
    .insert({ ...built.row, created_by: me?.id ?? null });
  if (error) return { error: "Couldn't create the event. Please try again." };
  revalidatePath("/admin/site-events");
  revalidatePath("/events");
  return { ok: true };
}

export async function updateEvent(
  input: EventInput & { id: string },
): Promise<ActionResult> {
  if (!(await isOperations())) {
    return { error: "You don't have permission to manage events." };
  }
  const built = buildRow(input);
  if ("error" in built) return built;
  const { error } = await getSupabaseAdmin()
    .from("events")
    .update(built.row)
    .eq("id", input.id);
  if (error) return { error: "Couldn't update the event. Please try again." };
  revalidatePath("/admin/site-events");
  revalidatePath("/events");
  return { ok: true };
}

export async function setEventPublished(input: {
  id: string;
  published: boolean;
}): Promise<ActionResult> {
  if (!(await isOperations())) {
    return { error: "You don't have permission to manage events." };
  }
  const { error } = await getSupabaseAdmin()
    .from("events")
    .update({ published: input.published })
    .eq("id", input.id);
  if (error) return { error: "Couldn't update the event. Please try again." };
  revalidatePath("/admin/site-events");
  revalidatePath("/events");
  return { ok: true };
}

export async function deleteEvent(input: {
  id: string;
}): Promise<ActionResult> {
  if (!(await isOperations())) {
    return { error: "You don't have permission to manage events." };
  }
  const admin = getSupabaseAdmin();
  const { data: existing } = await admin
    .from("events")
    .select("image_path")
    .eq("id", input.id)
    .maybeSingle();
  const { error } = await admin.from("events").delete().eq("id", input.id);
  if (error) return { error: "Couldn't delete the event. Please try again." };
  if (existing?.image_path) {
    await admin.storage.from(EVENT_MEDIA_BUCKET).remove([existing.image_path]);
  }
  revalidatePath("/admin/site-events");
  revalidatePath("/events");
  return { ok: true };
}
