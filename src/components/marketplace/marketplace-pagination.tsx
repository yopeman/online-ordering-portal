"use client";

import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

interface MarketplacePaginationProps {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
  labels: {
    previous: string;
    next: string;
    page: string;
  };
}

export function MarketplacePagination({
  page,
  totalPages,
  buildHref,
  labels,
}: MarketplacePaginationProps) {
  if (totalPages <= 1) return null;

  // Generate visible page numbers with window of 2 around active page
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
    <nav
      className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-border bg-surface px-4 py-3.5 shadow-xs"
      aria-label="Marketplace Pagination"
    >
      {/* Left: Previous & First */}
      <div className="flex items-center gap-1.5 order-2 sm:order-1">
        <Link
          href={buildHref(1)}
          aria-disabled={page === 1}
          title="First page"
          className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border text-sm transition-colors ${
            page === 1
              ? "pointer-events-none opacity-40 text-subtle-foreground"
              : "text-foreground hover:bg-surface-muted hover:border-primary-border"
          }`}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Link>

        <Link
          href={buildHref(Math.max(1, page - 1))}
          aria-disabled={page === 1}
          className={`inline-flex h-9 items-center gap-1 rounded-xl border border-border px-3 text-sm font-medium transition-colors ${
            page === 1
              ? "pointer-events-none opacity-40 text-subtle-foreground"
              : "text-foreground hover:bg-surface-muted hover:border-primary-border"
          }`}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">{labels.previous}</span>
        </Link>
      </div>

      {/* Center: Numeric Page Buttons */}
      <div className="flex items-center gap-1 order-1 sm:order-2 overflow-x-auto no-scrollbar py-0.5">
        {pageNumbers.map((p, idx) => {
          const prev = pageNumbers[idx - 1];
          const hasGap = prev !== undefined && p - prev > 1;

          return (
            <div key={p} className="flex items-center gap-1">
              {hasGap ? (
                <span className="px-1.5 text-xs text-subtle-foreground select-none">
                  …
                </span>
              ) : null}

              <Link
                href={buildHref(p)}
                aria-current={p === page ? "page" : undefined}
                className={`inline-flex h-9 min-w-9 items-center justify-center rounded-xl px-2.5 text-xs sm:text-sm font-semibold transition-all ${
                  p === page
                    ? "border border-primary bg-primary text-primary-foreground shadow-xs shadow-primary/25"
                    : "border border-border text-muted-foreground hover:bg-surface-muted hover:text-foreground"
                }`}
              >
                {p}
              </Link>
            </div>
          );
        })}
      </div>

      {/* Right: Next & Last */}
      <div className="flex items-center gap-1.5 order-3">
        <Link
          href={buildHref(Math.min(totalPages, page + 1))}
          aria-disabled={page === totalPages}
          className={`inline-flex h-9 items-center gap-1 rounded-xl border border-border px-3 text-sm font-medium transition-colors ${
            page === totalPages
              ? "pointer-events-none opacity-40 text-subtle-foreground"
              : "text-foreground hover:bg-surface-muted hover:border-primary-border"
          }`}
        >
          <span className="hidden sm:inline">{labels.next}</span>
          <ChevronRight className="h-4 w-4" />
        </Link>

        <Link
          href={buildHref(totalPages)}
          aria-disabled={page === totalPages}
          title="Last page"
          className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border text-sm transition-colors ${
            page === totalPages
              ? "pointer-events-none opacity-40 text-subtle-foreground"
              : "text-foreground hover:bg-surface-muted hover:border-primary-border"
          }`}
        >
          <ChevronsRight className="h-4 w-4" />
        </Link>
      </div>
    </nav>
  );
}
