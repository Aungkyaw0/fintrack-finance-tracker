"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { downloadCSV } from "@/lib/export-csv";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface ExportCsvButtonProps {
  filename: string;
  headers: string[];
  rows: (string | number | null | undefined)[][];
  label?: string;
  className?: string;
  variant?: "outline" | "default" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export function ExportCsvButton({
  filename,
  headers,
  rows,
  label,
  className = "",
  variant = "outline",
  size = "sm",
}: ExportCsvButtonProps) {
  const t = useTranslations("common");

  function handleExport() {
    if (!rows || rows.length === 0) {
      toast.error("No data available to export");
      return;
    }

    try {
      downloadCSV(filename, [headers, ...rows]);
      toast.success("CSV downloaded successfully");
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Failed to generate export file");
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleExport}
      className={`gap-1.5 text-xs font-medium ${className}`}
      disabled={!rows || rows.length === 0}
      title="Download CSV"
    >
      <Download className="w-3.5 h-3.5" />
      <span>{label || t("exportCsv")}</span>
    </Button>
  );
}
