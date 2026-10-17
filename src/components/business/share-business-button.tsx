"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export interface ShareBusinessButtonProps {
  businessName: string;
  description?: string;
  label?: string;
  copiedLabel?: string;
  variant?: "primary" | "secondary" | "ghost" | "subtle";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ShareBusinessButton({
  businessName,
  description = "",
  label = "Share business",
  copiedLabel = "Copied link!",
  variant = "secondary",
  size = "md",
  className = "",
}: ShareBusinessButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";

    // Prefer native Web Share API on mobile / supporting devices
    if (
      typeof navigator !== "undefined" &&
      typeof navigator.share === "function" &&
      /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
    ) {
      try {
        await navigator.share({
          title: businessName,
          text: description || businessName,
          url,
        });
        return;
      } catch (error) {
        // Fallback to clipboard if user dismissed or share failed
        if ((error as DOMException)?.name === "AbortError") return;
      }
    }

    // Fallback to clipboard copy
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch {
        // Fallback: prompt copy
        window.prompt("Copy store link:", url);
      }
    }
  };

  return (
    <Button
      type="button"
      variant={copied ? "subtle" : variant}
      size={size}
      onClick={handleShare}
      className={`transition-all duration-200 ${
        copied ? "border-success/40 text-success" : ""
      } ${className}`}
      aria-label={copied ? copiedLabel : label}
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 text-success transition-transform duration-200 scale-110" />
          <span>{copiedLabel}</span>
        </>
      ) : (
        <>
          <Share2 className="h-4 w-4" />
          <span>{label}</span>
        </>
      )}
    </Button>
  );
}
