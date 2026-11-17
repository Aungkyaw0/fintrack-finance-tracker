import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen relative flex flex-col justify-center items-center bg-background text-foreground px-4 py-8 overflow-x-hidden selection:bg-primary/20">
      {/* Ambient background glow for rich modern dark/light styling */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-primary/15 blur-3xl opacity-60 dark:opacity-30" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full bg-indigo-500/15 blur-3xl opacity-60 dark:opacity-30" />
      </div>

      {/* Floating Header with Theme & Language Toggles */}
      <header className="fixed top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 sm:px-8 max-w-5xl mx-auto w-full backdrop-blur-md bg-background/60 border-b border-border/40">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-black text-sm shadow-xs">
            F
          </div>
          <span className="font-extrabold tracking-tight text-sm">FinTrack</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageSwitcher variant="outline" />
        </div>
      </header>

      {/* Main Auth Content Container */}
      <main className="w-full max-w-md pt-14 pb-6">
        {children}
      </main>

      {/* Footer Info */}
      <footer className="text-center text-xs text-muted-foreground mt-4 pb-2">
        <p>© {new Date().getFullYear()} FinTrack. Fast, Secure &amp; Mobile-ready.</p>
      </footer>
    </div>
  );
}
