"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { cancelSaleAction } from "@/app/actions/sales";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function CancelSaleDialog({
  storeId,
  saleId,
  saleNumber,
}: {
  storeId: string;
  saleId: string;
  saleNumber: string;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");

  async function handleCancel(e: React.FormEvent) {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error("Please provide a reason for cancellation.");
      return;
    }

    setLoading(true);
    const res = await cancelSaleAction(storeId, saleId, reason);
    setLoading(false);

    if (res.error) {
      toast.error(res.error);
      return;
    }

    toast.success("Sale cancelled. Product stock has been restored.");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
          >
            Cancel / Refund Sale
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-rose-600">
            <AlertTriangle className="w-5 h-5" />
            <DialogTitle>Cancel Sale ({saleNumber})</DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            Cancelling will mark this sale as cancelled and automatically return
            all sold quantities back into your store&apos;s product inventory.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCancel} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="cancel-reason">
              Reason for Cancellation <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="cancel-reason"
              rows={3}
              placeholder="e.g. Customer returned items, wrong payment amount, order cancelled..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
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
            <Button
              type="submit"
              disabled={loading}
              className="gap-2 bg-rose-600 hover:bg-rose-700 text-white"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Confirm Cancellation &amp; Restore Stock</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

