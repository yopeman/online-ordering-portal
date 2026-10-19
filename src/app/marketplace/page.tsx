import type { Metadata } from "next";
import { MissingMongoUriError } from "@/lib/db";
import { getFormatters, getTranslator } from "@/lib/i18n-server";
import {
  getMarketplaceStats,
  listBusinesses,
  listBusinessLocations,
  listProducts,
} from "@/lib/queries";
import { MarketplaceHero } from "@/components/marketplace/marketplace-hero";
import { MarketplaceClient } from "@/components/marketplace/marketplace-client";
import { Card } from "@/components/ui/card";
import type { MarketplaceView } from "@/components/marketplace/types";

export const metadata: Metadata = {
  title: "Marketplace",
  description:
    "Explore local businesses and diverse product catalogs on Yope Order.",
};

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    category?: string;
    location?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
    page?: string;
    perPage?: string;
    view?: string;
    layout?: string;
  }>;
}) {
  const params = await searchParams;
  const t = await getTranslator();
  const { locale } = await getFormatters();

  const search = params.q?.trim() ?? "";
  const category = params.category?.trim() ?? "";
  const location = params.location?.trim() ?? "";
  const minPrice = params.minPrice && !isNaN(Number(params.minPrice))
    ? Number(params.minPrice)
    : undefined;
  const maxPrice = params.maxPrice && !isNaN(Number(params.maxPrice))
    ? Number(params.maxPrice)
    : undefined;
  const sort = params.sort?.trim() || "newest";
  const page = Math.max(1, Number(params.page) || 1);
  const perPage = [12, 24, 36].includes(Number(params.perPage))
    ? Number(params.perPage)
    : 12;
  const view: MarketplaceView =
    params.view === "products" ? "products" : "businesses";

  let businesses: Awaited<ReturnType<typeof listBusinesses>> = {
    items: [],
    total: 0,
    page,
    totalPages: 1,
  };
  let products: Awaited<ReturnType<typeof listProducts>> = {
    items: [],
    total: 0,
    page,
    totalPages: 1,
  };

  let stats: Awaited<ReturnType<typeof getMarketplaceStats>> = {
    businessCount: 0,
    productCount: 0,
    businessCategories: [],
    productCategories: [],
  };
  let locations: string[] = [];
  let dbMissing = false;

  try {
    const [fetchedStats, fetchedLocations] = await Promise.all([
      getMarketplaceStats(),
      listBusinessLocations(),
    ]);
    stats = fetchedStats;
    locations = fetchedLocations;

    if (view === "products") {
      products = await listProducts({
        search,
        category,
        minPrice,
        maxPrice,
        sort: sort as "newest" | "oldest" | "price_asc" | "price_desc" | "alpha",
        page,
        perPage,
      });
    } else {
      businesses = await listBusinesses({
        search,
        category,
        location,
        sort: sort as "newest" | "oldest" | "alpha" | "products",
        page,
        perPage,
      });
    }
  } catch (error) {
    if (!(error instanceof MissingMongoUriError)) throw error;
    dbMissing = true;
  }

  const activeCategories =
    view === "products" ? stats.productCategories : stats.businessCategories;
  const totalItems = view === "products" ? products.total : businesses.total;
  const totalPages = view === "products" ? products.totalPages : businesses.totalPages;

  return (
    <div className="container-page space-y-8 py-8 sm:py-12 animate-enter-up">
      {/* Rich Hero with Ambient Glow, Counters & View Tabs */}
      <MarketplaceHero
        view={view}
        businessCount={stats.businessCount}
        productCount={stats.productCount}
        labels={{
          badge: t("marketplace.badge"),
          heroTitle: t("marketplace.heroTitle"),
          heroSubtitle: t("marketplace.heroSubtitle"),
          businesses: t("marketplace.businesses"),
          products: t("marketplace.products"),
          totalBusinesses: t("marketplace.totalBusinesses"),
          totalProducts: t("marketplace.totalProducts"),
        }}
      />

      {dbMissing ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          {t("errors.mongoMissing")}
        </Card>
      ) : (
        /* Client coordinator: sidebar + toolbar + listing + server pagination */
        <MarketplaceClient
          view={view}
          total={totalItems}
          page={page}
          totalPages={totalPages}
          perPage={perPage}
          businesses={businesses.items}
          products={products.items}
          categories={activeCategories}
          locations={locations}
          locale={locale}
          labels={{
            filters: t("marketplace.filters"),
            clearFilters: t("marketplace.clearFilters"),
            searchPlaceholder: t("marketplace.searchPlaceholder"),
            categories: t("marketplace.categories"),
            allCategories: t("marketplace.allCategories"),
            priceRange: t("marketplace.priceRange"),
            minPrice: t("marketplace.minPrice"),
            maxPrice: t("marketplace.maxPrice"),
            apply: t("marketplace.apply"),
            location: t("marketplace.location"),
            allLocations: t("marketplace.allLocations"),
            sortBy: t("marketplace.sortBy"),
            sortNewest: t("marketplace.sortNewest"),
            sortOldest: t("marketplace.sortOldest"),
            sortAlpha: t("marketplace.sortAlpha"),
            sortPopular: t("marketplace.sortPopular"),
            sortPriceLow: t("marketplace.sortPriceLow"),
            sortPriceHigh: t("marketplace.sortPriceHigh"),
            showingResults: t("marketplace.showingResults"),
            perPage: t("marketplace.perPage"),
            page: t("marketplace.page"),
            previous: t("common.previous"),
            next: t("common.next"),
            viewStore: t("marketplace.viewStore"),
            viewProduct: t("marketplace.viewProduct"),
            verified: t("marketplace.verified"),
            productCount: t("marketplace.productCount"),
            empty: t("marketplace.empty"),
            emptyHint: t("marketplace.emptyHint"),
            noResults: t("marketplace.noResults"),
            noResultsHint: t("marketplace.noResultsHint"),
            businesses: t("marketplace.businesses"),
            products: t("marketplace.products"),
            gridView: t("marketplace.gridView"),
            listView: t("marketplace.listView"),
            ctaPrimary: t("landing.ctaPrimary"),
          }}
        />
      )}
    </div>
  );
}