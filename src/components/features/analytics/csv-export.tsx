'use client';

// =============================================================================
// CSV Export — Client-side download helper
// =============================================================================

/**
 * Trigger a CSV download in the browser.
 * @param csv The CSV string content (with BOM for Arabic support)
 * @param filename The download filename
 */
export function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Convert an array of objects to CSV string.
 * @param headers { key, label } array for column mapping
 * @param data Array of objects
 */
export function toCSV(
  headers: { key: string; label: string }[],
  data: Record<string, unknown>[],
): string {
  const BOM = '\uFEFF';
  const headerRow = headers.map((h) => `"${h.label}"`).join(',');
  const dataRows = data.map((row) =>
    headers.map((h) => {
      const val = row[h.key];
      const str = val === null || val === undefined ? '' : String(val);
      return `"${str.replace(/"/g, '""')}"`;
    }).join(','),
  );
  return BOM + [headerRow, ...dataRows].join('\n');
}
