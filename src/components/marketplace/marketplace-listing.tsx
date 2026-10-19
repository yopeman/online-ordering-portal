"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ImageOff,
  MapPin,
  Package,
  Phone,
  ShoppingBag,
  Store,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { BusinessListItem, ProductListItem } from "@/lib/queries";
import { formatNumber, formatPrice } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";
import type { MarketplaceLayout, MarketplaceView } from "./types";

interface MarketplaceListingProps {
  view: MarketplaceView;
  layout: MarketplaceLayout;
  businesses: BusinessListItem[];
  products: ProductListItem[];
  locale: Locale;
  labels: {
    productCount: string;
    viewStore: string;
    viewProduct: string;
    verified: string;
  };
}

export function MarketplaceListing({
  view,
  layout,
  businesses,
  products,
  locale,
  labels,
}: MarketplaceListingProps) {
  if (view === "products") {
    return (
      <div
        className={
          layout === "grid"
            ? "grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
            : "flex flex-col gap-4"
        }
      >
        {products.map((product, index) => {
          const delayMs = Math.min(index * 35, 350);

          if (layout === "list") {
            return (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                style={{ animationDelay: `${delayMs}ms` }}
                className="group card-lift animate-enter-up flex flex-col sm:flex-row overflow-hidden rounded-2xl border border-border bg-surface transition-all hover:border-primary-border"
              >
                <div className="relative h-48 sm:h-auto sm:w-48 md:w-56 shrink-0 bg-surface-muted overflow-hidden">
                  {product.image ? (
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 100vw, 224px"
                      unoptimized={
                        product.image.startsWith("data:") || product.image.startsWith("http://")
                      }
                      className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <ImageOff className="h-8 w-8 text-subtle-foreground" />
                    </div>
                  )}
                  {product.category ? (
                    <span className="absolute left-3 top-3">
                      <Badge tone="neutral">{product.category}</Badge>
                    </span>
                  ) : null}
                </div>

                <div className="flex flex-1 flex-col justify-between p-5">
                  <div className="space-y-1.5">
                    {product.businessName ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                        <Store className="h-3 w-3 text-primary" />
                        <span>{product.businessName}</span>
                      </span>
                    ) : null}

                    <h3 className="text-lg font-bold text-foreground transition-colors group-hover:text-primary">
                      {product.name}
                    </h3>

                    {product.description ? (
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {product.description}
                      </p>
                    ) : null}
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
                    <span className="text-lg font-extrabold text-primary">
                      {formatPrice(product.price, locale, product.currency)}
                    </span>

                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary transition-transform group-hover:translate-x-1">
                      <span>{labels.viewProduct}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          }

          // Grid card
          return (
            <Link
              key={product.id}
              href={`/products/${product.slug}`}
              style={{ animationDelay: `${delayMs}ms` }}
              className="group card-lift animate-enter-up flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-all hover:border-primary-border"
            >
              <div className="relative aspect-4/3 w-full bg-surface-muted overflow-hidden">
                {product.image ? (
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    unoptimized={
                      product.image.startsWith("data:") || product.image.startsWith("http://")
                    }
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <ImageOff className="h-8 w-8 text-subtle-foreground" />
                  </div>
                )}

                {/* Overlaid Badges */}
                <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-1 pointer-events-none">
                  {product.category ? (
                    <Badge tone="neutral" className="shadow-xs">
                      {product.category}
                    </Badge>
                  ) : <span />}

                  {product.businessName ? (
                    <span className="glass-card inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold text-foreground shadow-xs">
                      <Store className="h-3 w-3 text-primary" />
                      <span className="truncate max-w-30">{product.businessName}</span>
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
                <div className="space-y-1">
                  <h3 className="font-bold text-foreground text-base transition-colors group-hover:text-primary wrap-break-word">
                    {product.name}
                  </h3>
                  {product.description ? (
                    <p className="line-clamp-2 text-xs sm:text-sm text-muted-foreground">
                      {product.description}
                    </p>
                  ) : null}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
                  <span className="text-base sm:text-lg font-extrabold text-primary">
                    {formatPrice(product.price, locale, product.currency)}
                  </span>

                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-surface-muted text-muted-foreground transition-all group-hover:bg-primary group-hover:text-primary-foreground">
                    <ShoppingBag className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    );
  }

  // Businesses Listing
  return (
    <div
      className={
        layout === "grid"
          ? "grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
          : "flex flex-col gap-4"
      }
    >
      {businesses.map((business, index) => {
        const delayMs = Math.min(index * 35, 350);
        const countText = labels.productCount.replace(
          "{count}",
          formatNumber(business.productCount, locale),
        );

        if (layout === "list") {
          return (
            <Link
              key={business.id}
              href={`/store/${business.slug}`}
              style={{ animationDelay: `${delayMs}ms` }}
              className="group card-lift animate-enter-up flex flex-col sm:flex-row overflow-hidden rounded-2xl border border-border bg-surface transition-all hover:border-primary-border"
            >
              <div className="relative h-48 sm:h-auto sm:w-56 md:w-64 shrink-0 bg-surface-muted overflow-hidden">
                {business.image ? (
                  <Image
                    src={business.image}
                    alt={business.name}
                    fill
                    sizes="(max-width: 640px) 100vw, 256px"
                    unoptimized={
                      business.image.startsWith("data:") || business.image.startsWith("http://")
                    }
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Store className="h-10 w-10 text-subtle-foreground" />
                  </div>
                )}
                {business.category ? (
                  <span className="absolute left-3 top-3">
                    <Badge tone="primary">{business.category}</Badge>
                  </span>
                ) : null}
              </div>

              <div className="flex flex-1 flex-col justify-between p-5">
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-lg font-bold text-foreground transition-colors group-hover:text-primary">
                      {business.name}
                    </h3>
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  </div>

                  {business.description ? (
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {business.description}
                    </p>
                  ) : null}

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-xs text-muted-foreground">
                    {business.location ? (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-primary" />
                        <span>{business.location}</span>
                      </span>
                    ) : null}
                    {business.contactPhones[0] ? (
                      <span className="inline-flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5 text-primary" />
                        <span>
                          {typeof business.contactPhones[0] === "string"
                            ? business.contactPhones[0]
                            : business.contactPhones[0].target}
                        </span>
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    <Package className="h-3.5 w-3.5 text-primary" />
                    <span>{countText}</span>
                  </span>

                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary transition-transform group-hover:translate-x-1">
                    <span>{labels.viewStore}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          );
        }

        // Grid card
        return (
          <Link
            key={business.id}
            href={`/store/${business.slug}`}
            style={{ animationDelay: `${delayMs}ms` }}
            className="group card-lift animate-enter-up flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-all hover:border-primary-border"
          >
            <div className="relative aspect-4/3 w-full bg-surface-muted overflow-hidden">
              {business.image ? (
                <Image
                  src={business.image}
                  alt={business.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  unoptimized={
                    business.image.startsWith("data:") || business.image.startsWith("http://")
                  }
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Store className="h-10 w-10 text-subtle-foreground" />
                </div>
              )}

              {/* Overlaid Badges */}
              <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-1 pointer-events-none">
                {business.category ? (
                  <Badge tone="primary" className="shadow-xs font-semibold">
                    {business.category}
                  </Badge>
                ) : <span />}

                <span className="glass-card inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold text-foreground shadow-xs">
                  <CheckCircle2 className="h-3 w-3 text-primary" />
                  <span>{labels.verified}</span>
                </span>
              </div>
            </div>

            <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-foreground text-base transition-colors group-hover:text-primary wrap-break-word">
                    {business.name}
                  </h3>
                </div>

                {business.description ? (
                  <p className="line-clamp-2 text-xs sm:text-sm text-muted-foreground">
                    {business.description}
                  </p>
                ) : null}

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-xs text-muted-foreground">
                  {business.location ? (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-primary" />
                      <span className="truncate max-w-35">{business.location}</span>
                    </span>
                  ) : null}
                  {business.contactPhones[0] ? (
                    <span className="inline-flex items-center gap-1">
                      <Phone className="h-3 w-3 text-primary" />
                      <span>
                        {typeof business.contactPhones[0] === "string"
                          ? business.contactPhones[0]
                          : business.contactPhones[0].target}
                      </span>
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
                <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                  <Package className="h-3.5 w-3.5 text-primary" />
                  <span>{countText}</span>
                </span>

                <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary transition-transform group-hover:translate-x-1">
                  <span>{labels.viewStore}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
