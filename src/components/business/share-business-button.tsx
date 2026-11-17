"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ShareModal } from "@/components/ui/share-modal";

export interface ShareBusinessButtonProps {
  businessId?: string;
  businessName: string;
  description?: string;
  url?: string;
  imageUrl?: string;
  label?: string;
  title?: string;
  copiedLabel?: string;
  variant?: "primary" | "secondary" | "ghost" | "subtle";
  size?: "sm" | "md" | "lg" | "icon";
  className?: string;
  type?: "business" | "product";
  productName?: string;
  priceFormatted?: string;
  isOwner?: boolean;
}

export function ShareBusinessButton({
  businessId,
  businessName,
  description = "",
  url,
  imageUrl,
  label,
  title,
  variant = "secondary",
  size = "md",
  className = "",
  type = "business",
  productName,
  priceFormatted,
  isOwner = false,
}: ShareBusinessButtonProps) {
  const [open, setOpen] = useState(false);

  const isProduct = type === "product" || Boolean(productName);
  const displayLabel = label ?? (size === "icon" ? undefined : "Share");
  const accessibilityLabel = displayLabel || title || "Share";

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        className={`gap-1.5 transition-all ${className}`}
        aria-label={accessibilityLabel}
        title={title || displayLabel}
      >
        <Share2 className="h-4 w-4 text-primary" />
        {displayLabel ? <span>{displayLabel}</span> : null}
      </Button>

      <ShareModal
        open={open}
        onClose={() => setOpen(false)}
        businessId={businessId}
        type={isProduct ? "product" : "business"}
        title={productName || businessName}
        subtitle={productName ? businessName : undefined}
        description={description}
        priceFormatted={priceFormatted}
        imageUrl={imageUrl}
        url={url}
        isOwner={isOwner}
      />
    </>
  );
}

export { ShareProductButton } from "./share-product-button";
