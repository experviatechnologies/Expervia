import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCrmSession } from "@/lib/crm/session";
import {
  TASK_VIEWS,
  TasksNotReady,
  listTasks,
  taskViewCounts,
  type TaskView,
} from "@/lib/crm/tasks";
import { listOwners } from "@/lib/crm/record";
import { TASK_VIEW_LABEL } from "@/lib/crm/labels";
import { Card } from "@/components/crm/ui";
import { TaskForm } from "@/components/crm/task-form";
import { TaskList } from "@/components/crm/task-list";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Tasks" };

const EMPTY: Record<TaskView, string> = {
  mine: "You have no open tasks. Add one on the right, or from a contact's record.",
  due: "Nothing overdue or due today.",
  upcoming: "Nothing coming up after today.",
  open: "The team has no open tasks.",
  done: "No tasks have been completed yet.",
};

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string | string[] }>;
}) {
  const session = await getCrmSession();
  if (!session) redirect("/signin?next=/crm/tasks");
  const me = session.member.id;

  const sp = await searchParams;
  const raw = Array.isArray(sp.view) ? sp.view[0] : sp.view;
  const view: TaskView = (TASK_VIEWS as readonly string[]).includes(raw ?? "")
    ? (raw as TaskView)
    : "mine";

  let data;
  try {
    data = await Promise.all([
      listTasks(view, me),
      taskViewCounts(me),
      listOwners(),
    ]);
  } catch (e) {
    if (e instanceof TasksNotReady) {
      return (
        <div className="mx-auto max-w-3xl">
          <h1 className="text-ink text-2xl font-bold tracking-tight">Tasks</h1>
          <Card className="mt-6">
            <p className="text-sm text-slate-700">
              Tasks aren&apos;t set up yet. Run{" "}
              <code className="bg-brand-50 text-brand-800 rounded px-1.5 py-0.5">
                supabase/eten/67_crm_tasks.sql
              </code>{" "}
              in the Supabase SQL Editor, then reload this page.
            </p>
          </Card>
        </div>
      );
    }
    throw e;
  }
  const [{ rows, total }, counts, owners] = data;
  const teamView = view === "open" || view === "done";

  return (
    <div className="mx-auto max-w-7xl">
      <h1 className="text-ink text-2xl font-bold tracking-tight sm:text-3xl">
        Tasks
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        Follow-ups for the team. Tick a task when it&apos;s done and it is noted
        on the contact&apos;s or company&apos;s timeline.
      </p>

      <nav aria-label="Task views" className="-mx-4 mt-6 overflow-x-auto px-4">
        <ul className="flex min-w-max gap-1 border-b border-[#ece9f5]">
          {TASK_VIEWS.map((v) => {
            const active = v === view;
            return (
              <li key={v}>
                <Link
                  href={v === "mine" ? "/crm/tasks" : `/crm/tasks?view=${v}`}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "-mb-px flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors",
                    active
                      ? "border-brand-600 text-brand-700"
                      : "hover:text-ink border-transparent text-slate-500",
                  )}
                >
                  {TASK_VIEW_LABEL[v]}
                  {v !== "done" && (
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs tabular-nums",
                        v === "due" && (counts[v] ?? 0) > 0
                          ? "bg-rose-100 text-rose-800"
                          : active
                            ? "bg-brand-100 text-brand-800"
                            : "bg-slate-100 text-slate-600",
                      )}
                    >
                      {counts[v] ?? "–"}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <Card
          title={TASK_VIEW_LABEL[view]}
          action={
            total > rows.length ? (
              <span className="text-xs text-slate-500">
                Showing {rows.length} of {total}
              </span>
            ) : null
          }
        >
          <TaskList tasks={rows} showAssignee={teamView} empty={EMPTY[view]} />
        </Card>
        <Card title="Add a task">
          <TaskForm owners={owners} meId={me} />
        </Card>
      </div>
    </div>
  );
}
