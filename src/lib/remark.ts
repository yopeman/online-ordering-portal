/**
 * Attaches a default source location remark to a URL if it does not already have one.
 * If the URL already contains a non-empty `remark` query parameter, it preserves it.
 */
export function withRemark(url: string, defaultRemark: string): string {
  if (!url || !defaultRemark) return url;
  try {
    const isAbsolute = url.startsWith("http://") || url.startsWith("https://");
    const base = isAbsolute ? undefined : "https://placeholder.local";
    const parsed = new URL(url, base);

    const existing = parsed.searchParams.get("remark");
    if (!existing || !existing.trim()) {
      parsed.searchParams.set("remark", defaultRemark);
    }

    if (isAbsolute) {
      return parsed.toString();
    }
    return parsed.pathname + (parsed.search ? parsed.search : "") + parsed.hash;
  } catch {
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}remark=${encodeURIComponent(defaultRemark)}`;
  }
}

/**
 * Resolves the source location remark from query parameters or request referer header.
 */
export function resolveSourceLocation(
  queryRemark?: string | null,
  refererHeader?: string | null,
  fallback = "direct",
): string {
  const trimmed = queryRemark?.trim();
  if (trimmed) return trimmed;

  if (refererHeader) {
    try {
      const refUrl = new URL(refererHeader);
      const path = refUrl.pathname.replace(/\/+$/, "") || "/";
      if (path === "/marketplace" || path.startsWith("/marketplace/")) {
        return "marketplace";
      }
      if (path === "/" || path === "") {
        return "home";
      }
      if (path.startsWith("/store/")) {
        return "storefront";
      }
      if (path.startsWith("/products/")) {
        return "product_page";
      }
      if (path.startsWith("/businesses") || path.startsWith("/admin")) {
        return "dashboard";
      }

      // External host check
      const host = refUrl.hostname.toLowerCase();
      if (host.includes("t.me") || host.includes("telegram")) return "telegram";
      if (host.includes("whatsapp")) return "whatsapp";
      if (host.includes("facebook") || host.includes("fb.me")) return "facebook";
      if (host.includes("twitter") || host.includes("x.com")) return "x_twitter";
      if (host.includes("instagram")) return "instagram";
      if (host.includes("tiktok")) return "tiktok";
      if (host.includes("google")) return "google";
      return host;
    } catch {
      // not a valid URL
    }
  }

  return fallback;
}
