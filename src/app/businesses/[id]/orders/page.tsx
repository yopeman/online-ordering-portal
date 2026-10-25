import Link from "next/link";
import { notFound } from "next/navigation";
import { ClipboardList } from "lucide-react";

import { OrderList } from "@/components/business/order-list";
import { Card, PageHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { requireUser } from "@/lib/auth/guards";
import { getTranslator } from "@/lib/i18n-server";
import { getBusinessForOwner, listOrders } from "@/lib/queries";

export const metadata = { title: "Orders" };

const FILTERS = [
  { value: "all", key: "orders.filterAll" },
  { value: "unread", key: "orders.filterUnread" },
  { value: "read", key: "orders.filterRead" },
] as const;

export default async function OrdersTabPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ filter?: string; page?: string; limit?: string; perPage?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const user = await requireUser(`/businesses/${id}/orders`);
  const t = await getTranslator();

  const business = await getBusinessForOwner(id, user.id);
  if (!business) notFound();

  const filter = (["all", "read", "unread"] as const).includes(
    query.filter as "all" | "read" | "unread",
  )
    ? (query.filter as "all" | "read" | "unread")
    : "all";
  const page = Math.max(1, Number(query.page) || 1);
  const perPage = Math.min(100, Math.max(5, Number(query.limit || query.perPage) || 20));

  const orders = await listOrders({ businessId: id, filter, page, perPage });

  const buildHref = (nextPage: number, nextPerPage?: number) => {
    const search = new URLSearchParams();
    if (filter !== "all") search.set("filter", filter);
    const effectivePerPage = nextPerPage ?? perPage;
    if (nextPage > 1) search.set("page", String(nextPage));
    if (effectivePerPage !== 20) search.set("perPage", String(effectivePerPage));
    const queryString = search.toString();
    return queryString ? `/businesses/${id}/orders?${queryString}` : `/businesses/${id}/orders`;
  };

  const filterHref = (value: string) => {
    const search = new URLSearchParams();
    if (value !== "all") search.set("filter", value);
    if (perPage !== 20) search.set("perPage", String(perPage));
    const queryString = search.toString();
    return queryString ? `/businesses/${id}/orders?${queryString}` : `/businesses/${id}/orders`;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("orders.title")}
        description={t("orders.subtitle")}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-surface p-1 shadow-xs">
              {FILTERS.map((item) => (
                <Link
                  key={item.value}
                  href={filterHref(item.value)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                    filter === item.value
                      ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                      : "text-muted-foreground hover:bg-surface-muted hover:text-foreground"
                  }`}
                >
                  <span>{t(item.key)}</span>
                  {item.value === "unread" && orders.unreadCount > 0 ? (
                    <span
                      className={`inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                        filter === "unread"
                          ? "bg-primary-foreground text-primary"
                          : "bg-primary text-primary-foreground"
                      }`}
                    >
                      {orders.unreadCount}
                    </span>
                  ) : null}
                </Link>
              ))}
            </div>
          </div>
        }
      />

      {orders.total === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-8 w-8" />}
          title={t("orders.empty")}
          description={t("orders.emptyHint")}
        />
      ) : orders.items.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-muted-foreground">{t("common.empty")}</p>
          <Link
            href={buildHref(1)}
            className="mt-3 inline-flex text-sm font-medium text-primary hover:underline"
          >
            {t("common.back")} ({t("common.page")} 1)
          </Link>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <OrderList orders={orders.items} />
        </Card>
      )}

      <Pagination
        page={orders.page}
        totalPages={orders.totalPages}
        totalItems={orders.total}
        perPage={orders.perPage}
        perPageOptions={[10, 20, 50]}
        buildHref={buildHref}
        labels={{
          previous: t("common.previous"),
          next: t("common.next"),
          page: t("common.page"),
          first: t("common.first"),
          last: t("common.last"),
          showing: t("common.showing"),
          showingRange: t("common.showingRange"),
          perPage: t("common.perPage"),
          itemsPerPage: t("common.itemsPerPage"),
        }}
      />
    </div>
  );
}