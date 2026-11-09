"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Printer, Download, Store, CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";

interface SaleVoucherProps {
  store: {
    name: string;
    description?: string | null;
    currency: string;
  };
  sale: {
    id: string;
    saleNumber: string;
    soldAt: Date | string;
    subtotal: string | number;
    discountAmount: string | number;
    totalAmount: string | number;
    paymentMethod: string;
    notes?: string | null;
    status: string;
    createdByName?: string | null;
    createdByEmail?: string | null;
  };
  items: Array<{
    id: string;
    productName: string | null;
    productSku?: string | null;
    quantity: number;
    unitPrice: string | number;
    lineTotal: string | number;
  }>;
}

const METHOD_LABELS: Record<string, string> = {
  kbz_pay: "KBZPay",
  wave_pay: "WavePay",
  aya_pay: "AYA Pay",
  cash: "Cash (ငွေသား)",
  bank_transfer: "Bank Transfer",
  other: "Other",
};

export function SaleVoucherDialog({ store, sale, items }: SaleVoucherProps) {
  const [open, setOpen] = useState(false);
  const t = useTranslations();

  const subtotal = Number(sale.subtotal) || 0;
  const discount = Number(sale.discountAmount) || 0;
  const total = Number(sale.totalAmount) || 0;
  const cashier = sale.createdByName || sale.createdByEmail || "Staff";

  function handlePrint() {
    window.print();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="gap-1.5 font-medium shadow-xs">
            <Printer className="w-4 h-4" />
            <span>{t("common.printVoucher")}</span>
          </Button>
        }
      />

      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6 print:max-w-none print:m-0 print:p-0 print:border-none print:shadow-none">
        <DialogHeader className="print:hidden">
          <DialogTitle className="text-base flex items-center justify-between">
            <span>{t("common.voucher")} Preview</span>
          </DialogTitle>
        </DialogHeader>

        {/* The Printable Slip Container */}
        <div
          id="printable-receipt"
          className="bg-card text-foreground border border-dashed rounded-xl p-5 sm:p-6 space-y-4 print:border-none print:p-4 print:text-black print:bg-white text-xs"
        >
          {/* Header */}
          <div className="text-center space-y-1 border-b border-dashed pb-3">
            <h2 className="text-base font-bold tracking-tight text-foreground print:text-black">
              {store.name}
            </h2>
            {store.description && (
              <p className="text-[11px] text-muted-foreground print:text-gray-600">
                {store.description}
              </p>
            )}
            <p className="text-[11px] font-mono font-semibold pt-1 text-foreground print:text-black">
              Voucher: {sale.saleNumber}
            </p>
            <p className="text-[10px] text-muted-foreground print:text-gray-500">
              {new Date(sale.soldAt).toLocaleString()}
            </p>
            <p className="text-[10px] text-muted-foreground print:text-gray-600">
              Cashier: <b className="font-semibold">{cashier}</b>
            </p>
          </div>

          {/* Items Table */}
          <div className="space-y-2 border-b border-dashed pb-3">
            <div className="flex justify-between font-bold text-[11px] text-muted-foreground print:text-gray-700 pb-1 border-b border-border">
              <span>Item</span>
              <span>Qty × Price</span>
              <span className="text-right">Total</span>
            </div>

            {items.map((it) => (
              <div key={it.id} className="space-y-0.5 text-[11px]">
                <div className="flex justify-between font-medium text-foreground print:text-black">
                  <span className="truncate max-w-[170px]">{it.productName}</span>
                  <span className="text-muted-foreground print:text-gray-600 text-[10px]">
                    {it.quantity} × {Number(it.unitPrice).toLocaleString()}
                  </span>
                  <span className="font-semibold text-right">
                    {Number(it.lineTotal).toLocaleString()} {store.currency}
                  </span>
                </div>
                {it.productSku && (
                  <div className="text-[9px] text-muted-foreground font-mono">
                    SKU: {it.productSku}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Summary / Calculations */}
          <div className="space-y-1.5 text-xs border-b border-dashed pb-3">
            <div className="flex justify-between text-muted-foreground print:text-gray-600">
              <span>Subtotal:</span>
              <span>
                {subtotal.toLocaleString()} {store.currency}
              </span>
            </div>

            {discount > 0 && (
              <div className="flex justify-between text-rose-600 dark:text-rose-400 font-medium">
                <span>Discount:</span>
                <span>
                  −{discount.toLocaleString()} {store.currency}
                </span>
              </div>
            )}

            <div className="flex justify-between text-sm font-extrabold text-foreground print:text-black pt-1 border-t border-border">
              <span>Grand Total:</span>
              <span>
                {total.toLocaleString()} {store.currency}
              </span>
            </div>

            <div className="flex justify-between text-[11px] text-muted-foreground print:text-gray-600 pt-1">
              <span>Payment:</span>
              <span className="font-semibold text-foreground print:text-black">
                {METHOD_LABELS[sale.paymentMethod] || sale.paymentMethod}
              </span>
            </div>

            <div className="flex justify-between text-[11px] text-muted-foreground print:text-gray-600">
              <span>Status:</span>
              <span className="font-semibold capitalize text-foreground print:text-black">
                {sale.status}
              </span>
            </div>
          </div>

          {/* Notes if any */}
          {sale.notes && (
            <div className="border-b border-dashed pb-2 text-[10px]">
              <span className="text-muted-foreground print:text-gray-500 font-semibold block">
                Notes:
              </span>
              <p className="text-foreground print:text-black italic whitespace-pre-wrap">
                {sale.notes}
              </p>
            </div>
          )}

          {/* Footer Thank You */}
          <div className="text-center pt-1 space-y-0.5 text-[10px] text-muted-foreground print:text-gray-500">
            <p className="font-medium text-foreground print:text-black">
              ကျေးဇူးတင်ပါသည် / Thank you!
            </p>
            <p>Software by FinTrack</p>
          </div>
        </div>

        {/* Actions bar */}
        <div className="flex items-center justify-end gap-2 pt-2 print:hidden">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setOpen(false)}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handlePrint}
            className="gap-1.5 font-semibold bg-primary text-primary-foreground shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>{t("common.printVoucher")}</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
