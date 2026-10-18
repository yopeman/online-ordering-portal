"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Expand, ImageOff } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";

export interface ProductGalleryImage {
  url: string;
  alt?: string;
}

export interface ProductGalleryProps {
  images: ProductGalleryImage[];
  productName: string;
  aspectRatio?: string;
  fallbackNode?: React.ReactNode;
}

export function ProductGallery({
  images,
  productName,
  aspectRatio = "aspect-4/3 sm:aspect-16/10",
  fallbackNode,
}: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const hasImages = images.length > 0;
  const activeImage = hasImages ? images[selectedIndex] : null;

  const nextImage = () => {
    if (!hasImages) return;
    setSelectedIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    if (!hasImages) return;
    setSelectedIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  useEffect(() => {
    if (!lightboxOpen || !hasImages) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        prevImage();
      } else if (e.key === "ArrowRight") {
        nextImage();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen, hasImages, images.length]);

  return (
    <div className="space-y-3">
      {/* Main Image Container */}
      <Card className="group relative overflow-hidden bg-surface-muted">
        <div className={`relative flex w-full items-center justify-center ${aspectRatio}`}>
          {activeImage ? (
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              className="relative h-full w-full cursor-zoom-in focus:outline-none"
              aria-label={`Enlarge ${productName} image`}
            >
              <Image
                src={activeImage.url}
                alt={activeImage.alt || productName}
                fill
                priority
                unoptimized={activeImage.url.startsWith("http://")}
                sizes="(max-width: 1024px) 100vw, 1200px"
                className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              />
              <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-lg bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-xs opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <Expand className="h-3.5 w-3.5" />
                <span>Enlarge</span>
              </div>
            </button>
          ) : fallbackNode ? (
            fallbackNode
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-subtle-foreground">
              <ImageOff className="h-12 w-12" />
              <p className="mt-2 text-xs font-medium">No image available</p>
            </div>
          )}

          {/* Navigation Arrows for Main Display */}
          {images.length > 1 ? (
            <>
              <button
                type="button"
                onClick={prevImage}
                aria-label="Previous photo"
                className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-surface/90 text-foreground shadow-md backdrop-blur-xs transition-transform hover:scale-105 hover:bg-surface cursor-pointer z-10"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={nextImage}
                aria-label="Next photo"
                className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-surface/90 text-foreground shadow-md backdrop-blur-xs transition-transform hover:scale-105 hover:bg-surface cursor-pointer z-10"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <div className="absolute bottom-3 right-3 rounded-md bg-black/65 px-2 py-0.5 font-mono text-[11px] font-medium text-white backdrop-blur-xs">
                {selectedIndex + 1} / {images.length}
              </div>
            </>
          ) : null}
        </div>
      </Card>

      {/* Thumbnails Row */}
      {images.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {images.map((img, index) => {
            const isSelected = index === selectedIndex;
            return (
              <button
                key={`${img.url}-${index}`}
                type="button"
                onClick={() => setSelectedIndex(index)}
                aria-label={`Select photo ${index + 1}`}
                className={`relative aspect-square h-16 w-16 shrink-0 overflow-hidden rounded-lg border text-left transition-all cursor-pointer ${
                  isSelected
                    ? "border-primary ring-2 ring-primary/40"
                    : "border-border opacity-70 hover:opacity-100 hover:border-primary-border"
                }`}
              >
                <Image
                  src={img.url}
                  alt={img.alt || `Thumbnail ${index + 1}`}
                  fill
                  unoptimized={img.url.startsWith("http://")}
                  sizes="64px"
                  className="object-cover"
                />
              </button>
            );
          })}
        </div>
      ) : null}

      {/* Lightbox Modal */}
      {hasImages ? (
        <Modal
          open={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          size="lg"
          title={productName}
          description={`${selectedIndex + 1} of ${images.length} photos`}
        >
          <div className="space-y-4">
            <div className="relative flex min-h-65 max-h-[60vh] items-center justify-center overflow-hidden rounded-xl border border-border bg-black/5 dark:bg-black/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeImage?.url}
                alt={activeImage?.alt || productName}
                className="max-h-[58vh] w-auto max-w-full rounded-lg object-contain"
              />

              {images.length > 1 ? (
                <>
                  <button
                    type="button"
                    onClick={prevImage}
                    aria-label="Previous photo"
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-surface/90 text-foreground shadow-md backdrop-blur-xs transition-transform hover:scale-105 hover:bg-surface cursor-pointer"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={nextImage}
                    aria-label="Next photo"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-surface/90 text-foreground shadow-md backdrop-blur-xs transition-transform hover:scale-105 hover:bg-surface cursor-pointer"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              ) : null}
            </div>

            {images.length > 1 ? (
              <div className="flex gap-2 overflow-x-auto p-1">
                {images.map((img, idx) => (
                  <button
                    key={`modal-${img.url}-${idx}`}
                    type="button"
                    onClick={() => setSelectedIndex(idx)}
                    className={`relative aspect-square h-14 w-14 shrink-0 overflow-hidden rounded-lg border transition-all cursor-pointer ${
                      idx === selectedIndex
                        ? "border-primary ring-2 ring-primary/40"
                        : "border-border opacity-70 hover:opacity-100"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt={img.alt || `Thumbnail ${idx + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
