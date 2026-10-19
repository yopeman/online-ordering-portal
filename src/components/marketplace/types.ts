export type MarketplaceView = "businesses" | "products";
export type MarketplaceLayout = "grid" | "list";

export interface MarketplaceFilterState {
  view: MarketplaceView;
  search: string;
  category: string;
  location: string;
  minPrice?: number;
  maxPrice?: number;
  sort: string;
  page: number;
  perPage: number;
  layout: MarketplaceLayout;
}

export interface CategoryCount {
  category: string;
  count: number;
}
