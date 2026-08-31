import { Button } from './Button';

/** Which page numbers to show as clickable buttons - first, last, current
 * ± 1, with `null` gaps collapsed to an ellipsis, so a 200-page result
 * doesn't render 200 buttons. */
function pageWindow(current: number, total: number): (number | null)[] {
  const pages = new Set<number>([1, total, current, current - 1, current + 1]);
  const sorted = Array.from(pages)
    .filter(p => p >= 1 && p <= total)
    .sort((a, b) => a - b);

  const result: (number | null)[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) {
      result.push(null);
    }
    result.push(sorted[i]);
  }
  return result;
}

/**
 * Numbered pager (1, 2, 3, …) for page-number/offset-paginated data - not
 * infinite-scroll "Load more". Backed by GHA's page/pageSize/total/
 * totalPages response shape (docus/MOMO-HOUR-PHASE2.md's datalake/data
 * warehouse listings).
 */
export function Pagination({
  page,
  totalPages,
  total,
  onPageChange,
  isLoading
}: {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 p-3 dark:border-slate-800">
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Page {page} of {totalPages} · {total.toLocaleString()} row(s) total
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="secondary"
          size="sm"
          disabled={page <= 1 || isLoading}
          onClick={() => onPageChange(page - 1)}
        >
          ← Prev
        </Button>
        {pageWindow(page, totalPages).map((p, i) =>
          p === null ? (
            <span key={`ellipsis-${i}`} className="px-1 text-xs text-slate-400">
              …
            </span>
          ) : (
            <Button
              key={p}
              variant={p === page ? 'primary' : 'secondary'}
              size="sm"
              disabled={isLoading}
              onClick={() => onPageChange(p)}
            >
              {p}
            </Button>
          )
        )}
        <Button
          variant="secondary"
          size="sm"
          disabled={page >= totalPages || isLoading}
          onClick={() => onPageChange(page + 1)}
        >
          Next →
        </Button>
      </div>
    </div>
  );
}
