import { CreateBusinessButton } from "@/components/business/create-business-button";
import { BusinessOwnerCard } from "@/components/business/business-card";
import { ShareBusinessButton } from "@/components/business/share-business-button";
import { OnboardingGuidance } from "@/components/business/onboarding-guidance";
import { PageVideoButton } from "@/components/video";
import { PageHeader } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/guards";
import { getFormatters, getTranslator } from "@/lib/i18n-server";
import { getOwnerOnboardingStats, listBusinessesForOwner } from "@/lib/queries";

export const metadata = { title: "My businesses" };

export default async function BusinessesPage() {
  const user = await requireUser("/businesses");
  const t = await getTranslator();
  const { locale } = await getFormatters();

  const [businesses, onboardingStats] = await Promise.all([
    listBusinessesForOwner(user.id),
    getOwnerOnboardingStats(user.id),
  ]);
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
    share: t("common.share"),
  };

  return (
    <div className="container-page space-y-6 py-10">
      <PageHeader
        title={t("dashboard.title")}
        description={t("dashboard.subtitle")}
        action={
          <div className="flex items-center gap-2">
            <PageVideoButton videoKey="businessOverview" size="sm" />
            <CreateBusinessButton
              canCreate={canCreate}
              reachedLimit={!canCreate}
            />
          </div>
        }
      />

      {businesses.length === 0 ? (
        <OnboardingGuidance
          stats={onboardingStats}
          canCreateBusiness={canCreate}
          maxBusinesses={user.maxBusinesses}
          variant="hero"
        />
      ) : (
        <>
          {onboardingStats.completedCount < onboardingStats.totalSteps ? (
            <OnboardingGuidance
              stats={onboardingStats}
              business={businesses[0]}
              canCreateBusiness={canCreate}
              maxBusinesses={user.maxBusinesses}
              variant="banner"
            />
          ) : null}

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {businesses.map((business) => (
            <BusinessOwnerCard
              key={business.id}
              business={business}
              locale={locale}
              labels={cardLabels}
              shareAction={
                <ShareBusinessButton
                  businessId={business.id}
                  businessName={business.name}
                  description={business.description}
                  url={`/store/${business.slug}`}
                  imageUrl={business.image}
                  isOwner={true}
                  size="icon"
                  label={''}
                  className="h-8 w-8 !p-0"
                />
              }
            />
          ))}
          </div>
        </>
      )}
    </div>
  );
}