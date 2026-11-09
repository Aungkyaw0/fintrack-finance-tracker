"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogOut, User as UserIcon } from "lucide-react";
import { toast } from "sonner";

interface UserProfileProps {
  email: string;
  fullName?: string | null;
  avatarUrl?: string | null;
}

export function UserMenu({ user }: { user: UserProfileProps }) {
  const t = useTranslations();
  const router = useRouter();
  const supabase = createClient();

  const initials = (user.fullName || user.email || "U")
    .substring(0, 2)
    .toUpperCase();

  async function handleSignOut() {
    await supabase.auth.signOut();
    toast.success(t("auth.logout"));
    router.push("/auth/login");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
            <Avatar className="h-9 w-9 border border-border">
              {user.avatarUrl && (
                <AvatarImage src={user.avatarUrl} alt={user.fullName || ""} />
              )}
              <AvatarFallback className="bg-indigo-100 text-indigo-700 font-semibold text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none truncate">
              {user.fullName || "User"}
            </p>
            <p className="text-xs leading-none text-muted-foreground truncate">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          className="text-red-600 focus:text-red-600 cursor-pointer gap-2"
        >
          <LogOut className="w-4 h-4" />
          <span>{t("auth.logout")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
