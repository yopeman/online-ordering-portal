import Link from "next/link";
import { ArrowRight, MapPin, Store } from "lucide-react";

import { CreateBusinessButton } from "@/components/business/create-business-button";
import { BusinessCard } from "@/components/business/business-card";
import { Badge } from "@/components/ui/badge";
import { Card, PageHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/guards";
import { getFormatters, getTranslator } from "@/lib/i18n-server";
import { listBusinessesForOwner } from "@/lib/queries";

export const metadata = { title: "My businesses" };

export default async function BusinessesPage() {
  const user = await requireUser("/businesses");
  const t = await getTranslator();
  const { locale } = await getFormatters();

  const businesses = await listBusinessesForOwner(user.id);
  const canCreate = businesses.length < user.maxBusinesses;

  return (
    <div className="container-page space-y-6 py-10">
      <PageHeader
        title={t("dashboard.title")}
        description={t("dashboard.subtitle")}
        action={
          <CreateBusinessButton
            canCreate={canCreate}
            reachedLimit={!canCreate}
          />
        }
      />

      {businesses.length === 0 ? (
        <EmptyState
          icon={<Store className="h-8 w-8" />}
          title={t("dashboard.empty")}
          description={t("dashboard.emptyHint")}
          action={
            <CreateBusinessButton
              canCreate={canCreate}
              reachedLimit={!canCreate}
              max={user.maxBusinesses}
              label={t("dashboard.createAction")}
            />
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {businesses.map((business) => (
            <BusinessCard
              key={business.id}
              business={business}
              locale={locale}
              productLabel={t("dashboard.productsCount")}
            />
          ))}
        </div>
      )}

      {businesses.length > 0 ? (
        <Card className="overflow-hidden">
          <div className="divide-y divide-border">
            {businesses.map((business) => (
              <div
                key={business.id}
                className="flex flex-wrap items-center gap-3 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">
                    {business.name}
                  </p>
                  <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {business.location ? (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {business.location}
                      </span>
                    ) : null}
                    <span>
                      {t("dashboard.productsCount", { count: business.productCount })}
                    </span>
                    <span className={business.isActive ? "" : "text-warning"}>
                      {business.isActive ? t("dashboard.active") : t("dashboard.inactive")}
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {business.unreadOrders > 0 ? (
                    <Badge tone="primary">
                      {t("business.unreadOrders", { count: business.unreadOrders })}
                    </Badge>
                  ) : null}
                  {business.unreadActivities > 0 ? (
                    <Badge tone="info">
                      {t("activities.unreadCount", { count: business.unreadActivities })}
                    </Badge>
                  ) : null}
                  <Link
                    href={`/store/${business.slug}`}
                    className="rounded-lg px-2 py-1 text-xs text-muted-foreground hover:bg-surface-muted hover:text-foreground"
                  >
                    {t("common.view")}
                  </Link>
                  <Link
                    href={`/businesses/${business.id}/catalog`}
                    className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface-muted"
                  >
                    {t("business.tabCatalog")}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
}