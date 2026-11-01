"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { YouTubeIcon } from "./youtube-icon";
import { VideoModal } from "./video-modal";
import { resolveVideoKeyFromPathname, type PlatformVideoKey } from "@/lib/videos";

export interface PageVideoButtonProps {
  videoKey?: PlatformVideoKey;
  className?: string;
  size?: "sm" | "md" | "lg";
  label?: string;
}

/**
 * In-page button displaying the YouTube icon to open the video modal without complexity.
 */
export function PageVideoButton({
  videoKey,
  className = "",
  size = "md",
  label,
}: PageVideoButtonProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const activeKey = videoKey ?? resolveVideoKeyFromPathname(pathname);

  const iconSizes = {
    sm: "h-3.5 w-3.5",
    md: "h-4.5 w-4.5",
    lg: "h-5 w-5",
  };

  const buttonSizes = {
    sm: "h-8 px-2.5 text-xs gap-1.5",
    md: "h-9 px-3 text-xs gap-2",
    lg: "h-11 px-4 text-sm gap-2.5",
  };

  const iconOnlySizes = {
    sm: "h-8 w-8",
    md: "h-9 w-9",
    lg: "h-11 w-11",
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={label || "Watch video guide"}
        aria-label={label || "Watch video guide"}
        className={`group inline-flex items-center justify-center rounded-lg border border-border bg-surface font-medium text-foreground transition-all duration-150 hover:border-red-500/50 hover:bg-red-500/5 hover:text-red-600 active:scale-95 shadow-2xs ${
          label ? buttonSizes[size] : iconOnlySizes[size]
        } ${className}`}
      >
        <YouTubeIcon
          className={`${iconSizes[size]} shrink-0 transition-transform group-hover:scale-110`}
        />
        {label ? <span>{label}</span> : null}
      </button>

      <VideoModal
        open={open}
        onClose={() => setOpen(false)}
        videoKey={activeKey}
      />
    </>
  );
}
