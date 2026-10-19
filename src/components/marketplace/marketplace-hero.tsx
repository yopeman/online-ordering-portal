"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Package, PackageSearch, Sparkles, Store } from "lucide-react";
import type { MarketplaceView } from "./types";

interface MarketplaceHeroProps {
  view: MarketplaceView;
  businessCount: number;
  productCount: number;
  labels: {
    badge: string;
    heroTitle: string;
    heroSubtitle: string;
    businesses: string;
    products: string;
    totalBusinesses: string;
    totalProducts: string;
  };
}

export function MarketplaceHero({
  view,
  businessCount,
  productCount,
  labels,
}: MarketplaceHeroProps) {
  const searchParams = useSearchParams();

  const createViewHref = (newView: MarketplaceView) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", newView);
    params.delete("page");
    // Clear view-specific filters when switching views
    if (newView === "businesses") {
      params.delete("minPrice");
      params.delete("maxPrice");
    } else {
      params.delete("location");
    }
    params.delete("category");
    const query = params.toString();
    return query ? `/marketplace?${query}` : "/marketplace";
  };

  return (
    <header className="relative overflow-hidden rounded-3xl border border-border bg-linear-to-b from-surface via-surface to-surface-muted p-6 sm:p-10 shadow-sm">
      {/* Ambient background glow */}
      <div
        className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-info/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary-border bg-primary-soft px-3 py-1 text-xs font-semibold text-primary shadow-xs animate-float">
            <Sparkles className="h-3.5 w-3.5" />
            <span>{labels.badge}</span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            {labels.heroTitle}
          </h1>

          <p className="text-base text-muted-foreground sm:text-lg">
            {labels.heroSubtitle}
          </p>
        </div>

        {/* Live Counters */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 shrink-0">
          <div className="glass-card flex items-center gap-3 rounded-2xl p-3.5 sm:px-5 sm:py-4 shadow-xs transition-transform hover:scale-102">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight text-foreground">
                {businessCount.toLocaleString()}
              </p>
              <p className="text-xs font-medium text-muted-foreground">
                {labels.businesses}
              </p>
            </div>
          </div>

          <div className="glass-card flex items-center gap-3 rounded-2xl p-3.5 sm:px-5 sm:py-4 shadow-xs transition-transform hover:scale-102">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-info/15 text-info">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight text-foreground">
                {productCount.toLocaleString()}
              </p>
              <p className="text-xs font-medium text-muted-foreground">
                {labels.products}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="relative z-10 mt-8 flex border-b border-border/80">
        <div className="inline-flex items-center gap-2">
          <Link
            href={createViewHref("businesses")}
            className={`group inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-all duration-200 ${
              view === "businesses"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
            }`}
          >
            <Store
              className={`h-4 w-4 transition-transform group-hover:scale-110 ${
                view === "businesses" ? "text-primary" : "text-muted-foreground"
              }`}
            />
            <span>{labels.businesses}</span>
            <span
              className={`ml-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                view === "businesses"
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface-muted text-muted-foreground"
              }`}
            >
              {businessCount}
            </span>
          </Link>

          <Link
            href={createViewHref("products")}
            className={`group inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-all duration-200 ${
              view === "products"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
            }`}
          >
            <PackageSearch
              className={`h-4 w-4 transition-transform group-hover:scale-110 ${
                view === "products" ? "text-primary" : "text-muted-foreground"
              }`}
            />
            <span>{labels.products}</span>
            <span
              className={`ml-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                view === "products"
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface-muted text-muted-foreground"
              }`}
            >
              {productCount}
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
