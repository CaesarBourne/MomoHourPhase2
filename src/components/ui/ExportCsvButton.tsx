'use client';

import { Button } from './Button';

/** Exports whatever's currently on screen (i.e. already filtered) as a CSV
 * download - the export itself has no separate filter state of its own. */
export function ExportCsvButton({
  onExport,
  disabled,
  className = '',
  title
}: {
  onExport: () => void;
  disabled?: boolean;
  className?: string;
  title?: string;
}) {
  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      disabled={disabled}
      onClick={onExport}
      className={className}
      title={title}
    >
      ⇩ Export CSV
    </Button>
  );
}
