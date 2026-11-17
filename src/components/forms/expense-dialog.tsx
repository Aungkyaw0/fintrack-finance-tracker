"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createExpenseAction } from "@/app/actions/expenses";
import { ImageUpload } from "@/components/forms/image-upload";
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
import { Receipt, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

const EXPENSE_CATEGORIES = [
  { id: "rent", label: "Rent (အိမ်ငှားခ)" },
  { id: "salary", label: "Salary / Staff (လစာ)" },
  { id: "packaging", label: "Packaging (ထုပ်ပိုးခ)" },
  { id: "delivery", label: "Delivery / Shipping (ပို့ဆောင်ခ)" },
  { id: "advertising", label: "Advertising / Marketing (ကြော်ငြာခ)" },
  { id: "electricity", label: "Electricity / Utilities (မီးဘီလ်)" },
  { id: "internet", label: "Internet & Phone (ဖုန်း/အင်တာနက်)" },
  { id: "other", label: "Other Operating Expenses (အခြား)" },
];

export function ExpenseDialog({
  storeId,
  currency,
  trigger,
}: {
  storeId: string;
  currency: string;
  trigger?: React.ReactNode;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [category, setCategory] = useState("rent");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amtNum = parseFloat(amount);
    if (!amtNum || amtNum <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setLoading(true);
    const res = await createExpenseAction(storeId, {
      category,
      amount: amtNum,
      description,
      receiptUrl,
    });
    setLoading(false);

    if (res.error) {
      toast.error(res.error);
      return;
    }

    toast.success("Expense recorded successfully!");
    setOpen(false);
    setAmount("");
    setDescription("");
    setReceiptUrl(null);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          (trigger as React.ReactElement) || (
            <Button size="sm" className="gap-1.5 shadow-sm text-xs bg-rose-600 hover:bg-rose-700 text-white">
              <Plus className="w-3.5 h-3.5" />
              <span>{t("expenses.addExpense")}</span>
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
              <Receipt className="w-5 h-5" />
            </div>
            <DialogTitle>{t("expenses.addExpense")}</DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            Log store operating costs outside of product stock-in
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="exp-cat">{t("expenses.category")}</Label>
            <Select
              value={category}
              onValueChange={(val) => setCategory(val || "rent")}
            >
              <SelectTrigger id="exp-cat">
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORIES.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="exp-amount">
              {t("expenses.amount")} ({currency}) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="exp-amount"
              type="number"
              min="1"
              step="any"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="exp-desc">{t("expenses.description")}</Label>
            <Textarea
              id="exp-desc"
              rows={2}
              placeholder="e.g. October shop rent, packaging plastic bags..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Receipt Upload */}
          <div className="space-y-2">
            <Label className="text-xs">Bill / Receipt Slip</Label>
            <ImageUpload
              value={receiptUrl}
              onChange={(url) => setReceiptUrl(url)}
              onRemove={() => setReceiptUrl(null)}
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
              <span>{t("common.confirm")}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

