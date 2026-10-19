import Link from "next/link";
import { ArrowRight, Search, Store } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, PageHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { requireAdmin } from "@/lib/auth/guards";
import { listAllBusinesses } from "@/lib/admin-queries";
import { getFormatters, getTranslator } from "@/lib/i18n-server";

export const metadata = { title: "Admin · Businesses" };

export default async function AdminBusinessesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const query = await searchParams;
  await requireAdmin("/admin/businesses");
  const t = await getTranslator();
  const { date } = await getFormatters();

  const search = query.q?.trim() ?? "";
  const page = Math.max(1, Number(query.page) || 1);

  const businesses = await listAllBusinesses({ search, page });

  const buildHref = (nextPage: number) => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (nextPage > 1) params.set("page", String(nextPage));
    const queryString = params.toString();
    return queryString ? `/admin/businesses?${queryString}` : "/admin/businesses";
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("admin.businessesTitle")}
        description={t("admin.businessesSubtitle")}
      />

      <form method="get" className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle-foreground" />
          <input
            type="search"
            name="q"
            defaultValue={search}
            placeholder={t("common.search")}
            className="h-10 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm text-foreground placeholder:text-subtle-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
          />
        </div>
        <button
          type="submit"
          className="h-10 w-full sm:w-auto rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover cursor-pointer"
        >
          {t("common.search")}
        </button>
      </form>

      {businesses.items.length === 0 ? (
        <EmptyState
          icon={<Store className="h-8 w-8" />}
          title={t("admin.noBusinesses")}
          description={t("dashboard.emptyHint")}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="divide-y divide-border">
            {businesses.items.map((business) => (
              <div
                key={business.id}
                className="flex flex-wrap items-center gap-3 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-medium text-foreground">
                    {business.name}
                    <Badge tone={business.isActive ? "success" : "warning"}>
                      {business.isActive ? t("admin.active") : t("admin.inactive")}
                    </Badge>
                    {business.category ? (
                      <Badge tone="neutral">{business.category}</Badge>
                    ) : null}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    /{business.slug} · {t("admin.owner")}: {business.ownerName} ({business.ownerEmail})
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("landing.statsProducts")}: {business.productCount} ·{" "}
                    {t("landing.statsOrders")}: {business.orderCount} ·{" "}
                    {t("common.createdAt")}: {date(business.createdAt)}
                  </p>
                </div>

                <Link
                  href={`/admin/businesses/${business.id}/catalog`}
                  className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface-muted"
                >
                  {t("admin.viewBusiness")}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </Card>
      )}

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
    </div>
  );
}