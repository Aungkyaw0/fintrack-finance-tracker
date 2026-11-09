"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createPurchaseAction } from "@/app/actions/purchases";
import { SupplierDialog } from "@/components/forms/supplier-dialog";
import { ImageUpload } from "@/components/forms/image-upload";
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
import {
  Plus,
  Trash2,
  Truck,
  Loader2,
  FileText,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

interface SupplierOption {
  id: string;
  name: string;
  phone?: string | null;
}

interface ProductOption {
  id: string;
  name: string;
  sku?: string | null;
  costPrice: string | number;
  currentStock: number;
}

interface LineItem {
  id: string;
  productId: string;
  quantity: number;
  unitCost: number;
}

export function PurchaseForm({
  storeId,
  currency,
  suppliers,
  products,
}: {
  storeId: string;
  currency: string;
  suppliers: SupplierOption[];
  products: ProductOption[];
}) {
  const t = useTranslations();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [supplierId, setSupplierId] = useState<string>("none");
  const [shippingCost, setShippingCost] = useState("0");
  const [notes, setNotes] = useState("");
  const [invoiceScreenshot, setInvoiceScreenshot] = useState<string | null>(null);

  // Initial line items
  const [items, setItems] = useState<LineItem[]>([
    {
      id: "1",
      productId: products[0]?.id || "",
      quantity: 1,
      unitCost: products[0] ? Number(products[0].costPrice) : 0,
    },
  ]);

  function handleProductChange(index: number, prodId: string) {
    const prod = products.find((p) => p.id === prodId);
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        productId: prodId,
        unitCost: prod ? Number(prod.costPrice) : 0,
      };
      return copy;
    });
  }

  function handleQuantityChange(index: number, qty: number) {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], quantity: Math.max(1, qty) };
      return copy;
    });
  }

  function handleCostChange(index: number, cost: number) {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], unitCost: Math.max(0, cost) };
      return copy;
    });
  }

  function addItem() {
    setItems((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        productId: products[0]?.id || "",
        quantity: 1,
        unitCost: products[0] ? Number(products[0].costPrice) : 0,
      },
    ]);
  }

  function removeItem(index: number) {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  // Calculations
  const subtotal = items.reduce(
    (acc, it) => acc + it.quantity * it.unitCost,
    0
  );
  const shipping = Number(shippingCost) || 0;
  const grandTotal = subtotal + shipping;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (items.length === 0 || !items[0].productId) {
      toast.error("Please add at least one product.");
      return;
    }

    setLoading(true);
    const res = await createPurchaseAction(storeId, {
      supplierId: supplierId === "none" ? null : supplierId,
      shippingCost: shipping,
      notes,
      invoiceScreenshot,
      items: items.map((it) => ({
        productId: it.productId,
        quantity: it.quantity,
        unitCost: it.unitCost,
      })),
    });
    setLoading(false);

    if (res.error) {
      toast.error(res.error);
      return;
    }

    toast.success("Stock-In recorded successfully! Inventory updated.");
    router.push(`/stores/${storeId}/purchases/${res.purchaseId}`);
    router.refresh();
  }

  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
          <h3 className="font-semibold text-gray-900">No products found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            You need to add products to your inventory before you can record purchases.
          </p>
          <Button
            onClick={() => router.push(`/stores/${storeId}/products/new`)}
            className="gap-2 text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>{t("products.addProduct")}</span>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column: Supplier & Invoice screenshot */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{t("suppliers.title")}</CardTitle>
                <SupplierDialog
                  storeId={storeId}
                  onCreated={(newSupId) => setSupplierId(newSupId)}
                  trigger={
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-indigo-600 px-1.5">
                      + Add
                    </Button>
                  }
                />
              </div>
            </CardHeader>
            <CardContent>
              <Select
                value={supplierId}
                onValueChange={(val) => setSupplierId(val || "none")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Supplier">
                    {(val) => {
                      if (!val || val === "none") return "-- No Supplier / Direct --";
                      const s = suppliers.find((x) => x.id === val);
                      return s ? `${s.name}${s.phone ? ` (${s.phone})` : ""}` : null;
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- No Supplier / Direct --</SelectItem>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} {s.phone ? `(${s.phone})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Supplier Invoice</CardTitle>
              <CardDescription className="text-xs">
                Upload bill or receipt screenshot
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <ImageUpload
                value={invoiceScreenshot}
                onChange={(url) => setInvoiceScreenshot(url)}
                onRemove={() => setInvoiceScreenshot(null)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("common.notes")}</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                rows={3}
                placeholder="Purchase details, tracking #, invoice notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right columns: Line Items & Summary */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Purchased Products</CardTitle>
                <CardDescription className="text-xs">
                  Stock will be automatically increased upon confirmation
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addItem}
                className="gap-1 text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Row
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-500">
                      Item #{idx + 1}
                    </span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="text-slate-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Product selector */}
                  <div>
                    <Label className="text-xs mb-1 block">
                      {t("products.productName")}
                    </Label>
                    <Select
                      value={item.productId}
                      onValueChange={(val) => handleProductChange(idx, val || "")}
                    >
                      <SelectTrigger className="w-full bg-white">
                        <SelectValue placeholder="Choose product...">
                          {(val) => {
                            const p = products.find((x) => x.id === val);
                            return p ? `${p.name} (Stock: ${p.currentStock})` : null;
                          }}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} {p.sku ? `(${p.sku})` : ""} — current: {p.currentStock}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Quantity & Unit Cost */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs mb-1 block">
                        {t("sales.quantity")}
                      </Label>
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        value={item.quantity}
                        onChange={(e) =>
                          handleQuantityChange(idx, parseInt(e.target.value) || 1)
                        }
                        className="bg-white"
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-xs mb-1 block">
                        Unit Cost ({currency})
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        step="any"
                        value={item.unitCost}
                        onChange={(e) =>
                          handleCostChange(idx, parseFloat(e.target.value) || 0)
                        }
                        className="bg-white"
                        required
                      />
                    </div>
                  </div>

                  <div className="text-right text-xs text-muted-foreground pt-1 border-t">
                    Subtotal:{" "}
                    <b className="text-gray-900">
                      {(item.quantity * item.unitCost).toLocaleString()} {currency}
                    </b>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Pricing Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Order Total</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Items Subtotal:</span>
                <span className="font-medium">
                  {subtotal.toLocaleString()} {currency}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <Label htmlFor="shipping" className="text-muted-foreground">
                  {t("purchases.shippingCost")}:
                </Label>
                <div className="w-32">
                  <Input
                    id="shipping"
                    type="number"
                    min="0"
                    step="any"
                    value={shippingCost}
                    onChange={(e) => setShippingCost(e.target.value)}
                    className="text-right h-8 text-sm"
                  />
                </div>
              </div>

              <div className="pt-3 border-t flex justify-between items-baseline">
                <span className="text-base font-bold text-gray-900">
                  {t("common.total")}:
                </span>
                <span className="text-2xl font-extrabold text-indigo-600">
                  {grandTotal.toLocaleString()} {currency}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Confirm Stock-In (+{items.reduce((a, b) => a + b.quantity, 0)} units)</span>
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}

