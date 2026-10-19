import "server-only";

import type { QueryFilter } from "mongoose";
import { Types } from "mongoose";

import { connectDB } from "@/lib/db";
import { Business, User, toUserDTO } from "@/lib/models";
import type { UserDTO } from "@/lib/models";

export interface UserListItem extends UserDTO {
  businessCount: number;
}

export async function listUsers(options: {
  search?: string;
  role?: "all" | "admin" | "business_owner";
  page?: number;
  perPage?: number;
} = {}): Promise<{ items: UserListItem[]; total: number; page: number; totalPages: number }> {
  await connectDB();
  const page = Math.max(1, options.page ?? 1);
  const perPage = Math.min(50, Math.max(1, options.perPage ?? 20));

  const filter: QueryFilter<{ email: string; name: string; role: string }> = {};
  if (options.role && options.role !== "all") filter.role = options.role;

  if (options.search) {
    const escaped = options.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { name: { $regex: escaped, $options: "i" } },
      { email: { $regex: escaped, $options: "i" } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * perPage).limit(perPage).lean(),
    User.countDocuments(filter),
  ]);

  const counts = await Business.aggregate<{ _id: Types.ObjectId; count: number }>([
    { $group: { _id: "$owner", count: { $sum: 1 } } },
  ]);
  const countByOwner = new Map(counts.map((row) => [row._id.toString(), row.count]));

  return {
    items: users.map((user) => ({
      ...toUserDTO(user),
      businessCount: countByOwner.get(user._id.toString()) ?? 0,
    })),
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  };
}

export interface AdminBusinessItem {
  id: string;
  name: string;
  slug: string;
  category: string;
  location: string;
  status: "visible" | "hide";
  isActive: boolean;
  contactPhones: string[];
  ownerName: string;
  ownerEmail: string;
  productCount: number;
  orderCount: number;
  createdAt: Date;
}

/** Every business on the platform (admin, read only scope). */
export async function listAllBusinesses(options: {
  search?: string;
  page?: number;
  perPage?: number;
} = {}): Promise<{
  items: AdminBusinessItem[];
  total: number;
  page: number;
  totalPages: number;
}> {
  await connectDB();
  const page = Math.max(1, options.page ?? 1);
  const perPage = Math.min(50, Math.max(1, options.perPage ?? 20));

  const filter: QueryFilter<{ name: string; slug: string }> = {};
  if (options.search) {
    const escaped = options.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { name: { $regex: escaped, $options: "i" } },
      { slug: { $regex: escaped, $options: "i" } },
    ];
  }

  const [businesses, total] = await Promise.all([
    Business.find(filter)
      .populate("owner", "name email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage)
      .lean(),
    Business.countDocuments(filter),
  ]);

  const ids = businesses.map((business) => business._id);

  const [productCounts, orderCounts] = await Promise.all([
    Business.db.collection("catalogs")
      .aggregate([
        { $match: { business: { $in: ids } } },
        { $group: { _id: "$business", count: { $sum: 1 } } },
      ])
      .toArray(),
    Business.db.collection("orders")
      .aggregate([
        { $match: { business: { $in: ids } } },
        { $group: { _id: "$business", count: { $sum: 1 } } },
      ])
      .toArray(),
  ]);

  const asMap = (rows: { _id: Types.ObjectId; count: number }[]) =>
    new Map(rows.map((row) => [row._id.toString(), row.count]));

  const products = asMap(
    productCounts as unknown as { _id: Types.ObjectId; count: number }[],
  );
  const orders = asMap(orderCounts as unknown as { _id: Types.ObjectId; count: number }[]);

  return {
    items: businesses.map((business) => {
      const details =
        business.details && typeof business.details === "object"
          ? (business.details as Record<string, unknown>)
          : {};
      const owner =
        typeof business.owner === "object" && business.owner && "email" in business.owner
          ? (business.owner as { name?: string; email?: string })
          : undefined;

      return {
        id: business._id.toString(),
        name: business.name,
        slug: business.slug,
        category: String(details.category ?? ""),
        location: String(details.location ?? ""),
        status:
          (business.status as "visible" | "hide") ||
          (business.isActive !== false ? "visible" : "hide"),
        isActive: business.isActive !== false && business.status !== "hide",
        contactPhones: business.contactPhones ?? [],
        ownerName: owner?.name ?? "",
        ownerEmail: owner?.email ?? "",
        productCount: products.get(business._id.toString()) ?? 0,
        orderCount: orders.get(business._id.toString()) ?? 0,
        createdAt: business.createdAt ?? new Date(0),
      };
    }),
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  };
}