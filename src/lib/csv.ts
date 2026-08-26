/** Column definition for exportToCsv: a header label plus how to read each
 * row's value for that column. */
export interface CsvColumn<T> {
  header: string;
  value: (row: T) => string | number | boolean | null | undefined;
}

function csvEscape(value: unknown): string {
  const str = value === null || value === undefined ? '' : String(value);
  // Quote whenever the field contains a comma, quote, or newline - the three
  // characters that would otherwise break column boundaries or row boundaries.
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Builds a CSV from the given rows/columns and triggers a browser download.
 * Client-side only (uses Blob + a synthetic anchor click) - exports exactly
 * what's currently on screen, i.e. whatever filters are already applied,
 * since callers pass the already-filtered array.
 */
export function exportToCsv<T>(filename: string, rows: T[], columns: CsvColumn<T>[]): void {
  const header = columns.map(c => csvEscape(c.header)).join(',');
  const lines = rows.map(row => columns.map(c => csvEscape(c.value(row))).join(','));
  const csv = [header, ...lines].join('\r\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
