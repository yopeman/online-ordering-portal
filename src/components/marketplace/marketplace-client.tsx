"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PackageSearch, RotateCcw, Store } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import type { BusinessListItem, ProductListItem } from "@/lib/queries";
import type { Locale } from "@/lib/i18n/config";
import type { CategoryCount, MarketplaceLayout, MarketplaceView } from "./types";
import { MarketplaceSidebar } from "./marketplace-sidebar";
import { MarketplaceToolbar } from "./marketplace-toolbar";
import { MarketplaceListing } from "./marketplace-listing";
import { MarketplacePagination } from "./marketplace-pagination";

interface MarketplaceClientProps {
  view: MarketplaceView;
  total: number;
  page: number;
  totalPages: number;
  perPage: number;
  businesses: BusinessListItem[];
  products: ProductListItem[];
  categories: CategoryCount[];
  locations: string[];
  locale: Locale;
  labels: {
    filters: string;
    clearFilters: string;
    searchPlaceholder: string;
    categories: string;
    allCategories: string;
    priceRange: string;
    minPrice: string;
    maxPrice: string;
    apply: string;
    location: string;
    allLocations: string;
    sortBy: string;
    sortNewest: string;
    sortOldest: string;
    sortAlpha: string;
    sortPopular: string;
    sortPriceLow: string;
    sortPriceHigh: string;
    showingResults: string;
    perPage: string;
    page: string;
    previous: string;
    next: string;
    viewStore: string;
    viewProduct: string;
    verified: string;
    productCount: string;
    empty: string;
    emptyHint: string;
    noResults: string;
    noResultsHint: string;
    businesses: string;
    products: string;
    gridView: string;
    listView: string;
    ctaPrimary: string;
  };
}

export function MarketplaceClient({
  view,
  total,
  page,
  totalPages,
  perPage,
  businesses,
  products,
  categories,
  locations,
  locale,
  labels,
}: MarketplaceClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Initialize layout mode from URL or default to 'grid'
  const initialLayout = (searchParams.get("layout") as MarketplaceLayout) || "grid";
  const [layout, setLayout] = useState<MarketplaceLayout>(initialLayout);

  const handleLayoutChange = (newLayout: MarketplaceLayout) => {
    setLayout(newLayout);
    const params = new URLSearchParams(searchParams.toString());
    params.set("layout", newLayout);
    router.replace(`/marketplace?${params.toString()}`, { scroll: false });
  };

  const hasActiveFilters = Boolean(
    searchParams.get("q") ||
      searchParams.get("category") ||
      searchParams.get("location") ||
      searchParams.get("minPrice") ||
      searchParams.get("maxPrice") ||
      (searchParams.get("sort") && searchParams.get("sort") !== "newest"),
  );

  const buildHref = (nextPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (nextPage > 1) {
      params.set("page", String(nextPage));
    } else {
      params.delete("page");
    }
    const query = params.toString();
    return query ? `/marketplace?${query}` : "/marketplace";
  };

  const from = total > 0 ? (page - 1) * perPage + 1 : 0;
  const to = Math.min(total, page * perPage);

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start">
      {/* Sidebar Filter: Sticky Desktop + Drawer Mobile */}
      <MarketplaceSidebar
        view={view}
        categories={categories}
        locations={locations}
        isOpenMobile={isMobileFilterOpen}
        onCloseMobile={() => setIsMobileFilterOpen(false)}
        labels={{
          filters: labels.filters,
          clearFilters: labels.clearFilters,
          searchPlaceholder: labels.searchPlaceholder,
          categories: labels.categories,
          allCategories: labels.allCategories,
          priceRange: labels.priceRange,
          minPrice: labels.minPrice,
          maxPrice: labels.maxPrice,
          apply: labels.apply,
          location: labels.location,
          allLocations: labels.allLocations,
          sortBy: labels.sortBy,
          sortNewest: labels.sortNewest,
          sortOldest: labels.sortOldest,
          sortAlpha: labels.sortAlpha,
          sortPopular: labels.sortPopular,
          sortPriceLow: labels.sortPriceLow,
          sortPriceHigh: labels.sortPriceHigh,
          perPage: labels.perPage,
        }}
      />

      {/* Main Results Column */}
      <div className="flex-1 min-w-0 w-full space-y-6">
        {/* Toolbar */}
        <MarketplaceToolbar
          view={view}
          total={total}
          from={from}
          to={to}
          layout={layout}
          onLayoutChange={handleLayoutChange}
          onOpenMobileFilters={() => setIsMobileFilterOpen(true)}
          categories={categories}
          labels={{
            showingResults: labels.showingResults,
            filters: labels.filters,
            clearFilters: labels.clearFilters,
            gridView: labels.gridView,
            listView: labels.listView,
            businesses: labels.businesses,
            products: labels.products,
          }}
        />

        {/* Content State */}
        {total === 0 ? (
          <div className="rounded-3xl border border-border bg-surface p-8 sm:p-12 text-center animate-enter-scale">
            <EmptyState
              icon={
                view === "products" ? (
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <PackageSearch className="h-8 w-8" />
                  </div>
                ) : (
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Store className="h-8 w-8" />
                  </div>
                )
              }
              title={hasActiveFilters ? labels.noResults : labels.empty}
              description={
                hasActiveFilters ? labels.noResultsHint : labels.emptyHint
              }
              action={
                hasActiveFilters ? (
                  <button
                    type="button"
                    onClick={() => {
                      const params = new URLSearchParams();
                      if (view === "products") params.set("view", "products");
                      router.push(params.toString() ? `/marketplace?${params.toString()}` : "/marketplace");
                    }}
                    className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover cursor-pointer"
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span>{labels.clearFilters}</span>
                  </button>
                ) : (
                  <Link
                    href="/login"
                    className="inline-flex h-10 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
                  >
                    {labels.ctaPrimary}
                  </Link>
                )
              }
            />
          </div>
        ) : (
          <>
            {/* Listing Grid / List */}
            <MarketplaceListing
              view={view}
              layout={layout}
              businesses={businesses}
              products={products}
              locale={locale}
              labels={{
                productCount: labels.productCount,
                viewStore: labels.viewStore,
                viewProduct: labels.viewProduct,
                verified: labels.verified,
              }}
            />

            {/* Server-controlled Pagination */}
            <MarketplacePagination
              page={page}
              totalPages={totalPages}
              buildHref={buildHref}
              labels={{
                previous: labels.previous,
                next: labels.next,
                page: labels.page,
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}
