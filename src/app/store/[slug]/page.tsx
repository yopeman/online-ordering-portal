import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  Download,
  ExternalLink,
  FileText,
  Globe,
  ImageOff,
  Mail,
  MapPin,
  Package,
  Phone,
  Share2,
  Store,
  Tag,
  Truck,
} from "lucide-react";

import { ProductCard } from "@/components/business/product-card";
import { ShareBusinessButton } from "@/components/business/share-business-button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getCurrentUser } from "@/lib/auth/session";
import { readDetails } from "@/lib/models";
import { getFormatters, getTranslator } from "@/lib/i18n-server";
import {
  getBusinessBySlug,
  listAttachments,
  listProductsForBusiness,
} from "@/lib/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug, true);
  const details = business ? readDetails(business.details) : {};
  return {
    title: business?.name ? `${business.name} · Store` : "Business",
    description: business
      ? String(details.description || details.category || "Online storefront on Yope Order")
      : "",
  };
}

function formatDetailLabel(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function renderDetailValue(value: unknown): React.ReactNode {
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  if (Array.isArray(value)) {
    return value.join(", ");
  }
  if (typeof value === "object" && value !== null) {
    return JSON.stringify(value);
  }
  const strVal = String(value);
  if (/^https?:\/\//i.test(strVal)) {
    return (
      <a
        href={strVal}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-primary hover:underline break-all"
      >
        <span>{strVal.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}</span>
        <ExternalLink className="h-3 w-3 shrink-0" />
      </a>
    );
  }
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(strVal)) {
    return (
      <a
        href={`mailto:${strVal}`}
        className="inline-flex items-center gap-1 text-primary hover:underline"
      >
        <Mail className="h-3 w-3 shrink-0" />
        <span>{strVal}</span>
      </a>
    );
  }
  return strVal;
}

export default async function StorefrontPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ category?: string }>;
}) {
  const { slug } = await params;
  const sp = searchParams ? await searchParams : undefined;
  const selectedCategory = sp?.category?.trim() || "";

  const t = await getTranslator();
  const { locale } = await getFormatters();
  const currentUser = await getCurrentUser();

  const business = await getBusinessBySlug(slug, true);
  if (!business) notFound();

  const isOwner =
    currentUser &&
    (currentUser.id === business.owner.toString() || currentUser.role === "admin");

  if (!business.isActive && !isOwner) {
    notFound();
  }

  const details = readDetails(business.details);
  const businessId = business._id.toString();

  const [products, attachments] = await Promise.all([
    listProductsForBusiness(businessId),
    listAttachments("business", businessId),
  ]);

  // Visual assets
  const coverImage =
    business.image ||
    (typeof details.coverUrl === "string" ? details.coverUrl : "") ||
    (typeof details.image === "string" ? details.image : "");
  const logoUrl = typeof details.logoUrl === "string" ? details.logoUrl : "";

  // Core metadata
  const category = String(details.category ?? "");
  const description = String(details.description ?? "");
  const contactPhones = business.contactPhones ?? [];

  // Location handling
  const rawLocation = typeof details.location === "string" ? details.location.trim() : "";
  const isMapUrl = /^https?:\/\//i.test(rawLocation);
  const addressText = typeof details.address === "string" ? details.address.trim() : "";
  const cityText = typeof details.city === "string" ? details.city.trim() : "";

  const displayLocation = addressText
    ? cityText && !addressText.toLowerCase().includes(cityText.toLowerCase())
      ? `${addressText}, ${cityText}`
      : addressText
    : cityText || (!isMapUrl ? rawLocation : "");

  const mapUrl = isMapUrl
    ? rawLocation
    : displayLocation
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(displayLocation)}`
    : "";

  // Schedule / Hours
  const openingHours =
    typeof details.openingHours === "string"
      ? details.openingHours.trim()
      : typeof details.hours === "string"
      ? details.hours.trim()
      : "";

  // Contact & Delivery
  const email = typeof details.email === "string" ? details.email.trim() : "";
  const website = typeof details.website === "string" ? details.website.trim() : "";
  const delivery =
    details.delivery !== undefined && details.delivery !== null
      ? typeof details.delivery === "boolean"
        ? details.delivery
          ? "Delivery available"
          : "Pickup only"
        : String(details.delivery)
      : "";
  const currency = typeof details.currency === "string" ? details.currency.trim() : "";

  // Tags
  const tags: string[] = Array.isArray(details.tags)
    ? details.tags.map(String).filter(Boolean)
    : typeof details.tags === "string"
    ? details.tags.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  // Social Links
  const socialObj =
    typeof details.social === "object" && details.social !== null
      ? (details.social as Record<string, unknown>)
      : {};
  const telegram = String(details.telegram || socialObj.telegram || "");
  const instagram = String(details.instagram || socialObj.instagram || "");
  const facebook = String(details.facebook || socialObj.facebook || "");
  const tiktok = String(details.tiktok || socialObj.tiktok || "");
  const twitter = String(details.twitter || socialObj.twitter || details.x || socialObj.x || "");

  const socialLinks = [
    telegram && {
      name: "Telegram",
      href: telegram.startsWith("http") ? telegram : `https://t.me/${telegram.replace(/^@/, "")}`,
    },
    instagram && {
      name: "Instagram",
      href: instagram.startsWith("http") ? instagram : `https://instagram.com/${instagram.replace(/^@/, "")}`,
    },
    facebook && {
      name: "Facebook",
      href: facebook.startsWith("http") ? facebook : `https://facebook.com/${facebook}`,
    },
    tiktok && {
      name: "TikTok",
      href: tiktok.startsWith("http") ? tiktok : `https://tiktok.com/@${tiktok.replace(/^@/, "")}`,
    },
    twitter && {
      name: "X (Twitter)",
      href: twitter.startsWith("http") ? twitter : `https://x.com/${twitter.replace(/^@/, "")}`,
    },
  ].filter(Boolean) as { name: string; href: string }[];

  // Custom Extra Details (Any fields added by owner that weren't captured above)
  const handledKeys = new Set([
    "description",
    "category",
    "location",
    "address",
    "city",
    "openingHours",
    "hours",
    "currency",
    "tags",
    "logoUrl",
    "coverUrl",
    "image",
    "email",
    "website",
    "delivery",
    "social",
    "telegram",
    "instagram",
    "facebook",
    "tiktok",
    "twitter",
    "x",
  ]);

  const customDetails = Object.entries(details).filter(
    ([key, value]) =>
      !handledKeys.has(key) &&
      value !== undefined &&
      value !== null &&
      value !== "" &&
      typeof value !== "function",
  );

  // Grouped attachments
  const imageAttachments = attachments.filter((a) => a.kind === "image");
  const fileAttachments = attachments.filter((a) => a.kind === "file");

  // Products and Category filters
  const categories = [
    ...new Set(products.map((product) => product.category).filter(Boolean)),
  ];

  const filteredProducts = selectedCategory
    ? products.filter((p) => p.category === selectedCategory)
    : products;

  return (
    <div className="container-page space-y-6 py-6 sm:py-8">
      {/* Top Navigation & Owner Shortcuts */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{t("businessPublic.backToMarketplace")}</span>
        </Link>

        <div className="flex items-center gap-2">
          {isOwner ? (
            <Link
              href={`/businesses/${businessId}/catalog`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-surface-muted hover:border-primary-border"
            >
              <Store className="h-3.5 w-3.5 text-primary" />
              <span>{t("businessPublic.viewDashboard")}</span>
            </Link>
          ) : null}

          <ShareBusinessButton
            businessName={business.name}
            description={description}
            label={t("common.copy")}
            copiedLabel={t("common.copied")}
            size="sm"
          />
        </div>
      </div>

      {/* Inactive Alert for owner/admin */}
      {!business.isActive ? (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-xl border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-warning"
        >
          <div className="flex items-center gap-2 font-medium">
            <Badge tone="warning">{t("dashboard.inactive")}</Badge>
            <span>This business is inactive and hidden from the public marketplace.</span>
          </div>
          {isOwner ? (
            <Link
              href={`/businesses/${businessId}/settings`}
              className="text-xs font-semibold underline hover:opacity-80"
            >
              Change in Settings
            </Link>
          ) : null}
        </div>
      ) : null}

      {/* Hero Card */}
      <Card className="overflow-hidden shadow-sm">
        {/* Cover Banner */}
        <div className="relative flex h-48 w-full items-center justify-center overflow-hidden bg-surface-muted sm:h-64">
          {coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverImage}
              alt={business.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-surface-muted via-surface to-surface-muted/60">
              <Store className="h-16 w-16 text-subtle-foreground/50" />
            </div>
          )}
        </div>

        {/* Header Details */}
        <div className="space-y-5 p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt={`${business.name} logo`}
                  className="-mt-12 h-20 w-20 shrink-0 rounded-2xl border-4 border-surface bg-surface object-cover shadow-md sm:-mt-14 sm:h-24 sm:w-24"
                />
              ) : null}

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    {business.name}
                  </h1>
                  {category ? <Badge tone="primary">{category}</Badge> : null}
                  {!business.isActive ? (
                    <Badge tone="warning">{t("dashboard.inactive")}</Badge>
                  ) : (
                    <Badge tone="success">{t("dashboard.active")}</Badge>
                  )}
                  {currency ? <Badge tone="neutral">{currency}</Badge> : null}
                </div>

                <p className="font-mono text-xs text-muted-foreground">
                  /{business.slug}
                </p>

                {tags.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {tags.map((tag) => (
                      <Badge key={tag} tone="neutral" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            {/* Quick Call Action Buttons */}
            {contactPhones.length > 0 ? (
              <div className="flex flex-wrap gap-2 sm:flex-col sm:items-end">
                {contactPhones.map((phone) => (
                  <a
                    key={phone}
                    href={`tel:${phone}`}
                    className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-medium text-foreground shadow-xs transition-colors hover:bg-surface-muted hover:border-primary-border"
                  >
                    <Phone className="h-4 w-4 text-primary" />
                    <span>{phone}</span>
                  </a>
                ))}
              </div>
            ) : null}
          </div>

          {/* Business Description */}
          {description ? (
            <div className="border-t border-border pt-4">
              <p className="max-w-3xl whitespace-pre-line text-sm leading-relaxed text-muted-foreground sm:text-base">
                {description}
              </p>
            </div>
          ) : null}

          {/* Quick Info & Highlights Bar */}
          <div className="flex flex-wrap items-center gap-2.5 border-t border-border pt-4 text-xs sm:text-sm text-muted-foreground">
            {displayLocation ? (
              mapUrl ? (
                <a
                  href={mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-muted/60 px-3 py-1.5 text-foreground transition-colors hover:bg-surface-muted hover:text-primary hover:border-primary-border"
                >
                  <MapPin className="h-4 w-4 shrink-0 text-primary" />
                  <span className="font-medium">{displayLocation}</span>
                  <ExternalLink className="h-3 w-3 shrink-0 opacity-60" />
                </a>
              ) : (
                <div className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-muted/60 px-3 py-1.5 text-foreground">
                  <MapPin className="h-4 w-4 shrink-0 text-primary" />
                  <span className="font-medium">{displayLocation}</span>
                </div>
              )
            ) : null}

            {openingHours ? (
              <div className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-muted/60 px-3 py-1.5 text-foreground">
                <Clock className="h-4 w-4 shrink-0 text-primary" />
                <span>{openingHours}</span>
              </div>
            ) : null}

            {delivery ? (
              <div className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-muted/60 px-3 py-1.5 text-foreground">
                <Truck className="h-4 w-4 shrink-0 text-primary" />
                <span>{delivery}</span>
              </div>
            ) : null}

            {email ? (
              <a
                href={`mailto:${email}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-muted/60 px-3 py-1.5 text-foreground transition-colors hover:bg-surface-muted hover:text-primary"
              >
                <Mail className="h-4 w-4 shrink-0 text-primary" />
                <span>{email}</span>
              </a>
            ) : null}

            {website ? (
              <a
                href={website.startsWith("http") ? website : `https://${website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-muted/60 px-3 py-1.5 text-foreground transition-colors hover:bg-surface-muted hover:text-primary"
              >
                <Globe className="h-4 w-4 shrink-0 text-primary" />
                <span>
                  {website.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
                </span>
                <ExternalLink className="h-3 w-3 shrink-0 opacity-60" />
              </a>
            ) : null}

            <div className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-muted/60 px-3 py-1.5">
              <Package className="h-4 w-4 shrink-0" />
              <span>{t("marketplace.productCount", { count: products.length })}</span>
            </div>

            {/* Social Links */}
            {socialLinks.map((social) => (
              <a
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-muted/60 px-3 py-1.5 text-foreground transition-colors hover:bg-surface-muted hover:text-primary"
              >
                <span>{social.name}</span>
                <ExternalLink className="h-3 w-3 shrink-0 opacity-60" />
              </a>
            ))}
          </div>
        </div>
      </Card>

      {/* Additional Details Section (All Custom Fields) */}
      {customDetails.length > 0 ? (
        <Card className="p-5 sm:p-6 shadow-sm">
          <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
            <Tag className="h-4 w-4 text-primary" />
            <span>{t("common.details")}</span>
          </h2>
          <dl className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {customDetails.map(([key, value]) => (
              <div
                key={key}
                className="flex flex-col justify-center rounded-lg border border-border bg-surface-muted/40 p-3"
              >
                <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {formatDetailLabel(key)}
                </dt>
                <dd className="mt-1 text-sm font-medium text-foreground wrap-break-word">
                  {renderDetailValue(value)}
                </dd>
              </div>
            ))}
          </dl>
        </Card>
      ) : null}

      {/* Photo Gallery (Attachments) */}
      {imageAttachments.length > 0 ? (
        <Card className="p-5 sm:p-6 shadow-sm">
          <h2 className="text-base font-semibold text-foreground mb-4">
            Photos ({imageAttachments.length})
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {imageAttachments.map((attachment) => (
              <a
                key={String(attachment._id)}
                href={attachment.url}
                target="_blank"
                rel="noreferrer"
                className="group relative aspect-4/3 overflow-hidden rounded-xl border border-border bg-surface-muted"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={attachment.url}
                  alt={attachment.alt || business.name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </a>
            ))}
          </div>
        </Card>
      ) : null}

      {/* File Attachments / Documents */}
      {fileAttachments.length > 0 ? (
        <Card className="p-5 sm:p-6 shadow-sm">
          <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <span>Documents & Menus</span>
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {fileAttachments.map((file) => (
              <a
                key={String(file._id)}
                href={file.url}
                download
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface p-3 transition-colors hover:bg-surface-muted hover:border-primary-border"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText className="h-5 w-5 shrink-0 text-primary" />
                  <span className="truncate text-sm font-medium text-foreground">
                    {file.alt || file.url.split("/").pop()}
                  </span>
                </div>
                <Download className="h-4 w-4 shrink-0 text-muted-foreground" />
              </a>
            ))}
          </div>
        </Card>
      ) : null}

      {/* Menu / Products Section */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              {t("businessPublic.menu")}
            </h2>
            <span className="text-sm font-medium text-muted-foreground">
              ({products.length})
            </span>
          </div>

          {/* Interactive Category Filter Tabs */}
          {categories.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              <Link
                href={`/store/${business.slug}`}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  !selectedCategory
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "border border-border bg-surface text-muted-foreground hover:bg-surface-muted hover:text-foreground"
                }`}
              >
                {t("common.all")} ({products.length})
              </Link>
              {categories.map((cat) => {
                const count = products.filter((p) => p.category === cat).length;
                const isSelected = selectedCategory === cat;
                return (
                  <Link
                    key={cat}
                    href={
                      isSelected
                        ? `/store/${business.slug}`
                        : `/store/${business.slug}?category=${encodeURIComponent(cat)}`
                    }
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "border border-border bg-surface text-muted-foreground hover:bg-surface-muted hover:text-foreground"
                    }`}
                  >
                    {cat} ({count})
                  </Link>
                );
              })}
            </div>
          ) : null}
        </div>

        {/* Product Cards */}
        {filteredProducts.length === 0 ? (
          <EmptyState
            icon={<ImageOff className="h-8 w-8" />}
            title={
              selectedCategory
                ? `No products found in "${selectedCategory}"`
                : t("businessPublic.noProducts")
            }
            description={
              selectedCategory
                ? "Try selecting another category or view all products."
                : t("businessPublic.noProductsHint")
            }
            action={
              selectedCategory ? (
                <Link
                  href={`/store/${business.slug}`}
                  className="inline-flex h-9 items-center rounded-lg border border-border px-3 text-xs font-medium text-foreground hover:bg-surface-muted"
                >
                  View all products
                </Link>
              ) : undefined
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {filteredProducts.map((product) => (
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

      {/* Footer Share Action */}
      <div className="flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{t("businessPublic.backToMarketplace")}</span>
        </Link>

        <ShareBusinessButton
          businessName={business.name}
          description={description}
          label="Share this business"
          copiedLabel="Link copied!"
          variant="secondary"
        />
      </div>
    </div>
  );
}