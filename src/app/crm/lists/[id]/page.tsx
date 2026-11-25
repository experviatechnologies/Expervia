import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ExternalLink, Filter, UserCheck } from "lucide-react";
import { getCrmSession } from "@/lib/crm/session";
import {
  ListsNotReady,
  describeFilters,
  filterOptions,
  getList,
} from "@/lib/crm/lists";
import {
  SAVED_FILTER_KEYS,
  filtersToParams,
  listContacts,
} from "@/lib/crm/contacts";
import { fullName } from "@/lib/crm/labels";
import { Chip, LIST_KIND_CHIP } from "@/components/crm/ui";
import { ContactsTable } from "@/components/crm/contacts-table";
import { ExportCsvButton } from "@/components/shared/export-csv-button";
import { exportListCsv } from "../../contacts/actions";
import { ListControls, RemoveFromList } from "./list-controls";

export const metadata: Metadata = { title: "List" };

const PAGE_SIZE = 25;

export default async function ListPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const session = await getCrmSession();
  if (!session) redirect("/signin?next=/crm/lists");

  const { id } = await params;
  let list;
  try {
    list = await getList(id);
  } catch (e) {
    if (e instanceof ListsNotReady) redirect("/crm/lists");
    throw e;
  }
  if (!list) notFound();

  const sp = await searchParams;
  const pageParam = Array.isArray(sp.page) ? sp.page[0] : sp.page;
  const requested = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);
  const filters =
    list.kind === "smart" ? list.filters : { ...list.filters, listId: list.id };

  const [options, first] = await Promise.all([
    filterOptions(),
    listContacts(filters, requested, PAGE_SIZE),
  ]);
  const lastPage = Math.max(1, Math.ceil(first.total / PAGE_SIZE));
  const page = Math.min(requested, lastPage);
  const { rows, total } =
    page === requested ? first : await listContacts(filters, page, PAGE_SIZE);

  const saved = filtersToParams(list.filters, SAVED_FILTER_KEYS);
  const contactsHref = `/crm/contacts?${new URLSearchParams(saved)}`;

  return (
    <div className="mx-auto max-w-7xl">
      <Link
        href="/crm/lists"
        className="hover:text-brand-700 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600"
      >
        <ArrowLeft aria-hidden className="size-4" />
        All lists
      </Link>

      <header className="mt-4 rounded-2xl border border-[#ece9f5] bg-white p-5 shadow-[0_1px_2px_rgba(23,19,35,0.04)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-ink text-xl font-bold tracking-tight sm:text-2xl">
                {list.name}
              </h1>
              <Chip className={LIST_KIND_CHIP[list.kind]}>
                {list.kind === "smart" ? (
                  <Filter aria-hidden className="size-3" />
                ) : (
                  <UserCheck aria-hidden className="size-3" />
                )}
                {list.kind === "smart" ? "Smart list" : "Fixed list"}
              </Chip>
            </div>
            {list.description && (
              <p className="mt-1 text-sm text-slate-600">{list.description}</p>
            )}
            <p className="mt-2 text-sm text-slate-700">
              <span className="text-ink font-semibold">
                {total.toLocaleString("en-GB")}
              </span>{" "}
              {total === 1 ? "person" : "people"}
              {list.kind === "smart" && (
                <>
                  {" · "}
                  {describeFilters(list.filters, options.owners).join(" · ")}
                </>
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {list.kind === "smart" && (
              <Link
                href={contactsHref}
                className="text-ink hover:border-brand-300 hover:bg-brand-50 inline-flex h-10 items-center gap-2 rounded-lg border border-[#e4e0f0] bg-white px-3.5 text-sm font-semibold transition-colors"
              >
                <ExternalLink aria-hidden className="text-brand-600 size-4" />
                Open in Contacts
              </Link>
            )}
            <ExportCsvButton
              action={exportListCsv}
              args={list.id}
              filename="crm-list.csv"
              className="text-ink hover:border-brand-300 hover:bg-brand-50 inline-flex h-10 items-center gap-2 rounded-lg border border-[#e4e0f0] bg-white px-3.5 text-sm font-semibold transition-colors disabled:opacity-50"
            />
            <ListControls
              listId={list.id}
              listName={list.name}
              options={options}
              initial={{
                name: list.name,
                description: list.description ?? "",
                kind: list.kind,
                filters: saved,
              }}
            />
          </div>
        </div>
      </header>

      <div className="mt-6">
        <ContactsTable
          rows={rows}
          total={total}
          page={page}
          pageSize={PAGE_SIZE}
          caption={list.name}
          pageHref={(p) => `/crm/lists/${list.id}?page=${p}`}
          empty={
            list.kind === "smart"
              ? {
                  title: "Nobody matches right now",
                  text: "People will appear here as soon as they match this list's filters.",
                }
              : {
                  title: "Nobody on this list yet",
                  text: "Open a contact and use the Lists section on their record to add them.",
                  action: (
                    <Link
                      href="/crm/contacts"
                      className="text-brand-700 text-sm font-semibold hover:underline"
                    >
                      Go to contacts
                    </Link>
                  ),
                }
          }
          actionLabel="Remove from list"
          rowAction={
            list.kind === "fixed"
              ? (c) => (
                  <RemoveFromList
                    listId={list.id}
                    contactId={c.id}
                    name={fullName(c.firstName, c.lastName)}
                  />
                )
              : undefined
          }
        />
      </div>
    </div>
  );
}
