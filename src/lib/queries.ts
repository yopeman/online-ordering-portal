import "server-only";

import type { QueryFilter } from "mongoose";
import { Types } from "mongoose";

import { connectDB } from "@/lib/db";
import {
  Activity,
  Attachment,
  Business,
  Catalog,
  Order,
  readCatalogDetails,
  readDetails,
} from "@/lib/models";
import type {
  ActivityDoc,
  AttachmentDoc,
  BusinessDoc,
  CatalogDoc,
  OrderDoc,
} from "@/lib/models";

/* -------------------------------------------------------------------------- */
/* Businesses                                                                  */
/* -------------------------------------------------------------------------- */

export interface BusinessListItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  location: string;
  image: string;
  contactPhones: string[];
  status: "visible" | "hide";
  isActive: boolean;
  productCount: number;
  ownerId: string;
  ownerName: string;
  createdAt: Date;
}

/** Public listing: active businesses with their product counts. */
export async function listBusinesses(options: {
  search?: string;
  category?: string;
  page?: number;
  perPage?: number;
} = {}): Promise<{ items: BusinessListItem[]; total: number; page: number; totalPages: number }> {
  await connectDB();
  const page = Math.max(1, options.page ?? 1);
  const perPage = Math.min(48, Math.max(1, options.perPage ?? 12));

  const filter: QueryFilter<BusinessDoc> = {
    status: { $ne: "hide" },
    isActive: { $ne: false },
  };

  if (options.search) {
    const escaped = options.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { name: { $regex: escaped, $options: "i" } },
      { slug: { $regex: escaped, $options: "i" } },
      { "details.description": { $regex: escaped, $options: "i" } },
    ];
  }

  if (options.category) filter["details.category"] = options.category;

  const [items, total] = await Promise.all([
    Business.aggregate<{ _id: Types.ObjectId; productCount: number }>([
      { $match: filter },
      {
        $lookup: {
          from: "catalogs",
          let: { businessId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$business", "$$businessId"] },
                isActive: true,
              },
            },
            { $count: "count" },
          ],
          as: "catalogs",
        },
      },
      {
        $addFields: {
          productCount: { $ifNull: [{ $first: "$catalogs.count" }, 0] },
        },
      },
      { $sort: { createdAt: -1 } },
      { $skip: (page - 1) * perPage },
      { $limit: perPage },
    ]),
    Business.countDocuments(filter),
  ]);

  const businesses = await Business.find({ _id: { $in: items.map((item) => item._id) } })
    .populate("owner", "name")
    .lean();

  const byId = new Map(
    businesses.map((business) => [business._id.toString(), business]),
  );

  return {
    items: items
      .map((item) => {
        const business = byId.get(item._id.toString());
        if (!business) return null;
        return toBusinessListItem(business, item.productCount);
      })
      .filter((item): item is BusinessListItem => item !== null),
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  };
}

export function toBusinessListItem(
  business: BusinessDoc & { owner?: { name?: string } },
  productCount = 0,
): BusinessListItem {
  const details = readDetails(business.details);
  const status: "visible" | "hide" =
    (business.status as "visible" | "hide") ||
    (business.isActive !== false ? "visible" : "hide");
  return {
    id: business._id.toString(),
    name: business.name,
    slug: business.slug,
    description: String(details.description ?? ""),
    category: String(details.category ?? ""),
    location: String(details.location ?? ""),
    image: business.image ?? "",
    contactPhones: business.contactPhones ?? [],
    status,
    isActive: status === "visible" && business.isActive !== false,
    productCount,
    ownerId:
      typeof business.owner === "object" && business.owner && "_id" in business.owner
        ? String((business.owner as { _id: { toString(): string } })._id)
        : String(business.owner ?? ""),
    ownerName:
      typeof business.owner === "object" && business.owner && "name" in business.owner
        ? String((business.owner as { name?: string }).name ?? "")
        : "",
    createdAt: business.createdAt ?? new Date(0),
  };
}

export async function countBusinesses(ownerId: string): Promise<number> {
  await connectDB();
  return Business.countDocuments({ owner: ownerId });
}

/** Businesses owned by a user, with product/order counters. */
export async function listBusinessesForOwner(
  ownerId: string,
): Promise<
  (BusinessListItem & {
    productCount: number;
    unreadOrders: number;
    unreadActivities: number;
  })[]
> {
  await connectDB();

  const businesses = await Business.find({ owner: ownerId }).sort({ createdAt: -1 }).lean();
  if (businesses.length === 0) return [];

  const ids = businesses.map((business) => business._id);

  const [catalogCounts, orderCounts, activityCounts] = await Promise.all([
    Catalog.aggregate<{ _id: Types.ObjectId; count: number }>([
      { $match: { business: { $in: ids } } },
      { $group: { _id: "$business", count: { $sum: 1 } } },
    ]),
    Order.aggregate<{ _id: Types.ObjectId; count: number }>([
      { $match: { business: { $in: ids }, isRead: false } },
      { $group: { _id: "$business", count: { $sum: 1 } } },
    ]),
    Activity.aggregate<{ _id: Types.ObjectId; count: number }>([
      { $match: { business: { $in: ids }, isRead: false } },
      { $group: { _id: "$business", count: { $sum: 1 } } },
    ]),
  ]);

  const asMap = (rows: { _id: Types.ObjectId; count: number }[]) =>
    new Map(rows.map((row) => [row._id.toString(), row.count]));

  const products = asMap(catalogCounts);
  const orders = asMap(orderCounts);
  const activities = asMap(activityCounts);

  return businesses.map((business) => ({
    ...toBusinessListItem(business),
    productCount: products.get(business._id.toString()) ?? 0,
    unreadOrders: orders.get(business._id.toString()) ?? 0,
    unreadActivities: activities.get(business._id.toString()) ?? 0,
  }));
}

/** Fetches a business by id, scoped to the owner when provided. */
export async function getBusinessForOwner(
  businessId: string,
  ownerId: string,
): Promise<BusinessDoc | null> {
  await connectDB();
  const business = await Business.findOne({ _id: businessId, owner: ownerId }).lean();
  return (business as BusinessDoc | null) ?? null;
}

/** Fetches any business (admin scope). */
export async function getBusinessById(
  businessId: string,
): Promise<BusinessDoc | null> {
  await connectDB();
  const business = await Business.findById(businessId).lean();
  return (business as BusinessDoc | null) ?? null;
}

export async function getBusinessBySlug(
  slug: string,
  includeInactive = false,
): Promise<BusinessDoc | null> {
  await connectDB();
  const filter = includeInactive
    ? { slug }
    : { slug, status: { $ne: "hide" }, isActive: { $ne: false } };
  const business = await Business.findOne(filter).lean();
  return (business as BusinessDoc | null) ?? null;
}

export async function listBusinessCategories(): Promise<string[]> {
  await connectDB();
  const rows = await Business.aggregate<{ _id: string }>([
    { $match: { status: { $ne: "hide" }, isActive: { $ne: false } } },
    { $project: { category: "$details.category" } },
    { $match: { category: { $type: "string", $ne: "" } } },
    { $group: { _id: "$category" } },
    { $sort: { _id: 1 } },
  ]);
  return rows.map((row) => row._id).filter(Boolean);
}

/* -------------------------------------------------------------------------- */
/* Catalog                                                                     */
/* -------------------------------------------------------------------------- */

export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  price: number;
  currency: string;
  image: string;
  isActive: boolean;
  businessId: string;
  businessName: string;
  businessSlug: string;
  createdAt: Date;
}

export function toProductListItem(
  catalog: CatalogDoc & { business?: { name?: string; slug?: string } },
): ProductListItem {
  const details = readCatalogDetails(catalog.details);
  const business =
    typeof catalog.business === "object" && catalog.business && "name" in catalog.business
      ? (catalog.business as { name?: string; slug?: string })
      : undefined;

  return {
    id: catalog._id.toString(),
    name: catalog.name,
    slug: catalog.slug,
    category: catalog.category ?? "",
    description: String(details.description ?? ""),
    price: catalog.price ?? 0,
    currency: catalog.currency ?? "ETB",
    image: catalog.image ?? "",
    isActive: catalog.isActive ?? true,
    businessId:
      typeof catalog.business === "object" && catalog.business && "_id" in catalog.business
        ? String((catalog.business as { _id: { toString(): string } })._id)
        : String(catalog.business ?? ""),
    businessName: business?.name ?? "",
    businessSlug: business?.slug ?? "",
    createdAt: catalog.createdAt ?? new Date(0),
  };
}

export async function listProducts(options: {
  businessId?: string;
  search?: string;
  category?: string;
  includeInactive?: boolean;
  page?: number;
  perPage?: number;
}): Promise<{ items: ProductListItem[]; total: number; page: number; totalPages: number }> {
  await connectDB();
  const page = Math.max(1, options.page ?? 1);
  const perPage = Math.min(60, Math.max(1, options.perPage ?? 24));

  const filter: QueryFilter<CatalogDoc> = {};
  if (options.businessId) {
    filter.business = options.businessId;
  } else if (!options.includeInactive) {
    const visibleBusinesses = await Business.find(
      { status: { $ne: "hide" }, isActive: { $ne: false } },
      { _id: 1 },
    ).lean();
    filter.business = { $in: visibleBusinesses.map((b) => b._id) };
  }
  if (!options.includeInactive) filter.isActive = true;
  if (options.category) filter.category = options.category;

  if (options.search) {
    const escaped = options.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { name: { $regex: escaped, $options: "i" } },
      { category: { $regex: escaped, $options: "i" } },
      { "details.description": { $regex: escaped, $options: "i" } },
    ];
  }

  const [catalogs, total] = await Promise.all([
    Catalog.find(filter)
      .populate("business", "name slug")
      .sort({ createdAt: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage)
      .lean(),
    Catalog.countDocuments(filter),
  ]);

  return {
    items: (catalogs as (CatalogDoc & { business?: { name?: string; slug?: string } })[]).map(
      toProductListItem,
    ),
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  };
}

export async function listProductsForBusiness(
  businessId: string,
  options: { includeInactive?: boolean; category?: string } = {},
): Promise<ProductListItem[]> {
  const result = await listProducts({
    businessId,
    includeInactive: options.includeInactive,
    category: options.category,
    perPage: 60,
  });
  return result.items;
}

export async function getProductBySlug(slug: string): Promise<ProductListItem | null> {
  await connectDB();
  const catalog = await Catalog.findOne({ slug, isActive: true })
    .populate("business", "name slug details orderFormTemplates contactPhones")
    .lean();
  if (!catalog) return null;
  return toProductListItem(
    catalog as CatalogDoc & { business?: { name?: string; slug?: string } },
  );
}

export async function getProductForOwner(
  productId: string,
  businessId: string,
): Promise<CatalogDoc | null> {
  await connectDB();
  const catalog = await Catalog.findOne({ _id: productId, business: businessId }).lean();
  return (catalog as CatalogDoc | null) ?? null;
}

export async function countProducts(businessId: string): Promise<number> {
  await connectDB();
  return Catalog.countDocuments({ business: businessId });
}

export async function listProductCategories(businessId: string): Promise<string[]> {
  await connectDB();
  const matchBusiness = Types.ObjectId.isValid(businessId)
    ? { $in: [businessId, new Types.ObjectId(businessId)] }
    : businessId;
  const rows = await Catalog.aggregate<{ _id: string }>([
    { $match: { business: matchBusiness, category: { $type: "string", $ne: "" } } },
    { $group: { _id: "$category" } },
    { $sort: { _id: 1 } },
  ]);
  return rows.map((row) => row._id).filter(Boolean);
}

/* -------------------------------------------------------------------------- */
/* Orders                                                                      */
/* -------------------------------------------------------------------------- */

export interface OrderListItem {
  id: string;
  isRead: boolean;
  details: Record<string, unknown>;
  productId: string;
  productName: string;
  productSlug: string;
  productPrice: number;
  productCurrency: string;
  businessId: string;
  businessName: string;
  createdAt: Date;
}

export async function listOrders(options: {
  businessId?: string;
  filter?: "all" | "read" | "unread";
  page?: number;
  perPage?: number;
}): Promise<{ items: OrderListItem[]; total: number; page: number; totalPages: number }> {
  await connectDB();
  const page = Math.max(1, options.page ?? 1);
  const perPage = Math.min(50, Math.max(1, options.perPage ?? 20));

  const filter: QueryFilter<OrderDoc> = {};
  if (options.businessId) filter.business = options.businessId;
  if (options.filter === "read") filter.isRead = true;
  if (options.filter === "unread") filter.isRead = false;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate("product", "name slug price currency")
      .populate("business", "name")
      .sort({ createdAt: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage)
      .lean(),
    Order.countDocuments(filter),
  ]);

  return {
    items: (orders as (OrderDoc & {
      product?: { name?: string; slug?: string; price?: number; currency?: string };
      business?: { name?: string };
    })[]).map((order) => ({
      id: order._id.toString(),
      isRead: order.isRead,
      details:
        order.details && typeof order.details === "object"
          ? (order.details as Record<string, unknown>)
          : {},
      productId:
        typeof order.product === "object" && order.product && "_id" in order.product
          ? String((order.product as { _id: { toString(): string } })._id)
          : String(order.product ?? ""),
      productName:
        typeof order.product === "object" && order.product?.name
          ? order.product.name
          : "",
      productSlug:
        typeof order.product === "object" && order.product?.slug
          ? order.product.slug
          : "",
      productPrice:
        typeof order.product === "object" ? (order.product?.price ?? 0) : 0,
      productCurrency:
        typeof order.product === "object" ? (order.product?.currency ?? "ETB") : "ETB",
      businessId:
        typeof order.business === "object" && order.business && "_id" in order.business
          ? String((order.business as { _id: { toString(): string } })._id)
          : String(order.business ?? ""),
      businessName:
        typeof order.business === "object" ? (order.business?.name ?? "") : "",
      createdAt: order.createdAt ?? new Date(0),
    })),
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  };
}

/* -------------------------------------------------------------------------- */
/* Activity                                                                    */
/* -------------------------------------------------------------------------- */

export interface ActivityListItem {
  id: string;
  action: string;
  detail: string;
  isRead: boolean;
  createdAt: Date;
  actorName: string;
}

export async function listActivities(options: {
  businessId: string;
  page?: number;
  perPage?: number;
}): Promise<{ items: ActivityListItem[]; total: number; page: number; totalPages: number }> {
  await connectDB();
  const page = Math.max(1, options.page ?? 1);
  const perPage = Math.min(50, Math.max(1, options.perPage ?? 20));

  const [activities, total] = await Promise.all([
    Activity.find({ business: options.businessId })
      .populate("actor", "name")
      .sort({ createdAt: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage)
      .lean(),
    Activity.countDocuments({ business: options.businessId }),
  ]);

  return {
    items: (activities as (ActivityDoc & { actor?: { name?: string } | null })[]).map(
      (activity) => ({
        id: activity._id.toString(),
        action: activity.action,
        detail: activity.detail ?? "",
        isRead: activity.isRead ?? false,
        createdAt: activity.createdAt ?? new Date(0),
        actorName:
          activity.actor && typeof activity.actor === "object"
            ? (activity.actor.name ?? "")
            : "",
      }),
    ),
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  };
}

export async function countUnreadActivities(businessId: string): Promise<number> {
  await connectDB();
  return Activity.countDocuments({ business: businessId, isRead: false });
}

/* -------------------------------------------------------------------------- */
/* Attachments                                                                 */
/* -------------------------------------------------------------------------- */

export async function listAttachments(
  parentEntity: "catalog" | "business",
  parentId: string,
): Promise<AttachmentDoc[]> {
  await connectDB();
  return Attachment.find({ parentEntity, parentId })
    .sort({ order: -1, createdAt: 1 })
    .lean() as unknown as Promise<AttachmentDoc[]>;
}

/* -------------------------------------------------------------------------- */
/* Stats                                                                       */
/* -------------------------------------------------------------------------- */

export async function platformStats(): Promise<{
  businesses: number;
  products: number;
  orders: number;
}> {
  await connectDB();
  const [businesses, products, orders] = await Promise.all([
    Business.countDocuments({}),
    Catalog.countDocuments({}),
    Order.countDocuments({}),
  ]);
  return { businesses, products, orders };
}