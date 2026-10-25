import Link from "next/link";
import { Search, Users } from "lucide-react";

import {
  CreateUserButton,
  DeleteUserButton,
  EditUserButton,
} from "@/components/admin/user-forms";
import { Badge } from "@/components/ui/badge";
import { Card, PageHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { Avatar } from "@/components/ui/avatar";
import { requireAdmin } from "@/lib/auth/guards";
import { listUsers } from "@/lib/admin-queries";
import { getFormatters, getTranslator } from "@/lib/i18n-server";

export const metadata = { title: "Admin · Users" };

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string; page?: string }>;
}) {
  const query = await searchParams;
  const admin = await requireAdmin("/admin");
  const t = await getTranslator();
  const { date } = await getFormatters();

  const search = query.q?.trim() ?? "";
  const role = (["all", "admin", "business_owner"] as const).includes(
    query.role as "all" | "admin" | "business_owner",
  )
    ? (query.role as "all" | "admin" | "business_owner")
    : "all";
  const page = Math.max(1, Number(query.page) || 1);

  const users = await listUsers({ search, role, page });

  const buildHref = (nextPage: number) => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (role !== "all") params.set("role", role);
    if (nextPage > 1) params.set("page", String(nextPage));
    const queryString = params.toString();
    return queryString ? `/admin?${queryString}` : "/admin";
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("admin.usersTitle")}
        description={t("admin.usersSubtitle")}
        action={<CreateUserButton />}
      />

      <form method="get" className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle-foreground" />
          <input
            type="search"
            name="q"
            defaultValue={search}
            placeholder={t("common.search")}
            className="h-10 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm text-foreground placeholder:text-subtle-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
          />
        </div>
        <select
          name="role"
          defaultValue={role}
          className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground focus:border-primary focus:outline-none"
        >
          <option value="all">{t("common.all")}</option>
          <option value="admin">{t("admin.adminRole")}</option>
          <option value="business_owner">{t("admin.ownerRole")}</option>
        </select>
        <button
          type="submit"
          className="h-10 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
        >
          {t("common.search")}
        </button>
      </form>

      {users.items.length === 0 ? (
        <EmptyState
          icon={<Users className="h-8 w-8" />}
          title={t("admin.noUsers")}
          description={t("dashboard.emptyHint")}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="divide-y divide-border">
            {users.items.map((user) => (
              <div
                key={user.id}
                className="flex flex-wrap items-center gap-3 px-4 py-3"
              >
                <Avatar name={user.name} src={user.image} size="sm" />

                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-medium text-foreground">
                    {user.name}
                    {user.id === admin.id ? (
                      <Badge tone="primary">{t("nav.account")}</Badge>
                    ) : null}
                    <Badge tone={user.role === "admin" ? "info" : "neutral"}>
                      {user.role === "admin" ? t("admin.adminRole") : t("admin.ownerRole")}
                    </Badge>
                    <Badge tone={user.status === "active" ? "success" : "danger"}>
                      {user.status === "active" ? t("admin.active") : t("admin.inactive")}
                    </Badge>
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {user.email} · {t("admin.ownedBusinesses", { count: user.businessCount })} ·{" "}
                    {t("admin.joined")}: {date(user.createdAt)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("admin.maxBusinesses")}: {user.maxBusinesses} ·{" "}
                    {t("admin.maxCatalogs")}: {user.maxCatalogs}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <EditUserButton user={user} />
                  <DeleteUserButton user={user} isSelf={user.id === admin.id} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Pagination
        page={users.page}
        totalPages={users.totalPages}
        totalItems={users.total}
        buildHref={buildHref}
        labels={{
          previous: t("common.previous"),
          next: t("common.next"),
          page: t("common.page"),
          first: t("common.first"),
          last: t("common.last"),
          showing: t("common.showing"),
          showingRange: t("common.showingRange"),
        }}
      />
    </div>
  );
}