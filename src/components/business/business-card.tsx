import Link from "next/link";
import {
  Activity,
  ArrowRight,
  ClipboardList,
  ExternalLink,
  MapPin,
  Package,
  Phone,
  Settings,
  Store,
} from "lucide-react";

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
              {typeof business.contactPhones[0] === "string"
                ? business.contactPhones[0]
                : business.contactPhones[0].target}
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

export interface BusinessOwnerCardLabels {
  productsCount: string;
  active: string;
  inactive: string;
  unreadOrders: string;
  unreadActivities: string;
  viewStore: string;
  catalog: string;
  orders: string;
  activities: string;
  settings: string;
}

export type BusinessOwnerItem = BusinessListItem & {
  productCount: number;
  unreadOrders?: number;
  unreadActivities?: number;
};

export function BusinessOwnerCard({
  business,
  locale,
  labels,
}: {
  business: BusinessOwnerItem;
  locale: Locale;
  labels: BusinessOwnerCardLabels;
}) {
  const productCountFormatted = formatNumber(business.productCount, locale);
  const unreadOrders = business.unreadOrders ?? 0;
  const unreadActivities = business.unreadActivities ?? 0;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-surface transition-all duration-200 hover:border-border-strong hover:shadow-md">
      {/* Visual Header / Cover Image */}
      <div className="relative h-50 w-full items-center justify-center overflow-hidden bg-surface-muted">
        <Link
          href={`/businesses/${business.id}/catalog`}
          className="absolute inset-0 z-0 flex items-center justify-center"
          tabIndex={-1}
          aria-hidden="true"
        >
          {business.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={business.image}
              alt={business.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-surface-muted via-surface to-surface-muted/60">
              <Store className="h-10 w-10 text-subtle-foreground/60 transition-transform duration-300 group-hover:scale-110" />
            </div>
          )}
        </Link>

        {/* Top Floating Badges & View Store Action */}
        <div className="pointer-events-none relative z-10 flex w-full items-center justify-between gap-2 p-3">
          <div className="pointer-events-auto flex flex-wrap items-center gap-1.5">
            <Badge
              tone={business.isActive ? "success" : "warning"}
              className="bg-surface/90 shadow-sm backdrop-blur-sm"
            >
              {business.isActive ? labels.active : labels.inactive}
            </Badge>
            {business.category ? (
              <Badge tone="neutral" className="bg-surface/90 shadow-sm backdrop-blur-sm">
                {business.category}
              </Badge>
            ) : null}
          </div>

          <Link
            href={`/store/${business.slug}`}
            className="pointer-events-auto inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-surface/90 px-2.5 py-1 text-xs font-medium text-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-surface hover:text-primary hover:border-primary-border"
          >
            <Store className="h-3 w-3" />
            <span>{labels.viewStore}</span>
            <ExternalLink className="h-2.5 w-2.5 opacity-70" />
          </Link>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="flex flex-1 flex-col p-4">
        {/* Title and slug */}
        <div className="space-y-0.5">
          <Link
            href={`/businesses/${business.id}/catalog`}
            className="group/title inline-block"
          >
            <h3 className="line-clamp-1 font-semibold text-foreground transition-colors group-hover/title:text-primary">
              {business.name}
            </h3>
          </Link>
          <p className="font-mono text-xs text-muted-foreground">/{business.slug}</p>
        </div>

        {/* Description */}
        {business.description ? (
          <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
            {business.description}
          </p>
        ) : null}

        {/* Meta row: Location, Phone, Product count */}
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
          {business.location ? (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate max-w-35">{business.location}</span>
            </span>
          ) : null}
          {business.contactPhones[0] ? (
            <span className="inline-flex items-center gap-1">
              <Phone className="h-3.5 w-3.5 shrink-0" />
              <span>
                {typeof business.contactPhones[0] === "string"
                  ? business.contactPhones[0]
                  : business.contactPhones[0].target}
              </span>
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1 font-medium text-foreground">
            <Package className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span>{labels.productsCount.replace("{count}", productCountFormatted)}</span>
          </span>
        </div>

        {/* Unread Alert Badges (if any) */}
        {(unreadOrders > 0 || unreadActivities > 0) ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-dashed border-border pt-2.5">
            {unreadOrders > 0 ? (
              <Link
                href={`/businesses/${business.id}/orders`}
                className="transition-transform hover:scale-105"
              >
                <Badge tone="primary" className="cursor-pointer">
                  <ClipboardList className="h-3 w-3" />
                  {labels.unreadOrders.replace("{count}", String(unreadOrders))}
                </Badge>
              </Link>
            ) : null}
            {unreadActivities > 0 ? (
              <Link
                href={`/businesses/${business.id}/activities`}
                className="transition-transform hover:scale-105"
              >
                <Badge tone="info" className="cursor-pointer">
                  <Activity className="h-3 w-3" />
                  {labels.unreadActivities.replace("{count}", String(unreadActivities))}
                </Badge>
              </Link>
            ) : null}
          </div>
        ) : null}

        {/* Card Footer: Quick tab shortcuts & Primary Catalog/Manage button */}
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3">
          <div className="flex items-center gap-1">
            <Link
              href={`/businesses/${business.id}/orders`}
              title={labels.orders}
              className="relative inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
            >
              <ClipboardList className="h-4 w-4" />
              {unreadOrders > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {unreadOrders > 9 ? "9+" : unreadOrders}
                </span>
              ) : null}
            </Link>
            <Link
              href={`/businesses/${business.id}/activities`}
              title={labels.activities}
              className="relative inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
            >
              <Activity className="h-4 w-4" />
              {unreadActivities > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-info text-[10px] font-bold text-info-foreground">
                  {unreadActivities > 9 ? "9+" : unreadActivities}
                </span>
              ) : null}
            </Link>
            <Link
              href={`/businesses/${business.id}/settings`}
              title={labels.settings}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
            >
              <Settings className="h-4 w-4" />
            </Link>
          </div>

          <Link
            href={`/businesses/${business.id}/catalog`}
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground transition-all hover:bg-surface-muted hover:border-border-strong group-hover:border-primary-border"
          >
            <span>{labels.catalog}</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}