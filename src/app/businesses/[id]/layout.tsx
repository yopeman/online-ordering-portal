import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Store } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { TabsNav } from "@/components/ui/tabs-nav";
import { requireUser } from "@/lib/auth/guards";
import { readDetails } from "@/lib/models";
import { getTranslator } from "@/lib/i18n-server";
import { countUnreadActivities, getBusinessForOwner } from "@/lib/queries";
import { Order } from "@/lib/models";
import { connectDB } from "@/lib/db";

export default async function BusinessLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser(`/businesses/${id}`);
  const t = await getTranslator();

  const business = await getBusinessForOwner(id, user.id);
  if (!business) notFound();

  await connectDB();
  const [unreadOrders, unreadActivities] = await Promise.all([
    Order.countDocuments({ business: id, isRead: false }),
    countUnreadActivities(id),
  ]);

  const details = readDetails(business.details);

  return (
    <div className="container-page space-y-5 py-8">
      <div>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                {business.name}
              </h1>
              <Badge tone={business.isActive ? "success" : "warning"}>
                {business.isActive ? t("dashboard.active") : t("dashboard.inactive")}
              </Badge>
              {details.category ? (
                <Badge tone="primary">{String(details.category)}</Badge>
              ) : null}
            </div>
            <p className="text-sm text-muted-foreground">
              {t("dashboard.ownedBy")}{" "}
              <span className="text-foreground">
                {business.owner.toString() === user.id ? t("dashboard.you") : user.name}
              </span>{" "}
              · /{business.slug}
            </p>
          </div>

          <Link
            href={`/store/${business.slug}`}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm text-foreground hover:bg-surface-muted"
          >
            <Store className="h-4 w-4" />
            {t("common.view")}
          </Link>
        </div>
      </div>

      <TabsNav
        items={[
          {
            href: `/businesses/${id}/catalog`,
            label: t("business.tabCatalog"),
            icon: "layoutGrid",
          },
          {
            href: `/businesses/${id}/orders`,
            label: t("business.tabOrders"),
            icon: "clipboard",
            badge: unreadOrders || undefined,
          },
          {
            href: `/businesses/${id}/activities`,
            label: t("business.tabActivities"),
            icon: "activity",
            badge: unreadActivities || undefined,
          },
          {
            href: `/businesses/${id}/settings`,
            label: t("business.tabSettings"),
            icon: "settings",
          },
        ]}
      />

      {children}
    </div>
  );
}