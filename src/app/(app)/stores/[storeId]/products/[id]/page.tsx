import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getStoreById } from "@/app/actions/stores";
import { getProductById } from "@/app/actions/products";
import { StockAdjustmentDialog } from "@/components/forms/stock-adjustment-dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Package,
  ArrowLeft,
  Edit,
  History,
  TrendingUp,
  Tag,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ storeId: string; id: string }>;
}) {
  const { storeId, id } = await params;
  const store = await getStoreById(storeId);
  if (!store) notFound();

  const data = await getProductById(storeId, id);
  if (!data) notFound();

  const { product, movements } = data;
  const t = await getTranslations();

  const cost = Number(product.costPrice) || 0;
  const sell = Number(product.sellingPrice) || 0;
  const profitPerUnit = sell - cost;
  const marginPercent = sell > 0 ? Math.round((profitPerUnit / sell) * 100) : 0;

  const isOutOfStock = product.currentStock <= 0;
  const isLowStock =
    !isOutOfStock && product.currentStock <= product.lowStockThreshold;

  const MOVEMENT_LABELS: Record<string, string> = {
    sale: t("status.sale") || "Sale",
    purchase: t("status.purchase") || "Purchase",
    adjustment: t("status.adjustment") || "Adjustment",
    loss: t("status.loss") || "Loss",
    damage: t("status.damage") || "Damage",
    correction: t("status.correction") || "Correction",
    return: t("status.return") || "Return",
  };

  return (
    <div className="space-y-6">
      {/* Back button & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href={`/stores/${storeId}/products`}>
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {product.name}
              </h1>
              {product.categoryName && (
                <Badge variant="outline" className="text-xs">
                  <span
                    className="w-1.5 h-1.5 rounded-full mr-1.5"
                    style={{
                      backgroundColor: product.categoryColor || "#6366f1",
                    }}
                  />
                  {product.categoryName}
                </Badge>
              )}
            </div>
            {product.sku && (
              <p className="text-xs text-muted-foreground font-mono mt-0.5">
                SKU: {product.sku}
              </p>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <StockAdjustmentDialog
            storeId={storeId}
            productId={product.id}
            currentStock={product.currentStock}
            productName={product.name}
          />
        </div>
      </div>

      {/* Main Grid: Details & Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Product Image Card */}
        <Card className="flex flex-col items-center justify-center p-6 bg-card">
          <div className="w-48 h-48 rounded-2xl bg-muted overflow-hidden relative border flex items-center justify-center shadow-xs">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-cover"
                sizes="192px"
              />
            ) : (
              <Package className="w-16 h-16 text-muted-foreground/40" />
            )}
          </div>
          {product.description && (
            <p className="text-xs text-muted-foreground mt-4 text-center">
              {product.description}
            </p>
          )}
        </Card>

        {/* Key Metrics */}
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Current Stock */}
          <Card className="border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
                {t("products.currentStock")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-foreground">
                  {product.currentStock}
                </span>
                <Badge
                  variant={
                    isOutOfStock
                      ? "destructive"
                      : isLowStock
                      ? "default"
                      : "secondary"
                  }
                  className={`text-xs ${
                    isLowStock ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200" : ""
                  }`}
                >
                  {isOutOfStock
                    ? t("products.outOfStock")
                    : isLowStock
                    ? t("products.lowStock")
                    : t("products.inStock")}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2">
                {t("products.threshold")}: {product.lowStockThreshold} units
              </p>
            </CardContent>
          </Card>

          {/* Unit Profit */}
          <Card className="border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
                {t("products.estimatedProfit")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
                +{profitPerUnit.toLocaleString()} {store.currency}
              </div>
              <p className="text-[11px] text-muted-foreground mt-2">
                {t("products.margin")}: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{marginPercent}%</span>
              </p>
            </CardContent>
          </Card>

          {/* Cost Price */}
          <Card className="border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
                {t("products.costPrice")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {cost.toLocaleString()} {store.currency}
              </div>
            </CardContent>
          </Card>

          {/* Selling Price */}
          <Card className="border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
                {t("products.sellingPrice")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {sell.toLocaleString()} {store.currency}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Stock Movement Timeline */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600" />
            <div>
              <CardTitle className="text-base">
                {t("stock.movementHistory")}
              </CardTitle>
              <CardDescription className="text-xs">
                {t("products.stockAuditLog")}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {movements.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">
              No stock movements recorded yet.
            </p>
          ) : (
            <>
              {/* Mobile Card Layout (Zero Horizontal Scrolling) */}
              <div className="divide-y block md:hidden">
                {movements.map((m) => {
                  const isPositive = m.quantityChange > 0;
                  return (
                    <div key={m.id} className="py-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[11px] font-medium">
                            {MOVEMENT_LABELS[m.movementType] || m.movementType}
                          </Badge>
                          <span className="text-[11px] text-muted-foreground">
                            {new Date(m.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <span
                          className={`text-sm font-bold ${
                            isPositive ? "text-emerald-600" : "text-rose-600"
                          }`}
                        >
                          {isPositive ? `+${m.quantityChange}` : m.quantityChange}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {t("products.stockBeforeAfter")}: {m.stockBefore} →{" "}
                          <strong className="text-foreground">{m.stockAfter}</strong>
                          {(m.createdByName || m.createdByEmail) && (
                            <span className="block text-[10px] text-muted-foreground">
                              By: {m.createdByName || m.createdByEmail}
                            </span>
                          )}
                        </span>
                        {m.notes && (
                          <span className="truncate max-w-[140px] italic">
                            {m.notes}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[160px]">{t("common.date")}</TableHead>
                      <TableHead>{t("products.type")}</TableHead>
                      <TableHead className="text-center">{t("products.change")}</TableHead>
                      <TableHead className="text-center">{t("products.stockBeforeAfter")}</TableHead>
                      <TableHead>Staff / User</TableHead>
                      <TableHead>{t("common.notes")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.map((m) => {
                      const isPositive = m.quantityChange > 0;
                      return (
                        <TableRow key={m.id} className="text-xs">
                          <TableCell className="text-muted-foreground">
                            {new Date(m.createdAt).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize text-[11px]">
                              {MOVEMENT_LABELS[m.movementType] || m.movementType}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center font-bold">
                            <span
                              className={
                                isPositive ? "text-emerald-600" : "text-rose-600"
                              }
                            >
                              {isPositive
                                ? `+${m.quantityChange}`
                                : m.quantityChange}
                            </span>
                          </TableCell>
                          <TableCell className="text-center font-mono">
                            {m.stockBefore} → <b>{m.stockAfter}</b>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {m.createdByName || m.createdByEmail || "System"}
                          </TableCell>
                          <TableCell className="text-muted-foreground max-w-xs truncate">
                            {m.notes || "—"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

