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
  const [imgSrc, setImgSrc] = useState<string | null>(null);

  const videoItem = platformDescriptionVideos.landingPage;
  const mode = getDetectedDeviceMode();
  const rawUrl = mode === "mobile" ? videoItem.mobile : videoItem.desktop;
  const videoId = extractYouTubeId(rawUrl) || "umP2-lG2x7Y";
  const embedUrl = getYouTubeEmbedUrl(rawUrl, { autoplay: true });

  const thumbnailUrl =
    imgSrc || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

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
              onError={() => {
                if (!imgSrc) {
                  setImgSrc(`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`);
                }
              }}
            />
          </button>
        )}
      </div>
    </div>
  );
}
