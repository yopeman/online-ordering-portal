import { notFound } from "next/navigation";
import { ClipboardList } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, PageHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireAdmin } from "@/lib/auth/guards";
import { getTranslator } from "@/lib/i18n-server";
import { getBusinessById, listOrders } from "@/lib/queries";

export const metadata = { title: "Admin · Orders" };

export default async function AdminBusinessOrdersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireAdmin(`/admin/businesses/${id}/orders`);
  const t = await getTranslator();

  const business = await getBusinessById(id);
  if (!business) notFound();

  const orders = await listOrders({ businessId: id, perPage: 50 });

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("admin.ordersTitle")}
        description={t("admin.ordersSubtitle")}
        action={<Badge tone="warning">{t("admin.readonly")}</Badge>}
      />

      {orders.items.length === 0 ? (
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
    </div>
  );
}