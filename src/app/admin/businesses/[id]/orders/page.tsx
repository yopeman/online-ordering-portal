import { notFound } from "next/navigation";
import { ClipboardList } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, PageHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { requireAdmin } from "@/lib/auth/guards";
import { getTranslator } from "@/lib/i18n-server";
import { getBusinessById, listOrders } from "@/lib/queries";

export const metadata = { title: "Admin · Orders" };

export default async function AdminBusinessOrdersPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string; limit?: string; perPage?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  await requireAdmin(`/admin/businesses/${id}/orders`);
  const t = await getTranslator();

  const business = await getBusinessById(id);
  if (!business) notFound();

  const page = Math.max(1, Number(query?.page) || 1);
  const perPage = Math.min(100, Math.max(5, Number(query?.limit || query?.perPage) || 20));
  const orders = await listOrders({ businessId: id, page, perPage });

  const buildHref = (nextPage: number, nextPerPage?: number) => {
    const search = new URLSearchParams();
    const effectivePerPage = nextPerPage ?? perPage;
    if (nextPage > 1) search.set("page", String(nextPage));
    if (effectivePerPage !== 20) search.set("perPage", String(effectivePerPage));
    const queryString = search.toString();
    return queryString
      ? `/admin/businesses/${id}/orders?${queryString}`
      : `/admin/businesses/${id}/orders`;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("admin.ordersTitle")}
        description={t("admin.ordersSubtitle")}
        action={<Badge tone="warning">{t("admin.readonly")}</Badge>}
      />

      {orders.total === 0 ? (
        <EmptyState icon={<ClipboardList className="h-8 w-8" />} title={t("admin.noOrders")} />
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-border">
            {orders.items.map((order) => (
              <li
                key={order.id}
                className="flex flex-wrap items-center gap-3 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">{order.productName}</p>
                  <p className="text-xs text-muted-foreground">
                    {String(order.details.customerName ?? t("orders.unknownCustomer"))} ·{" "}
                    {order.createdAt.toISOString().slice(0, 16).replace("T", " ")}
                  </p>
                </div>
                <Badge tone={order.isRead ? "neutral" : "primary"}>
                  {order.isRead ? t("common.read") : t("common.unread")}
                </Badge>
              </li>
            ))}
          </ul>
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