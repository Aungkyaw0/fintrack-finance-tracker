"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { updateStoreAction, deleteStoreAction } from "@/app/actions/stores";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Trash2, Save, Store } from "lucide-react";
import { toast } from "sonner";

export function StoreSettingsForm({
  store,
}: {
  store: {
    id: string;
    name: string;
    description?: string | null;
    currency: string;
    logoUrl?: string | null;
  };
}) {
  const t = useTranslations();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [name, setName] = useState(store.name);
  const [description, setDescription] = useState(store.description || "");
  const [currency, setCurrency] = useState(store.currency);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error(t("errors.required"));
      return;
    }

    setLoading(true);
    const res = await updateStoreAction(store.id, {
      name,
      description,
      currency,
    });
    setLoading(false);

    if (res.error) {
      toast.error(res.error);
      return;
    }

    toast.success("Store settings updated successfully!");
    router.refresh();
  }

  async function handleDelete() {
    if (
      !confirm(
        `Are you sure you want to permanently delete "${store.name}"? All associated products, sales, and transaction records will be permanently removed.`
      )
    ) {
      return;
    }

    setDeleting(true);
    const res = await deleteStoreAction(store.id);
    setDeleting(false);

    if (res.error) {
      toast.error(res.error);
      return;
    }

    toast.success("Store deleted.");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("stores.settings")}</CardTitle>
          <CardDescription className="text-xs">
            Manage store identity and default currency
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSave}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="s-name">
                {t("stores.storeName")} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="s-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="s-curr">{t("stores.currency")}</Label>
              <Select
                value={currency}
                onValueChange={(val) => setCurrency(val || "MMK")}
              >
                <SelectTrigger id="s-curr">
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
              <Label htmlFor="s-desc">{t("stores.storeDescription")}</Label>
              <Textarea
                id="s-desc"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={loading} className="gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                <Save className="w-4 h-4" />
                <span>{t("common.save")}</span>
              </Button>
            </div>
          </CardContent>
        </form>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/30 bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-base text-destructive">Danger Zone</CardTitle>
          <CardDescription className="text-xs">
            Irreversible store project deletion
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-foreground">
                Delete Store Project
              </p>
              <p className="text-xs text-muted-foreground">
                Permanently delete this store and all its inventory &amp; sales data.
              </p>
            </div>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
              className="gap-1.5 text-xs"
            >
              {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t("common.delete")}</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

