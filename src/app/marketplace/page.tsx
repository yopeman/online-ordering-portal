import Link from "next/link";
import { PackageSearch, Search, Store } from "lucide-react";

import { BusinessCard } from "@/components/business/business-card";
import { ProductCard } from "@/components/business/product-card";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { MissingMongoUriError } from "@/lib/db";
import { getFormatters, getTranslator } from "@/lib/i18n-server";
import { listBusinesses, listBusinessCategories, listProducts } from "@/lib/queries";

export const metadata = { title: "Marketplace" };

const PER_PAGE = 12;

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; page?: string; view?: string }>;
}) {
  const params = await searchParams;
  const t = await getTranslator();
  const { locale, number } = await getFormatters();

  const search = params.q?.trim() ?? "";
  const category = params.category?.trim() ?? "";
  const page = Math.max(1, Number(params.page) || 1);
  const view = params.view === "products" ? "products" : "businesses";

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
  let categories: string[] = [];
  let dbMissing = false;

  try {
    categories = await listBusinessCategories();
    if (view === "products") {
      products = await listProducts({ search, category, page, perPage: PER_PAGE });
    } else {
      businesses = await listBusinesses({ search, category, page, perPage: PER_PAGE });
    }
  } catch (error) {
    if (!(error instanceof MissingMongoUriError)) throw error;
    dbMissing = true;
  }

  const buildHref = (nextPage: number) => {
    const query = new URLSearchParams();
    if (search) query.set("q", search);
    if (category) query.set("category", category);
    if (view === "products") query.set("view", "products");
    if (nextPage > 1) query.set("page", String(nextPage));
    const queryString = query.toString();
    return queryString ? `/marketplace?${queryString}` : "/marketplace";
  };

  const hasResults = view === "products" ? products.total > 0 : businesses.total > 0;

  return (
    <div className="container-page space-y-6 py-10">
      <PageHeader
        title={t("marketplace.title")}
        description={t("marketplace.subtitle")}
      />

      <form method="get" className="flex flex-col gap-3 sm:flex-row">
        {view === "products" ? <input type="hidden" name="view" value="products" /> : null}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle-foreground" />
          <input
            type="search"
            name="q"
            defaultValue={search}
            placeholder={t("marketplace.searchPlaceholder")}
            className="h-11 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm text-foreground placeholder:text-subtle-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
          />
        </div>

        {categories.length > 0 ? (
          <select
            name="category"
            defaultValue={category}
            className="h-11 w-full sm:w-auto rounded-lg border border-border bg-surface px-3 text-sm text-foreground focus:border-primary focus:outline-none"
          >
            <option value="">{t("common.all")}</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        ) : null}

        <button
          type="submit"
          className="h-11 w-full sm:w-auto rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover cursor-pointer"
        >
          {t("common.search")}
        </button>
      </form>

      <div className="flex items-center gap-2 border-b border-border text-sm overflow-x-auto no-scrollbar">
        <Link
          href={search ? `/marketplace?q=${encodeURIComponent(search)}` : "/marketplace"}
          className={`-mb-px shrink-0 border-b-2 px-3 py-2 font-medium ${view === "businesses"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
        >
          {t("marketplace.businesses")} ({number(businesses.total)})
        </Link>
        <Link
          href={`/marketplace?view=products${search ? `&q=${encodeURIComponent(search)}` : ""}`}
          className={`-mb-px shrink-0 border-b-2 px-3 py-2 font-medium ${view === "products"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
        >
          {t("marketplace.products")}
        </Link>
      </div>

      {dbMissing ? (
        <Card className="p-6 text-sm text-muted-foreground">
          {t("errors.mongoMissing")}
        </Card>
      ) : !hasResults ? (
        <EmptyState
          icon={view === "products" ? <PackageSearch className="h-8 w-8" /> : <Store className="h-8 w-8" />}
          title={search || category ? t("marketplace.noResults") : t("marketplace.empty")}
          description={search || category ? t("marketplace.noResultsHint") : t("marketplace.emptyHint")}
          action={
            <Link
              href="/login"
              className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
            >
              {t("landing.ctaPrimary")}
            </Link>
          }
        />
      ) : view === "products" ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {products.items.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                locale={locale}
                altLabel={t("product.imageOf")}
                showBusiness
              />
            ))}
          </div>
          <Pagination
            page={products.page}
            totalPages={products.totalPages}
            buildHref={buildHref}
            labels={{
              previous: t("common.previous"),
              next: t("common.next"),
              page: t("common.page"),
            }}
          />
        </>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {businesses.items.map((business) => (
              <BusinessCard
                key={business.id}
                business={business}
                locale={locale}
                productLabel={t("marketplace.productCount")}
              />
            ))}
          </div>
          <Pagination
            page={businesses.page}
            totalPages={businesses.totalPages}
            buildHref={buildHref}
            labels={{
              previous: t("common.previous"),
              next: t("common.next"),
              page: t("common.page"),
            }}
          />
        </>
      )}
    </div>
  );
}