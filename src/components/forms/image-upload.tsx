"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Upload, X, Camera, Loader2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

export function ImageUpload({
  value,
  onChange,
  onRemove,
}: {
  value?: string | null;
  onChange: (url: string) => void;
  onRemove?: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File is too large (maximum 5 MB)");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || "Upload failed");
      }

      onChange(json.url);
      toast.success("Image uploaded!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {value ? (
        <div className="relative w-36 h-36 rounded-xl overflow-hidden border border-border group bg-slate-100">
          <Image
            src={value}
            alt="Product"
            fill
            className="object-cover"
            sizes="144px"
          />
          <button
            type="button"
            onClick={() => {
              if (onRemove) onRemove();
              else onChange("");
            }}
            className="absolute top-1.5 right-1.5 p-1 bg-black/60 hover:bg-black/80 text-white rounded-full transition-opacity shadow-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => !uploading && fileInputRef.current?.click()}
          className="w-36 h-36 border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer bg-slate-50/50 hover:bg-indigo-50/30 transition-colors p-4 text-center"
        >
          {uploading ? (
            <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
          ) : (
            <>
              <div className="p-2.5 rounded-full bg-indigo-50 text-indigo-600">
                <Camera className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-slate-600">
                Upload Image
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

