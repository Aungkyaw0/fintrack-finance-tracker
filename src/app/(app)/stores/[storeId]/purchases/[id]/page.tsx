import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getStoreById } from "@/app/actions/stores";
import { getPurchaseById } from "@/app/actions/purchases";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ArrowLeft, Truck, Image as ImageIcon, Calendar, User } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function PurchaseDetailPage({
  params,
}: {
  params: Promise<{ storeId: string; id: string }>;
}) {
  const { storeId, id } = await params;
  const store = await getStoreById(storeId);
  if (!store) notFound();

  const data = await getPurchaseById(storeId, id);
  if (!data) notFound();

  const { purchase, items, screenshots } = data;
  const t = await getTranslations();

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/stores/${storeId}/purchases`}>
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground font-mono">
              {purchase.purchaseNumber}
            </h1>
            <Badge variant="secondary" className="capitalize text-xs">
              {t("status." + purchase.status) || purchase.status}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {new Date(purchase.purchasedAt).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Supplier & Invoice */}
        <div className="space-y-6">
          <Card className="border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
                {t("purchases.supplier")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <p className="text-base font-bold text-foreground">
                {purchase.supplierName || "Direct / No Supplier"}
              </p>
              {purchase.supplierPhone && (
                <p className="text-xs text-muted-foreground font-mono">
                  {purchase.supplierPhone}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Invoice Screenshot */}
          <Card className="border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
                Invoice / Payment Evidence
              </CardTitle>
            </CardHeader>
            <CardContent>
              {screenshots.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">
                  No invoice attached.
                </p>
              ) : (
                <div className="space-y-3">
                  {screenshots.map((s) => (
                    <a
                      key={s.id}
                      href={s.storagePath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block relative aspect-4/3 rounded-xl overflow-hidden border bg-muted hover:opacity-90 transition-opacity"
                    >
                      <Image
                        src={s.storagePath}
                        alt="Invoice receipt"
                        fill
                        className="object-contain"
                      />
                    </a>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {purchase.notes && (
            <Card className="border bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
                  {t("common.notes")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-foreground whitespace-pre-wrap">
                  {purchase.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Columns: Purchased Items Table & Totals */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("purchases.stockInItems") || "Stock-In Items"}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {/* Mobile Card List (Zero Horizontal Scroll) */}
              <div className="divide-y block md:hidden px-4">
                {items.map((it) => (
                  <div key={it.id} className="py-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <Link
                        href={`/stores/${storeId}/products/${it.productId}`}
                        className="font-semibold text-xs text-foreground hover:text-indigo-600 truncate max-w-[200px]"
                      >
                        {it.productName}
                      </Link>
                      <span className="text-xs font-bold text-foreground">
                        {Number(it.lineTotal).toLocaleString()} {store.currency}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>
                        +{it.quantity} × {Number(it.unitCost).toLocaleString()} {store.currency}
                      </span>
                      {it.productSku && (
                        <span className="font-mono text-[10px]">{it.productSku}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("products.productName")}</TableHead>
                      <TableHead className="text-center">{t("sales.quantity")}</TableHead>
                      <TableHead className="text-right">{t("purchases.unitCost") || "Unit Cost"}</TableHead>
                      <TableHead className="text-right">{t("common.total")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((it) => (
                      <TableRow key={it.id}>
                        <TableCell>
                          <Link
                            href={`/stores/${storeId}/products/${it.productId}`}
                            className="font-medium text-xs hover:text-indigo-600"
                          >
                            {it.productName}
                          </Link>
                          {it.productSku && (
                            <span className="text-[10px] text-muted-foreground block font-mono">
                              {it.productSku}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-center font-bold text-xs">
                          +{it.quantity}
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          {Number(it.unitCost).toLocaleString()} {store.currency}
                        </TableCell>
                        <TableCell className="text-right font-medium text-xs">
                          {Number(it.lineTotal).toLocaleString()} {store.currency}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Totals Breakdown */}
              <div className="p-4 border-t space-y-2 bg-muted/30">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Shipping Cost:</span>
                  <span>
                    {Number(purchase.shippingCost).toLocaleString()} {store.currency}
                  </span>
                </div>
                <div className="flex justify-between items-baseline pt-2 border-t font-bold">
                  <span className="text-sm text-foreground">{t("common.total")}:</span>
                  <span className="text-lg text-primary">
                    {Number(purchase.totalAmount).toLocaleString()} {store.currency}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

