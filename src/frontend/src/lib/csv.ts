/**
 * Shared CSV export utility.
 * Builds a CSV blob from headers + rows, triggers a file download.
 *
 * Each row is an array of string | number values. All values are
 * quoted and commas/double-quotes inside values are escaped.
 */
export function downloadCsv(
  filename: string,
  headers: string[],
  rows: (string | number)[][],
): void {
  const escapeField = (v: string | number) =>
    `"${String(v).replace(/"/g, '""')}"`;
  const csv = [headers.map(escapeField), ...rows.map((r) => r.map(escapeField))]
    .map((r) => r.join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
