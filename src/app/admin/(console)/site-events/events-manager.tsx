"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  CalendarPlus,
  Loader2,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  ImageIcon,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  createEvent,
  updateEvent,
  deleteEvent,
  setEventPublished,
} from "./actions";

export type EventRow = {
  id: string;
  title: string;
  blurb: string | null;
  speaker: string | null;
  speakerTitle: string | null;
  platform: string | null;
  joinUrl: string | null;
  recordingUrl: string | null;
  imagePath: string | null;
  imageUrl: string | null;
  startLocal: string; // "YYYY-MM-DDTHH:mm" in WAT, or ""
  endLocal: string;
  published: boolean;
  timeStatus: "live" | "upcoming" | "ended" | "undated";
};

const STATUS_STYLE: Record<EventRow["timeStatus"], string> = {
  live: "bg-eten-verified/15 text-eten-verified",
  upcoming: "bg-eten-accent/15 text-eten-accent",
  ended: "bg-eten-hover text-eten-faint",
  undated: "bg-eten-hover text-eten-faint",
};
const STATUS_LABEL: Record<EventRow["timeStatus"], string> = {
  live: "Live now",
  upcoming: "Upcoming",
  ended: "Ended",
  undated: "No date",
};

function fieldClass() {
  return "border-eten-line bg-eten-panel-hi text-eten-ink focus:border-eten-accent w-full rounded-lg border px-3 py-2 text-sm outline-none";
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-eten-ink-muted mb-1 block text-xs font-medium">
      {children}
    </label>
  );
}

/** Create/edit form for one event. `event` undefined = new. */
function EventForm({
  event,
  onDone,
  onCancel,
}: {
  event?: EventRow;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(event?.title ?? "");
  const [blurb, setBlurb] = useState(event?.blurb ?? "");
  const [speaker, setSpeaker] = useState(event?.speaker ?? "");
  const [speakerTitle, setSpeakerTitle] = useState(event?.speakerTitle ?? "");
  const [startLocal, setStartLocal] = useState(event?.startLocal ?? "");
  const [endLocal, setEndLocal] = useState(event?.endLocal ?? "");
  const [platform, setPlatform] = useState(event?.platform ?? "");
  const [joinUrl, setJoinUrl] = useState(event?.joinUrl ?? "");
  const [recordingUrl, setRecordingUrl] = useState(event?.recordingUrl ?? "");
  const [published, setPublished] = useState(event?.published ?? false);
  const [imagePath, setImagePath] = useState<string | null>(
    event?.imagePath ?? null,
  );
  const [imageUrl, setImageUrl] = useState<string | null>(
    event?.imageUrl ?? null,
  );
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/event-image", {
        method: "POST",
        body,
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "The image upload failed.");
      } else {
        setImagePath(json.path);
        setImageUrl(json.url);
      }
    } catch {
      setError("The image upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  function submit() {
    setError(null);
    if (!title.trim()) {
      setError("A title is required.");
      return;
    }
    startTransition(async () => {
      const input = {
        title,
        blurb,
        speaker,
        speakerTitle,
        startLocal,
        endLocal,
        platform,
        joinUrl,
        recordingUrl,
        imagePath,
        published,
      };
      const res = event
        ? await updateEvent({ ...input, id: event.id })
        : await createEvent(input);
      if ("error" in res) setError(res.error);
      else onDone();
    });
  }

  const busy = pending || uploading;

  return (
    <div className="bg-eten-panel border-eten-line rounded-2xl border p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-eten-ink font-semibold">
          {event ? "Edit event" : "New event"}
        </h3>
        <Button
          type="button"
          variant="etenOutline"
          size="icon-sm"
          onClick={onCancel}
          disabled={busy}
          aria-label="Cancel"
        >
          <X className="size-3.5" />
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <Label>Title *</Label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={fieldClass()}
            placeholder="ETEN Webinar: …"
          />
        </div>

        <div className="md:col-span-2">
          <Label>Blurb</Label>
          <textarea
            value={blurb}
            onChange={(e) => setBlurb(e.target.value)}
            rows={3}
            className={fieldClass()}
            placeholder="Short description shown on the events page."
          />
        </div>

        <div>
          <Label>Speaker</Label>
          <input
            value={speaker}
            onChange={(e) => setSpeaker(e.target.value)}
            className={fieldClass()}
          />
        </div>
        <div>
          <Label>Speaker title</Label>
          <input
            value={speakerTitle}
            onChange={(e) => setSpeakerTitle(e.target.value)}
            className={fieldClass()}
          />
        </div>

        <div>
          <Label>Starts (WAT)</Label>
          <input
            type="datetime-local"
            value={startLocal}
            onChange={(e) => setStartLocal(e.target.value)}
            className={fieldClass()}
          />
        </div>
        <div>
          <Label>Ends (WAT)</Label>
          <input
            type="datetime-local"
            value={endLocal}
            onChange={(e) => setEndLocal(e.target.value)}
            className={fieldClass()}
          />
        </div>

        <div>
          <Label>Platform</Label>
          <input
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className={fieldClass()}
            placeholder="Zoom, Google Meet, …"
          />
        </div>
        <div>
          <Label>Join / register URL</Label>
          <input
            value={joinUrl}
            onChange={(e) => setJoinUrl(e.target.value)}
            className={fieldClass()}
            placeholder="https://…"
          />
        </div>

        <div className="md:col-span-2">
          <Label>Recording URL (YouTube — for past events)</Label>
          <input
            value={recordingUrl}
            onChange={(e) => setRecordingUrl(e.target.value)}
            className={fieldClass()}
            placeholder="https://youtube.com/watch?v=…"
          />
        </div>

        {/* Flyer image */}
        <div className="md:col-span-2">
          <Label>Flyer image</Label>
          <div className="flex flex-wrap items-center gap-4">
            <div className="border-eten-line bg-eten-panel-hi relative grid h-24 w-40 shrink-0 place-items-center overflow-hidden rounded-lg border">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt="Flyer preview"
                  fill
                  sizes="160px"
                  className="object-cover"
                />
              ) : (
                <ImageIcon className="text-eten-faint/50 size-7" />
              )}
            </div>
            <div className="flex flex-col gap-2">
              <label className="border-eten-line text-eten-ink-muted hover:border-eten-faint hover:text-eten-ink inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold">
                {uploading ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Upload className="size-3.5" />
                )}
                {imageUrl ? "Replace image" : "Upload image"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  disabled={uploading}
                  onChange={handleFile}
                />
              </label>
              {imageUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setImagePath(null);
                    setImageUrl(null);
                  }}
                  className="text-eten-faint hover:text-destructive text-left text-xs"
                >
                  Remove image
                </button>
              )}
              <p className="text-eten-faint text-xs">
                PNG, JPEG or WebP · 6 MB max
              </p>
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="accent-eten-accent size-4"
            />
            <span className="text-eten-ink">
              Published{" "}
              <span className="text-eten-faint">
                (visible on the public events page)
              </span>
            </span>
          </label>
        </div>
      </div>

      {error && <p className="text-destructive mt-4 text-sm">{error}</p>}

      <div className="mt-5 flex justify-end gap-2">
        <Button
          type="button"
          variant="etenOutline"
          size="sm"
          onClick={onCancel}
          disabled={busy}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="eten"
          size="sm"
          onClick={submit}
          disabled={busy}
        >
          {pending && <Loader2 className="size-3.5 animate-spin" />}
          {event ? "Save changes" : "Create event"}
        </Button>
      </div>
    </div>
  );
}

/** One row in the events list. */
function EventListItem({
  event,
  onEdit,
}: {
  event: EventRow;
  onEdit: () => void;
}) {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function togglePublish() {
    setError(null);
    startTransition(async () => {
      const res = await setEventPublished({
        id: event.id,
        published: !event.published,
      });
      if ("error" in res) setError(res.error);
      else router.refresh();
    });
  }

  function remove() {
    setError(null);
    startTransition(async () => {
      const res = await deleteEvent({ id: event.id });
      if ("error" in res) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <li className="bg-eten-panel border-eten-line flex flex-wrap items-center gap-4 rounded-2xl border p-4">
      <div className="border-eten-line bg-eten-panel-hi relative grid h-16 w-24 shrink-0 place-items-center overflow-hidden rounded-lg border">
        {event.imageUrl ? (
          <Image
            src={event.imageUrl}
            alt=""
            fill
            sizes="96px"
            className="object-cover"
          />
        ) : (
          <ImageIcon className="text-eten-faint/40 size-6" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-eten-ink font-semibold">{event.title}</span>
          <span
            className={
              "rounded-full px-2 py-0.5 text-[11px] font-medium " +
              STATUS_STYLE[event.timeStatus]
            }
          >
            {STATUS_LABEL[event.timeStatus]}
          </span>
          {!event.published && (
            <span className="bg-eten-hover text-eten-faint rounded-full px-2 py-0.5 text-[11px] font-medium">
              Draft
            </span>
          )}
          {event.recordingUrl && (
            <span className="text-eten-accent text-[11px] font-medium">
              Recording linked
            </span>
          )}
        </div>
        <div className="text-eten-faint mt-1 flex flex-wrap gap-x-3 text-xs">
          {event.startLocal && (
            <span className="tabular-nums">
              {event.startLocal.replace("T", " ")} WAT
            </span>
          )}
          {event.speaker && <span>{event.speaker}</span>}
          {event.platform && <span>{event.platform}</span>}
        </div>
        {error && <p className="text-destructive mt-1 text-xs">{error}</p>}
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="etenOutline"
          size="sm"
          onClick={togglePublish}
          disabled={pending}
          title={event.published ? "Unpublish" : "Publish"}
        >
          {pending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : event.published ? (
            <EyeOff className="size-3.5" />
          ) : (
            <Eye className="size-3.5" />
          )}
          {event.published ? "Unpublish" : "Publish"}
        </Button>
        <Button
          type="button"
          variant="etenOutline"
          size="sm"
          onClick={onEdit}
          disabled={pending}
        >
          <Pencil className="size-3.5" />
          Edit
        </Button>
        {confirmDelete ? (
          <>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={remove}
              disabled={pending}
            >
              Confirm
            </Button>
            <Button
              type="button"
              variant="etenOutline"
              size="sm"
              onClick={() => setConfirmDelete(false)}
              disabled={pending}
            >
              Cancel
            </Button>
          </>
        ) : (
          <Button
            type="button"
            variant="etenOutline"
            size="icon-sm"
            onClick={() => setConfirmDelete(true)}
            disabled={pending}
            aria-label="Delete"
          >
            <Trash2 className="size-3.5" />
          </Button>
        )}
      </div>
    </li>
  );
}

export function EventsManager({ events }: { events: EventRow[] }) {
  // null = closed, "new" = create form, otherwise the id being edited.
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const router = useRouter();

  function done() {
    setEditing(null);
    router.refresh();
  }

  const editingEvent =
    editing && editing !== "new"
      ? events.find((e) => e.id === editing)
      : undefined;

  return (
    <div className="flex flex-col gap-4">
      {editing === null && (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="eten"
            size="sm"
            onClick={() => setEditing("new")}
          >
            <CalendarPlus className="size-3.5" />
            New event
          </Button>
        </div>
      )}

      {editing === "new" && (
        <EventForm onDone={done} onCancel={() => setEditing(null)} />
      )}
      {editingEvent && (
        <EventForm
          event={editingEvent}
          onDone={done}
          onCancel={() => setEditing(null)}
        />
      )}

      {editing === null &&
        (events.length === 0 ? (
          <div className="bg-eten-panel border-eten-line text-eten-faint flex flex-col items-center gap-3 rounded-2xl border p-12 text-center">
            <CalendarPlus className="text-eten-faint/50 size-9" />
            <p className="text-sm">
              No events yet. Create one to show it on the public events page.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {events.map((event) => (
              <EventListItem
                key={event.id}
                event={event}
                onEdit={() => setEditing(event.id)}
              />
            ))}
          </ul>
        ))}
    </div>
  );
}
