"use client";

import { useMemo, useState } from "react";
import { Play } from "lucide-react";

import { DescriptionVideoModal } from "./description-video-modal";
import { YouTubeIcon } from "./youtube-icon";
import {
  getVideoItem,
  type PlatformVideoKey,
} from "@/lib/videos";

export interface PageVideoButtonProps {
  videoKey: PlatformVideoKey;
  variant?: "button" | "hero" | "badge" | "icon";
  label?: string;
  className?: string;
}

/**
 * In-page button or badge to trigger the description video modal for a specific section.
 */
export function PageVideoButton({
  videoKey,
  variant = "button",
  label,
  className = "",
}: PageVideoButtonProps) {
  const [open, setOpen] = useState(false);
  const video = useMemo(() => getVideoItem(videoKey), [videoKey]);

  const buttonLabel = label || `Watch ${video.title} Guide`;

  return (
    <>
      {variant === "hero" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`group inline-flex h-12 items-center justify-center gap-2.5 rounded-lg border border-border bg-surface px-5 text-sm font-semibold text-foreground transition-all duration-200 hover:border-red-500/50 hover:bg-red-500/5 hover:text-red-500 hover:shadow-xs active:scale-98 ${className}`}
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-red-500/10 text-red-500 transition-transform group-hover:scale-110">
            <YouTubeIcon className="h-4 w-4" />
          </div>
          <span>{label || "Watch Demo Video"}</span>
        </button>
      ) : variant === "badge" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`group inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-600 transition-all hover:bg-red-500/20 dark:text-red-400 ${className}`}
        >
          <YouTubeIcon className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
          <span>{label || "Video Guide"}</span>
        </button>
      ) : variant === "icon" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          title={buttonLabel}
          aria-label={buttonLabel}
          className={`flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-foreground transition-all hover:border-red-500/40 hover:bg-red-500/5 hover:text-red-500 ${className}`}
        >
          <YouTubeIcon className="h-4 w-4" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`group inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-xs font-medium text-foreground transition-all duration-150 hover:border-red-500/40 hover:bg-red-500/5 hover:text-red-500 shadow-2xs ${className}`}
        >
          <YouTubeIcon className="h-4 w-4 transition-transform group-hover:scale-110" />
          <span>{buttonLabel}</span>
        </button>
      )}

      <DescriptionVideoModal
        open={open}
        onClose={() => setOpen(false)}
        videoKey={videoKey}
      />
    </>
  );
}
