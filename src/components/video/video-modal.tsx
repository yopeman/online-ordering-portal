"use client";

import { useEffect, useMemo } from "react";
import { X } from "lucide-react";
import {
  getDetectedDeviceMode,
  getYouTubeEmbedUrl,
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

  const embedUrl = useMemo(() => {
    if (!open) return null;
    const item = platformDescriptionVideos[videoKey];
    if (!item) return null;
    const mode = getDetectedDeviceMode();
    const rawUrl = mode === "mobile" ? item.mobile : item.desktop;
    return getYouTubeEmbedUrl(rawUrl, { autoplay: true });
  }, [open, videoKey]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close modal backdrop"
        className="fixed inset-0 cursor-default bg-black/80 backdrop-blur-sm transition-opacity animate-fadeIn"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close video"
          className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white/80 backdrop-blur-md transition-all hover:bg-black/90 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        {/* 16:9 Video Player */}
        <div className="relative aspect-video w-full bg-black">
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
    </div>
  );
}
