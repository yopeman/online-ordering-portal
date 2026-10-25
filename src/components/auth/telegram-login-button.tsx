"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

interface TelegramLoginButtonProps {
  botUsername: string;
  authUrl: string;
  next?: string;
  labels?: {
    authenticating?: string;
    errorPrefix?: string;
    retry?: string;
  };
}

export function TelegramLoginButton({
  botUsername,
  authUrl,
  next,
  labels,
}: TelegramLoginButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMiniApp, setIsMiniApp] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    // 1. Detect if running inside Telegram Mini App (Web App)
    const tg = typeof window !== "undefined"
      ? (window as unknown as {
          Telegram?: {
            WebApp?: {
              initData?: string;
              ready?: () => void;
              expand?: () => void;
            };
          };
        }).Telegram
      : undefined;

    // Check both WebApp initData and hash fallback (tgWebAppData)
    let initData = tg?.WebApp?.initData;
    if (!initData && typeof window !== "undefined" && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.slice(1));
      initData = hashParams.get("tgWebAppData") || "";
    }

    if (initData && initData.length > 0) {
      setTimeout(() => {
        if (!isMounted) return;
        setIsMiniApp(true);
        setAuthenticating(true);
        setErrorMessage(null);
      }, 0);

      tg?.WebApp?.ready?.();
      tg?.WebApp?.expand?.();

      fetch("/api/auth/telegram/webapp", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData, next }),
      })
        .then(async (res) => {
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || errData.reason || "Authentication failed");
          }
          return res.json();
        })
        .then((data: { ok: boolean; token?: string; redirectUrl?: string }) => {
          if (data.token) {
            try {
              sessionStorage.setItem("yope_session", data.token);
              localStorage.setItem("yope_session", data.token);
            } catch {}
          }
          const dest = data.redirectUrl || next || "/businesses";
          const sep = dest.includes("?") ? "&" : "?";
          const finalUrl = data.token
            ? `${dest}${sep}tg_session=${encodeURIComponent(data.token)}`
            : dest;
          window.location.replace(finalUrl);
        })
        .catch((err: unknown) => {
          if (!isMounted) return;
          const msg = err instanceof Error ? err.message : "Failed to sign in via Telegram";
          setErrorMessage(msg);
          setAuthenticating(false);
        });

      return () => {
        isMounted = false;
      };
    }

    // 2. Regular Web Browser: Embed official Telegram Login Widget
    if (!containerRef.current || !botUsername) return;

    containerRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    script.setAttribute("data-telegram-login", botUsername);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-radius", "8");
    script.setAttribute("data-auth-url", authUrl);
    script.setAttribute("data-request-access", "write");

    containerRef.current.appendChild(script);

    return () => {
      isMounted = false;
    };
  }, [botUsername, authUrl, next]);

  if (isMiniApp && authenticating) {
    return (
      <div className="flex h-11 w-full items-center justify-center gap-2.5 rounded-lg border border-[#2AABEE]/30 bg-[#2AABEE]/10 px-4 text-sm font-medium text-[#2AABEE]">
        <Loader2 className="h-4 w-4 animate-spin text-[#2AABEE]" />
        <span>{labels?.authenticating ?? "Signing in with Telegram..."}</span>
      </div>
    );
  }

  if (isMiniApp && errorMessage) {
    return (
      <div className="space-y-2 text-center">
        <p className="text-xs text-danger">
          {labels?.errorPrefix ?? "Telegram error:"} {errorMessage}
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="text-xs font-medium text-primary hover:underline"
        >
          {labels?.retry ?? "Try again"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div
        ref={containerRef}
        className="flex min-h-[44px] w-full items-center justify-center overflow-hidden"
      />
    </div>
  );
}

export function TelegramMark({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
    </svg>
  );
}
