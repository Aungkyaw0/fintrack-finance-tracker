"use client";

import { useEffect, useState } from "react";
import { Download, X, Share, PlusSquare, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(true); // default true to avoid flash
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // 1. Check if already running as installed PWA
    const inStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone ===
        true;

    setIsStandalone(inStandalone);

    if (inStandalone) return;

    // Check if dismissed in this session
    const isDismissed = sessionStorage.getItem("pwa_prompt_dismissed");
    if (isDismissed) {
      setDismissed(true);
      return;
    }

    // 2. Check if iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice =
      /iphone|ipad|ipod/.test(ua) &&
      !(window as unknown as { MSStream?: boolean }).MSStream;

    setIsIOS(isIosDevice);

    // 3. Android / Chromium beforeinstallprompt listener
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  if (isStandalone || dismissed) {
    return null;
  }

  // Only show if we either have the Android prompt ready OR it's an iOS Safari browser
  if (!deferredPrompt && !isIOS) {
    return null;
  }

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setDeferredPrompt(null);
        setDismissed(true);
      }
    } catch (err) {
      console.error("Install prompt error:", err);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("pwa_prompt_dismissed", "true");
  };

  return (
    <div className="fixed bottom-20 left-3 right-3 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-sm z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="bg-card/95 backdrop-blur-md border border-primary/20 shadow-xl rounded-2xl p-3.5 text-card-foreground ring-1 ring-black/5 dark:ring-white/10">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-black text-lg shadow-sm shrink-0">
              F
            </div>
            <div>
              <h4 className="font-bold text-xs sm:text-sm tracking-tight text-foreground flex items-center gap-1.5">
                <span>FinTrack App</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                  Install
                </span>
              </h4>
              <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                Faster access, offline support &amp; full screen
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground p-1 rounded-lg transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isIOS ? (
          <div className="mt-2.5 pt-2 border-t border-border/60 text-[11px] text-muted-foreground space-y-1">
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <span>Install on iPhone/iPad:</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>1. Tap Safari&apos;s Share button</span>
              <Share className="w-3.5 h-3.5 text-primary inline" />
            </div>
            <div className="flex items-center gap-1.5">
              <span>2. Scroll down &amp; tap &quot;Add to Home Screen&quot;</span>
              <PlusSquare className="w-3.5 h-3.5 text-primary inline" />
            </div>
          </div>
        ) : (
          <div className="mt-3 flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={handleInstallClick}
              className="w-full gap-2 font-semibold shadow-xs bg-primary text-primary-foreground hover:bg-primary/90 h-9"
            >
              <Download className="w-4 h-4" />
              <span>Install App</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDismiss}
              className="text-xs h-9 px-3"
            >
              Later
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

