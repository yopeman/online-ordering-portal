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
  desktop: string;
  mobile: string;
}

export const platformDescriptionVideos: Record<
  PlatformVideoKey,
  PlatformVideoItem
> = {
  landingPage: {
    desktop: "https://www.youtube.com/watch?v=umP2-lG2x7Y",
    mobile: "https://www.youtube.com/watch?v=umP2-lG2x7Y",
  },
  marketplace: {
    desktop: "https://www.youtube.com/watch?v=MH1_wtNhJ28",
    mobile: "https://www.youtube.com/watch?v=MH1_wtNhJ28",
  },
  login: {
    desktop: "https://www.youtube.com/watch?v=btzWrusgm18",
    mobile: "https://www.youtube.com/watch?v=btzWrusgm18",
  },
  businessFront: {
    desktop: "https://www.youtube.com/watch?v=yKgSx_OFod0",
    mobile: "https://www.youtube.com/watch?v=yKgSx_OFod0",
  },
  productDetail: {
    desktop: "https://www.youtube.com/watch?v=qFjNVcY2ivo",
    mobile: "https://www.youtube.com/watch?v=qFjNVcY2ivo",
  },
  businessOverview: {
    desktop: "https://www.youtube.com/watch?v=4yUgGsqKPGI",
    mobile: "https://www.youtube.com/watch?v=4yUgGsqKPGI",
  },
  businessWorkspace: {
    desktop: "https://www.youtube.com/watch?v=kGkK_l9C-00",
    mobile: "https://www.youtube.com/watch?v=kGkK_l9C-00",
  },
  catalogTab: {
    desktop: "https://www.youtube.com/watch?v=N2S4E5DBQ18",
    mobile: "https://www.youtube.com/watch?v=N2S4E5DBQ18",
  },
  ordersTab: {
    desktop: "https://www.youtube.com/watch?v=3puVyvd0Qxk",
    mobile: "https://www.youtube.com/watch?v=3puVyvd0Qxk",
  },
  activityTab: {
    desktop: "https://www.youtube.com/watch?v=X9B_Ok9b0Hk",
    mobile: "https://www.youtube.com/watch?v=X9B_Ok9b0Hk",
  },
  settingsTab: {
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
 * Returns list of all platform videos for browsing or playlist navigation.
 */
export function getAllVideos(): PlatformVideoItem[] {
  return Object.values(platformDescriptionVideos);
}