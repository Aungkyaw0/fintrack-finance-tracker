"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface BackButtonProps {
  href?: string;
  onClick?: () => void;
  className?: string;
  label?: string;
}

export function BackButton({ href, onClick, className, label }: BackButtonProps) {
  const router = useRouter();

  const content = (
    <>
      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-card hover:bg-muted active:scale-95 border border-border/80 flex items-center justify-center text-foreground transition-all shadow-2xs shrink-0">
        <ArrowLeft className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.25]" />
      </div>
      {label && (
        <span className="text-xs sm:text-sm font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
          {label}
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn("inline-flex items-center gap-2 group cursor-pointer", className)}
        aria-label="Go back"
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => (onClick ? onClick() : router.back())}
      className={cn("inline-flex items-center gap-2 group cursor-pointer", className)}
      aria-label="Go back"
    >
      {content}
    </button>
  );
}

