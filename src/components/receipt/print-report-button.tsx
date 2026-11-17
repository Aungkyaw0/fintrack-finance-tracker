"use client";

import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { useTranslations } from "next-intl";

export function PrintReportButton({ label }: { label?: string }) {
  const t = useTranslations("common");

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => window.print()}
      className="gap-1.5 text-xs font-medium shadow-xs"
      title="Print or Save as PDF"
    >
      <Printer className="w-3.5 h-3.5" />
      <span>{label || t("printVoucher")}</span>
    </Button>
  );
}

