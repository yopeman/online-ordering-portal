import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Bell,
  ClipboardList,
  History,
  LayoutGrid,
  Share2,
  TrendingUp,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getCurrentUser, isAdmin } from "@/lib/auth/session";
import { MissingMongoUriError } from "@/lib/db";
import { getTranslator } from "@/lib/i18n-server";
import { platformStats } from "@/lib/queries";

export default async function LandingPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect(isAdmin(user) ? "/admin" : "/businesses");
  }

  const t = await getTranslator();

  let stats = { businesses: 0, products: 0, orders: 0 };
  let dbMissing = false;
  try {
    stats = await platformStats();
  } catch (error) {
    if (!(error instanceof MissingMongoUriError)) throw error;
    dbMissing = true;
  }

  const features = [
    {
      icon: LayoutGrid,
      title: t("landing.featureCatalogTitle"),
      body: t("landing.featureCatalogBody"),
    },
    {
      icon: ClipboardList,
      title: t("landing.featureOrdersTitle"),
      body: t("landing.featureOrdersBody"),
    },
    {
      icon: Bell,
      title: t("landing.featureNotificationsTitle"),
      body: t("landing.featureNotificationsBody"),
    },
    {
      icon: History,
      title: t("landing.featureInsightsTitle"),
      body: t("landing.featureInsightsBody"),
    },
    {
      icon: Share2,
      title: t("landing.featurePublicTitle"),
      body: t("landing.featurePublicBody"),
    },
    {
      icon: TrendingUp,
      title: t("landing.featureLimitsTitle"),
      body: t("landing.featureLimitsBody"),
    },
  ];

  const steps = [
    {
      title: t("landing.stepOneTitle"),
      body: t("landing.stepOneBody"),
    },
    {
      title: t("landing.stepTwoTitle"),
      body: t("landing.stepTwoBody"),
    },
    {
      title: t("landing.stepThreeTitle"),
      body: t("landing.stepThreeBody"),
    },
  ];

  return (
    <>
      <section className="border-b border-border bg-gradient-to-b from-primary-soft to-transparent">
        <div className="container-page flex flex-col items-center gap-6 py-16 text-center sm:py-24">
          <Badge tone="primary">{t("landing.heroBadge")}</Badge>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            {t("landing.heroTitle")}
          </h1>
          <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
            {t("landing.heroSubtitle")}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href={user ? "/businesses" : "/login"}
              className="inline-flex h-12 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
            >
              {t("landing.ctaPrimary")}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/marketplace"
              className="inline-flex h-12 items-center rounded-lg border border-border bg-surface px-6 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
            >
              {t("landing.ctaSecondary")}
            </Link>
          </div>

          <dl className="mt-6 grid w-full max-w-2xl grid-cols-3 divide-x divide-border rounded-xl border border-border bg-surface">
            <Stat label={t("landing.statsBusinesses")} value={stats.businesses} />
            <Stat label={t("landing.statsProducts")} value={stats.products} />
            <Stat label={t("landing.statsOrders")} value={stats.orders} />
          </dl>
        </div>
      </section>

      <section className="container-page py-16">
        <h2 className="text-center text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {t("landing.featuresTitle")}
        </h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} className="p-5">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
                <feature.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-semibold text-foreground">{feature.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{feature.body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-surface">
        <div className="container-page py-16">
          <h2 className="text-center text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {t("landing.stepsTitle")}
          </h2>
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {steps.map((step, index) => (
              <li key={step.title} className="flex gap-4">
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {index + 1}
                </span>
                <div>
                  <h3 className="font-semibold text-foreground">{step.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="container-page py-16">
        <div className="flex flex-col items-center gap-6 rounded-2xl border border-border bg-primary-soft px-6 py-14 text-center">
          <h2 className="max-w-2xl text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {t("landing.heroTitle")}
          </h2>
          <Link
            href={user ? "/businesses" : "/login"}
            className="inline-flex h-12 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            {t("landing.ctaPrimary")}
            <ArrowRight className="h-4 w-4" />
          </Link>
          {dbMissing ? (
            <p className="max-w-xl text-xs text-muted-foreground">
              {t("errors.mongoMissing")}
            </p>
          ) : null}
        </div>
      </section>
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="px-4 py-4">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-2xl font-semibold text-foreground">{value}</dd>
    </div>
  );
}