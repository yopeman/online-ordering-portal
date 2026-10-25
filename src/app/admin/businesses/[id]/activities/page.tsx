import { notFound } from "next/navigation";
import { Activity as ActivityIcon } from "lucide-react";

import { Markdown } from "@/components/business/business-card";
import { Badge } from "@/components/ui/badge";
import { Card, PageHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { requireAdmin } from "@/lib/auth/guards";
import { getFormatters, getTranslator } from "@/lib/i18n-server";
import { getBusinessById, listActivities } from "@/lib/queries";

export const metadata = { title: "Admin · Activity" };

export default async function AdminBusinessActivitiesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string; limit?: string; perPage?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  await requireAdmin(`/admin/businesses/${id}/activities`);
  const t = await getTranslator();
  const { date } = await getFormatters();

  const business = await getBusinessById(id);
  if (!business) notFound();

  const page = Math.max(1, Number(query?.page) || 1);
  const perPage = Math.min(100, Math.max(5, Number(query?.limit || query?.perPage) || 20));
  const activities = await listActivities({ businessId: id, page, perPage });

  const buildHref = (nextPage: number, nextPerPage?: number) => {
    const search = new URLSearchParams();
    const effectivePerPage = nextPerPage ?? perPage;
    if (nextPage > 1) search.set("page", String(nextPage));
    if (effectivePerPage !== 20) search.set("perPage", String(effectivePerPage));
    const queryString = search.toString();
    return queryString
      ? `/admin/businesses/${id}/activities?${queryString}`
      : `/admin/businesses/${id}/activities`;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("admin.activitiesTitle")}
        description={t("admin.activitiesSubtitle")}
        action={<Badge tone="warning">{t("admin.readonly")}</Badge>}
      />

      {activities.total === 0 ? (
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

      <Pagination
        page={activities.page}
        totalPages={activities.totalPages}
        totalItems={activities.total}
        perPage={activities.perPage}
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