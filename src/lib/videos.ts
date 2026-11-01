export type PlatformVideoKey =
  | "landingPage"
  | "marketplace"
  | "login"
  | "businessFront"
  | "productDetail"
  | "businessOverview"
  | "businessWorkspace"
  | "catalogTab"
  | "ordersTab"
  | "activityTab"
  | "settingsTab";

export type DeviceMode = "desktop" | "mobile";

export interface PlatformVideoItem {
  key: PlatformVideoKey;
  title: string;
  subtitle: string;
  description: string;
  visuals: string[];
  keyPoints: string[];
  desktop: string;
  mobile: string;
}

export const platformDescriptionVideos: Record<
  PlatformVideoKey,
  PlatformVideoItem
> = {
  landingPage: {
    key: "landingPage",
    title: "Landing Page",
    subtitle: "Orders Hub portal introduction & live statistics",
    description:
      "Modern online ordering portal for businesses. Instant storefront creation, multi-language support, and platform overview.",
    visuals: [
      "Hero header with primary CTAs: 'Explore Marketplace' & 'Get Started'",
      "Live platform statistics counter (Businesses, Products, Orders)",
      "Core feature showcase cards (Instant Storefront, Custom Forms, Telegram Alerts)",
      "Theme switcher (Light, Dark, Night, System) & multi-language dropdown",
    ],
    keyPoints: [
      "Introduce Orders Hub as the modern online ordering portal for businesses.",
      "Explain that merchants can launch a store and take orders in minutes with zero coding.",
      "Highlight mobile-friendly browsing and full multi-language support (English, Amharic, Afaan Oromoo, Tigrinya, Afar).",
      "Invite viewers to explore the marketplace or create their own business account.",
    ],
    desktop: "https://www.youtube.com/watch?v=umP2-lG2x7Y",
    mobile: "https://www.youtube.com/watch?v=umP2-lG2x7Y",
  },
  marketplace: {
    key: "marketplace",
    title: "Marketplace",
    subtitle: "Buyer discovery hub, search & product filtering",
    description:
      "Central discovery hub connecting buyers with local and online businesses across diverse categories and locations.",
    visuals: [
      "Search bar and filtering drawer (Category, Location, Price Range, Sorting)",
      "Toggle between Businesses view and Products view",
      "Responsive business cards showing logo, description, and direct store links",
      "Product grid with prices, merchant tags, and quick-view links",
    ],
    keyPoints: [
      "The central discovery hub connecting buyers with local and online businesses.",
      "Demonstrate how easily customers can search, filter by location or price, and compare items.",
      "Show how any registered merchant instantly gets free organic exposure here.",
      "One-click navigation takes buyers directly to the merchant's dedicated storefront.",
    ],
    desktop: "https://www.youtube.com/watch?v=MH1_wtNhJ28",
    mobile: "https://www.youtube.com/watch?v=MH1_wtNhJ28",
  },
  login: {
    key: "login",
    title: "Login & Authentication",
    subtitle: "Passwordless sign-in via Google and Telegram",
    description:
      "Fast, frictionless authentication with Google OAuth and Telegram Login with automatic notification linking.",
    visuals: [
      "Clean, minimal login card with platform branding",
      "One-tap sign-in buttons: Google OAuth and Telegram Login",
      "Developer accounts shortcut (in development environments)",
    ],
    keyPoints: [
      "Fast, frictionless sign-in with no complex passwords to remember.",
      "Secure authentication via Google or Telegram.",
      "Signing in with Telegram automatically enables instant order alerts directly to your phone.",
      "Safe, persistent sessions keep your stores accessible and secure.",
    ],
    desktop: "https://www.youtube.com/watch?v=btzWrusgm18",
    mobile: "https://www.youtube.com/watch?v=btzWrusgm18",
  },
  businessFront: {
    key: "businessFront",
    title: "Business Storefront",
    subtitle: "Public branded store with direct contact channels",
    description:
      "Dedicated merchant storefront (/store/[slug]) with catalog showcase, WhatsApp, Telegram, Phone, and social sharing.",
    visuals: [
      "Branded business header: Store name, bio, verified status, and contact badges",
      "'Share Store' button generating quick links or QR codes",
      "Categorized product gallery with high-res photos and pricing",
    ],
    keyPoints: [
      "Every merchant receives their own shareable public storefront URL (/store/[slug]).",
      "Customers can browse your complete catalog without downloading any app.",
      "Direct contact buttons let customers reach out via phone, messaging apps, or visit in person.",
      "Share your store link directly on Instagram, TikTok, WhatsApp, or print on shop packaging.",
    ],
    desktop: "https://www.youtube.com/watch?v=yKgSx_OFod0",
    mobile: "https://www.youtube.com/watch?v=yKgSx_OFod0",
  },
  productDetail: {
    key: "productDetail",
    title: "Product Detail & Ordering",
    subtitle: "Product specs, image gallery & dynamic order form",
    description:
      "Comprehensive product page with custom tailored order form, instant validation, and real-time merchant notification.",
    visuals: [
      "High-resolution product image gallery with thumbnail preview",
      "Product specifications: price, category, stock status, and detailed description",
      "Dynamic Order Form built specifically for this business",
      "Form submission animation and instant order confirmation message",
    ],
    keyPoints: [
      "Dedicated page for every product item to showcase photos and key details.",
      "Customers fill out your tailored order form (delivery address, preferred time, notes).",
      "No complicated registration required for buyers to submit an order.",
      "Submitting an order instantly notifies the merchant and logs the order in real time.",
    ],
    desktop: "https://www.youtube.com/watch?v=qFjNVcY2ivo",
    mobile: "https://www.youtube.com/watch?v=qFjNVcY2ivo",
  },
  businessOverview: {
    key: "businessOverview",
    title: "Business Overview",
    subtitle: "Manage multiple businesses from a single account",
    description:
      "Owner dashboard listing active stores, quick metrics, status toggles, and fast store creation.",
    visuals: [
      "'My Businesses' dashboard listing all stores owned by the user",
      "Quick metrics: product count, active status, unread alerts, and store links",
      "'Create New Business' button opening the setup modal",
    ],
    keyPoints: [
      "Manage one or multiple businesses from a single, unified account.",
      "Quick overview of store performance and status.",
      "Easily register and launch a new business in seconds by setting a custom URL slug.",
      "Click into any business to enter its dedicated management workspace.",
    ],
    desktop: "https://www.youtube.com/watch?v=4yUgGsqKPGI",
    mobile: "https://www.youtube.com/watch?v=4yUgGsqKPGI",
  },
  businessWorkspace: {
    key: "businessWorkspace",
    title: "Business Workspace",
    subtitle: "Operational command center for store management",
    description:
      "Store management command center with instant tab switching across Catalog, Orders, Activities, and Settings.",
    visuals: [
      "Store header displaying active business name and quick 'Visit Public Store' link",
      "4-tab top navigation bar: Catalog, Orders, Activities, and Settings",
      "Smooth tab switching showcasing the daily operational workflow",
    ],
    keyPoints: [
      "The operational command center for your store.",
      "Switch effortlessly between managing inventory, processing incoming orders, reviewing logs, and adjusting store settings.",
      "One-click button allows merchants to preview their live storefront at any time.",
    ],
    desktop: "https://www.youtube.com/watch?v=kGkK_l9C-00",
    mobile: "https://www.youtube.com/watch?v=kGkK_l9C-00",
  },
  catalogTab: {
    key: "catalogTab",
    title: "Catalog Management",
    subtitle: "Product inventory, images, prices & categories",
    description:
      "Full control over products, Cloudinary image uploads, instant pricing edits, and catalog categorization.",
    visuals: [
      "Inventory list with product thumbnails, categories, pricing, and status badges",
      "'Add Product' modal: title, price, category, markdown description, and image uploader",
      "Quick action menu: Edit details, upload additional attachments, or delete item",
    ],
    keyPoints: [
      "Full control over your product inventory.",
      "Add new products in seconds with high-quality Cloudinary image uploads.",
      "Update prices, modify descriptions, and categorize items easily.",
      "All changes reflect instantly on your public store and marketplace.",
    ],
    desktop: "https://www.youtube.com/watch?v=N2S4E5DBQ18",
    mobile: "https://www.youtube.com/watch?v=N2S4E5DBQ18",
  },
  ordersTab: {
    key: "ordersTab",
    title: "Orders Inbox",
    subtitle: "Incoming customer orders, unread flags & processing",
    description:
      "Central inbox for incoming customer orders, custom field responses, unread counters, and fulfillment tracking.",
    visuals: [
      "Incoming orders feed with order date, customer summary, and bold 'Unread' badges",
      "Click to open order details: customer contact info and custom form field answers",
      "'Mark as Read / Processed' action button",
    ],
    keyPoints: [
      "Central inbox for all incoming customer orders.",
      "Unread indicators ensure new sales are addressed immediately.",
      "View all custom order responses (e.g., delivery address, preferred schedule, custom specs).",
      "Track order fulfillment and mark items as processed with a single click.",
    ],
    desktop: "https://www.youtube.com/watch?v=3puVyvd0Qxk",
    mobile: "https://www.youtube.com/watch?v=3puVyvd0Qxk",
  },
  activityTab: {
    key: "activityTab",
    title: "Activities Audit Log",
    subtitle: "Automated chronological store event timeline",
    description:
      "Complete audit trail of store events, catalog additions, price changes, orders placed, and filtering tools.",
    visuals: [
      "Chronological timeline of store events (catalog additions, price updates, incoming orders)",
      "Action filter pills/dropdown to isolate specific actions",
      "Pagination bar for browsing historical records",
    ],
    keyPoints: [
      "A transparent, automated audit trail for your business.",
      "See exactly what changed, when it happened, and who made the change.",
      "Filter activity by categories like catalog updates, settings changes, or orders placed.",
      "Great for keeping teams accountable and reviewing business history.",
    ],
    desktop: "https://www.youtube.com/watch?v=X9B_Ok9b0Hk",
    mobile: "https://www.youtube.com/watch?v=X9B_Ok9b0Hk",
  },
  settingsTab: {
    key: "settingsTab",
    title: "Store Settings & Form Builder",
    subtitle: "Business profile, custom order form & Telegram bot",
    description:
      "Store identity customization, dynamic drag-and-drop order form builder, Telegram notification alerts, and danger zone.",
    visuals: [
      "Business profile form: Name, description, phone numbers, and location details",
      "Dynamic Order Form Builder: Adding custom fields (Text, Number, Dropdown, Checkbox)",
      "Telegram Bot connection instructions and chat ID setup",
      "'Danger Zone': Business deletion confirmation modal",
    ],
    keyPoints: [
      "Customize your store's identity and primary contact channels.",
      "Design your customer order form: add custom questions and required fields.",
      "Connect your Telegram account to activate instant push notifications for new orders.",
      "Manage store administration and securely archive or remove businesses if needed.",
    ],
    desktop: "https://www.youtube.com/watch?v=kiEIS9DYo5c",
    mobile: "https://www.youtube.com/watch?v=kiEIS9DYo5c",
  },
};

/**
 * Extracts 11-character YouTube video ID from various YouTube URL formats.
 */
export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  const match = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
  );
  if (match && match[1]) return match[1];
  if (/^[\w-]{11}$/.test(trimmed)) return trimmed;
  return null;
}

/**
 * Generates an embedded YouTube iframe player URL with autoplay and privacy-enhanced domain.
 */
export function getYouTubeEmbedUrl(
  url: string,
  options: { autoplay?: boolean; rel?: boolean; loop?: boolean } = {}
): string | null {
  const videoId = extractYouTubeId(url);
  if (!videoId) return null;

  const autoplay = options.autoplay ?? true ? "1" : "0";
  const rel = options.rel ? "1" : "0";
  const loop = options.loop ? "1" : "0";

  return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=${autoplay}&rel=${rel}&loop=${loop}&enablejsapi=1&origin=${
    typeof window !== "undefined" ? encodeURIComponent(window.location.origin) : ""
  }`;
}

/**
 * Detects whether the current client device / viewing mode is mobile or desktop.
 * Uses viewport width (<= 768px), primary pointer capability (touch), and mobile user-agent heuristics.
 */
export function getDetectedDeviceMode(): DeviceMode {
  if (typeof window === "undefined") return "desktop";

  const isSmallScreen = window.matchMedia("(max-width: 768px)").matches;
  const isTouch = window.matchMedia("(pointer: coarse)").matches;
  const isMobileUA =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent || ""
    );

  if (isSmallScreen || (isTouch && isMobileUA)) {
    return "mobile";
  }
  return "desktop";
}

/**
 * Automatically maps any portal pathname to the corresponding video guide key.
 */
export function resolveVideoKeyFromPathname(pathname: string): PlatformVideoKey {
  if (!pathname || pathname === "/") return "landingPage";
  if (pathname.startsWith("/marketplace")) return "marketplace";
  if (pathname.startsWith("/login")) return "login";
  if (pathname.startsWith("/store/")) return "businessFront";
  if (pathname.startsWith("/products/")) return "productDetail";

  // Business workspace tabs
  if (pathname.includes("/businesses/") && pathname.endsWith("/catalog")) {
    return "catalogTab";
  }
  if (pathname.includes("/businesses/") && pathname.endsWith("/orders")) {
    return "ordersTab";
  }
  if (pathname.includes("/businesses/") && pathname.endsWith("/activities")) {
    return "activityTab";
  }
  if (pathname.includes("/businesses/") && pathname.endsWith("/settings")) {
    return "settingsTab";
  }

  // Admin workspace routes mapped to relevant section videos
  if (pathname.includes("/admin/businesses/") && pathname.endsWith("/catalog")) {
    return "catalogTab";
  }
  if (pathname.includes("/admin/businesses/") && pathname.endsWith("/orders")) {
    return "ordersTab";
  }
  if (pathname.includes("/admin/businesses/") && pathname.endsWith("/activities")) {
    return "activityTab";
  }
  if (
    pathname.match(/^\/businesses\/[^/]+$/) ||
    pathname.match(/^\/admin\/businesses\/[^/]+$/)
  ) {
    return "businessWorkspace";
  }

  // Business overview / list
  if (pathname.startsWith("/businesses") || pathname.startsWith("/admin")) {
    return "businessOverview";
  }

  return "landingPage";
}

/**
 * Returns video item metadata for a specific key.
 */
export function getVideoItem(key: PlatformVideoKey): PlatformVideoItem {
  return platformDescriptionVideos[key] ?? platformDescriptionVideos.landingPage;
}

/**
 * Returns list of all platform videos for browsing or playlist navigation.
 */
export function getAllVideos(): PlatformVideoItem[] {
  return Object.values(platformDescriptionVideos);
}