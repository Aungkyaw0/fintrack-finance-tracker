"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  createSupplierAction,
  updateSupplierAction,
  SupplierInput,
} from "@/app/actions/suppliers";
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
import { Users, Plus, Loader2, Edit } from "lucide-react";
import { toast } from "sonner";

export function SupplierDialog({
  storeId,
  initialData,
  isEdit = false,
  trigger,
  onCreated,
}: {
  storeId: string;
  initialData?: {
    id: string;
    name: string;
    phone?: string | null;
    address?: string | null;
    notes?: string | null;
  };
  isEdit?: boolean;
  trigger?: React.ReactNode;
  onCreated?: (supplierId: string) => void;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState(initialData?.name || "");
  const [phone, setPhone] = useState(initialData?.phone || "");
  const [address, setAddress] = useState(initialData?.address || "");
  const [notes, setNotes] = useState(initialData?.notes || "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error(t("errors.required"));
      return;
    }

    setLoading(true);
    const payload: SupplierInput = {
      name: name.trim(),
      phone: phone.trim() || undefined,
      address: address.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    if (isEdit && initialData) {
      const res = await updateSupplierAction(storeId, initialData.id, payload);
      setLoading(false);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(t("common.save"));
    } else {
      const res = await createSupplierAction(storeId, payload);
      setLoading(false);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(t("common.save"));
      if (res.supplier && onCreated) {
        onCreated(res.supplier.id);
      }
    }

    setOpen(false);
    if (!isEdit) {
      setName("");
      setPhone("");
      setAddress("");
      setNotes("");
    }
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          (trigger as React.ReactElement) || (
            <Button size="sm" className="gap-1.5 shadow-sm text-xs">
              <Plus className="w-3.5 h-3.5" />
              <span>{t("suppliers.addSupplier")}</span>
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <Users className="w-5 h-5" />
            </div>
            <DialogTitle>
              {isEdit ? t("common.edit") : t("suppliers.addSupplier")}
            </DialogTitle>
          </div>
          <DialogDescription>
            {t("suppliers.supplierName")} &amp; contact info
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="sup-name">
              {t("suppliers.supplierName")} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="sup-name"
              placeholder="e.g. ABC Wholesaler"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sup-phone">{t("suppliers.phone")}</Label>
            <Input
              id="sup-phone"
              type="tel"
              placeholder="e.g. 09 1234 5678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sup-address">{t("suppliers.address")}</Label>
            <Input
              id="sup-address"
              placeholder="e.g. Bogyoke Market, Shop #12"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sup-notes">{t("common.notes")}</Label>
            <Textarea
              id="sup-notes"
              rows={2}
              placeholder="Payment terms, bank accounts..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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

