"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getCrmSession } from "@/lib/crm/session";
import { isUuid, listOwners } from "@/lib/crm/record";
import {
  TASK_PRIORITIES,
  TASK_TYPES,
  type TaskPriority,
  type TaskType,
} from "@/lib/crm/tasks";

export type TaskResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

const NOT_READY = "Tasks aren't set up yet. Run SQL 67 in Supabase first.";
const missingTable = (e: { message: string; code?: string } | null) =>
  Boolean(e && (e.code === "42P01" || /crm_tasks/.test(e.message)));

function refresh(contactId?: string | null, companyId?: string | null) {
  revalidatePath("/crm/tasks");
  revalidatePath("/crm", "layout"); // sidebar count
  if (contactId) revalidatePath(`/crm/contacts/${contactId}`);
  if (companyId) revalidatePath(`/crm/companies/${companyId}`);
}

/** Write a line on the related contact's or company's timeline. */
async function timeline(
  task: { contact_id: string | null; company_id: string | null; title: string },
  event: string,
  subject: string,
  actorId: string,
  taskId: string,
) {
  if (!task.contact_id && !task.company_id) return;
  await getSupabaseAdmin()
    .from("crm_activities")
    .insert({
      contact_id: task.contact_id,
      company_id: task.contact_id ? null : task.company_id,
      type: "task",
      product: "crm",
      event,
      subject,
      payload: { task_id: taskId },
      actor_id: actorId,
    });
}

export async function createTask(input: {
  title: string;
  notes?: string;
  type: TaskType;
  priority: TaskPriority;
  dueAt?: string | null;
  assigneeId?: string | null;
  contactId?: string | null;
  companyId?: string | null;
}): Promise<TaskResult> {
  const session = await getCrmSession();
  if (!session)
    return { ok: false, error: "You don't have access to the CRM." };

  const title = (input.title ?? "").trim().replace(/\s+/g, " ");
  const notes = (input.notes ?? "").trim();
  if (!title) return { ok: false, error: "Say what needs doing." };
  if (title.length > 200)
    return { ok: false, error: "Keep the title shorter." };
  if (notes.length > 2000)
    return { ok: false, error: "The notes are too long." };
  if (!(TASK_TYPES as readonly string[]).includes(input.type)) {
    return { ok: false, error: "Choose a task type." };
  }
  if (!(TASK_PRIORITIES as readonly string[]).includes(input.priority)) {
    return { ok: false, error: "Choose a priority." };
  }
  let dueAt: string | null = null;
  if (input.dueAt) {
    const d = new Date(input.dueAt);
    if (Number.isNaN(d.getTime()))
      return { ok: false, error: "Pick a valid due date." };
    dueAt = d.toISOString();
  }
  const assigneeId = input.assigneeId || session.member.id;
  if (assigneeId !== session.member.id) {
    const owners = await listOwners();
    if (!owners.some((o) => o.id === assigneeId)) {
      return { ok: false, error: "Tasks can only be given to CRM staff." };
    }
  }
  const contactId =
    input.contactId && isUuid(input.contactId) ? input.contactId : null;
  const companyId =
    input.companyId && isUuid(input.companyId) ? input.companyId : null;

  const { data, error } = await getSupabaseAdmin()
    .from("crm_tasks")
    .insert({
      title,
      notes: notes || null,
      type: input.type,
      priority: input.priority,
      due_at: dueAt,
      assignee_id: assigneeId,
      contact_id: contactId,
      company_id: companyId,
      created_by: session.member.id,
    })
    .select("id, contact_id, company_id, title")
    .single();
  if (error || !data) {
    return {
      ok: false,
      error: missingTable(error) ? NOT_READY : "Couldn't save the task.",
    };
  }
  await timeline(
    data,
    "task_created",
    `Task added: ${title}`,
    session.member.id,
    data.id,
  );
  refresh(contactId, companyId);
  return { ok: true, id: data.id };
}

export async function setTaskDone(
  id: string,
  done: boolean,
): Promise<TaskResult> {
  const session = await getCrmSession();
  if (!session)
    return { ok: false, error: "You don't have access to the CRM." };
  if (!isUuid(id)) return { ok: false, error: "Unknown task." };

  const admin = getSupabaseAdmin();
  const { data: task, error } = await admin
    .from("crm_tasks")
    .update(
      done
        ? { done_at: new Date().toISOString(), done_by: session.member.id }
        : { done_at: null, done_by: null },
    )
    .eq("id", id)
    .select("id, contact_id, company_id, title")
    .maybeSingle();
  if (error)
    return {
      ok: false,
      error: missingTable(error) ? NOT_READY : "Couldn't update the task.",
    };
  if (!task) return { ok: false, error: "Unknown task." };
  await timeline(
    task,
    done ? "task_done" : "task_reopened",
    done ? `Task done: ${task.title}` : `Task reopened: ${task.title}`,
    session.member.id,
    task.id,
  );
  refresh(task.contact_id, task.company_id);
  return { ok: true, id };
}

export async function deleteTask(id: string): Promise<TaskResult> {
  const session = await getCrmSession();
  if (!session)
    return { ok: false, error: "You don't have access to the CRM." };
  if (!isUuid(id)) return { ok: false, error: "Unknown task." };
  const { data, error } = await getSupabaseAdmin()
    .from("crm_tasks")
    .delete()
    .eq("id", id)
    .select("contact_id, company_id")
    .maybeSingle();
  if (error) return { ok: false, error: "Couldn't delete the task." };
  refresh(data?.contact_id, data?.company_id);
  return { ok: true, id };
}

/** Contacts and companies matching a search, for linking a new task. */
export async function searchRelated(
  q: string,
): Promise<
  { kind: "contact" | "company"; id: string; label: string; detail: string }[]
> {
  const session = await getCrmSession();
  if (!session) return [];
  const term = (q ?? "")
    .replace(/[,()*%\\:"']/g, " ")
    .trim()
    .slice(0, 60);
  if (term.length < 2) return [];
  const admin = getSupabaseAdmin();
  const words = term.split(/\s+/).slice(0, 3);
  let contacts = admin
    .from("crm_contacts")
    .select("id, first_name, last_name, email")
    .limit(6);
  for (const w of words) {
    contacts = contacts.or(
      `first_name.ilike.%${w}%,last_name.ilike.%${w}%,email.ilike.%${w}%`,
    );
  }
  const [c, co] = await Promise.all([
    contacts,
    admin
      .from("crm_companies")
      .select("id, name")
      .ilike("name", `%${term}%`)
      .limit(4),
  ]);
  return [
    ...(c.data ?? []).map((r) => ({
      kind: "contact" as const,
      id: r.id,
      label: `${r.first_name} ${r.last_name}`.trim() || "No name",
      detail: r.email ?? "Contact",
    })),
    ...(co.data ?? []).map((r) => ({
      kind: "company" as const,
      id: r.id,
      label: r.name,
      detail: "Company",
    })),
  ];
}
