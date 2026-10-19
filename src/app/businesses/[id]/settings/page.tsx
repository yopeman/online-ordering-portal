import { notFound } from "next/navigation";

import { BusinessSettingsForm } from "@/components/business/business-settings-form";
import { DeleteBusinessCard } from "@/components/business/delete-business-card";
import { PageHeader } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/guards";
import { readContacts, readDetails, readOrderFormTemplates } from "@/lib/models";
import { getTranslator } from "@/lib/i18n-server";
import { getBusinessForOwner, listAttachments } from "@/lib/queries";

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
  const templates = readOrderFormTemplates(business.orderFormTemplates);
  const attachments = await listAttachments("business", id);

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
          details: Object.entries(details)
            .filter(([, value]) => value !== undefined && value !== null && value !== "")
            .map(([key, value]) => ({
              key,
              value:
                typeof value === "object"
                  ? JSON.stringify(value)
                  : String(value),
            })),
          orderForms: templates.map((field) => ({
            name: field.label,
            type: field.type,
            options: field.options ?? [],
          })),
          contacts: readContacts(business.contactPhones),
          files: attachments.map((attachment) => ({
            url: attachment.url,
            name:
              attachment.alt ||
              (attachment.url.startsWith("data:")
                ? "Attachment"
                : attachment.url.split("/").pop() || "Attachment"),
            size: 0,
            type: attachment.kind === "file" ? "file" : "image",
          })),
          image: business.image ?? "",
          status:
            (business.status as "visible" | "hide") ||
            (business.isActive !== false ? "visible" : "hide"),
          isActive: business.isActive ?? true,
        }}
      />

      <DeleteBusinessCard businessId={id} businessName={business.name} />
    </div>
  );
}