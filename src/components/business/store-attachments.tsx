"use client";

import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  FileText,
  Images,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { getAttachmentDisplayName } from "@/lib/attachment-utils";

export interface StoreAttachmentItem {
  id: string;
  url: string;
  alt: string;
  kind: "image" | "file" | "link";
  order?: number;
}

export interface StoreAttachmentsProps {
  businessName?: string;
  title?: string;
  filesTitle?: string;
  photosTitle?: string;
  attachments: StoreAttachmentItem[];
  maxPreview?: number;
  maxFilesPreview?: number;
  showPhotos?: boolean;
  showFiles?: boolean;
}

export function StoreAttachments({
  businessName = "Store",
  title,
  filesTitle = "Documents & Menus",
  photosTitle = "Photos",
  attachments,
  maxPreview = 3,
  maxFilesPreview = 2,
  showPhotos = true,
  showFiles = true,
}: StoreAttachmentsProps) {
  const images = showPhotos ? attachments.filter((a) => a.kind === "image") : [];
  const files = showFiles
    ? attachments.filter((a) => a.kind === "file" || a.kind === "link")
    : [];

  const [modalOpen, setModalOpen] = useState(false);
  const [userTab, setUserTab] = useState<"photos" | "files" | null>(null);
  const activeTab: "photos" | "files" =
    userTab ?? (images.length > 0 ? "photos" : "files");
  const setActiveTab = setUserTab;
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number>(0);

  useEffect(() => {
    if (!modalOpen || activeTab !== "photos") return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        setSelectedPhotoIndex((prev) => (prev - 1 + images.length) % images.length);
      } else if (e.key === "ArrowRight") {
        setSelectedPhotoIndex((prev) => (prev + 1) % images.length);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modalOpen, activeTab, images.length]);

  if (images.length === 0 && files.length === 0) return null;

  const visibleImages = images.slice(0, maxPreview);
  const remainingImagesCount = images.length - maxPreview;

  const openPhotoModal = (index: number) => {
    setSelectedPhotoIndex(index);
    setActiveTab("photos");
    setModalOpen(true);
  };

  const openFilesModal = () => {
    setActiveTab("files");
    setModalOpen(true);
  };

  const nextPhoto = () => {
    setSelectedPhotoIndex((prev) => (prev + 1) % images.length);
  };

  const prevPhoto = () => {
    setSelectedPhotoIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <>
      <div className="space-y-6">
        {/* Photos Preview Card */}
        {images.length > 0 ? (
          <Card className="p-5 sm:p-6 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Images className="h-4 w-4 text-primary" />
                <h2 className="text-base font-semibold text-foreground">
                  {photosTitle} ({images.length})
                </h2>
              </div>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => openPhotoModal(0)}
                className="gap-1.5"
              >
                <Images className="h-3.5 w-3.5" />
                <span>Show more ({images.length})</span>
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {visibleImages.map((attachment, index) => {
                const isLastWithMore =
                  index === maxPreview - 1 && remainingImagesCount > 0;

                return (
                  <button
                    key={attachment.id}
                    type="button"
                    onClick={() => openPhotoModal(index)}
                    className="group relative aspect-4/3 w-full overflow-hidden rounded-xl border border-border bg-surface-muted text-left transition-all duration-200 hover:border-primary-border hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/25 cursor-pointer"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={attachment.url}
                      alt={attachment.alt || businessName}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />

                    {isLastWithMore ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs text-white transition-colors group-hover:bg-black/70">
                        <span className="text-xl font-bold tracking-tight">
                          +{remainingImagesCount}
                        </span>
                        <span className="text-xs font-medium opacity-90">
                          Show more
                        </span>
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </Card>
        ) : null}

        {/* File Attachments / Documents Preview */}
        {files.length > 0 ? (
          <Card className="p-5 sm:p-6 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <h2 className="text-base font-semibold text-foreground">
                  {filesTitle} ({files.length})
                </h2>
              </div>

              {files.length > maxFilesPreview ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={openFilesModal}
                  className="gap-1.5"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>Show more ({files.length})</span>
                </Button>
              ) : files.length > 0 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={openFilesModal}
                  className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>View all</span>
                </Button>
              ) : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {files.slice(0, maxFilesPreview).map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface p-3 transition-colors hover:bg-surface-muted hover:border-primary-border"
                >
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2.5 min-w-0 flex-1 hover:text-primary transition-colors"
                  >
                    <FileText className="h-5 w-5 shrink-0 text-primary" />
                    <span className="truncate text-sm font-medium text-foreground">
                      {getAttachmentDisplayName(file.alt, file.url, "Document")}
                    </span>
                  </a>
                  <div className="flex items-center gap-1 shrink-0">
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noreferrer"
                      title="Open in new tab"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-surface hover:text-foreground"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                    {file.kind !== "link" ? (
                      <a
                        href={file.url}
                        download
                        title="Download file"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary-hover shadow-xs"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </a>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ) : null}
      </div>

      {/* Attachments Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        size="lg"
        title={
          <div className="flex items-center gap-2">
            <span>
              {title ||
                (!showPhotos || images.length === 0
                  ? `${filesTitle} · ${businessName}`
                  : `Attachments · ${businessName}`)}
            </span>
          </div>
        }
        description={
          images.length > 0 && files.length > 0
            ? `${images.length} ${images.length === 1 ? "photo" : "photos"} and ${files.length} ${files.length === 1 ? "document" : "documents"}`
            : images.length > 0
            ? `${images.length} ${images.length === 1 ? "photo" : "photos"} available`
            : `${files.length} ${files.length === 1 ? "document" : "documents"} available`
        }
        footer={
          <Button variant="secondary" onClick={() => setModalOpen(false)}>
            Close
          </Button>
        }
      >
        <div className="space-y-4">
          {/* Tab Switcher if both photos and documents exist */}
          {images.length > 0 && files.length > 0 ? (
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <button
                type="button"
                onClick={() => setActiveTab("photos")}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeTab === "photos"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-surface-muted hover:text-foreground"
                }`}
              >
                <Images className="h-3.5 w-3.5" />
                <span>{photosTitle} ({images.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("files")}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeTab === "files"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-surface-muted hover:text-foreground"
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Documents ({files.length})</span>
              </button>
            </div>
          ) : null}

          {/* Photos View */}
          {activeTab === "photos" && images.length > 0 ? (
            <div className="space-y-4">
              {/* Highlight / Lightbox Active Image Preview */}
              <div className="relative flex min-h-65 max-h-[55vh] items-center justify-center overflow-hidden rounded-xl border border-border bg-black/5 dark:bg-black/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={images[selectedPhotoIndex]?.url}
                  alt={images[selectedPhotoIndex]?.alt || `${businessName} photo`}
                  className="max-h-[50vh] w-auto max-w-full rounded-lg object-contain shadow-xs"
                />

                {/* Left/Right Navigation controls if more than 1 image */}
                {images.length > 1 ? (
                  <>
                    <button
                      type="button"
                      onClick={prevPhoto}
                      aria-label="Previous photo"
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-surface/90 text-foreground shadow-md backdrop-blur-sm transition-transform hover:scale-105 hover:bg-surface cursor-pointer"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={nextPhoto}
                      aria-label="Next photo"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-surface/90 text-foreground shadow-md backdrop-blur-sm transition-transform hover:scale-105 hover:bg-surface cursor-pointer"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                ) : null}

                {/* Bottom Caption Overlay */}
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-linear-to-t from-black/75 via-black/45 to-transparent p-3 text-xs text-white">
                  <span className="truncate font-medium">
                    {images[selectedPhotoIndex]?.alt || `${businessName} photo`}
                  </span>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono text-[11px] opacity-80">
                      {selectedPhotoIndex + 1} / {images.length}
                    </span>
                    <a
                      href={images[selectedPhotoIndex]?.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] hover:underline"
                    >
                      <span>Full size</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>

              {/* All Thumbnails Grid */}
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">
                  All photos ({images.length})
                </p>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 max-h-48 overflow-y-auto p-1">
                  {images.map((img, idx) => {
                    const isSelected = idx === selectedPhotoIndex;
                    return (
                      <button
                        key={img.id}
                        type="button"
                        onClick={() => setSelectedPhotoIndex(idx)}
                        className={`group relative aspect-square overflow-hidden rounded-lg border text-left transition-all cursor-pointer ${
                          isSelected
                            ? "border-primary ring-2 ring-primary/40"
                            : "border-border opacity-70 hover:opacity-100 hover:border-primary-border"
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.url}
                          alt={img.alt || `Thumbnail ${idx + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}

          {/* Files / Documents View */}
          {activeTab === "files" && files.length > 0 ? (
            <div className="space-y-2.5">
              <p className="text-xs font-medium text-muted-foreground">
                All documents ({files.length})
              </p>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface p-3 transition-colors hover:bg-surface-muted"
                  >
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2.5 min-w-0 flex-1 hover:text-primary transition-colors"
                    >
                      <FileText className="h-5 w-5 shrink-0 text-primary" />
                      <span className="truncate text-sm font-medium text-foreground">
                        {getAttachmentDisplayName(file.alt, file.url, "Document")}
                      </span>
                    </a>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noreferrer"
                        title="Open in new tab"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-surface hover:text-foreground"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                      {file.kind !== "link" ? (
                        <a
                          href={file.url}
                          download
                          title="Download file"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover shadow-xs"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </a>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </Modal>
    </>
  );
}
