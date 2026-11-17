"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  ShoppingCart,
  MoreHorizontal,
  Truck,
  Receipt,
  BarChart3,
  Users,
  Settings,
  Store,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { ThemeToggle } from "./theme-toggle";

interface BottomNavProps {
  storeId?: string;
  userRole?: "owner" | "manager" | "staff";
}

export function BottomNav({ storeId, userRole = "staff" }: BottomNavProps) {
  const pathname = usePathname();
  const [openMore, setOpenMore] = useState(false);
  const t = useTranslations("nav");

  if (!storeId) {
    return null;
  }

  const basePath = `/stores/${storeId}`;

  const navItems = [
    {
      title: t("dashboard"),
      href: `${basePath}/dashboard`,
      icon: LayoutDashboard,
      active: pathname.startsWith(`${basePath}/dashboard`),
    },
    {
      title: t("products"),
      href: `${basePath}/products`,
      icon: Package,
      active: pathname.startsWith(`${basePath}/products`),
    },
    {
      title: t("newSale"),
      href: `${basePath}/sales/new`,
      icon: PlusCircle,
      highlight: true,
      active: pathname === `${basePath}/sales/new`,
    },
    {
      title: t("sales"),
      href: `${basePath}/sales`,
      icon: ShoppingCart,
      active: pathname === `${basePath}/sales` || (pathname.startsWith(`${basePath}/sales`) && pathname !== `${basePath}/sales/new`),
    },
  ];

  const allMoreItems = [
    {
      title: t("purchases"),
      href: `${basePath}/purchases`,
      icon: Truck,
      desc: "Stock-in & supplier invoices",
      roles: ["owner", "manager"],
    },
    {
      title: t("expenses"),
      href: `${basePath}/expenses`,
      icon: Receipt,
      desc: "Operating costs & receipts",
      roles: ["owner", "manager"],
    },
    {
      title: t("reports"),
      href: `${basePath}/reports`,
      icon: BarChart3,
      desc: "P&L, Margins & Cashflow",
      roles: ["owner", "manager"],
    },
    {
      title: t("suppliers"),
      href: `${basePath}/suppliers`,
      icon: Users,
      desc: "Supplier directory & balances",
      roles: ["owner", "manager"],
    },
    {
      title: t("settings"),
      href: `${basePath}/settings`,
      icon: Settings,
      desc: "Store profile & preferences",
      roles: ["owner", "manager"],
    },
    {
      title: t("allStores") || "All Stores",
      href: "/dashboard",
      icon: Store,
      desc: "Switch or create a store",
      roles: ["owner", "manager", "staff"],
    },
  ];

  const moreItems = allMoreItems.filter((item) =>
    item.roles.includes(userRole)
  );

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur-md pb-safe md:hidden shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
      <nav className="flex items-center justify-around h-16 px-1">
        {/* First 2 items */}
        {navItems.slice(0, 2).map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 py-1 text-[11px] font-medium transition-colors",
                item.active
                  ? "text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", item.active && "text-primary")} />
              <span className="truncate max-w-[64px]">{item.title}</span>
            </Link>
          );
        })}

        {/* Highlighted Middle action: + Sale */}
        <Link
          href={`${basePath}/sales/new`}
          className="flex flex-col items-center justify-center -mt-5"
          aria-label={t("newSale")}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 active:scale-95 transition-transform">
            <PlusCircle className="h-6 w-6" />
          </div>
          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
            {t("newSale")}
          </span>
        </Link>

        {/* 4th item: Sales */}
        {navItems.slice(3, 4).map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 py-1 text-[11px] font-medium transition-colors",
                item.active
                  ? "text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", item.active && "text-primary")} />
              <span className="truncate max-w-[64px]">{item.title}</span>
            </Link>
          );
        })}

        {/* 5th item: More Sheet */}
        <Sheet open={openMore} onOpenChange={setOpenMore}>
          <SheetTrigger
            render={
              <button
                type="button"
                className="flex flex-1 flex-col items-center justify-center gap-1 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
              />
            }
          >
            <MoreHorizontal className="h-5 w-5" />
            <span className="truncate max-w-[64px]">{t("more") || "More"}</span>
          </SheetTrigger>
          <SheetContent side="bottom" showCloseButton={false} className="rounded-t-2xl pb-8 max-h-[85vh] overflow-y-auto">
            <SheetHeader className="text-left pb-3 border-b flex flex-row items-center justify-between">
              <SheetTitle className="text-base font-bold">Store Menu</SheetTitle>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground mr-1">Theme</span>
                <ThemeToggle />
                <SheetClose
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground shrink-0"
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Close</span>
                    </Button>
                  }
                />
              </div>
            </SheetHeader>
            <div className="grid grid-cols-1 gap-2 pt-4">
              {moreItems.map((item) => {
                const Icon = item.icon;
                const isSelected = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpenMore(false)}
                    className={cn(
                      "flex items-center gap-3.5 p-3 rounded-xl transition-colors",
                      isSelected
                        ? "bg-primary/10 text-primary font-semibold"
                        : "hover:bg-muted text-foreground"
                    )}
                  >
                    <div
                      className={cn(
                        "p-2 rounded-lg",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">{item.title}</div>
                      <div className="text-xs text-muted-foreground truncate">{item.desc}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  );
}
