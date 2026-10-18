"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";

export function FooterNavButtons() {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== "undefined") {
      router.back();
    }
  };

  const handleForward = () => {
    if (typeof window !== "undefined") {
      router.forward();
    }
  };

  return (
    <div className="flex items-center gap-1.5" role="navigation" aria-label="History navigation">
      <button
        type="button"
        onClick={handleBack}
        aria-label="Go back"
        title="Go back"
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-all duration-150 hover:border-primary-border hover:bg-surface-muted hover:text-foreground active:scale-95 cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={handleForward}
        aria-label="Go forward"
        title="Go forward"
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-all duration-150 hover:border-primary-border hover:bg-surface-muted hover:text-foreground active:scale-95 cursor-pointer"
      >
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
