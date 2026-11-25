"use client";

/**
 * A list of tasks with a checkbox to complete (or reopen) each one. Overdue
 * and due-today are shown with an icon and words, never colour alone.
 */
import Link from "next/link";
import { useState, useTransition } from "react";
import {
  AlertCircle,
  Building2,
  Clock,
  Loader2,
  Trash2,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TASK_PRIORITY_LABEL, TASK_TYPE_LABEL } from "@/lib/crm/labels";
import type { TaskRow } from "@/lib/crm/tasks";
import { deleteTask, setTaskDone } from "@/app/crm/tasks/actions";

const PRIORITY_CHIP = {
  high: "bg-rose-50 text-rose-700 ring-rose-600/15",
  medium: "bg-amber-50 text-amber-800 ring-amber-600/20",
  low: "bg-slate-100 text-slate-600 ring-slate-500/15",
} as const;

function TaskItem({
  task,
  showRelated,
  showAssignee,
}: {
  task: TaskRow;
  showRelated: boolean;
  showAssignee: boolean;
}) {
  const [pending, start] = useTransition();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const done = Boolean(task.doneAt);

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) => {
    setError(null);
    start(async () => {
      const res = await fn();
      if (!res.ok) setError(res.error ?? "Something went wrong.");
    });
  };

  return (
    <li className="flex gap-3 py-3 first:pt-0 last:pb-0">
      <div className="pt-0.5">
        {pending && !deleting ? (
          <Loader2
            aria-label="Saving"
            className="text-brand-500 size-5 animate-spin"
          />
        ) : (
          <input
            type="checkbox"
            checked={done}
            onChange={(e) => run(() => setTaskDone(task.id, e.target.checked))}
            aria-label={
              done ? `Reopen: ${task.title}` : `Mark done: ${task.title}`
            }
            className="accent-brand-700 size-5 cursor-pointer"
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm font-semibold",
            done ? "text-slate-500 line-through" : "text-ink",
          )}
        >
          {task.title}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
          <span>{TASK_TYPE_LABEL[task.type]}</span>
          {!done && (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold ring-1 ring-inset",
                PRIORITY_CHIP[task.priority],
              )}
            >
              {TASK_PRIORITY_LABEL[task.priority]} priority
            </span>
          )}
          {done ? (
            <span>
              Done {task.doneLabel}
              {task.doneByName ? ` by ${task.doneByName}` : ""}
            </span>
          ) : task.dueLabel ? (
            <span
              className={cn(
                "inline-flex items-center gap-1",
                task.overdue && "font-semibold text-rose-700",
                task.dueToday && "font-semibold text-amber-800",
              )}
            >
              {task.overdue ? (
                <AlertCircle aria-hidden className="size-3.5" />
              ) : (
                <Clock aria-hidden className="size-3.5" />
              )}
              {task.overdue
                ? "Overdue · "
                : task.dueToday
                  ? "Due today · "
                  : "Due "}
              {task.dueLabel}
            </span>
          ) : (
            <span className="text-slate-400">No due date</span>
          )}
          {showRelated && task.contact && (
            <Link
              href={`/crm/contacts/${task.contact.id}`}
              className="text-brand-700 inline-flex items-center gap-1 font-semibold hover:underline"
            >
              <User aria-hidden className="size-3.5" />
              {task.contact.name}
            </Link>
          )}
          {showRelated && task.company && (
            <Link
              href={`/crm/companies/${task.company.id}`}
              className="text-brand-700 inline-flex items-center gap-1 font-semibold hover:underline"
            >
              <Building2 aria-hidden className="size-3.5" />
              {task.company.name}
            </Link>
          )}
          {showAssignee && task.assigneeName && (
            <span>For {task.assigneeName}</span>
          )}
        </div>
        {task.notes && !done && (
          <p className="mt-1 text-sm whitespace-pre-line text-slate-600">
            {task.notes}
          </p>
        )}
        {error && (
          <p role="alert" className="mt-1 text-sm text-rose-700">
            {error}
          </p>
        )}
      </div>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setDeleting(true);
          run(() => deleteTask(task.id));
        }}
        aria-label={`Delete task: ${task.title}`}
        title="Delete task"
        className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"
      >
        {pending && deleting ? (
          <Loader2 aria-hidden className="size-4 animate-spin" />
        ) : (
          <Trash2 aria-hidden className="size-4" />
        )}
      </button>
    </li>
  );
}

export function TaskList({
  tasks,
  showRelated = true,
  showAssignee = false,
  empty,
}: {
  tasks: TaskRow[];
  showRelated?: boolean;
  showAssignee?: boolean;
  empty: string;
}) {
  if (tasks.length === 0) {
    return <p className="text-sm text-slate-600">{empty}</p>;
  }
  return (
    <ul className="divide-y divide-[#f1eef8]">
      {tasks.map((t) => (
        <TaskItem
          key={t.id}
          task={t}
          showRelated={showRelated}
          showAssignee={showAssignee}
        />
      ))}
    </ul>
  );
}
