"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createStoreAction } from "@/app/actions/stores";
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
import { Plus, Store, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function CreateStoreDialog({
  trigger,
  onCreated,
}: {
  trigger?: React.ReactNode;
  onCreated?: (storeId: string) => void;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [currency, setCurrency] = useState("MMK");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error(t("errors.required"));
      return;
    }

    setLoading(true);
    const res = await createStoreAction({
      name,
      description,
      currency,
    });
    setLoading(false);

    if (res.error) {
      toast.error(res.error);
      return;
    }

    toast.success(
      t("common.save") +
        (currency === "MMK" ? " (အောင်မြင်ပါသည်)" : " (Success)")
    );
    setOpen(false);
    setName("");
    setDescription("");
    setCurrency("MMK");

    if (res.store) {
      if (onCreated) {
        onCreated(res.store.id);
      } else {
        router.push(`/stores/${res.store.id}/dashboard`);
        router.refresh();
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          (trigger as React.ReactElement) || (
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              <span>{t("stores.createStore")}</span>
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <Store className="w-5 h-5" />
            </div>
            <DialogTitle>{t("stores.createStore")}</DialogTitle>
          </div>
          <DialogDescription>
            {t("stores.storeDescription")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="store-name">
              {t("stores.storeName")} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="store-name"
              placeholder="e.g. My Clothes & Bags Store"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="store-currency">{t("stores.currency")}</Label>
            <Select
              value={currency}
              onValueChange={(val) => setCurrency(val || "MMK")}
            >
              <SelectTrigger id="store-currency">
                <SelectValue placeholder="MMK" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MMK">MMK (ကျပ်)</SelectItem>
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="THB">THB (฿)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="store-desc">{t("stores.storeDescription")}</Label>
            <Textarea
              id="store-desc"
              rows={3}
              placeholder="e.g. Yangon, Hledan Branch / Online Store"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
