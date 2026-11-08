"use client";

import { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import {
  getDetectedDeviceMode,
  getYouTubeEmbedUrl,
  isYouTubeShort,
  platformDescriptionVideos,
  type PlatformVideoKey,
} from "@/lib/videos";

export interface VideoModalProps {
  open: boolean;
  onClose: () => void;
  videoKey: PlatformVideoKey;
}

/**
 * Clean, lightweight video modal for displaying YouTube demos with no complexity.
 * Supports both standard horizontal (16:9) videos and vertical (9:16) YouTube Shorts.
 */
export function VideoModal({ open, onClose, videoKey }: VideoModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  const { embedUrl, isShort } = useMemo(() => {
    if (!open) return { embedUrl: null, isShort: false };
    const item = platformDescriptionVideos[videoKey];
    if (!item) return { embedUrl: null, isShort: false };
    const mode = getDetectedDeviceMode();
    const rawUrl = mode === "mobile" ? item.mobile : item.desktop;
    return {
      embedUrl: getYouTubeEmbedUrl(rawUrl, { autoplay: true }),
      isShort: isYouTubeShort(rawUrl),
    };
  }, [open, videoKey]);

  if (!open) return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close modal backdrop"
        className="fixed inset-0 cursor-default bg-black/80 backdrop-blur-sm transition-opacity animate-fadeIn"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        className={`relative z-10 w-full overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl transition-all duration-200 ${
          isShort ? "max-w-[400px]" : "max-w-4xl"
        }`}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close video"
          className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white/80 backdrop-blur-md transition-all hover:bg-black/90 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Video Player (Responsive for 16:9 horizontal and 9:16 Shorts) */}
        <div
          className="relative w-full bg-black flex items-center justify-center"
          style={{
            aspectRatio: isShort ? "9 / 16" : "16 / 9",
            maxHeight: isShort ? "82vh" : undefined,
          }}
        >
          {embedUrl ? (
            <iframe
              src={embedUrl}
              title="Video guide"
              className="h-full w-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-white/60">
              Video not available
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
