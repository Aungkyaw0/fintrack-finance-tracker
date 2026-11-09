import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getStoreById } from "@/app/actions/stores";
import { getSales } from "@/app/actions/sales";
import { Card, CardContent } from "@/components/ui/card";
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
  ShoppingCart,
  Plus,
  Eye,
  Calendar,
  CreditCard,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
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

export default async function SalesPage({
  params,
  searchParams,
}: {
  params: Promise<{ storeId: string }>;
  searchParams: Promise<{ method?: string; status?: string }>;
}) {
  const { storeId } = await params;
  const { method, status } = await searchParams;

  const store = await getStoreById(storeId);
  if (!store) notFound();

  const sales = await getSales(storeId, {
    paymentMethod: method,
    status: status,
  });
  const t = await getTranslations();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            {t("sales.title")} &amp; Timeline
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {sales.length} transactions recorded
          </p>
        </div>

        <Link href={`/stores/${storeId}/sales/new`}>
          <Button className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
            <Plus className="w-4 h-4" />
            <span>{t("sales.newSale")}</span>
          </Button>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        <Link
          href={`/stores/${storeId}/sales`}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
            !method ? "bg-indigo-600 text-white" : "bg-white border text-slate-600 hover:bg-slate-50"
          }`}
        >
          All Methods
        </Link>
        {["kbz_pay", "wave_pay", "aya_pay", "cash", "bank_transfer"].map((m) => (
          <Link
            key={m}
            href={`/stores/${storeId}/sales?method=${m}`}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              method === m
                ? "bg-indigo-600 text-white"
                : "bg-white border text-slate-600 hover:bg-slate-50"
            }`}
          >
            {METHOD_LABELS[m] || m}
          </Link>
        ))}
      </div>

      {/* Sales List */}
      {sales.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">
              {t("sales.noSales")}
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Create your first sale to start recording revenue and tracking customer payment receipts.
            </p>
            <Link href={`/stores/${storeId}/sales/new`}>
              <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
                <Plus className="w-4 h-4" />
                {t("sales.newSale")}
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobile Card List (No horizontal scroll!) */}
          <div className="space-y-3 md:hidden">
            {sales.map((s) => (
              <Link
                key={s.id}
                href={`/stores/${storeId}/sales/${s.id}`}
                className="block"
              >
                <Card className="hover:border-indigo-300 transition-colors bg-white">
                  <CardContent className="p-4 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-indigo-600">
                            {s.saleNumber}
                          </span>
                          <Badge
                            variant={s.status === "completed" ? "secondary" : "destructive"}
                            className="text-[10px] capitalize"
                          >
                            {t("status." + s.status) || s.status}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {new Date(s.soldAt).toLocaleString()}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-base font-bold text-emerald-600 block">
                          +{Number(s.totalAmount).toLocaleString()} {store.currency}
                        </span>
                        <Badge variant="outline" className="text-[10px] font-normal mt-0.5">
                          {METHOD_LABELS[s.paymentMethod] || s.paymentMethod}
                        </Badge>
                      </div>
                    </div>

                    {s.notes && (
                      <p className="text-xs text-slate-600 pt-2 border-t line-clamp-2">
                        {s.notes}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Desktop Table View */}
          <Card className="hidden md:block overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("sales.saleNumber")}</TableHead>
                    <TableHead>{t("common.date")}</TableHead>
                    <TableHead>{t("sales.paymentMethod")}</TableHead>
                    <TableHead>{t("common.notes")}</TableHead>
                    <TableHead className="text-right">{t("common.total")}</TableHead>
                    <TableHead className="text-center">{t("common.status")}</TableHead>
                    <TableHead className="w-[80px] text-right">
                      {t("common.actions")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((s) => (
                    <TableRow key={s.id} className="hover:bg-slate-50/70">
                      <TableCell className="font-mono font-medium text-xs text-indigo-600">
                        <Link
                          href={`/stores/${storeId}/sales/${s.id}`}
                          className="hover:underline"
                        >
                          {s.saleNumber}
                        </Link>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(s.soldAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs font-normal">
                          {METHOD_LABELS[s.paymentMethod] || s.paymentMethod}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                        {s.notes || "—"}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-xs sm:text-sm text-emerald-600">
                        +{Number(s.totalAmount).toLocaleString()} {store.currency}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={s.status === "completed" ? "secondary" : "destructive"}
                          className="text-[10px] capitalize"
                        >
                          {t("status." + s.status) || s.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/stores/${storeId}/sales/${s.id}`}>
                          <Button variant="ghost" size="sm" className="h-8 px-2 text-indigo-600">
                            <Eye className="w-4 h-4 mr-1" />
                            <span className="text-xs">Receipt</span>
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

