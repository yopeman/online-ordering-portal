/**
 * Safely extracts a display name for an attachment from its alt text or URL.
 * Handles data URLs gracefully without exposing massive base64 payloads.
 */
export function getAttachmentDisplayName(
  alt?: string | null,
  url?: string | null,
  fallback = "Attachment",
): string {
  if (alt && alt.trim()) return alt.trim();
  if (!url) return fallback;
  if (url.startsWith("data:")) return fallback;
  const filename = url.split("/").pop();
  return filename && filename.trim() ? filename.trim() : fallback;
}
