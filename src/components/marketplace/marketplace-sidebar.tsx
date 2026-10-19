"use client";

import { useId, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowDownUp,
  ChevronDown,
  Filter,
  MapPin,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Tag,
  X,
} from "lucide-react";
import type { CategoryCount, MarketplaceView } from "./types";

interface MarketplaceSidebarProps {
  view: MarketplaceView;
  categories: CategoryCount[];
  locations?: string[];
  isOpenMobile: boolean;
  onCloseMobile: () => void;
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
    perPage: string;
  };
}

export function MarketplaceSidebar({
  view,
  categories,
  locations = [],
  isOpenMobile,
  onCloseMobile,
  labels,
}: MarketplaceSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const currentSearch = searchParams.get("q") || "";
  const currentCategory = searchParams.get("category") || "";
  const currentLocation = searchParams.get("location") || "";
  const currentMinPrice = searchParams.get("minPrice") || "";
  const currentMaxPrice = searchParams.get("maxPrice") || "";
  const currentSort = searchParams.get("sort") || "newest";
  const currentPerPage = searchParams.get("perPage") || "12";

  const [searchInput, setSearchInput] = useState(currentSearch);
  const [minPriceInput, setMinPriceInput] = useState(currentMinPrice);
  const [maxPriceInput, setMaxPriceInput] = useState(currentMaxPrice);
  const [categorySearch, setCategorySearch] = useState("");
  const [showAllCategories, setShowAllCategories] = useState(false);

  const searchInputId = useId();
  const minPriceId = useId();
  const maxPriceId = useId();
  const locationSelectId = useId();
  const sortSelectId = useId();
  const perPageSelectId = useId();

  // Calculate active filter count
  const activeCount = [
    Boolean(currentSearch),
    Boolean(currentCategory),
    Boolean(currentLocation),
    Boolean(currentMinPrice || currentMaxPrice),
    currentSort !== "newest",
    currentPerPage !== "12",
  ].filter(Boolean).length;

  const updateFilters = (updates: Record<string, string | null | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page"); // Always reset page on filter change

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === undefined || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    const queryString = params.toString();
    startTransition(() => {
      router.push(queryString ? `/marketplace?${queryString}` : "/marketplace");
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ q: searchInput.trim() });
  };

  const handlePriceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({
      minPrice: minPriceInput ? String(Number(minPriceInput)) : null,
      maxPrice: maxPriceInput ? String(Number(maxPriceInput)) : null,
    });
  };

  const setPricePreset = (min: number | null, max: number | null) => {
    const minStr = min !== null ? String(min) : "";
    const maxStr = max !== null ? String(max) : "";
    setMinPriceInput(minStr);
    setMaxPriceInput(maxStr);
    updateFilters({ minPrice: minStr || null, maxPrice: maxStr || null });
  };

  const clearAllFilters = () => {
    setSearchInput("");
    setMinPriceInput("");
    setMaxPriceInput("");
    const params = new URLSearchParams();
    if (view === "products") params.set("view", "products");
    const layout = searchParams.get("layout");
    if (layout) params.set("layout", layout);
    startTransition(() => {
      router.push(params.toString() ? `/marketplace?${params.toString()}` : "/marketplace");
    });
    if (isOpenMobile) onCloseMobile();
  };

  // Filter categories by local category search query
  const filteredCategories = categories.filter((c) =>
    c.category.toLowerCase().includes(categorySearch.toLowerCase().trim()),
  );

  const displayedCategories = showAllCategories
    ? filteredCategories
    : filteredCategories.slice(0, 7);

  const sidebarContent = (
    <div className="flex flex-col gap-6 p-1">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-primary" />
          <h2 className="text-base font-semibold text-foreground">{labels.filters}</h2>
          {activeCount > 0 ? (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {activeCount}
            </span>
          ) : null}
        </div>

        {activeCount > 0 ? (
          <button
            type="button"
            onClick={clearAllFilters}
            className="group inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-danger cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5 transition-transform group-hover:-rotate-90" />
            <span>{labels.clearFilters}</span>
          </button>
        ) : null}
      </div>

      {/* Keyword Search */}
      <form onSubmit={handleSearchSubmit} className="space-y-1.5">
        <label htmlFor={searchInputId} className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {labels.searchPlaceholder}
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle-foreground" />
          <input
            id={searchInputId}
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={labels.searchPlaceholder}
            className="h-10 w-full rounded-xl border border-border bg-surface pl-9 pr-8 text-sm text-foreground placeholder:text-subtle-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          {searchInput ? (
            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                updateFilters({ q: null });
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-subtle-foreground hover:bg-surface-muted hover:text-foreground cursor-pointer"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      </form>

      {/* Sort Section */}
      <div className="space-y-2">
        <label htmlFor={sortSelectId} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <ArrowDownUp className="h-3.5 w-3.5 text-primary" />
          <span>{labels.sortBy}</span>
        </label>
        <div className="relative">
          <select
            id={sortSelectId}
            value={currentSort}
            onChange={(e) => updateFilters({ sort: e.target.value })}
            className="h-10 w-full appearance-none rounded-xl border border-border bg-surface px-3 pr-8 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
          >
            <option value="newest">{labels.sortNewest}</option>
            <option value="alpha">{labels.sortAlpha}</option>
            {view === "businesses" ? (
              <option value="products">{labels.sortPopular}</option>
            ) : (
              <>
                <option value="price_asc">{labels.sortPriceLow}</option>
                <option value="price_desc">{labels.sortPriceHigh}</option>
              </>
            )}
            <option value="oldest">{labels.sortOldest}</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle-foreground" />
        </div>
      </div>

      {/* Category Filter */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Tag className="h-3.5 w-3.5 text-primary" />
            <span>{labels.categories}</span>
          </span>
          {currentCategory ? (
            <button
              type="button"
              onClick={() => updateFilters({ category: null })}
              className="text-xs text-primary hover:underline cursor-pointer"
            >
              Reset
            </button>
          ) : null}
        </div>

        {categories.length > 8 ? (
          <div className="relative mb-2">
            <input
              type="text"
              value={categorySearch}
              onChange={(e) => setCategorySearch(e.target.value)}
              placeholder="Find category..."
              className="h-8 w-full rounded-lg border border-border bg-surface px-2.5 text-xs text-foreground placeholder:text-subtle-foreground focus:border-primary focus:outline-none"
            />
          </div>
        ) : null}

        <div className="space-y-1">
          <button
            type="button"
            onClick={() => updateFilters({ category: null })}
            className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
              !currentCategory
                ? "bg-primary-soft text-primary font-semibold"
                : "text-muted-foreground hover:bg-surface-muted hover:text-foreground"
            }`}
          >
            <span>{labels.allCategories}</span>
            <span className="text-xs text-subtle-foreground">
              {categories.reduce((acc, curr) => acc + curr.count, 0)}
            </span>
          </button>

          {displayedCategories.map((c) => {
            const isSelected = currentCategory.toLowerCase() === c.category.toLowerCase();
            return (
              <button
                key={c.category}
                type="button"
                onClick={() => updateFilters({ category: isSelected ? null : c.category })}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-sm transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-primary-soft text-primary font-semibold"
                    : "text-muted-foreground hover:bg-surface-muted hover:text-foreground"
                }`}
              >
                <span className="truncate pr-2">{c.category}</span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-xs ${
                    isSelected
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "bg-surface-muted text-subtle-foreground"
                  }`}
                >
                  {c.count}
                </span>
              </button>
            );
          })}

          {filteredCategories.length > 7 ? (
            <button
              type="button"
              onClick={() => setShowAllCategories((prev) => !prev)}
              className="mt-1 w-full text-left text-xs font-medium text-primary hover:underline cursor-pointer"
            >
              {showAllCategories
                ? "Show fewer"
                : `+ Show ${filteredCategories.length - 7} more`}
            </button>
          ) : null}
        </div>
      </div>

      {/* Price Range Filter (Products only) */}
      {view === "products" ? (
        <div className="space-y-3 rounded-2xl border border-border/80 bg-surface-muted/40 p-3.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {labels.priceRange} (ETB)
          </span>

          <form onSubmit={handlePriceSubmit} className="space-y-2.5">
            <div className="flex items-center gap-2">
              <input
                id={minPriceId}
                aria-label={labels.minPrice}
                type="number"
                min="0"
                value={minPriceInput}
                onChange={(e) => setMinPriceInput(e.target.value)}
                placeholder={labels.minPrice}
                className="h-9 w-full rounded-lg border border-border bg-surface px-2.5 text-xs text-foreground placeholder:text-subtle-foreground focus:border-primary focus:outline-none"
              />
              <span className="text-xs text-subtle-foreground">—</span>
              <input
                id={maxPriceId}
                aria-label={labels.maxPrice}
                type="number"
                min="0"
                value={maxPriceInput}
                onChange={(e) => setMaxPriceInput(e.target.value)}
                placeholder={labels.maxPrice}
                className="h-9 w-full rounded-lg border border-border bg-surface px-2.5 text-xs text-foreground placeholder:text-subtle-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="h-8 w-full rounded-lg bg-primary text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary-hover cursor-pointer"
            >
              {labels.apply}
            </button>
          </form>

          {/* Quick Price Preset Chips */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => setPricePreset(null, 500)}
              className="rounded-md border border-border bg-surface px-2 py-1 text-[11px] text-muted-foreground hover:border-primary hover:text-primary cursor-pointer"
            >
              &lt; 500
            </button>
            <button
              type="button"
              onClick={() => setPricePreset(500, 1500)}
              className="rounded-md border border-border bg-surface px-2 py-1 text-[11px] text-muted-foreground hover:border-primary hover:text-primary cursor-pointer"
            >
              500 - 1.5k
            </button>
            <button
              type="button"
              onClick={() => setPricePreset(1500, 5000)}
              className="rounded-md border border-border bg-surface px-2 py-1 text-[11px] text-muted-foreground hover:border-primary hover:text-primary cursor-pointer"
            >
              1.5k - 5k
            </button>
            <button
              type="button"
              onClick={() => setPricePreset(5000, null)}
              className="rounded-md border border-border bg-surface px-2 py-1 text-[11px] text-muted-foreground hover:border-primary hover:text-primary cursor-pointer"
            >
              5k+
            </button>
          </div>
        </div>
      ) : null}

      {/* Location Filter (Businesses only) */}
      {view === "businesses" && locations.length > 0 ? (
        <div className="space-y-2">
          <label htmlFor={locationSelectId} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            <span>{labels.location}</span>
          </label>
          <div className="relative">
            <select
              id={locationSelectId}
              value={currentLocation}
              onChange={(e) => updateFilters({ location: e.target.value })}
              className="h-10 w-full appearance-none rounded-xl border border-border bg-surface px-3 pr-8 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              <option value="">{labels.allLocations}</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle-foreground" />
          </div>
        </div>
      ) : null}

      {/* Items Per Page */}
      <div className="space-y-2 border-t border-border/80 pt-4">
        <label htmlFor={perPageSelectId} className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {labels.perPage}
        </label>
        <div className="flex gap-2">
          {["12", "24", "36"].map((count) => (
            <button
              key={count}
              type="button"
              onClick={() => updateFilters({ perPage: count })}
              className={`flex-1 rounded-lg border py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                currentPerPage === count
                  ? "border-primary bg-primary text-primary-foreground font-semibold"
                  : "border-border bg-surface text-muted-foreground hover:bg-surface-muted hover:text-foreground"
              }`}
            >
              {count}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className="hidden lg:block w-72 xl:w-80 shrink-0 sticky top-24 self-start">
        <div className="max-h-[calc(100vh-7rem)] overflow-y-auto no-scrollbar overscroll-contain rounded-2xl border border-border bg-surface p-5 shadow-xs">
          {sidebarContent}
        </div>
      </aside>

      {/* Mobile Slide-Over Drawer Sheet */}
      {isOpenMobile ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop blur */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300"
            onClick={onCloseMobile}
            aria-hidden="true"
          />

          {/* Drawer container */}
          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <div className="w-screen max-w-sm rounded-l-3xl border-l border-border bg-surface p-6 shadow-2xl flex flex-col justify-between overflow-y-auto animate-enter-up">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-5 w-5 text-primary" />
                  <span className="text-lg font-bold text-foreground">
                    {labels.filters}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onCloseMobile}
                  className="rounded-full p-1.5 text-subtle-foreground hover:bg-surface-muted hover:text-foreground cursor-pointer"
                  aria-label="Close filters"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 flex-1">{sidebarContent}</div>

              <div className="mt-6 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={onCloseMobile}
                  className="h-11 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary-hover transition-colors cursor-pointer"
                >
                  Apply & Close
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
