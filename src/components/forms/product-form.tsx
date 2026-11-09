"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createProductAction, updateProductAction, ProductFormData } from "@/app/actions/products";
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
import { ImageUpload } from "@/components/forms/image-upload";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CategoryOption {
  id: string;
  name: string;
  color: string | null;
}

export function ProductForm({
  storeId,
  currency,
  categories,
  initialData,
  isEdit = false,
}: {
  storeId: string;
  currency: string;
  categories: CategoryOption[];
  initialData?: {
    id?: string;
    name: string;
    sku?: string | null;
    categoryId?: string | null;
    description?: string | null;
    imageUrl?: string | null;
    costPrice: string | number;
    sellingPrice: string | number;
    currentStock?: number;
    lowStockThreshold?: number;
  };
  isEdit?: boolean;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState(initialData?.name || "");
  const [sku, setSku] = useState(initialData?.sku || "");
  const [categoryId, setCategoryId] = useState<string>(
    initialData?.categoryId || "none"
  );
  const [costPrice, setCostPrice] = useState(
    initialData?.costPrice ? String(initialData.costPrice) : ""
  );
  const [sellingPrice, setSellingPrice] = useState(
    initialData?.sellingPrice ? String(initialData.sellingPrice) : ""
  );
  const [stock, setStock] = useState(
    initialData?.currentStock !== undefined ? String(initialData.currentStock) : "0"
  );
  const [lowStockThreshold, setLowStockThreshold] = useState(
    initialData?.lowStockThreshold !== undefined
      ? String(initialData.lowStockThreshold)
      : "5"
  );
  const [description, setDescription] = useState(
    initialData?.description || ""
  );
  const [imageUrl, setImageUrl] = useState<string | null>(
    initialData?.imageUrl || null
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error(t("errors.required"));
      return;
    }

    setLoading(true);

    const payload: ProductFormData = {
      name: name.trim(),
      sku: sku.trim() || undefined,
      categoryId: categoryId === "none" ? null : categoryId,
      description: description.trim() || undefined,
      imageUrl: imageUrl || undefined,
      costPrice: Number(costPrice) || 0,
      sellingPrice: Number(sellingPrice) || 0,
      initialStock: Number(stock) || 0,
      lowStockThreshold: Number(lowStockThreshold) || 5,
    };

    if (isEdit && initialData?.id) {
      const res = await updateProductAction(storeId, initialData.id, payload);
      setLoading(false);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(t("common.save"));
      router.push(`/stores/${storeId}/products/${initialData.id}`);
      router.refresh();
    } else {
      const res = await createProductAction(storeId, payload);
      setLoading(false);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(t("common.save"));
      router.push(`/stores/${storeId}/products`);
      router.refresh();
    }
  }

  // Margin preview calculation
  const cost = Number(costPrice) || 0;
  const sell = Number(sellingPrice) || 0;
  const profitPerUnit = sell - cost;
  const marginPercent = sell > 0 ? Math.round((profitPerUnit / sell) * 100) : 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Image upload & Category */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {t("products.productImage")}
              </CardTitle>
              <CardDescription className="text-xs">
                Upload JPG, PNG or WebP
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <ImageUpload
                value={imageUrl}
                onChange={(url) => setImageUrl(url)}
                onRemove={() => setImageUrl(null)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("categories.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={categoryId}
                onValueChange={(val) => setCategoryId(val || "none")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- No Category --</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: c.color || "#6366f1" }}
                        />
                        <span>{c.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        {/* Right Columns: Basic details & Pricing & Stock */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {isEdit ? t("common.edit") : t("products.addProduct")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="product-name">
                  {t("products.productName")}{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="product-name"
                  placeholder="e.g. Cotton T-Shirt White (L)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sku">{t("products.sku")}</Label>
                <Input
                  id="sku"
                  placeholder="e.g. TSHIRT-WHT-L or Barcode"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="desc">{t("products.description")}</Label>
                <Textarea
                  id="desc"
                  rows={2}
                  placeholder="Optional details, sizes, colors..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pricing &amp; Inventory</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cost-price">
                    {t("products.costPrice")} ({currency})
                  </Label>
                  <Input
                    id="cost-price"
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sell-price">
                    {t("products.sellingPrice")} ({currency}){" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="sell-price"
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Profit Preview */}
              {sell > 0 && (
                <div className="p-3 rounded-lg bg-indigo-50/70 border border-indigo-100 flex items-center justify-between text-xs">
                  <span className="text-indigo-900 font-medium">
                    Estimated Profit / Unit:
                  </span>
                  <span className="font-bold text-indigo-700">
                    +{profitPerUnit.toLocaleString()} {currency} ({marginPercent}%)
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t">
                {!isEdit && (
                  <div className="space-y-2">
                    <Label htmlFor="stock">
                      {t("products.currentStock")} (Initial)
                    </Label>
                    <Input
                      id="stock"
                      type="number"
                      min="0"
                      step="1"
                      placeholder="0"
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="low-stock">
                    {t("products.lowStockThreshold")}
                  </Label>
                  <Input
                    id="low-stock"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="5"
                    value={lowStockThreshold}
                    onChange={(e) => setLowStockThreshold(e.target.value)}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Alert triggers when stock drops to or below this level.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={loading} className="gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{t("common.save")}</span>
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}

