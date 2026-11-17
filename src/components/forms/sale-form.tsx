"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createSaleAction, PaymentMethod } from "@/app/actions/sales";
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
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Trash2,
  ShoppingCart,
  Loader2,
  AlertCircle,
  CreditCard,
  QrCode,
  Banknote,
} from "lucide-react";
import { toast } from "sonner";

interface ProductOption {
  id: string;
  name: string;
  sku?: string | null;
  sellingPrice: string | number;
  currentStock: number;
}

interface SaleLineItem {
  id: string;
  productId: string;
  quantity: number | "";
  unitPrice: number | "";
  discount: number;
}

const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: string }[] = [
  { id: "kbz_pay", label: "KBZPay", icon: "📱" },
  { id: "wave_pay", label: "WavePay", icon: "📱" },
  { id: "aya_pay", label: "AYA Pay", icon: "📱" },
  { id: "cash", label: "Cash (ငွေသား)", icon: "💵" },
  { id: "bank_transfer", label: "Bank Transfer", icon: "🏦" },
  { id: "other", label: "Other", icon: "💳" },
];

export function SaleForm({
  storeId,
  currency,
  products,
}: {
  storeId: string;
  currency: string;
  products: ProductOption[];
}) {
  const t = useTranslations();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("kbz_pay");
  const [overallDiscount, setOverallDiscount] = useState("0");
  const [notes, setNotes] = useState("");
  const [paymentScreenshot, setPaymentScreenshot] = useState<string | null>(null);

  // Available in-stock products
  const inStockProducts = products.filter((p) => p.currentStock > 0);

  const [items, setItems] = useState<SaleLineItem[]>([
    {
      id: "1",
      productId: inStockProducts[0]?.id || "",
      quantity: 1,
      unitPrice: inStockProducts[0] ? Number(inStockProducts[0].sellingPrice) : 0,
      discount: 0,
    },
  ]);

  function handleProductChange(index: number, prodId: string) {
    const prod = products.find((p) => p.id === prodId);
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        productId: prodId,
        unitPrice: prod ? Number(prod.sellingPrice) : 0,
        quantity: 1,
      };
      return copy;
    });
  }

  function handleQuantityChange(index: number, valStr: string) {
    if (valStr === "") {
      setItems((prev) => {
        const copy = [...prev];
        copy[index] = { ...copy[index], quantity: "" };
        return copy;
      });
      return;
    }

    const qty = parseInt(valStr, 10);
    if (isNaN(qty)) return;

    const it = items[index];
    const prod = products.find((p) => p.id === it.productId);
    const maxStock = prod ? prod.currentStock : 1;

    if (qty > maxStock) {
      toast.error(`Only ${maxStock} items left in stock for ${prod?.name}`);
    }

    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], quantity: qty };
      return copy;
    });
  }

  function handlePriceChange(index: number, valStr: string) {
    if (valStr === "") {
      setItems((prev) => {
        const copy = [...prev];
        copy[index] = { ...copy[index], unitPrice: "" };
        return copy;
      });
      return;
    }

    const price = parseFloat(valStr);
    if (isNaN(price)) return;

    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], unitPrice: Math.max(0, price) };
      return copy;
    });
  }

  function addItem() {
    setItems((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        productId: inStockProducts[0]?.id || "",
        quantity: 1,
        unitPrice: inStockProducts[0]
          ? Number(inStockProducts[0].sellingPrice)
          : 0,
        discount: 0,
      },
    ]);
  }

  function removeItem(index: number) {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  // Calculations
  const subtotal = items.reduce(
    (acc, it) =>
      acc +
      (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0) -
      (it.discount || 0),
    0
  );
  const discountTotal = Number(overallDiscount) || 0;
  const grandTotal = Math.max(0, subtotal - discountTotal);
  const totalUnits = items.reduce(
    (acc, it) => acc + (Number(it.quantity) || 0),
    0
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (items.length === 0 || !items[0].productId) {
      toast.error("Please add at least one product to the sale.");
      return;
    }

    // Validate stocks before sending
    for (const it of items) {
      const q = Number(it.quantity);
      if (!q || q <= 0) {
        toast.error("Please enter a valid quantity for all items.");
        return;
      }
      const prod = products.find((p) => p.id === it.productId);
      if (prod && q > prod.currentStock) {
        toast.error(
          `Insufficient stock for "${prod.name}". Available: ${prod.currentStock}`
        );
        return;
      }
    }

    setLoading(true);
    const res = await createSaleAction(storeId, {
      paymentMethod,
      discountAmount: discountTotal,
      notes,
      paymentScreenshot,
      items: items.map((it) => ({
        productId: it.productId,
        quantity: Number(it.quantity) || 1,
        unitPrice: Number(it.unitPrice) || 0,
        discount: it.discount,
      })),
    });
    setLoading(false);

    if (res.error) {
      toast.error(res.error);
      return;
    }

    toast.success("Sale completed! Stock updated atomically.");
    router.push(`/stores/${storeId}/sales/${res.saleId}`);
    router.refresh();
  }

  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
          <h3 className="font-semibold text-foreground">No products found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Add products to your store before recording sales.
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
        {/* Left column: Payment Method & Payment Screenshot */}
        <div className="space-y-6">
          {/* Payment Method */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t("sales.paymentMethod")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_METHODS.map((pm) => (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => setPaymentMethod(pm.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all text-left ${
                      paymentMethod === pm.id
                        ? "border-primary bg-primary/10 text-primary shadow-2xs ring-1 ring-primary"
                        : "border-border bg-card text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    }`}
                  >
                    <span className="text-base">{pm.icon}</span>
                    <span className="truncate">{pm.label}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Payment Screenshot (The Core Feature) */}
          <Card className="border-indigo-200">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-indigo-600" />
                <CardTitle className="text-base">
                  {t("sales.paymentScreenshot")}
                </CardTitle>
              </div>
              <CardDescription className="text-xs">
                KBZPay / WavePay / Bank slip evidence
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <ImageUpload
                value={paymentScreenshot}
                onChange={(url) => setPaymentScreenshot(url)}
                onRemove={() => setPaymentScreenshot(null)}
              />
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t("common.notes")}</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                rows={3}
                placeholder="Customer name, phone, delivery address, voucher notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right columns: Products selection, quantities & Totals */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">{t("sales.selectProducts")}</CardTitle>
                <CardDescription className="text-xs">
                  Stock will be automatically deducted upon confirmation
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
                Add Item
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {items.map((item, idx) => {
                const prod = products.find((p) => p.id === item.productId);
                const maxStock = prod ? prod.currentStock : 0;
                const isOverStock = Number(item.quantity) > maxStock;

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 sm:p-4 rounded-xl border transition-colors space-y-3.5 ${
                      isOverStock
                        ? "bg-destructive/10 border-destructive/40"
                        : "bg-muted/30 dark:bg-muted/10 border-border"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-muted-foreground">
                        Item #{idx + 1}
                      </span>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Product Selector */}
                    <div>
                      <Label className="text-xs mb-1 block font-medium text-foreground">
                        {t("products.productName")}
                      </Label>
                      <Select
                        value={item.productId}
                        onValueChange={(val) =>
                          handleProductChange(idx, val || "")
                        }
                      >
                        <SelectTrigger className="w-full bg-background border-input text-foreground">
                          <SelectValue placeholder="Choose product...">
                            {(val) => {
                              const p = products.find((x) => x.id === val);
                              return p ? `${p.name} (Left: ${p.currentStock})` : null;
                            }}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((p) => (
                            <SelectItem
                              key={p.id}
                              value={p.id}
                              disabled={p.currentStock <= 0}
                            >
                              <div className="flex items-center justify-between w-full gap-3">
                                <span className="font-medium">{p.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  (Left: {p.currentStock})
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Quantity & Unit Price */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <Label className="text-xs font-medium text-foreground">
                            {t("sales.quantity")}
                          </Label>
                          {prod && (
                            <span
                              className={`text-[10px] ${
                                isOverStock
                                  ? "text-destructive font-bold"
                                  : "text-muted-foreground"
                              }`}
                            >
                              Max: {maxStock}
                            </span>
                          )}
                        </div>
                        <Input
                          type="number"
                          min="1"
                          max={maxStock > 0 ? maxStock : 1}
                          step="1"
                          value={item.quantity}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) =>
                            handleQuantityChange(idx, e.target.value)
                          }
                          onBlur={() => {
                            if (item.quantity === "" || Number(item.quantity) < 1) {
                              handleQuantityChange(idx, "1");
                            }
                          }}
                          className="bg-background border-input text-foreground font-semibold"
                          required
                        />
                      </div>

                      <div>
                        <Label className="text-xs mb-1 block font-medium text-foreground">
                          {t("sales.unitPrice")} ({currency})
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          step="any"
                          value={item.unitPrice}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) =>
                            handlePriceChange(idx, e.target.value)
                          }
                          onBlur={() => {
                            if (item.unitPrice === "") handlePriceChange(idx, "0");
                          }}
                          className="bg-background border-input text-foreground font-semibold"
                          required
                        />
                      </div>
                    </div>

                    <div className="text-right text-xs text-muted-foreground pt-1 border-t border-border">
                      Line Total:{" "}
                      <b className="text-foreground font-bold">
                        {(
                          (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)
                        ).toLocaleString()}{" "}
                        {currency}
                      </b>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Pricing & Checkout summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Sale Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Subtotal ({totalUnits} units):
                </span>
                <span className="font-medium">
                  {subtotal.toLocaleString()} {currency}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <Label htmlFor="disc" className="text-muted-foreground">
                  {t("sales.discount")} ({currency}):
                </Label>
                <div className="w-32">
                  <Input
                    id="disc"
                    type="number"
                    min="0"
                    step="any"
                    value={overallDiscount}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setOverallDiscount(e.target.value)}
                    className="text-right h-8 text-sm bg-background border-input text-foreground font-semibold"
                  />
                </div>
              </div>

              <div className="pt-3 border-t flex justify-between items-baseline">
                <div>
                  <span className="text-base font-bold text-foreground block">
                    {t("sales.totalAmount")}:
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Method: {PAYMENT_METHODS.find((p) => p.id === paymentMethod)?.label}
                  </span>
                </div>
                <span className="text-2xl font-extrabold text-emerald-600">
                  {grandTotal.toLocaleString()} {currency}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Action buttons */}
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
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <ShoppingCart className="w-4 h-4" />
              <span>
                {t("sales.confirmSale")} (−{totalUnits} stock)
              </span>
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}

