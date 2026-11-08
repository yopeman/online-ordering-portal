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
    desktop: "https://www.youtube.com/watch?v=tpM0fV213R4",
    mobile: "https://www.youtube.com/watch?v=tpM0fV213R4",
  },
  marketplace: {
    desktop: "https://www.youtube.com/watch?v=MH1_wtNhJ28",
    mobile: "https://youtube.com/shorts/hNPw9K5gIm8?si=AX3HOZ6gJZzjgsNF",
  },
  login: {
    desktop: "https://www.youtube.com/watch?v=btzWrusgm18",
    mobile: "https://youtube.com/shorts/AkfSDN_uu10?si=c_1KfcncObJjqjrt",
  },
  businessFront: {
    desktop: "https://www.youtube.com/watch?v=yKgSx_OFod0",
    mobile: "https://youtube.com/shorts/EXzj5hwwD80?si=lpiAwW1Hc-pVy8fE",
  },
  productDetail: {
    desktop: "https://www.youtube.com/watch?v=qFjNVcY2ivo",
    mobile: "https://youtube.com/shorts/RwjnIbGHum8?si=XfpJKJZKXEoXls4D",
  },
  businessOverview: {
    desktop: "https://www.youtube.com/watch?v=4yUgGsqKPGI",
    mobile: "https://youtube.com/shorts/y1dTcKcvfVs?si=vOkxNYBGv3UxbKRR",
  },
  businessWorkspace: {
    desktop: "https://www.youtube.com/watch?v=kGkK_l9C-00",
    mobile: "https://youtube.com/shorts/blWev_nR610?si=Hn5HDRRukz9aIHhN",
  },
  catalogTab: {
    desktop: "https://www.youtube.com/watch?v=N2S4E5DBQ18",
    mobile: "https://youtube.com/shorts/v_khUSQ-plM?si=-wRqtN6Rr1lAHqqu",
  },
  ordersTab: {
    desktop: "https://www.youtube.com/watch?v=3puVyvd0Qxk",
    mobile: "https://youtube.com/shorts/Ae1hsG8DE2s?si=uNhD4bEjAMle6Igz",
  },
  activityTab: {
    desktop: "https://www.youtube.com/watch?v=X9B_Ok9b0Hk",
    mobile: "https://youtube.com/shorts/9M47HjA2Ja8?si=or4aLAZVgX1AtlUd",
  },
  settingsTab: {
    desktop: "https://www.youtube.com/watch?v=kiEIS9DYo5c",
    mobile: "https://youtube.com/shorts/ZTZ7kVuu36M?si=xJjSezYWhM_moGN1",
  },
};

/**
 * Detects whether a given YouTube URL is a YouTube Shorts video link.
 */
export function isYouTubeShort(url: string): boolean {
  if (!url) return false;
  return /(?:youtube\.com|youtu\.be)\/shorts\//i.test(url.trim());
}

/**
 * Extracts 11-character YouTube video ID from various YouTube URL formats
 * including standard watch URLs, YouTube Shorts, embed links, youtu.be, and live links.
 */
export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();

  // Bare 11-character video ID
  if (/^[\w-]{11}$/.test(trimmed)) return trimmed;

  // Primary regex covering shorts, watch, embed, v, live, and youtu.be
  const match = trimmed.match(
    /(?:youtu\.be\/|(?:www\.|m\.)?youtube(?:-nocookie)?\.com\/(?:embed\/|v\/|shorts\/|live\/|watch\?(?:.*&)?v=))([\w-]{11})/
  );
  if (match && match[1]) return match[1];

  // URL parser fallback for deep or complex query string combinations
  try {
    const parsed = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    const vParam = parsed.searchParams.get("v");
    if (vParam && /^[\w-]{11}$/.test(vParam)) return vParam;

    const parts = parsed.pathname.split("/").filter(Boolean);
    const lastPart = parts[parts.length - 1];
    if (lastPart && /^[\w-]{11}$/.test(lastPart)) return lastPart;
  } catch {
    // ignore parsing errors
  }

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
  const loopParam = options.loop ? `&loop=1&playlist=${videoId}` : "&loop=0";

  const originParam =
    typeof window !== "undefined" && window.location?.origin && window.location.origin !== "null"
      ? `&origin=${encodeURIComponent(window.location.origin)}`
      : "";

  return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=${autoplay}&rel=${rel}${loopParam}&enablejsapi=1${originParam}`;
}

/**
 * Returns YouTube thumbnail image URL for a given video URL or ID.
 */
export function getYouTubeThumbnailUrl(
  urlOrId: string,
  quality: "maxres" | "hq" | "mq" | "default" = "hq"
): string | null {
  const videoId = extractYouTubeId(urlOrId);
  if (!videoId) return null;
  const filename = quality === "maxres" ? "maxresdefault.jpg" : `${quality}default.jpg`;
  return `https://img.youtube.com/vi/${videoId}/${filename}`;
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