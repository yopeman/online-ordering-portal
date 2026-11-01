"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";

import { DescriptionVideoModal } from "./description-video-modal";
import { YouTubeIcon } from "./youtube-icon";
import { getVideoItem, resolveVideoKeyFromPathname } from "@/lib/videos";

export function HeaderVideoButton() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Automatically determine the relevant video guide based on the active page
  const videoKey = useMemo(
    () => resolveVideoKeyFromPathname(pathname || "/"),
    [pathname]
  );
  const video = useMemo(() => getVideoItem(videoKey), [videoKey]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Watch ${video.title} video guide`}
        title={`Watch ${video.title} video guide`}
        className="group relative flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-medium text-foreground transition-all duration-150 hover:border-red-500/40 hover:bg-red-500/5 hover:text-red-500 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-red-500/50"
      >
        <div className="relative flex items-center justify-center">
          <YouTubeIcon className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
          <span className="absolute -top-1 -right-1 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
          </span>
        </div>
        <span className="hidden md:inline font-semibold">Video Guide</span>
      </button>

      <DescriptionVideoModal
        open={open}
        onClose={() => setOpen(false)}
        videoKey={videoKey}
      />
    </>
  );
}
