import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Filter, ListChecks, UserCheck } from "lucide-react";
import { getCrmSession } from "@/lib/crm/session";
import {
  ListsNotReady,
  describeFilters,
  filterOptions,
  listLists,
  type CrmList,
} from "@/lib/crm/lists";
import { shortDate } from "@/lib/crm/labels";
import { Card, Chip, LIST_KIND_CHIP } from "@/components/crm/ui";
import { NewList } from "./new-list";

export const metadata: Metadata = { title: "Lists" };

export default async function ListsPage() {
  const session = await getCrmSession();
  if (!session) redirect("/signin?next=/crm/lists");

  let lists: CrmList[];
  try {
    lists = await listLists();
  } catch (e) {
    if (e instanceof ListsNotReady) {
      return (
        <div className="mx-auto max-w-3xl">
          <h1 className="text-ink text-2xl font-bold tracking-tight">Lists</h1>
          <Card className="mt-6">
            <p className="text-sm text-slate-700">
              Lists aren&apos;t set up yet. Run{" "}
              <code className="bg-brand-50 text-brand-800 rounded px-1.5 py-0.5">
                supabase/eten/66_crm_lists.sql
              </code>{" "}
              in the Supabase SQL Editor, then reload this page.
            </p>
          </Card>
        </div>
      );
    }
    throw e;
  }
  const options = await filterOptions();

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div>
          <h1 className="text-ink text-2xl font-bold tracking-tight sm:text-3xl">
            Lists
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Groups of contacts to follow up with or email. A smart list updates
            itself from its filters; a fixed list holds the people you add.
          </p>
        </div>
        <NewList options={options} />
      </div>

      {lists.length === 0 ? (
        <Card className="mt-6">
          <div className="flex flex-col items-center py-8 text-center">
            <span className="bg-brand-50 text-brand-700 flex size-12 items-center justify-center rounded-full">
              <ListChecks aria-hidden className="size-6" />
            </span>
            <h2 className="text-ink mt-4 font-semibold">No lists yet</h2>
            <p className="mt-1 max-w-md text-sm text-slate-600">
              Create one here, or filter the{" "}
              <Link
                href="/crm/contacts"
                className="text-brand-700 font-semibold hover:underline"
              >
                contacts list
              </Link>{" "}
              and choose <span className="font-semibold">Save as list</span>.
            </p>
          </div>
        </Card>
      ) : (
        <ul className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {lists.map((l) => (
            <li key={l.id}>
              <Link
                href={`/crm/lists/${l.id}`}
                className="hover:border-brand-300 focus-visible:outline-brand-400 flex h-full flex-col rounded-2xl border border-[#ece9f5] bg-white p-5 shadow-[0_1px_2px_rgba(23,19,35,0.04)] transition-colors focus-visible:outline-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-ink font-semibold">{l.name}</h2>
                  <Chip className={LIST_KIND_CHIP[l.kind]}>
                    {l.kind === "smart" ? (
                      <Filter aria-hidden className="size-3" />
                    ) : (
                      <UserCheck aria-hidden className="size-3" />
                    )}
                    {l.kind === "smart" ? "Smart" : "Fixed"}
                  </Chip>
                </div>
                {l.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                    {l.description}
                  </p>
                )}
                {l.kind === "smart" && (
                  <p className="mt-2 line-clamp-2 text-xs text-slate-500">
                    {describeFilters(l.filters, options.owners).join(" · ")}
                  </p>
                )}
                <div className="mt-auto flex items-end justify-between gap-3 pt-4">
                  <p>
                    <span className="text-ink text-2xl font-semibold">
                      {l.size?.toLocaleString("en-GB") ?? "–"}
                    </span>{" "}
                    <span className="text-sm text-slate-500">
                      {l.size === 1 ? "person" : "people"}
                    </span>
                  </p>
                  <p className="text-xs text-slate-500">
                    Updated {shortDate(l.updatedAt)}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
