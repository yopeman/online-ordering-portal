import Link from "next/link";
import { notFound } from "next/navigation";
import { Activity as ActivityIcon, CheckCheck } from "lucide-react";

import { Markdown } from "@/components/business/business-card";
import { markAllActivitiesReadAction } from "@/app/actions/orders";
import { Badge } from "@/components/ui/badge";
import { Card, PageHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { requireUser } from "@/lib/auth/guards";
import { getFormatters, getTranslator } from "@/lib/i18n-server";
import { getBusinessForOwner, listActivities } from "@/lib/queries";

export const metadata = { title: "Activity" };

export default async function ActivitiesTabPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const user = await requireUser(`/businesses/${id}/activities`);
  const t = await getTranslator();
  const { date } = await getFormatters();

  const business = await getBusinessForOwner(id, user.id);
  if (!business) notFound();

  const page = Math.max(1, Number(query.page) || 1);
  const activities = await listActivities({ businessId: id, page });
  const hasUnread = activities.items.some((item) => !item.isRead);

  const buildHref = (nextPage: number) => {
    const queryString = nextPage > 1 ? `?page=${nextPage}` : "";
    return `/businesses/${id}/activities${queryString}`;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("activities.title")}
        description={t("activities.subtitle")}
        action={
          hasUnread ? (
            <form action={markAllActivitiesReadAction}>
              <input type="hidden" name="businessId" value={id} />
              <button
                type="submit"
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm text-foreground transition-colors hover:bg-surface-muted"
              >
                <CheckCheck className="h-4 w-4" />
                {t("common.markAllRead")}
              </button>
            </form>
          ) : null
        }
      />

      {activities.items.length === 0 ? (
        <EmptyState
          icon={<ActivityIcon className="h-8 w-8" />}
          title={t("activities.empty")}
          description={t("activities.emptyHint")}
        />
      ) : (
        <Card className="overflow-hidden">
          <ol className="divide-y divide-border">
            {activities.items.map((item) => {
              const label = t(`activityActions.${item.action}`);
              return (
                <li
                  key={item.id}
                  className={`flex flex-wrap items-start gap-3 px-4 py-3 ${
                    item.isRead ? "" : "bg-primary-soft/40"
                  }`}
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{label}</p>
                      {!item.isRead ? (
                        <Badge tone="primary">{t("common.unread")}</Badge>
                      ) : null}
                    </div>
                    <Markdown text={item.detail} />
                    <p className="text-xs text-muted-foreground">
                      {date(item.createdAt)}
                      {item.actorName ? ` · ${t("activities.by", { name: item.actorName })}` : ""}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </Card>
      )}

      <Pagination
        page={activities.page}
        totalPages={activities.totalPages}
        buildHref={buildHref}
        labels={{
          previous: t("common.previous"),
          next: t("common.next"),
          page: t("common.page"),
        }}
      />

      <div className="flex justify-end">
        <Link
          href={`/businesses/${id}/orders`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          {t("business.tabOrders")}
        </Link>
      </div>
    </div>
  );
}