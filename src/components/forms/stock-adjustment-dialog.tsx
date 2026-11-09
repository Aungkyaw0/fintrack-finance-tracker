"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { adjustStockAction } from "@/app/actions/products";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SlidersHorizontal, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function StockAdjustmentDialog({
  storeId,
  productId,
  currentStock,
  productName,
}: {
  storeId: string;
  productId: string;
  currentStock: number;
  productName: string;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [type, setType] = useState<"decrease" | "increase">("decrease");
  const [quantity, setQuantity] = useState("1");
  const [reason, setReason] = useState<"loss" | "damage" | "correction" | "other">("loss");
  const [notes, setNotes] = useState("");

  const qtyNum = Math.max(1, parseInt(quantity) || 1);
  const change = type === "decrease" ? -qtyNum : qtyNum;
  const newStockPreview = Math.max(0, currentStock + change);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await adjustStockAction(
      storeId,
      productId,
      change,
      notes || reason,
      reason
    );
    setLoading(false);

    if (res.error) {
      toast.error(res.error);
      return;
    }

    toast.success("Stock adjusted successfully!");
    setOpen(false);
    setNotes("");
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{t("stock.adjustment")}</span>
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("stock.adjustment")}</DialogTitle>
          <DialogDescription className="text-xs">
            {productName} (Current: <b>{currentStock}</b>)
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Action type */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={type === "decrease" ? "default" : "outline"}
              className={`h-9 text-xs font-semibold ${
                type === "decrease" ? "bg-rose-600 hover:bg-rose-700 text-white" : ""
              }`}
              onClick={() => setType("decrease")}
            >
              Decrease (−)
            </Button>
            <Button
              type="button"
              variant={type === "increase" ? "default" : "outline"}
              className={`h-9 text-xs font-semibold ${
                type === "increase" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""
              }`}
              onClick={() => setType("increase")}
            >
              Increase (+)
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adj-qty">{t("sales.quantity")}</Label>
            <Input
              id="adj-qty"
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="adj-reason">{t("stock.adjustmentReason")}</Label>
            <Select
              value={reason}
              onValueChange={(val) =>
                setReason((val || "loss") as "loss" | "damage" | "correction" | "other")
              }
            >
              <SelectTrigger id="adj-reason">
                <SelectValue placeholder="Select Reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="loss">{t("stock.reasons.loss")}</SelectItem>
                <SelectItem value="damage">{t("stock.reasons.damage")}</SelectItem>
                <SelectItem value="correction">
                  {t("stock.reasons.correction")}
                </SelectItem>
                <SelectItem value="other">{t("stock.reasons.other")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adj-notes">{t("common.notes")}</Label>
            <Textarea
              id="adj-notes"
              rows={2}
              placeholder="Why was this stock modified?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* New Stock Preview */}
          <div className="p-3 rounded-lg bg-slate-50 border flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Updated Stock Preview:</span>
            <span className="font-bold text-gray-900">
              {currentStock} →{" "}
              <span className={change < 0 ? "text-rose-600" : "text-emerald-600"}>
                {newStockPreview}
              </span>
            </span>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={loading} className="gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{t("common.confirm")}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

