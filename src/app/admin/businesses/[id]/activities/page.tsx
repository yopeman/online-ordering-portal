import { notFound } from "next/navigation";
import { Activity as ActivityIcon } from "lucide-react";

import { Markdown } from "@/components/business/business-card";
import { Badge } from "@/components/ui/badge";
import { Card, PageHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireAdmin } from "@/lib/auth/guards";
import { getFormatters, getTranslator } from "@/lib/i18n-server";
import { getBusinessById, listActivities } from "@/lib/queries";

export const metadata = { title: "Admin · Activity" };

export default async function AdminBusinessActivitiesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireAdmin(`/admin/businesses/${id}/activities`);
  const t = await getTranslator();
  const { date } = await getFormatters();

  const business = await getBusinessById(id);
  if (!business) notFound();

  const activities = await listActivities({ businessId: id, perPage: 50 });

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("admin.activitiesTitle")}
        description={t("admin.activitiesSubtitle")}
        action={<Badge tone="warning">{t("admin.readonly")}</Badge>}
      />

      {activities.items.length === 0 ? (
        <EmptyState icon={<ActivityIcon className="h-8 w-8" />} title={t("admin.noActivities")} />
      ) : (
        <Card className="overflow-hidden">
          <ol className="divide-y divide-border">
            {activities.items.map((item) => (
              <li key={item.id} className="px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-foreground">
                    {t(`activityActions.${item.action}`)}
                  </p>
                  {!item.isRead ? (
                    <Badge tone="primary">{t("common.unread")}</Badge>
                  ) : null}
                </div>
                <Markdown text={item.detail} />
                <p className="mt-1 text-xs text-muted-foreground">
                  {date(item.createdAt)}
                  {item.actorName ? ` · ${t("activities.by", { name: item.actorName })}` : ""}
                </p>
              </li>
            ))}
          </ol>
        </Card>
      )}
    </div>
  );
}