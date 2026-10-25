"use client";

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type ComponentType,
} from "react";

export function Dropdown({
  trigger,
  items,
  align = "end",
  label,
}: {
  trigger: ReactNode;
  items: {
    key: string;
    label: ReactNode;
    icon?: ComponentType<{ className?: string }>;
    onSelect?: () => void;
    active?: boolean;
    href?: string;
  }[];
  align?: "start" | "end";
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 text-sm text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
      >
        {trigger}
      </button>

      {open ? (
        <div
          role="menu"
          className={`absolute z-40 mt-2 min-w-44 overflow-hidden rounded-xl border border-border bg-surface-raised p-1 shadow-xl ${
            align === "end" ? "right-0" : "left-0"
          }`}
        >
          {items.map((item) => {
            const Icon = item.icon;
            const content = (
              <>
                {Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
                <span className="flex-1 text-left">{item.label}</span>
                {item.active ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                ) : null}
              </>
            );

            const className =
              "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-foreground transition-colors hover:bg-surface-muted";

            if (item.href) {
              return (
                <a
                  key={item.key}
                  href={item.href}
                  className={className}
                  role="menuitem"
                  onClick={() => {
                    setOpen(false);
                    item.onSelect?.();
                  }}
                >
                  {content}
                </a>
              );
            }

            return (
              <button
                key={item.key}
                type="button"
                role="menuitem"
                className={className}
                onClick={() => {
                  setOpen(false);
                  item.onSelect?.();
                }}
              >
                {content}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}