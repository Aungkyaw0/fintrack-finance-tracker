import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getStoreById } from "@/app/actions/stores";
import { getSaleById } from "@/app/actions/sales";
import { CancelSaleDialog } from "@/components/forms/cancel-sale-dialog";
import { SaleVoucherDialog } from "@/components/receipt/sale-voucher-dialog";
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
  ArrowLeft,
  ShoppingCart,
  QrCode,
  Calendar,
  CreditCard,
  CheckCircle2,
  XCircle,
  FileText,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

const METHOD_LABELS: Record<string, string> = {
  kbz_pay: "KBZPay",
  wave_pay: "WavePay",
  aya_pay: "AYA Pay",
  cash: "Cash (ငွေသား)",
  bank_transfer: "Bank Transfer",
  other: "Other",
};

export default async function SaleDetailPage({
  params,
}: {
  params: Promise<{ storeId: string; id: string }>;
}) {
  const { storeId, id } = await params;
  const store = await getStoreById(storeId);
  if (!store) notFound();

  const data = await getSaleById(storeId, id);
  if (!data) notFound();

  const { sale, items, screenshots } = data;
  const t = await getTranslations();

  const isCompleted = sale.status === "completed";

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href={`/stores/${storeId}/sales`}>
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground font-mono">
                {sale.saleNumber}
              </h1>
              <Badge
                variant={isCompleted ? "secondary" : "destructive"}
                className="capitalize text-xs"
              >
                {t("status." + sale.status) || sale.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {new Date(sale.soldAt).toLocaleString()} ·{" "}
              {METHOD_LABELS[sale.paymentMethod] || sale.paymentMethod}
              {(sale.createdByName || sale.createdByEmail) && (
                <>
                  {" "}· Recorded by:{" "}
                  <b className="font-semibold text-foreground">
                    {sale.createdByName || sale.createdByEmail}
                  </b>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <SaleVoucherDialog
            store={{
              name: store.name,
              description: store.description,
              currency: store.currency,
            }}
            sale={sale}
            items={items}
          />
          {isCompleted && (
            <CancelSaleDialog
              storeId={storeId}
              saleId={sale.id}
              saleNumber={sale.saleNumber}
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Payment Screenshot & Notes */}
        <div className="space-y-6">
          {/* Payment Evidence Screenshot */}
          <Card className="border bg-card">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-primary" />
                <CardTitle className="text-sm font-semibold text-foreground">
                  {t("sales.paymentScreenshot")}
                </CardTitle>
              </div>
              <CardDescription className="text-xs">
                {METHOD_LABELS[sale.paymentMethod] || sale.paymentMethod} Evidence
              </CardDescription>
            </CardHeader>
            <CardContent>
              {screenshots.length === 0 ? (
                <div className="text-center py-6 border border-dashed rounded-xl bg-muted/30">
                  <p className="text-xs text-muted-foreground">
                    No screenshot attached.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {screenshots.map((s) => (
                    <a
                      key={s.id}
                      href={s.storagePath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block relative aspect-4/3 rounded-xl overflow-hidden border bg-muted hover:opacity-95 transition-opacity shadow-xs"
                    >
                      <Image
                        src={s.storagePath}
                        alt="Payment screenshot"
                        fill
                        className="object-contain"
                      />
                    </a>
                  ))}
                  <p className="text-[10px] text-center text-muted-foreground">
                    Click to inspect full image
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes Card */}
          {sale.notes && (
            <Card className="border bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
                  {t("common.notes")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-foreground whitespace-pre-wrap">
                  {sale.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Columns: Sold Items Table & Totals */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("sales.soldItems") || "Sold Items"}</CardTitle>
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
                        {it.quantity} × {Number(it.unitPrice).toLocaleString()} {store.currency}
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
                      <TableHead className="text-right">{t("sales.unitPrice")}</TableHead>
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
                          {it.quantity}
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          {Number(it.unitPrice).toLocaleString()} {store.currency}
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
                  <span>{t("sales.subtotal")}:</span>
                  <span>
                    {Number(sale.subtotal).toLocaleString()} {store.currency}
                  </span>
                </div>
                {Number(sale.discountAmount) > 0 && (
                  <div className="flex justify-between text-xs text-rose-600 dark:text-rose-400">
                    <span>{t("sales.discount")}:</span>
                    <span>
                      −{Number(sale.discountAmount).toLocaleString()}{" "}
                      {store.currency}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-baseline pt-2 border-t font-bold">
                  <span className="text-sm text-foreground">
                    {t("sales.totalAmount")}:
                  </span>
                  <span className="text-xl text-emerald-600">
                    {Number(sale.totalAmount).toLocaleString()} {store.currency}
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

