"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Store, Check, ChevronsUpDown, LayoutGrid } from "lucide-react";
import { CreateStoreDialog } from "@/components/forms/create-store-dialog";

interface StoreItem {
  id: string;
  name: string;
  currency: string;
}

export function StoreSwitcher({
  stores,
  currentStoreId,
}: {
  stores: StoreItem[];
  currentStoreId?: string;
}) {
  const t = useTranslations();
  const router = useRouter();

  const currentStore = stores.find((s) => s.id === currentStoreId);

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-3 gap-2 font-medium bg-background max-w-[200px] sm:max-w-[260px] justify-between"
            >
              <div className="flex items-center gap-2 truncate">
                <Store className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="truncate">
                  {currentStore ? currentStore.name : t("stores.switchStore")}
                </span>
              </div>
              <ChevronsUpDown className="w-3.5 h-3.5 text-muted-foreground shrink-0 opacity-60" />
            </Button>
          }
        />
        <DropdownMenuContent align="start" className="w-[240px]">
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            {t("stores.myStores")}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => router.push("/dashboard")}
            className="gap-2 cursor-pointer"
          >
            <LayoutGrid className="w-4 h-4 text-muted-foreground" />
            <span>{t("stores.title")} (Overview)</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {stores.map((s) => (
            <DropdownMenuItem
              key={s.id}
              onClick={() => router.push(`/stores/${s.id}/dashboard`)}
              className="gap-2 cursor-pointer justify-between"
            >
              <div className="flex items-center gap-2 truncate">
                <Store className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span className="truncate">{s.name}</span>
              </div>
              {s.id === currentStoreId && (
                <Check className="w-4 h-4 text-indigo-600 shrink-0" />
              )}
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator />

          <div className="p-1">
            <CreateStoreDialog
              trigger={
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                >
                  + {t("stores.createStore")}
                </Button>
              }
            />
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
