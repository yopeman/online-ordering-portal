"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ShareModal } from "@/components/ui/share-modal";

export interface ShareBusinessButtonProps {
  businessName: string;
  description?: string;
  url?: string;
  imageUrl?: string;
  label?: string;
  copiedLabel?: string;
  variant?: "primary" | "secondary" | "ghost" | "subtle";
  size?: "sm" | "md" | "lg";
  className?: string;
  type?: "business" | "product";
  productName?: string;
  priceFormatted?: string;
}

export function ShareBusinessButton({
  businessName,
  description = "",
  url,
  imageUrl,
  label = "Share",
  variant = "secondary",
  size = "md",
  className = "",
  type = "business",
  productName,
  priceFormatted,
}: ShareBusinessButtonProps) {
  const [open, setOpen] = useState(false);

  const isProduct = type === "product" || Boolean(productName);

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
        type={isProduct ? "product" : "business"}
        title={productName || businessName}
        subtitle={productName ? businessName : undefined}
        description={description}
        priceFormatted={priceFormatted}
        imageUrl={imageUrl}
        url={url}
      />
    </>
  );
}

export { ShareProductButton } from "./share-product-button";
