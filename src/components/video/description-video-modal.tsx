"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Laptop,
  Maximize2,
  Play,
  RotateCcw,
  Smartphone,
  Sparkles,
  X,
} from "lucide-react";

import { YouTubeIcon } from "./youtube-icon";
import {
  getAllVideos,
  getDetectedDeviceMode,
  getVideoItem,
  getYouTubeEmbedUrl,
  type DeviceMode,
  type PlatformVideoKey,
} from "@/lib/videos";

export interface DescriptionVideoModalProps {
  open: boolean;
  onClose: () => void;
  videoKey: PlatformVideoKey;
  onSelectVideoKey?: (key: PlatformVideoKey) => void;
}

export function DescriptionVideoModal({
  open,
  onClose,
  videoKey,
  onSelectVideoKey,
}: DescriptionVideoModalProps) {
  if (!open) return null;
  return (
    <DescriptionVideoModalDialog
      open={open}
      onClose={onClose}
      videoKey={videoKey}
      onSelectVideoKey={onSelectVideoKey}
    />
  );
}

function DescriptionVideoModalDialog({
  onClose,
  videoKey,
  onSelectVideoKey,
}: DescriptionVideoModalProps) {
  // 1. Identify device mode (desktop vs mobile)
  const detectedDevice = useMemo(() => getDetectedDeviceMode(), []);
  const [activeDevice, setActiveDevice] = useState<DeviceMode>(detectedDevice);
  const [selectedKey, setSelectedKey] = useState<PlatformVideoKey>(videoKey);
  const [showHighlights, setShowHighlights] = useState(false);
  const [showAllGuides, setShowAllGuides] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  // Sync selectedKey if prop changes
  useEffect(() => {
    setSelectedKey(videoKey);
  }, [videoKey]);

  // Handle ESC key and body scroll lock
  useEffect(() => {
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
  }, [onClose]);

  // Current video item
  const video = useMemo(() => getVideoItem(selectedKey), [selectedKey]);
  const allVideos = useMemo(() => getAllVideos(), []);

  // Determine current active URL based on device mode
  const rawVideoUrl = activeDevice === "mobile" ? video.mobile : video.desktop;
  const embedUrl = useMemo(
    () => getYouTubeEmbedUrl(rawVideoUrl, { autoplay: true }),
    [rawVideoUrl]
  );

  const handleSelectKey = (key: PlatformVideoKey) => {
    setSelectedKey(key);
    setIframeLoaded(false);
    onSelectVideoKey?.(key);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="video-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="fixed inset-0 cursor-default bg-black/75 backdrop-blur-md transition-opacity animate-fadeIn"
      />

      {/* Modal Container */}
      <div className="relative z-10 flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border/80 bg-surface shadow-2xl transition-all sm:rounded-3xl">
        {/* Top Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 px-4 py-3 sm:px-6 sm:py-4 bg-surface">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-500 ring-1 ring-red-500/20">
              <YouTubeIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2
                  id="video-modal-title"
                  className="truncate text-sm sm:text-base font-semibold text-foreground"
                >
                  {video.title}
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  <Sparkles className="h-2.5 w-2.5" />
                  Guide
                </span>
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {video.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Device Mode Switcher (Desktop vs Mobile) */}
            <div className="flex items-center rounded-xl border border-border bg-surface-muted/60 p-0.5">
              <button
                type="button"
                onClick={() => {
                  setActiveDevice("desktop");
                  setIframeLoaded(false);
                }}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                  activeDevice === "desktop"
                    ? "bg-surface text-foreground shadow-xs ring-1 ring-border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Desktop mode video"
              >
                <Laptop className="h-3.5 w-3.5" />
                <span className="hidden xs:inline">Desktop</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveDevice("mobile");
                  setIframeLoaded(false);
                }}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                  activeDevice === "mobile"
                    ? "bg-surface text-foreground shadow-xs ring-1 ring-border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Mobile mode video"
              >
                <Smartphone className="h-3.5 w-3.5" />
                <span className="hidden xs:inline">Mobile</span>
              </button>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Video Player Area */}
        <div className="relative bg-black">
          {/* 16:9 Aspect ratio video player */}
          <div className="relative aspect-video w-full overflow-hidden bg-black flex items-center justify-center">
            {embedUrl ? (
              <iframe
                key={`${selectedKey}-${activeDevice}`}
                src={embedUrl}
                title={`${video.title} - ${activeDevice} demonstration`}
                className="h-full w-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                onLoad={() => setIframeLoaded(true)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center text-white/80">
                <Play className="h-10 w-10 text-red-500 mb-2" />
                <p className="text-sm font-medium">Video preview loading...</p>
              </div>
            )}

            {!iframeLoaded && embedUrl && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/90 text-white">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
                <span className="text-xs text-white/70">
                  Loading {activeDevice} video player...
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Scrollable Information Body */}
        <div className="space-y-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
          {/* Quick Info & Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface-muted/40 p-3 sm:px-4">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-medium text-foreground">Active Mode:</span>
              <span className="inline-flex items-center gap-1 font-semibold text-primary">
                {activeDevice === "desktop" ? (
                  <>
                    <Laptop className="h-3.5 w-3.5" />
                    <span>Desktop Mode</span>
                  </>
                ) : (
                  <>
                    <Smartphone className="h-3.5 w-3.5" />
                    <span>Mobile Mode</span>
                  </>
                )}
              </span>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground">
                Device auto-detected as{" "}
                <strong className="text-foreground font-semibold capitalize">
                  {detectedDevice}
                </strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              {rawVideoUrl && (
                <a
                  href={rawVideoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-red-500/40 hover:text-red-500 shadow-2xs"
                >
                  <YouTubeIcon className="h-3.5 w-3.5" />
                  <span>Open in YouTube</span>
                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                </a>
              )}
            </div>
          </div>

          {/* Description Text */}
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {video.description}
          </p>

          {/* Collapsible Key Highlights */}
          <div className="rounded-xl border border-border bg-surface">
            <button
              type="button"
              onClick={() => setShowHighlights((v) => !v)}
              className="flex w-full items-center justify-between p-3.5 text-left text-xs font-semibold text-foreground transition-colors hover:bg-surface-muted/50 rounded-xl"
            >
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>What this video covers ({video.keyPoints.length} points)</span>
              </span>
              {showHighlights ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </button>

            {showHighlights && (
              <div className="border-t border-border px-4 py-3 space-y-3 bg-surface-muted/20">
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Key Takeaways
                    </span>
                    <ul className="space-y-1.5 text-xs text-foreground/90">
                      {video.keyPoints.map((point, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Visuals Showcased
                    </span>
                    <ul className="space-y-1.5 text-xs text-muted-foreground">
                      {video.visuals.map((vis, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-border mt-1.5 shrink-0" />
                          <span>{vis}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Playlist Switcher: Other Videos */}
          <div className="rounded-xl border border-border bg-surface">
            <button
              type="button"
              onClick={() => setShowAllGuides((v) => !v)}
              className="flex w-full items-center justify-between p-3.5 text-left text-xs font-semibold text-foreground transition-colors hover:bg-surface-muted/50 rounded-xl"
            >
              <span className="flex items-center gap-2">
                <Play className="h-3.5 w-3.5 text-red-500" />
                <span>Explore Other Portal Guides ({allVideos.length})</span>
              </span>
              <span className="text-[11px] text-primary">
                {showAllGuides ? "Hide list" : "Browse all guides"}
              </span>
            </button>

            {showAllGuides && (
              <div className="border-t border-border p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 bg-surface-muted/30">
                {allVideos.map((item) => {
                  const isActive = item.key === selectedKey;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => handleSelectKey(item.key)}
                      className={`flex items-start gap-2.5 rounded-lg border p-2 text-left transition-all ${
                        isActive
                          ? "border-red-500/50 bg-red-500/5 text-foreground ring-1 ring-red-500/20"
                          : "border-border bg-surface hover:bg-surface-muted hover:border-foreground/20 text-muted-foreground"
                      }`}
                    >
                      <div
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
                          isActive
                            ? "bg-red-500 text-white"
                            : "bg-surface-muted text-muted-foreground"
                        }`}
                      >
                        <Play className="h-3 w-3 fill-current" />
                      </div>
                      <div className="min-w-0">
                        <p
                          className={`text-xs font-semibold truncate ${
                            isActive ? "text-foreground" : "text-foreground/90"
                          }`}
                        >
                          {item.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {item.subtitle}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
