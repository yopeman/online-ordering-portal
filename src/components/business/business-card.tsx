import Link from "next/link";
import { MapPin, Phone, Store } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { BusinessListItem } from "@/lib/queries";
import { formatNumber } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";

/** Small, dependency free renderer for the markdown-ish activity details. */
export function Markdown({ text }: { text: string }) {
  if (!text.trim()) return null;

  const blocks = text.split(/\n{2,}/);

  return (
    <div className="space-y-1 text-sm text-muted-foreground">
      {blocks.map((block, index) => (
        <p key={index}>{renderInline(block)}</p>
      ))}
    </div>
  );
}

function renderInline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));
    const token = match[0];

    if (token.startsWith("**")) {
      nodes.push(
        <strong key={key++} className="font-semibold text-foreground">
          {token.slice(2, -2)}
        </strong>,
      );
    } else if (token.startsWith("`")) {
      nodes.push(
        <code
          key={key++}
          className="rounded bg-surface-muted px-1 py-0.5 font-mono text-xs text-foreground"
        >
          {token.slice(1, -1)}
        </code>,
      );
    } else {
      const linkMatch = /\[([^\]]+)\]\(([^)]+)\)/.exec(token);
      if (linkMatch) {
        nodes.push(
          <a
            key={key++}
            href={linkMatch[2]}
            className="text-primary hover:underline"
            rel="noreferrer"
          >
            {linkMatch[1]}
          </a>,
        );
      }
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

export function BusinessCard({
  business,
  locale,
  productLabel,
}: {
  business: BusinessListItem;
  locale: Locale;
  productLabel: string;
}) {
  const productCount = formatNumber(business.productCount, locale);
  return (
    <Link
      href={`/store/${business.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-surface transition-colors hover:border-primary-border"
    >
      <div className="relative flex h-36 items-center justify-center overflow-hidden bg-surface-muted">
        {business.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={business.image}
            alt={business.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <Store className="h-10 w-10 text-subtle-foreground" />
        )}
        {business.category ? (
          <span className="absolute left-3 top-3">
            <Badge tone="primary">{business.category}</Badge>
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-semibold text-foreground">{business.name}</h3>
        {business.description ? (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {business.description}
          </p>
        ) : null}

        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-xs text-muted-foreground">
          {business.location ? (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {business.location}
            </span>
          ) : null}
          {business.contactPhones[0] ? (
            <span className="inline-flex items-center gap-1">
              <Phone className="h-3.5 w-3.5" />
              {business.contactPhones[0]}
            </span>
          ) : null}
          <span className="ml-auto">
            {productLabel.replace("{count}", productCount)}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function formatCount(value: number, locale: Locale): string {
  return formatNumber(value, locale);
}