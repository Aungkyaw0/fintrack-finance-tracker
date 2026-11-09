import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen relative flex items-center justify-center bg-background text-foreground p-4">
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <ThemeToggle />
        <LanguageSwitcher variant="outline" />
      </div>
      <div className="w-full max-w-md">
        {/* App logo / name */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 mb-4 shadow-md">
            <span className="text-2xl font-bold text-white">F</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">FinTrack</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Store Finance &amp; Inventory Manager
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}


