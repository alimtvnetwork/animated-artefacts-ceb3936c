/**
 * Tiny JSON-download helper shared by the slide/theme exporters.
 * Centralizes the Blob → <a download> dance so each exporter stays small
 * and we don't repeat the URL.createObjectURL lifecycle (DRY rule 9).
 */

/** Slugify an arbitrary label into a filename-safe stem. */
export function slugifyName(s: string, fallback = 'export'): string {
  return (
    s
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase()
      .slice(0, 48) || fallback
  );
}

/** Trigger a browser download of `value` serialized as pretty JSON. */
export function downloadJson(value: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
