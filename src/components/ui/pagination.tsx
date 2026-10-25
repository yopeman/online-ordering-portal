import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

export interface PaginationLabels {
  previous: string;
  next: string;
  page: string;
  first?: string;
  last?: string;
  showing?: string;
  showingRange?: string;
  perPage?: string;
  itemsPerPage?: string;
}

export interface PaginationProps {
  page: number;
  totalPages: number;
  buildHref: (page: number, perPage?: number) => string;
  labels: PaginationLabels;
  totalItems?: number;
  perPage?: number;
  perPageOptions?: number[];
  className?: string;
}

export function Pagination({
  page,
  totalPages,
  buildHref,
  labels,
  totalItems,
  perPage,
  perPageOptions,
  className = "",
}: PaginationProps) {
  // If no items at all, hide pagination
  if (totalPages <= 0 || totalItems === 0) return null;

  const currentLimit = perPage || 20;

  let rangeText: string | null = null;
  if (typeof totalItems === "number" && totalItems > 0) {
    const from = Math.min(totalItems, (page - 1) * currentLimit + 1);
    const to = Math.min(totalItems, page * currentLimit);
    if (labels.showingRange) {
      rangeText = labels.showingRange
        .replace("{from}", String(from))
        .replace("{to}", String(to))
        .replace("{total}", String(totalItems));
    } else {
      rangeText = `${labels.showing || "Showing"} ${from}–${to} of ${totalItems}`;
    }
  }

  const showPerPage =
    Boolean(perPageOptions && perPage && perPageOptions.length > 1) &&
    (totalItems === undefined || totalItems > (perPageOptions ? Math.min(...perPageOptions) : 0));

  // If only 1 page and no range/per-page controls to show, nothing to render
  if (totalPages <= 1 && !showPerPage && !rangeText) {
    return null;
  }

  // Calculate visible numeric pages around active page
  const windowSize = 2;
  const pageNumbers: number[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= page - windowSize && i <= page + windowSize)
    ) {
      pageNumbers.push(i);
    }
  }

  return (
    <div
      className={`flex flex-col gap-3 rounded-2xl border border-border/80 bg-surface/80 p-3 shadow-xs backdrop-blur-xs sm:flex-row sm:items-center sm:justify-between ${className}`}
      aria-label="Pagination Navigation"
    >
      {/* Range text / summary */}
      <div className="flex items-center justify-between sm:justify-start gap-3">
        {rangeText ? (
          <p className="text-xs sm:text-sm font-medium text-muted-foreground">
            {rangeText}
          </p>
        ) : (
          <span className="hidden sm:inline-block" />
        )}

        {/* Mobile-only page size selector if on single row */}
        {showPerPage && perPageOptions ? (
          <div className="flex sm:hidden items-center gap-1 text-xs">
            <span className="text-muted-foreground">{labels.perPage || "Per page"}:</span>
            <div className="inline-flex items-center rounded-lg border border-border bg-surface p-0.5">
              {perPageOptions.map((opt) => (
                <Link
                  key={opt}
                  href={buildHref(1, opt)}
                  className={`rounded-md px-1.5 py-0.5 text-xs font-medium transition-all ${
                    opt === perPage
                      ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                      : "text-muted-foreground hover:bg-surface-muted hover:text-foreground"
                  }`}
                >
                  {opt}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {/* Navigation Controls */}
      <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 sm:gap-4">
        {totalPages > 1 ? (
          <nav className="flex items-center gap-1 sm:gap-1.5" aria-label="Pagination">
            {/* First Page */}
            <Link
              href={buildHref(1, perPage)}
              aria-disabled={page === 1}
              title={labels.first || "First page"}
              className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border text-sm transition-colors ${
                page === 1
                  ? "pointer-events-none opacity-40 text-subtle-foreground"
                  : "bg-surface hover:bg-surface-muted hover:border-primary-border text-foreground"
              }`}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Link>

            {/* Previous Page */}
            <Link
              href={buildHref(Math.max(1, page - 1), perPage)}
              aria-disabled={page === 1}
              className={`inline-flex h-9 items-center gap-1 rounded-xl border border-border px-2.5 sm:px-3 text-xs sm:text-sm font-medium transition-colors ${
                page === 1
                  ? "pointer-events-none opacity-40 text-subtle-foreground"
                  : "bg-surface hover:bg-surface-muted hover:border-primary-border text-foreground"
              }`}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">{labels.previous}</span>
            </Link>

            {/* Numeric page items */}
            <ul className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 max-w-[50vw] sm:max-w-none">
              {pageNumbers.map((p, idx) => {
                const prev = pageNumbers[idx - 1];
                const hasGap = prev !== undefined && p - prev > 1;

                return (
                  <li key={p} className="flex items-center gap-1 shrink-0">
                    {hasGap ? (
                      <span
                        className="px-1 text-xs text-subtle-foreground select-none"
                        aria-hidden="true"
                      >
                        …
                      </span>
                    ) : null}
                    <Link
                      href={buildHref(p, perPage)}
                      aria-current={p === page ? "page" : undefined}
                      className={`inline-flex h-9 min-w-9 items-center justify-center rounded-xl px-2.5 text-xs sm:text-sm font-semibold transition-all ${
                        p === page
                          ? "border border-primary bg-primary text-primary-foreground shadow-xs shadow-primary/25"
                          : "border border-border bg-surface text-muted-foreground hover:bg-surface-muted hover:text-foreground hover:border-border"
                      }`}
                    >
                      {p}
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* Next Page */}
            <Link
              href={buildHref(Math.min(totalPages, page + 1), perPage)}
              aria-disabled={page === totalPages}
              className={`inline-flex h-9 items-center gap-1 rounded-xl border border-border px-2.5 sm:px-3 text-xs sm:text-sm font-medium transition-colors ${
                page === totalPages
                  ? "pointer-events-none opacity-40 text-subtle-foreground"
                  : "bg-surface hover:bg-surface-muted hover:border-primary-border text-foreground"
              }`}
            >
              <span className="hidden sm:inline">{labels.next}</span>
              <ChevronRight className="h-4 w-4" />
            </Link>

            {/* Last Page */}
            <Link
              href={buildHref(totalPages, perPage)}
              aria-disabled={page === totalPages}
              title={labels.last || "Last page"}
              className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border text-sm transition-colors ${
                page === totalPages
                  ? "pointer-events-none opacity-40 text-subtle-foreground"
                  : "bg-surface hover:bg-surface-muted hover:border-primary-border text-foreground"
              }`}
            >
              <ChevronsRight className="h-4 w-4" />
            </Link>
          </nav>
        ) : null}

        {/* Desktop Page Size Selector */}
        {showPerPage && perPageOptions ? (
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="font-medium">{labels.perPage || "Per page"}:</span>
            <div className="inline-flex items-center rounded-xl border border-border bg-surface p-0.5">
              {perPageOptions.map((opt) => (
                <Link
                  key={opt}
                  href={buildHref(1, opt)}
                  className={`rounded-lg px-2 py-1 text-xs font-medium transition-all ${
                    opt === perPage
                      ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                      : "text-muted-foreground hover:bg-surface-muted hover:text-foreground"
                  }`}
                >
                  {opt}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}