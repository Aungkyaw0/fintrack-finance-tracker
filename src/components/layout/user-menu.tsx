"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { signOutAction } from "@/app/actions/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
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

  const initials = (user.fullName || user.email || "U")
    .substring(0, 2)
    .toUpperCase();

  async function handleSignOut() {
    await signOutAction();
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
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
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
        </DropdownMenuGroup>
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
