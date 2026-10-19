import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({
  page,
  totalPages,
  buildHref,
  labels,
}: {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
  labels: { previous: string; next: string; page: string };
}) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);
  const window = 2;
  const visible = pages.filter(
    (candidate) =>
      candidate === 1 ||
      candidate === totalPages ||
      Math.abs(candidate - page) <= window,
  );

  return (
    <nav className="flex items-center justify-between gap-2 sm:gap-4" aria-label="Pagination">
      <Link
        href={buildHref(Math.max(1, page - 1))}
        aria-disabled={page === 1}
        className={`inline-flex h-9 shrink-0 items-center gap-1 rounded-lg border border-border px-2 sm:px-3 text-sm ${
          page === 1 ? "pointer-events-none opacity-50" : "hover:bg-surface-muted"
        }`}
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="hidden sm:inline">{labels.previous}</span>
      </Link>

      <ul className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1 max-w-[60vw] sm:max-w-none">
        {visible.map((candidate, index) => {
          const previous = visible[index - 1];
          const gap = previous !== undefined && candidate - previous > 1;

          return (
            <li key={candidate} className="flex shrink-0 items-center gap-1">
              {gap ? <span className="px-1 text-subtle-foreground">…</span> : null}
              <Link
                href={buildHref(candidate)}
                aria-current={candidate === page ? "page" : undefined}
                className={`inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-2 text-sm ${
                  candidate === page
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:bg-surface-muted"
                }`}
              >
                {candidate}
              </Link>
            </li>
          );
        })}
      </ul>

      <Link
        href={buildHref(Math.min(totalPages, page + 1))}
        aria-disabled={page === totalPages}
        className={`inline-flex h-9 shrink-0 items-center gap-1 rounded-lg border border-border px-2 sm:px-3 text-sm ${
          page === totalPages
            ? "pointer-events-none opacity-50"
            : "hover:bg-surface-muted"
        }`}
      >
        <span className="hidden sm:inline">{labels.next}</span>
        <ChevronRight className="h-4 w-4" />
      </Link>
    </nav>
  );
}