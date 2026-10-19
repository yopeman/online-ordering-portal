import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  ExternalLink,
  Globe,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  ShieldCheck,
  ShoppingBag,
  Store,
  Tag,
  Truck,
  XCircle,
} from "lucide-react";

import {
  OrderForm,
  type OrderFormFieldDTO,
} from "@/components/business/order-form";
import { ProductCard } from "@/components/business/product-card";
import { ProductGallery } from "@/components/business/product-gallery";
import { ShareBusinessButton } from "@/components/business/share-business-button";
import { StoreAttachments } from "@/components/business/store-attachments";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/session";
import { connectDB } from "@/lib/db";
import {
  Business,
  Catalog,
  DEFAULT_ORDER_FORM_FIELDS,
  getContactDisplayLabel,
  getContactHref,
  readCatalogDetails,
  readContacts,
  readDetails,
  readOrderFormTemplates,
  type BusinessContact,
} from "@/lib/models";
import { getFormatters, getTranslator } from "@/lib/i18n-server";
import {
  getProductBySlug,
  listAttachments,
  listProductsForBusiness,
} from "@/lib/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  const title = product?.businessName
    ? `${product.name} · ${product.businessName}`
    : product?.name ?? "Product";
  return {
    title,
    description: product?.description || "Product details on Yope Order",
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
    return value.map(String).join(", ");
  }
  if (typeof value === "object" && value !== null) {
    return JSON.stringify(value);
  }
  const str = String(value);
  if (/^https?:\/\//i.test(str)) {
    return (
      <a
        href={str}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 text-primary hover:underline break-all"
      >
        <span>{str.replace(/^https?:\/\/(www\.)?/, "")}</span>
        <ExternalLink className="h-3 w-3 shrink-0" />
      </a>
    );
  }
  return str;
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const t = await getTranslator();
  const { locale, price: formatPriceAmount } = await getFormatters();
  const imageAltLabel = t("product.imageOf");

  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const currentUser = await getCurrentUser();

  await connectDB();
  const [raw, business] = await Promise.all([
    Catalog.findOne({ slug }).lean(),
    Business.findById(product.businessId).lean(),
  ]);

  if (!business) notFound();

  const businessId = business._id.toString();
  const isOwner =
    currentUser &&
    (currentUser.id === business.owner?.toString() || currentUser.role === "admin");

  const businessIsActive =
    (business.status ? business.status === "visible" : true) &&
    business.isActive !== false;

  if (!businessIsActive && !isOwner) {
    notFound();
  }

  const details = readCatalogDetails(raw?.details);
  const businessDetails = readDetails(business.details);

  // Business order form templates & contact channels drive the order form
  const contactPhones: BusinessContact[] = readContacts(business.contactPhones);
  const templates = readOrderFormTemplates(business.orderFormTemplates);

  const fields: OrderFormFieldDTO[] = (
    templates.length > 0 ? templates : DEFAULT_ORDER_FORM_FIELDS
  ).map((field) => ({
    key: field.key,
    label: field.label,
    type: field.type,
    required: Boolean(field.required),
    placeholder: field.placeholder ?? "",
    options: field.options ?? [],
  }));

  // Fetch product attachments (images and document files)
  const attachments = await listAttachments("catalog", product.id);

  // Collect and deduplicate all product images
  const rawImageUrls: string[] = [];
  if (product.image) rawImageUrls.push(product.image);
  if (Array.isArray(details.images)) {
    for (const img of details.images) {
      if (typeof img === "string" && img.trim()) rawImageUrls.push(img.trim());
    }
  }
  for (const att of attachments) {
    if (att.kind === "image" && att.url) {
      rawImageUrls.push(att.url);
    }
  }
  const uniqueImageUrls = Array.from(new Set(rawImageUrls));
  const galleryImages = uniqueImageUrls.map((url) => ({
    url,
    alt: product.name,
  }));

  // Serialized attachments for product files and documents preview & modal
  const serializedAttachments = attachments.map((a) => ({
    id: String(a._id),
    url: a.url,
    alt: a.alt || (a.url.startsWith("data:") ? "Attachment" : a.url.split("/").pop() || "Attachment"),
    kind: a.kind as "image" | "file" | "link",
    order: a.order,
  }));

  // Pricing calculations
  const price = product.price;
  const currency = product.currency || "ETB";
  const comparePrice =
    typeof details.comparePrice === "number" && details.comparePrice > price
      ? details.comparePrice
      : undefined;
  const discountPercent = comparePrice
    ? Math.round(((comparePrice - price) / comparePrice) * 100)
    : 0;

  // Stock & availability
  const inStock = details.inStock !== false && details.available !== false;
  const inventory =
    typeof details.inventory === "number" ? details.inventory : undefined;
  const sku = typeof details.sku === "string" ? details.sku.trim() : "";
  const badges: string[] = Array.isArray(details.badges)
    ? details.badges.map(String).filter(Boolean)
    : [];

  // Description & specifics
  const shortDescription = product.description || String(details.description ?? "");
  const longDescription =
    typeof details.longDescription === "string"
      ? details.longDescription.trim()
      : "";
  const ingredients = details.ingredients
    ? Array.isArray(details.ingredients)
      ? details.ingredients.map(String)
      : [String(details.ingredients)]
    : [];
  const preparationTime =
    typeof details.preparationTime === "string"
      ? details.preparationTime.trim()
      : "";

  // Extra product custom details
  const handledProductKeys = new Set([
    "description",
    "longDescription",
    "price",
    "comparePrice",
    "currency",
    "inStock",
    "available",
    "inventory",
    "sku",
    "badges",
    "images",
    "ingredients",
    "preparationTime",
  ]);

  const extraProductDetails = Object.entries(details).filter(
    ([key, value]) =>
      !handledProductKeys.has(key) &&
      value !== undefined &&
      value !== null &&
      value !== "" &&
      typeof value !== "function",
  );

  // Business Details (NO DOCUMENT)
  const businessLogo =
    typeof businessDetails.logoUrl === "string" ? businessDetails.logoUrl : "";
  const businessCover =
    business.image ||
    (typeof businessDetails.coverUrl === "string" ? businessDetails.coverUrl : "") ||
    (typeof businessDetails.image === "string" ? businessDetails.image : "");
  const businessCategory = String(businessDetails.category ?? "");
  const businessDescription = String(businessDetails.description ?? "");

  // Business Location handling
  const rawLocation =
    typeof businessDetails.location === "string" ? businessDetails.location.trim() : "";
  const isMapUrl = /^https?:\/\//i.test(rawLocation);
  const addressText =
    typeof businessDetails.address === "string" ? businessDetails.address.trim() : "";
  const cityText =
    typeof businessDetails.city === "string" ? businessDetails.city.trim() : "";
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

  // Schedule & Fulfillment
  const openingHours =
    typeof businessDetails.openingHours === "string"
      ? businessDetails.openingHours.trim()
      : typeof businessDetails.hours === "string"
        ? businessDetails.hours.trim()
        : "";
  const email = typeof businessDetails.email === "string" ? businessDetails.email.trim() : "";
  const website = typeof businessDetails.website === "string" ? businessDetails.website.trim() : "";
  const delivery =
    businessDetails.delivery !== undefined && businessDetails.delivery !== null
      ? typeof businessDetails.delivery === "boolean"
        ? businessDetails.delivery
          ? "Delivery available"
          : "Pickup only"
        : String(businessDetails.delivery)
      : "";
  const businessTags: string[] = Array.isArray(businessDetails.tags)
    ? businessDetails.tags.map(String).filter(Boolean)
    : typeof businessDetails.tags === "string"
      ? businessDetails.tags.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

  // Social Links
  const socialObj =
    typeof businessDetails.social === "object" && businessDetails.social !== null
      ? (businessDetails.social as Record<string, unknown>)
      : {};
  const telegram = String(businessDetails.telegram || socialObj.telegram || "");
  const instagram = String(businessDetails.instagram || socialObj.instagram || "");
  const facebook = String(businessDetails.facebook || socialObj.facebook || "");
  const tiktok = String(businessDetails.tiktok || socialObj.tiktok || "");
  const twitter = String(businessDetails.twitter || socialObj.twitter || businessDetails.x || socialObj.x || "");

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

  // Custom Extra Business Details (excluding handled keys and NO documents)
  const handledBusinessKeys = new Set([
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

  const extraBusinessDetails = Object.entries(businessDetails).filter(
    ([key, value]) =>
      !handledBusinessKeys.has(key) &&
      value !== undefined &&
      value !== null &&
      value !== "" &&
      typeof value !== "function",
  );

  // Other products from this store for cross-selling
  const moreStoreProducts = await listProductsForBusiness(product.businessId);
  const otherProducts = moreStoreProducts
    .filter((p) => p.id !== product.id)
    .slice(0, 4);

  return (
    <div className="container-page space-y-8 py-6 sm:py-8">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Link
            href="/marketplace"
            className="transition-colors hover:text-foreground"
          >
            {t("marketplace.title")}
          </Link>
          <span>/</span>
          <Link
            href={`/store/${business.slug}`}
            className="flex items-center gap-1 font-medium transition-colors hover:text-foreground"
          >
            <Store className="h-3.5 w-3.5" />
            <span>{business.name}</span>
          </Link>
          <span>/</span>
          <span className="truncate max-w-50 sm:max-w-xs text-foreground font-medium">
            {product.name}
          </span>
        </div>

        <div className="flex items-center justify-end gap-2">
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
            businessName={`${product.name} · ${business.name}`}
            description={shortDescription || product.name}
            label={t("common.share")}
            copiedLabel={t("common.copied")}
            size="sm"
          />
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* Left Column: Product Gallery + All Product Details + Business Details */}
        <div className="space-y-8 min-w-0">
          {/* 1. Main Product Overview Card */}
          <Card className="p-5 sm:p-6 shadow-sm space-y-6">
            {/* Interactive Image Gallery */}
            <ProductGallery
              images={galleryImages}
              productName={product.name}
            />

            {/* Badges & Category Header */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                {product.category ? (
                  <Badge tone="primary">{product.category}</Badge>
                ) : null}

                {inStock ? (
                  <Badge tone="success" className="gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>In Stock</span>
                  </Badge>
                ) : (
                  <Badge tone="warning" className="gap-1">
                    <XCircle className="h-3 w-3" />
                    <span>Out of Stock</span>
                  </Badge>
                )}

                {badges.map((b) => (
                  <Badge key={b} tone="neutral">
                    {b}
                  </Badge>
                ))}
              </div>

              {/* Product Title */}
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {product.name}
              </h1>

              {/* Price and Savings Section */}
              <div className="flex flex-wrap items-baseline gap-3 pt-1">
                <span className="text-3xl font-extrabold tracking-tight text-primary">
                  {formatPriceAmount(price, currency)}
                </span>

                {comparePrice ? (
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-medium text-muted-foreground line-through">
                      {formatPriceAmount(comparePrice, currency)}
                    </span>
                    <Badge tone="success" className="text-xs font-semibold">
                      Save {discountPercent}%
                    </Badge>
                  </div>
                ) : null}
              </div>

              {/* Stock count & SKU */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
                {inventory !== undefined ? (
                  <span>
                    <strong className="text-foreground">{inventory}</strong> items available
                  </span>
                ) : null}

                {sku ? (
                  <span>
                    SKU: <code className="font-mono text-foreground">{sku}</code>
                  </span>
                ) : null}
              </div>

              {/* Short Description */}
              {shortDescription ? (
                <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground pt-2">
                  {shortDescription}
                </p>
              ) : null}
            </div>
          </Card>

          {/* 2. All Product Details & Specifications */}
          <Card className="p-5 sm:p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <Tag className="h-4 w-4 text-primary" />
              <h2 className="text-base font-semibold text-foreground">
                {t("product.detailsTitle")} & Specifications
              </h2>
            </div>

            <div className="space-y-4">
              {/* Long / Detailed Description if available */}
              {longDescription && longDescription !== shortDescription ? (
                <div className="space-y-1.5">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Description
                  </h3>
                  <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">
                    {longDescription}
                  </p>
                </div>
              ) : null}

              {/* Ingredients / Materials / Contents */}
              {ingredients.length > 0 ? (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Ingredients & Materials
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {ingredients.map((item, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center rounded-lg border border-border bg-surface-muted/60 px-2.5 py-1 text-xs font-medium text-foreground"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Preparation / Delivery Time */}
              {preparationTime ? (
                <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-muted/40 p-3 text-sm">
                  <Clock className="h-4 w-4 shrink-0 text-primary" />
                  <span className="text-muted-foreground">Preparation / Lead time:</span>
                  <span className="font-medium text-foreground">{preparationTime}</span>
                </div>
              ) : null}

              {/* Extra Product Custom Key-Value Details */}
              {extraProductDetails.length > 0 ? (
                <div className="space-y-2 pt-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Additional Specifications
                  </h3>
                  <dl className="grid gap-3 sm:grid-cols-2">
                    {extraProductDetails.map(([key, value]) => (
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
                </div>
              ) : null}
            </div>
          </Card>

          {/* 3. Product Documents & Files (if any attached) */}
          <StoreAttachments
            businessName={product.name}
            title={`Documents & Specifications · ${product.name}`}
            filesTitle="Documents & Specifications"
            attachments={serializedAttachments}
            showPhotos={false}
            maxFilesPreview={4}
          />

          {/* 4. Business Detail Card (NO DOCUMENT) */}
          <Card className="overflow-hidden p-0 shadow-sm border border-border">
            <div className="p-5 sm:p-6 space-y-6">
              {/* Business Header with Avatar/Logo & Visit Store button */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-bold text-foreground sm:text-xl">
                        {business.name}
                      </h2>
                      {businessIsActive ? (
                        <Badge tone="success" className="gap-1">
                          <ShieldCheck className="h-3 w-3" />
                          <span>Verified Store</span>
                        </Badge>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {businessCategory ? (
                        <Badge tone="neutral">{businessCategory}</Badge>
                      ) : null}
                      <span>/{business.slug}</span>
                    </div>
                  </div>
                </div>

                <Link href={`/store/${business.slug}`}>
                  <Button variant="secondary" className="gap-1.5 shadow-xs">
                    <Store className="h-4 w-4 text-primary" />
                    <span>Visit Storefront</span>
                  </Button>
                </Link>
              </div>

              {/* Business Description */}
              {businessDescription ? (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {businessDescription}
                </p>
              ) : null}

              {/* Quick Info Grid (Location, Hours, Delivery, Contacts) */}
              <div className="grid gap-3 sm:grid-cols-2 text-sm">
                {/* Location / Address */}
                {displayLocation ? (
                  <div className="flex items-start gap-2.5 rounded-lg border border-border bg-surface-muted/40 p-3">
                    <MapPin className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                    <div className="min-w-0 space-y-0.5">
                      <p className="text-xs font-semibold text-muted-foreground">Location</p>
                      <p className="text-foreground">{displayLocation}</p>
                      {mapUrl ? (
                        <a
                          href={mapUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <span>Open in Maps</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                {/* Opening Hours */}
                {openingHours ? (
                  <div className="flex items-start gap-2.5 rounded-lg border border-border bg-surface-muted/40 p-3">
                    <Clock className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                    <div className="min-w-0 space-y-0.5">
                      <p className="text-xs font-semibold text-muted-foreground">Opening Hours</p>
                      <p className="text-foreground">{openingHours}</p>
                    </div>
                  </div>
                ) : null}

                {/* Delivery Options */}
                {delivery ? (
                  <div className="flex items-start gap-2.5 rounded-lg border border-border bg-surface-muted/40 p-3">
                    <Truck className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                    <div className="min-w-0 space-y-0.5">
                      <p className="text-xs font-semibold text-muted-foreground">Fulfillment</p>
                      <p className="text-foreground">{delivery}</p>
                    </div>
                  </div>
                ) : null}

                {/* Contact Channels */}
                {contactPhones.length > 0 ? (
                  <div className="flex items-start gap-2.5 rounded-lg border border-border bg-surface-muted/40 p-3">
                    <Phone className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                    <div className="min-w-0 space-y-1.5">
                      <p className="text-xs font-semibold text-muted-foreground">Contacts</p>
                      <div className="flex flex-wrap gap-2">
                        {contactPhones.map((contact, idx) => {
                          const href = getContactHref(contact);
                          const isExternal = contact.type === "telegram" || contact.type === "wa";
                          return (
                            <a
                              key={`${contact.type}-${contact.target}-${idx}`}
                              href={href}
                              target={isExternal ? "_blank" : undefined}
                              rel={isExternal ? "noopener noreferrer" : undefined}
                              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-surface-muted hover:border-primary-border"
                            >
                              {contact.type === "telegram" ? (
                                <Send className="h-3.5 w-3.5 text-sky-500" />
                              ) : contact.type === "wa" ? (
                                <MessageCircle className="h-3.5 w-3.5 text-emerald-500" />
                              ) : contact.type === "email" ? (
                                <Mail className="h-3.5 w-3.5 text-amber-500" />
                              ) : (
                                <Phone className="h-3.5 w-3.5 text-primary" />
                              )}
                              <span>{getContactDisplayLabel(contact)}</span>
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* Email Contact */}
                {email ? (
                  <div className="flex items-start gap-2.5 rounded-lg border border-border bg-surface-muted/40 p-3">
                    <Mail className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                    <div className="min-w-0 space-y-0.5">
                      <p className="text-xs font-semibold text-muted-foreground">Email</p>
                      <a
                        href={`mailto:${email}`}
                        className="truncate block text-primary hover:underline"
                      >
                        {email}
                      </a>
                    </div>
                  </div>
                ) : null}

                {/* Website */}
                {website ? (
                  <div className="flex items-start gap-2.5 rounded-lg border border-border bg-surface-muted/40 p-3">
                    <Globe className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                    <div className="min-w-0 space-y-0.5">
                      <p className="text-xs font-semibold text-muted-foreground">Website</p>
                      <a
                        href={website.startsWith("http") ? website : `https://${website}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline truncate"
                      >
                        <span className="truncate">{website.replace(/^https?:\/\//i, "")}</span>
                        <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Business Tags */}
              {businessTags.length > 0 ? (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {businessTags.map((tag) => (
                    <Badge key={tag} tone="neutral" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              ) : null}

              {/* Social Channels */}
              {socialLinks.length > 0 ? (
                <div className="space-y-2 border-t border-border pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Connect with {business.name}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {socialLinks.map((social) => (
                      <a
                        key={social.name}
                        href={social.href}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary-border hover:bg-surface-muted"
                      >
                        <span>{social.name}</span>
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </Card>
        </div>

        {/* Right Column: Sticky Order Form & Store Actions */}
        <aside className="space-y-6 lg:sticky lg:top-24 lg:h-fit">
          {/* Order Now Card */}
          <Card className="p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-primary" />
                <h2 className="font-semibold text-foreground">
                  {t("product.orderNow")}
                </h2>
              </div>
              <span className="font-bold text-primary">
                {formatPriceAmount(price, currency)}
              </span>
            </div>

            <OrderForm
              slug={product.slug}
              fields={fields}
              contactPhones={contactPhones}
              price={product.price}
              currency={product.currency}
            />
          </Card>
        </aside>
      </div>

      {/* Bottom Section: More Products from This Store */}
      {otherProducts.length > 0 ? (
        <section className="space-y-4 pt-4 border-t border-border">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                More from {business.name}
              </h2>
              <p className="text-xs text-muted-foreground">
                Discover other items available at this store
              </p>
            </div>

            <Link href={`/store/${business.slug}`}>
              <Button variant="ghost" size="sm" className="gap-1 text-primary">
                <span>View all ({moreStoreProducts.length})</span>
                <ArrowLeft className="h-3.5 w-3.5 rotate-180" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
            {otherProducts.map((p) => (
              <ProductCard key={p.id} product={p} locale={"en"} altLabel={""} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}