"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  Receipt,
  Users,
  BarChart3,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function StoreNav({
  storeId,
  userRole = "staff",
}: {
  storeId: string;
  userRole?: "owner" | "manager" | "staff";
}) {
  const t = useTranslations();
  const pathname = usePathname();

  const allNavItems = [
    {
      title: t("dashboard.title"),
      href: `/stores/${storeId}/dashboard`,
      icon: LayoutDashboard,
      roles: ["owner", "manager", "staff"],
    },
    {
      title: t("products.title"),
      href: `/stores/${storeId}/products`,
      icon: Package,
      roles: ["owner", "manager", "staff"],
    },
    {
      title: t("sales.title"),
      href: `/stores/${storeId}/sales`,
      icon: ShoppingCart,
      roles: ["owner", "manager", "staff"],
    },
    {
      title: t("purchases.title"),
      href: `/stores/${storeId}/purchases`,
      icon: Truck,
      roles: ["owner", "manager"],
    },
    {
      title: t("expenses.title"),
      href: `/stores/${storeId}/expenses`,
      icon: Receipt,
      roles: ["owner", "manager"],
    },
    {
      title: t("suppliers.title"),
      href: `/stores/${storeId}/suppliers`,
      icon: Users,
      roles: ["owner", "manager"],
    },
    {
      title: t("reports.title"),
      href: `/stores/${storeId}/reports`,
      icon: BarChart3,
      roles: ["owner", "manager"],
    },
    {
      title: t("settings.title"),
      href: `/stores/${storeId}/settings`,
      icon: Settings,
      roles: ["owner", "manager"],
    },
  ];

  const navItems = allNavItems.filter((item) =>
    item.roles.includes(userRole)
  );

  return (
    <div className="hidden sm:block border-b bg-background sticky top-14 z-30 overflow-x-auto no-scrollbar">
      <nav className="flex items-center space-x-1 px-4 sm:px-6 py-1 min-w-max">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap",
                isActive
                  ? "bg-primary/10 text-primary font-semibold shadow-2xs"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "w-4 h-4",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
