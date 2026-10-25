"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ShareModal } from "@/components/ui/share-modal";

export interface ShareProductButtonProps {
  productName: string;
  businessName?: string;
  description?: string;
  priceFormatted?: string;
  imageUrl?: string;
  url?: string;
  label?: string;
  copiedLabel?: string;
  variant?: "primary" | "secondary" | "ghost" | "subtle";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ShareProductButton({
  productName,
  businessName,
  description = "",
  priceFormatted,
  imageUrl,
  url,
  label = "Share",
  variant = "secondary",
  size = "md",
  className = "",
}: ShareProductButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={() => setOpen(true)}
        className={`gap-1.5 transition-all ${className}`}
        aria-label={label}
      >
        <Share2 className="h-4 w-4 text-primary" />
        <span>{label}</span>
      </Button>

      <ShareModal
        open={open}
        onClose={() => setOpen(false)}
        type="product"
        title={productName}
        subtitle={businessName}
        description={description}
        priceFormatted={priceFormatted}
        imageUrl={imageUrl}
        url={url}
      />
    </>
  );
}
