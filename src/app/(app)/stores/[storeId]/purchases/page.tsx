import Link from "next/link";
import { notFound } from "next/navigation";
import { getStoreById } from "@/app/actions/stores";
import { getPurchases } from "@/app/actions/purchases";
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
import { Truck, Plus, Eye, Calendar, User } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function PurchasesPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const store = await getStoreById(storeId);
  if (!store) notFound();

  const purchases = await getPurchases(storeId);
  const t = await getTranslations();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            {t("purchases.title")} (Stock-In)
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {purchases.length} {t("purchases.purchaseHistory").toLowerCase()}
          </p>
        </div>

        <Link href={`/stores/${storeId}/purchases/new`}>
          <Button className="gap-1.5 shadow-sm">
            <Plus className="w-4 h-4" />
            <span>{t("purchases.newPurchase")}</span>
          </Button>
        </Link>
      </div>

      {/* Purchases List */}
      {purchases.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
              <Truck className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">
              {t("purchases.noPurchases")}
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Record inventory purchases from suppliers to accurately calculate
              your COGS and inventory valuation.
            </p>
            <Link href={`/stores/${storeId}/purchases/new`}>
              <Button size="sm" className="gap-1.5">
                <Plus className="w-4 h-4" />
                {t("purchases.newPurchase")}
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobile Card List (No horizontal scroll!) */}
          <div className="space-y-3 md:hidden">
            {purchases.map((p) => (
              <Link
                key={p.id}
                href={`/stores/${storeId}/purchases/${p.id}`}
                className="block"
              >
                <Card className="hover:border-indigo-300 transition-colors bg-white">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-indigo-600">
                            {p.purchaseNumber}
                          </span>
                          <Badge variant="secondary" className="text-[10px] capitalize">
                            {t("status." + p.status) || p.status}
                          </Badge>
                        </div>
                        <p className="text-xs font-medium text-slate-800 mt-1">
                          {p.supplierName ? p.supplierName : "Direct / No Supplier"}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-base font-bold text-gray-900 block">
                          {Number(p.totalAmount).toLocaleString()} {store.currency}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {new Date(p.purchasedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {Number(p.shippingCost) > 0 && (
                      <p className="text-[11px] text-muted-foreground pt-1.5 border-t">
                        Shipping: +{Number(p.shippingCost).toLocaleString()} {store.currency}
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
                    <TableHead>{t("purchases.purchaseNumber")}</TableHead>
                    <TableHead>{t("purchases.supplier")}</TableHead>
                    <TableHead>{t("common.date")}</TableHead>
                    <TableHead className="text-right">Shipping</TableHead>
                    <TableHead className="text-right">{t("common.total")}</TableHead>
                    <TableHead className="text-center">{t("common.status")}</TableHead>
                    <TableHead className="w-[80px] text-right">
                      {t("common.actions")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchases.map((p) => (
                    <TableRow key={p.id} className="hover:bg-slate-50/70">
                      <TableCell className="font-mono font-medium text-xs text-indigo-600">
                        <Link
                          href={`/stores/${storeId}/purchases/${p.id}`}
                          className="hover:underline"
                        >
                          {p.purchaseNumber}
                        </Link>
                      </TableCell>
                      <TableCell className="text-xs text-gray-900">
                        {p.supplierName ? (
                          <span className="font-medium">{p.supplierName}</span>
                        ) : (
                          <span className="text-muted-foreground">Direct / Other</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(p.purchasedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {Number(p.shippingCost) > 0
                          ? `${Number(p.shippingCost).toLocaleString()} ${store.currency}`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-xs text-gray-900">
                        {Number(p.totalAmount).toLocaleString()} {store.currency}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="text-[10px] capitalize">
                          {t("status." + p.status) || p.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/stores/${storeId}/purchases/${p.id}`}>
                          <Button variant="ghost" size="sm" className="h-8 px-2 text-indigo-600">
                            <Eye className="w-4 h-4 mr-1" />
                            <span className="text-xs">View</span>
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

