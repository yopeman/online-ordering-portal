"use client";

import { LogOut, ShieldCheck, ShoppingCart, ChartNoAxesCombined, UserCircle2 } from "lucide-react";

import { Dropdown } from "@/components/ui/dropdown";
import { Avatar } from "@/components/ui/avatar";
import { useApp } from "@/components/providers/app-provider";
import { logoutAction } from "@/app/actions/auth";

export interface UserMenuData {
  name: string;
  email: string;
  image: string;
  isAdmin: boolean;
}

/**
 * Account menu lives on the client so icons and the logout action can stay
 * interactive; the header only passes serialisable user data.
 */
export function UserMenu({ name, email, image, isAdmin }: UserMenuData) {
  const { t } = useApp();

  return (
    <Dropdown
      label={t("nav.account")}
      trigger={<Avatar name={name} src={image} size="sm" />}
      items={[
        {
          key: "account",
          label: (
            <span className="flex flex-col">
              <span className="font-medium">{name}</span>
              <span className="text-xs text-muted-foreground">{email}</span>
            </span>
          ),
          icon: UserCircle2,
        },
        {
          key: "businesses",
          label: t("nav.myBusinesses"),
          icon: ChartNoAxesCombined,
          href: "/businesses",
        },
        ...(isAdmin
          ? [
              {
                key: "admin",
                label: t("nav.admin"),
                icon: ShieldCheck,
                href: "/admin",
              },
            ]
          : []),
        {
          key: "marketplace",
          label: t("nav.marketplace"),
          icon: ShoppingCart,
          href: "/marketplace",
        },
        {
          key: "logout",
          label: t("nav.logout"),
          icon: LogOut,
          href: "/api/auth/logout",
          onSelect: async () => {
            try {
              await logoutAction();
            } catch {
              // ignore redirect exception
            }
            window.location.replace("/api/auth/logout");
          },
        },
      ]}
    />
  );
}
