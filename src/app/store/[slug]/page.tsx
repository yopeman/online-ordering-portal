import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ImageOff, MapPin, Phone, Store } from "lucide-react";

import { ProductCard } from "@/components/business/product-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { readDetails } from "@/lib/models";
import { getFormatters, getTranslator } from "@/lib/i18n-server";
import { getBusinessBySlug, listProductsForBusiness } from "@/lib/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);
  return {
    title: business?.name ?? "Business",
    description: business ? String(readDetails(business.details).description ?? "") : "",
  };
}

export default async function StorefrontPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const t = await getTranslator();
  const { locale } = await getFormatters();

  const business = await getBusinessBySlug(slug);
  if (!business) notFound();

  const details = readDetails(business.details);
  const products = await listProductsForBusiness(business._id.toString());
  const categories = [...new Set(products.map((product) => product.category).filter(Boolean))];

  return (
    <div className="container-page space-y-6 py-8">
      <Card className="overflow-hidden">
        <div className="flex h-40 items-center justify-center bg-surface-muted sm:h-52">
          {business.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={business.image}
              alt={business.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <Store className="h-12 w-12 text-subtle-foreground" />
          )}
        </div>

        <div className="space-y-4 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                  {business.name}
                </h1>
                {String(details.category ?? "") ? (
                  <Badge tone="primary">{String(details.category)}</Badge>
                ) : null}
              </div>
              {details.description ? (
                <p className="max-w-2xl text-sm text-muted-foreground">
                  {String(details.description)}
                </p>
              ) : null}
            </div>

            {(business.contactPhones ?? []).length > 0 ? (
              <div className="flex flex-col gap-2">
                {(business.contactPhones ?? []).map((phone) => (
                  <a
                    key={phone}
                    href={`tel:${phone}`}
                    className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-4 text-sm text-foreground transition-colors hover:bg-surface-muted"
                  >
                    <Phone className="h-4 w-4" />
                    {phone}
                  </a>
                ))}
              </div>
            ) : null}
          </div>

          <dl className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {details.location ? (
              <div className="inline-flex items-center gap-1.5">
                <dt className="sr-only">{t("dashboard.location")}</dt>
                <MapPin className="h-4 w-4" />
                <dd>{String(details.location)}</dd>
              </div>
            ) : null}
            {details.openingHours ? (
              <div>
                <dt className="sr-only">{t("common.details")}</dt>
                <dd>{String(details.openingHours)}</dd>
              </div>
            ) : null}
            <div>
              <dt className="sr-only">{t("businessPublic.menu")}</dt>
              <dd>{t("marketplace.productCount", { count: products.length })}</dd>
            </div>
          </dl>
        </div>
      </Card>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-foreground">
            {t("businessPublic.menu")}
          </h2>
          {categories.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              <Badge tone="neutral">{t("common.all")}</Badge>
              {categories.map((item) => (
                <Link key={item} href={`#${item}`}>
                  <Badge tone="neutral">{item}</Badge>
                </Link>
              ))}
            </div>
          ) : null}
        </div>

        {products.length === 0 ? (
          <EmptyState
            icon={<ImageOff className="h-8 w-8" />}
            title={t("businessPublic.noProducts")}
            description={t("businessPublic.noProductsHint")}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                locale={locale}
                altLabel={t("product.imageOf")}
              />
            ))}
          </div>
        )}
      </section>

      <div className="flex justify-end pt-4">
        <Button variant="secondary">SHARE THE BUSINESS</Button>
      </div>
    </div>
  );
}