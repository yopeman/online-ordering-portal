"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { AppIcon, type IconName } from "@/components/ui/icon";

export interface TabItem {
  href: string;
  label: string;
  icon?: IconName;
  badge?: number;
}

export function TabsNav({ items }: { items: TabItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="no-scrollbar -mb-px flex gap-1 overflow-x-auto border-b border-border">
      {items.map((item) => {
        const active =
          pathname === item.href ||
          (item.href.split("/").length > 2 && pathname.startsWith(`${item.href}/`));
        const deepActive =
          item.href.split("/").length <= 3 &&
          pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
              active || deepActive
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:border-border-strong hover:text-foreground"
            }`}
          >
            {item.icon ? <AppIcon name={item.icon} className="h-4 w-4" /> : null}
            {item.label}
            {item.badge ? (
              <span className="rounded-full bg-primary px-1.5 py-0.5 text-[11px] font-semibold text-primary-foreground">
                {item.badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}