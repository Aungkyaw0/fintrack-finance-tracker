"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  createCategoryAction,
  deleteCategoryAction,
} from "@/app/actions/categories";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tag, Trash2, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CategoryItem {
  id: string;
  name: string;
  color: string | null;
}

const PRESET_COLORS = [
  "#6366f1", // indigo
  "#ec4899", // pink
  "#10b981", // emerald
  "#f59e0b", // amber
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#ef4444", // red
  "#14b8a6", // teal
];

export function CategoryManagerDialog({
  storeId,
  categories,
  trigger,
}: {
  storeId: string;
  categories: CategoryItem[];
  trigger?: React.ReactNode;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    const res = await createCategoryAction(storeId, { name, color });
    setLoading(false);

    if (res.error) {
      toast.error(res.error);
      return;
    }

    toast.success("Category added!");
    setName("");
    router.refresh();
  }

  async function handleDeleteCategory(catId: string) {
    if (!confirm(t("common.confirm") + "?")) return;
    setDeletingId(catId);
    const res = await deleteCategoryAction(storeId, catId);
    setDeletingId(null);

    if (res.error) {
      toast.error(res.error);
      return;
    }

    toast.success(t("common.delete"));
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          (trigger as React.ReactElement) || (
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <Tag className="w-3.5 h-3.5" />
              <span>{t("categories.title")}</span>
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <Tag className="w-5 h-5" />
            </div>
            <DialogTitle>{t("categories.title")}</DialogTitle>
          </div>
          <DialogDescription>{t("categories.addCategory")}</DialogDescription>
        </DialogHeader>

        {/* Add Form */}
        <form onSubmit={handleAddCategory} className="space-y-3 pt-2">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder={t("categories.categoryName")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={loading} className="gap-1">
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span>{t("common.add")}</span>
            </Button>
          </div>

          {/* Color swatches */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs text-muted-foreground">
              {t("categories.color")}:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-5 h-5 rounded-full border transition-transform ${
                    color === c ? "scale-125 border-gray-900 shadow-xs" : "border-transparent"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </form>

        {/* Category List */}
        <div className="mt-4 border-t pt-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            {t("categories.title")} ({categories.length})
          </p>
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2 text-center">
              No categories yet
            </p>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {categories.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: c.color || "#6366f1" }}
                    />
                    <span className="font-medium text-foreground">{c.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteCategory(c.id)}
                    disabled={deletingId === c.id}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

