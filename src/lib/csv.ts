/**
 * Tiny client-side CSV helpers for admin tables whose rows are already loaded
 * in the browser. `toCsv` builds an RFC-4180 string; `downloadCsv` triggers a
 * file download. `downloadCsv` touches the DOM, so call it only from a browser
 * event handler.
 */

type Cellish = string | number | null | undefined;

function cell(value: Cellish): string {
  if (value == null) return "";
  let s = String(value);
  // Formula injection (OWASP "CSV Injection"): a text cell starting with
  // = + - @ or a tab/return is run as a formula by Excel and Sheets. Prefix
  // it with ' so it opens as plain text (a phone like +234... stays readable).
  if (typeof value === "string" && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(headers: string[], rows: Cellish[][]): string {
  const lines = [
    headers.map(cell).join(","),
    ...rows.map((r) => r.map(cell).join(",")),
  ];
  return lines.join("\r\n");
}

export function downloadCsv(filename: string, csv: string): void {
  try {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch {
    /* download unavailable in this context */
  }
}
