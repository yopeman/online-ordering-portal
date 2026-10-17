import { Store } from "lucide-react";

import { CreateBusinessButton } from "@/components/business/create-business-button";
import { BusinessOwnerCard } from "@/components/business/business-card";
import { PageHeader } from "@/components/ui/card";
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

  const cardLabels = {
    productsCount: t("dashboard.productsCount"),
    active: t("dashboard.active"),
    inactive: t("dashboard.inactive"),
    unreadOrders: t("business.unreadOrders"),
    unreadActivities: t("activities.unreadCount"),
    viewStore: t("common.view"),
    catalog: t("business.tabCatalog"),
    orders: t("business.tabOrders"),
    activities: t("business.tabActivities"),
    settings: t("business.tabSettings"),
  };

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
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {businesses.map((business) => (
            <BusinessOwnerCard
              key={business.id}
              business={business}
              locale={locale}
              labels={cardLabels}
            />
          ))}
        </div>
      )}
    </div>
  );
}