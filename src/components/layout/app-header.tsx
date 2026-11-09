import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getUserStores } from "@/app/actions/stores";
import { StoreSwitcher } from "./store-switcher";
import { LanguageSwitcher } from "./language-switcher";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

export async function AppHeader({
  currentStoreId,
}: {
  currentStoreId?: string;
}) {
  const user = await getCurrentUser();
  const stores = await getUserStores();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6">
        {/* Left: Brand + Store Switcher */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-bold text-lg text-primary hover:opacity-90 transition-opacity"
          >
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
              F
            </div>
            <span className="hidden sm:inline-block">FinTrack</span>
          </Link>

          {stores.length > 0 && (
            <StoreSwitcher
              stores={stores.map((s) => ({
                id: s.id,
                name: s.name,
                currency: s.currency,
              }))}
              currentStoreId={currentStoreId}
            />
          )}
        </div>

        {/* Right: Language + Theme + User Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <ThemeToggle />
          <LanguageSwitcher variant="ghost" />
          {user && (
            <UserMenu
              user={{
                email: user.email,
                fullName: user.fullName,
                avatarUrl: user.avatarUrl,
              }}
            />
          )}
        </div>
      </div>
    </header>
  );
}
