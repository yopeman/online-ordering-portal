"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Grid3X3,
  List,
  SlidersHorizontal,
  X,
} from "lucide-react";
import type { CategoryCount, MarketplaceLayout, MarketplaceView } from "./types";

interface MarketplaceToolbarProps {
  view: MarketplaceView;
  total: number;
  from: number;
  to: number;
  layout: MarketplaceLayout;
  onLayoutChange: (layout: MarketplaceLayout) => void;
  onOpenMobileFilters: () => void;
  categories: CategoryCount[];
  labels: {
    showingResults: string;
    filters: string;
    clearFilters: string;
    gridView: string;
    listView: string;
    businesses: string;
    products: string;
  };
}

export function MarketplaceToolbar({
  view,
  total,
  from,
  to,
  layout,
  onLayoutChange,
  onOpenMobileFilters,
  categories,
  labels,
}: MarketplaceToolbarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const currentSearch = searchParams.get("q") || "";
  const currentCategory = searchParams.get("category") || "";
  const currentLocation = searchParams.get("location") || "";
  const currentMinPrice = searchParams.get("minPrice") || "";
  const currentMaxPrice = searchParams.get("maxPrice") || "";

  // Active filter items for pills
  const activeChips: { key: string; label: string }[] = [];
  if (currentSearch) {
    activeChips.push({ key: "q", label: `"${currentSearch}"` });
  }
  if (currentCategory) {
    activeChips.push({ key: "category", label: currentCategory });
  }
  if (currentLocation) {
    activeChips.push({ key: "location", label: currentLocation });
  }
  if (currentMinPrice || currentMaxPrice) {
    activeChips.push({
      key: "price",
      label: currentMinPrice && currentMaxPrice
        ? `${currentMinPrice} - ${currentMaxPrice} ETB`
        : currentMinPrice
        ? `≥ ${currentMinPrice} ETB`
        : `≤ ${currentMaxPrice} ETB`,
    });
  }

  const removeChip = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    if (key === "price") {
      params.delete("minPrice");
      params.delete("maxPrice");
    } else {
      params.delete(key);
    }
    const query = params.toString();
    startTransition(() => {
      router.push(query ? `/marketplace?${query}` : "/marketplace");
    });
  };

  const setCategoryFilter = (cat: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    if (currentCategory.toLowerCase() === cat.toLowerCase()) {
      params.delete("category");
    } else {
      params.set("category", cat);
    }
    const query = params.toString();
    startTransition(() => {
      router.push(query ? `/marketplace?${query}` : "/marketplace");
    });
  };

  return (
    <div className="space-y-3">
      {/* Quick Category Pill Carousel */}
      {categories.length > 0 ? (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <button
            type="button"
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString());
              params.delete("category");
              params.delete("page");
              const query = params.toString();
              startTransition(() => {
                router.push(query ? `/marketplace?${query}` : "/marketplace");
              });
            }}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              !currentCategory
                ? "bg-primary text-primary-foreground shadow-xs shadow-primary/25"
                : "border border-border bg-surface text-muted-foreground hover:border-primary-border hover:text-foreground"
            }`}
          >
            All
          </button>
          {categories.slice(0, 10).map((c) => {
            const isSelected = currentCategory.toLowerCase() === c.category.toLowerCase();
            return (
              <button
                key={c.category}
                type="button"
                onClick={() => setCategoryFilter(c.category)}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-xs shadow-primary/25"
                    : "border border-border bg-surface text-muted-foreground hover:border-primary-border hover:text-foreground"
                }`}
              >
                {c.category} ({c.count})
              </button>
            );
          })}
        </div>
      ) : null}

      {/* Main Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-4 py-3 shadow-xs">
        {/* Results Count Text */}
        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          <span>
            {total > 0
              ? labels.showingResults
                  .replace("{from}", String(from))
                  .replace("{to}", String(to))
                  .replace("{total}", String(total))
                  .replace("{type}", view === "products" ? labels.products : labels.businesses)
              : `0 ${view === "products" ? labels.products : labels.businesses}`}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Mobile Filter Button */}
          <button
            type="button"
            onClick={onOpenMobileFilters}
            className="inline-flex lg:hidden items-center gap-1.5 rounded-xl border border-border bg-surface-muted px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-border/60 transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
            <span>{labels.filters}</span>
            {activeChips.length > 0 ? (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {activeChips.length}
              </span>
            ) : null}
          </button>

          {/* Grid vs List View Mode */}
          <div className="inline-flex items-center rounded-xl border border-border bg-surface-muted p-0.5">
            <button
              type="button"
              onClick={() => onLayoutChange("grid")}
              title={labels.gridView}
              aria-label={labels.gridView}
              className={`rounded-lg p-1.5 transition-colors cursor-pointer ${
                layout === "grid"
                  ? "bg-surface text-primary shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onLayoutChange("list")}
              title={labels.listView}
              aria-label={labels.listView}
              className={`rounded-lg p-1.5 transition-colors cursor-pointer ${
                layout === "list"
                  ? "bg-surface text-primary shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Active Filter Chips Strip */}
      {activeChips.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 pt-1 animate-enter-scale">
          <span className="text-xs font-medium text-muted-foreground">Active:</span>
          {activeChips.map((chip) => (
            <span
              key={chip.key}
              className="inline-flex items-center gap-1 rounded-full border border-primary-border bg-primary-soft pl-2.5 pr-1.5 py-0.5 text-xs font-medium text-primary shadow-2xs"
            >
              <span>{chip.label}</span>
              <button
                type="button"
                onClick={() => removeChip(chip.key)}
                className="rounded-full p-0.5 hover:bg-primary/20 text-primary transition-colors cursor-pointer"
                aria-label={`Remove filter ${chip.label}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={() => {
              const params = new URLSearchParams();
              if (view === "products") params.set("view", "products");
              const lay = searchParams.get("layout");
              if (lay) params.set("layout", lay);
              startTransition(() => {
                router.push(params.toString() ? `/marketplace?${params.toString()}` : "/marketplace");
              });
            }}
            className="text-xs font-medium text-muted-foreground hover:text-danger underline ml-1 cursor-pointer"
          >
            {labels.clearFilters}
          </button>
        </div>
      ) : null}
    </div>
  );
}
