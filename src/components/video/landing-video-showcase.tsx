"use client";

import { useState } from "react";
import { YouTubeIcon } from "./youtube-icon";
import {
  extractYouTubeId,
  getDetectedDeviceMode,
  getYouTubeEmbedUrl,
  platformDescriptionVideos,
} from "@/lib/videos";

export interface LandingVideoShowcaseProps {
  className?: string;
}

/**
 * In-page video preview & player showcase for the landing page.
 * Displays the video thumbnail image directly on the main page (no modal),
 * and plays the video inline upon user click.
 */
export function LandingVideoShowcase({
  className = "",
}: LandingVideoShowcaseProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const videoItem = platformDescriptionVideos.landingPage;
  const mode = getDetectedDeviceMode();
  const rawUrl = mode === "mobile" ? videoItem.mobile : videoItem.desktop;
  const videoId = extractYouTubeId(rawUrl) || "umP2-lG2x7Y";
  const embedUrl = getYouTubeEmbedUrl(rawUrl, { autoplay: true });

  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

  return (
    <div
      className={`relative mx-auto w-full max-w-4xl overflow-hidden rounded-2xl border border-border bg-black shadow-2xl transition-all ${className}`}
    >
      <div className="relative aspect-video w-full">
        {isPlaying && embedUrl ? (
          <iframe
            src={embedUrl}
            title="Orders Hub Platform Demo"
            className="h-full w-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            onClick={() => setIsPlaying(true)}
            aria-label="Play platform demo video"
            className="group relative flex h-full w-full cursor-pointer items-center justify-center overflow-hidden focus:outline-hidden"
          >
            {/* Thumbnail Image on the main page */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumbnailUrl}
              alt="Orders Hub Platform Video Preview"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-102"
              loading="lazy"
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent transition-opacity group-hover:opacity-85" />

            {/* Centered Play Button & Label */}
            <div className="relative flex flex-col items-center gap-3">
              <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-red-600 text-white shadow-2xl transition-all duration-300 group-hover:scale-110 group-hover:bg-red-700 group-hover:shadow-red-500/40">
                <YouTubeIcon className="h-10 w-10 sm:h-12 sm:w-12" />
              </div>
              <span className="rounded-full border border-white/20 bg-black/60 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur-md transition-all group-hover:bg-black/80">
                Watch Platform Demo
              </span>
            </div>
          </button>
        )}
      </div>
    </div>
  );
}
