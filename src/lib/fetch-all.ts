/**
 * Read every row of a query, 1,000 at a time.
 *
 * Supabase (PostgREST) returns at most 1,000 rows per request, silently. Any
 * list or count that can grow past that (members, profiles, pod memberships,
 * certifications ...) must read in pages, or rows beyond 1,000 simply vanish
 * from the screen. The members table passed 1,000 on 24 Nov 2026.
 *
 * Pass a function that builds the query for a row range, with a stable order:
 *
 *   const { data } = await fetchAllRows((from, to) =>
 *     admin.from("members").select("id").order("id").range(from, to));
 *
 * Returns the same { data, error } shape as a single Supabase query, so it can
 * replace one in a Promise.all without other changes.
 */
const PAGE = 1000;

type Page<T> = PromiseLike<{
  data: T[] | null;
  error: { message: string } | null;
}>;

export async function fetchAllRows<T>(
  page: (from: number, to: number) => Page<T>,
): Promise<
  { data: T[]; error: null } | { data: null; error: { message: string } }
> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await page(from, from + PAGE - 1);
    if (error) return { data: null, error };
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE) return { data: rows, error: null };
  }
}
