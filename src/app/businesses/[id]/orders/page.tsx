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
  searchParams: Promise<{ filter?: string; page?: string }>;
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

  const orders = await listOrders({ businessId: id, filter, page });

  const buildHref = (nextPage: number) => {
    const params = new URLSearchParams();
    if (filter !== "all") params.set("filter", filter);
    if (nextPage > 1) params.set("page", String(nextPage));
    const queryString = params.toString();
    return queryString ? `/businesses/${id}/orders?${queryString}` : `/businesses/${id}/orders`;
  };

  const filterHref = (value: string) => {
    const params = new URLSearchParams();
    if (value !== "all") params.set("filter", value);
    const queryString = params.toString();
    return queryString ? `/businesses/${id}/orders?${queryString}` : `/businesses/${id}/orders`;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("orders.title")}
        description={t("orders.subtitle")}
        action={
          <div className="flex flex-wrap gap-1 rounded-lg border border-border p-1">
            {FILTERS.map((item) => (
              <Link
                key={item.value}
                href={filterHref(item.value)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  filter === item.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t(item.key)}
              </Link>
            ))}
          </div>
        }
      />

      {orders.items.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-8 w-8" />}
          title={t("orders.empty")}
          description={t("orders.emptyHint")}
        />
      ) : (
        <Card className="overflow-hidden">
          <OrderList orders={orders.items} />
        </Card>
      )}

      <Pagination
        page={orders.page}
        totalPages={orders.totalPages}
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