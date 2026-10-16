import { notFound } from "next/navigation";

import { BusinessSettingsForm } from "@/components/business/business-settings-form";
import { DeleteBusinessCard } from "@/components/business/delete-business-card";
import { PageHeader } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/guards";
import { readDetails, readOrderFormTemplates } from "@/lib/models";
import { getTranslator } from "@/lib/i18n-server";
import { getBusinessForOwner } from "@/lib/queries";

export const metadata = { title: "Settings" };

export default async function SettingsTabPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser(`/businesses/${id}/settings`);
  const t = await getTranslator();

  const business = await getBusinessForOwner(id, user.id);
  if (!business) notFound();

  const details = readDetails(business.details);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("business.settingsTitle")}
        description={t("business.settingsSubtitle")}
      />

      <BusinessSettingsForm
        businessId={id}
        values={{
          name: business.name,
          description: String(details.description ?? ""),
          category: String(details.category ?? ""),
          location: String(details.location ?? ""),
          image: business.image ?? "",
          isActive: business.isActive ?? true,
          contactPhones: business.contactPhones ?? [],
        }}
        orderFormTemplates={readOrderFormTemplates(business.orderFormTemplates)}
      />

      <DeleteBusinessCard businessId={id} businessName={business.name} />
    </div>
  );
}