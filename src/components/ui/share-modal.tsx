"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import {
  Check,
  Copy,
  ExternalLink,
  Package,
  QrCode,
  Share2,
  Store,
  X,
} from "lucide-react";

import { useTranslation } from "@/components/providers/app-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  type: "business" | "product";
  title: string;
  subtitle?: string;
  description?: string;
  url?: string;
  priceFormatted?: string;
  imageUrl?: string;
}

function subscribeToUrl(callback: () => void) {
  window.addEventListener("popstate", callback);
  return () => window.removeEventListener("popstate", callback);
}

function useShareUrl(initialUrl?: string): string {
  return useSyncExternalStore(
    subscribeToUrl,
    () => initialUrl || (typeof window !== "undefined" ? window.location.href : ""),
    () => initialUrl || ""
  );
}

export function ShareModal(props: ShareModalProps) {
  if (!props.open) return null;
  return <ShareModalDialog {...props} />;
}

function ShareModalDialog({
  onClose,
  type,
  title,
  subtitle,
  description,
  url: initialUrl,
  priceFormatted,
  imageUrl,
}: ShareModalProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const currentUrl = useShareUrl(initialUrl);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const shareText =
    type === "product"
      ? `Check out ${title}${subtitle ? ` from ${subtitle}` : ""}${
          priceFormatted ? ` (${priceFormatted})` : ""
        } on Yope Order!`
      : `Check out ${title} on Yope Order! ${description || ""}`.trim();

  const handleCopy = async () => {
    if (!currentUrl) return;
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(currentUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        window.prompt(t("common.copyLink"), currentUrl);
      }
    } catch {
      window.prompt(t("common.copyLink"), currentUrl);
    }
  };

  const handleNativeShare = async () => {
    if (
      typeof navigator !== "undefined" &&
      typeof navigator.share === "function"
    ) {
      try {
        await navigator.share({
          title,
          text: shareText,
          url: currentUrl,
        });
      } catch (err: unknown) {
        if ((err as DOMException)?.name === "AbortError") return;
      }
    }
  };

  const openTelegramShare = () => {
    const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(
      currentUrl,
    )}&text=${encodeURIComponent(shareText)}`;
    const tg = typeof window !== "undefined"
      ? (window as unknown as { Telegram?: { WebApp?: { openTelegramLink?: (url: string) => void } } }).Telegram
      : undefined;

    if (tg?.WebApp?.openTelegramLink) {
      tg.WebApp.openTelegramLink(tgUrl);
    } else {
      window.open(tgUrl, "_blank", "noopener,noreferrer");
    }
  };

  const openWhatsAppShare = () => {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
      `${shareText} ${currentUrl}`,
    )}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  const openFacebookShare = () => {
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      currentUrl,
    )}`;
    window.open(fbUrl, "_blank", "noopener,noreferrer");
  };

  const openXShare = () => {
    const xUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(
      currentUrl,
    )}&text=${encodeURIComponent(shareText)}`;
    window.open(xUrl, "_blank", "noopener,noreferrer");
  };

  const hasNativeShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    currentUrl,
  )}&margin=12`;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="fixed inset-0 cursor-default bg-black/60 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl border border-border bg-surface shadow-2xl transition-all sm:rounded-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              {type === "product" ? (
                <Package className="h-5 w-5" />
              ) : (
                <Store className="h-5 w-5" />
              )}
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">
                {type === "product"
                  ? t("common.shareProduct")
                  : t("common.shareBusiness")}
              </h2>
              <p className="text-xs text-muted-foreground">
                {t("common.shareSubtitle")}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="space-y-4 overflow-y-auto px-5 py-4">
          {/* Item Preview Card */}
          <div className="flex items-center gap-3.5 rounded-xl border border-border bg-surface-muted/60 p-3">
            {imageUrl ? (
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border bg-surface">
                <Image
                  src={imageUrl}
                  alt={title}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              </div>
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-border bg-primary/10 text-primary">
                {type === "product" ? (
                  <Package className="h-6 w-6" />
                ) : (
                  <Store className="h-6 w-6" />
                )}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-semibold text-foreground">
                  {title}
                </span>
                {priceFormatted ? (
                  <Badge tone="primary" className="shrink-0 text-[11px] px-1.5 py-0.5">
                    {priceFormatted}
                  </Badge>
                ) : null}
              </div>
              {subtitle ? (
                <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
              ) : description ? (
                <p className="line-clamp-1 text-xs text-muted-foreground">
                  {description}
                </p>
              ) : null}
            </div>
          </div>

          {/* Copy Link Input Bar */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              {t("common.copyLink")}
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-surface p-1.5 shadow-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20">
              <input
                type="text"
                readOnly
                value={currentUrl}
                aria-label="Share URL"
                className="min-w-0 flex-1 bg-transparent px-2.5 text-xs text-foreground focus:outline-none"
              />
              <Button
                type="button"
                size="sm"
                variant={copied ? "subtle" : "primary"}
                onClick={handleCopy}
                className={`shrink-0 transition-all duration-200 ${
                  copied
                    ? "border-success/40 bg-success/15 text-success hover:bg-success/20"
                    : ""
                }`}
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-success scale-110" />
                    <span>{t("common.copied")}</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>{t("common.copy")}</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Share Via Channels */}
          <div className="space-y-2 pt-1">
            <span className="text-xs font-medium text-muted-foreground">
              {t("common.shareVia")}
            </span>
            <div className="grid grid-cols-4 gap-2">
              {/* Telegram */}
              <button
                type="button"
                onClick={openTelegramShare}
                className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-border bg-surface p-2.5 text-foreground transition-all duration-150 hover:-translate-y-0.5 hover:border-[#2AABEE]/50 hover:bg-[#2AABEE]/10 hover:text-[#2AABEE]"
                title="Telegram"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2AABEE]/15 text-[#2AABEE]">
                  <TelegramSvg />
                </div>
                <span className="text-[11px] font-medium">Telegram</span>
              </button>

              {/* WhatsApp */}
              <button
                type="button"
                onClick={openWhatsAppShare}
                className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-border bg-surface p-2.5 text-foreground transition-all duration-150 hover:-translate-y-0.5 hover:border-[#25D366]/50 hover:bg-[#25D366]/10 hover:text-[#25D366]"
                title="WhatsApp"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#25D366]/15 text-[#25D366]">
                  <WhatsAppSvg />
                </div>
                <span className="text-[11px] font-medium">WhatsApp</span>
              </button>

              {/* Facebook */}
              <button
                type="button"
                onClick={openFacebookShare}
                className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-border bg-surface p-2.5 text-foreground transition-all duration-150 hover:-translate-y-0.5 hover:border-[#1877F2]/50 hover:bg-[#1877F2]/10 hover:text-[#1877F2]"
                title="Facebook"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1877F2]/15 text-[#1877F2]">
                  <FacebookSvg />
                </div>
                <span className="text-[11px] font-medium">Facebook</span>
              </button>

              {/* X / Twitter */}
              <button
                type="button"
                onClick={openXShare}
                className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-border bg-surface p-2.5 text-foreground transition-all duration-150 hover:-translate-y-0.5 hover:border-foreground/40 hover:bg-surface-muted"
                title="X"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-muted text-foreground">
                  <XSvg />
                </div>
                <span className="text-[11px] font-medium">X</span>
              </button>
            </div>
          </div>

          {/* QR Code Section Toggle */}
          <div className="border-t border-border pt-3">
            <button
              type="button"
              onClick={() => setShowQr((v) => !v)}
              className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
            >
              <span className="flex items-center gap-2">
                <QrCode className="h-4 w-4 text-primary" />
                <span>{showQr ? t("common.hideQr") : t("common.scanQr")}</span>
              </span>
              <span className="text-[11px] text-primary underline">
                {showQr ? t("common.hideQr") : t("common.showQr")}
              </span>
            </button>

            {showQr && currentUrl ? (
              <div className="mt-3 flex flex-col items-center justify-center rounded-xl border border-border bg-white p-4 shadow-inner">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrCodeUrl}
                  alt="QR Code"
                  width={180}
                  height={180}
                  className="rounded-lg shadow-sm"
                  loading="lazy"
                />
                <p className="mt-2.5 text-center text-[11px] font-medium text-neutral-600">
                  {t("common.scanQr")}
                </p>
              </div>
            ) : null}
          </div>
        </div>

        {/* Modal Footer (Optional Native Share) */}
        {hasNativeShare ? (
          <div className="border-t border-border bg-surface-muted/40 px-5 py-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleNativeShare}
              className="w-full gap-2 text-xs"
            >
              <Share2 className="h-3.5 w-3.5 text-primary" />
              <span>{t("common.moreOptions")}</span>
              <ExternalLink className="ml-auto h-3 w-3 text-muted-foreground" />
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function TelegramSvg() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
    </svg>
  );
}

function WhatsAppSvg() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 15 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M9.53 7.04C9.36 7.04 9.09 7.11 8.87 7.35C8.65 7.59 8.02 8.18 8.02 9.38C8.02 10.58 8.9 11.74 9.02 11.9C9.14 12.06 10.74 14.53 13.19 15.59C13.77 15.84 14.23 16 14.58 16.11C15.17 16.3 15.7 16.27 16.12 16.21C16.6 16.14 17.58 15.61 17.78 15.04C17.98 14.47 17.98 13.99 17.92 13.89C17.86 13.79 17.7 13.73 17.46 13.61C17.22 13.49 16.03 12.91 15.81 12.83C15.59 12.75 15.43 12.71 15.27 12.95C15.11 13.19 14.65 13.73 14.51 13.89C14.37 14.05 14.23 14.07 13.99 13.95C13.75 13.83 12.98 13.58 12.07 12.76C11.36 12.13 10.88 11.35 10.74 11.11C10.6 10.87 10.73 10.74 10.85 10.62C10.96 10.51 11.1 10.33 11.22 10.19C11.34 10.05 11.38 9.95 11.46 9.79C11.54 9.63 11.5 9.49 11.44 9.37C11.38 9.25 10.9 8.08 10.7 7.6C10.51 7.13 10.31 7.19 10.16 7.19C10.02 7.19 9.85 7.17 9.69 7.17L9.53 7.04Z" />
    </svg>
  );
}

function FacebookSvg() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function XSvg() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
