import Link from "next/link";
import { notFound } from "next/navigation";
import { getStoreById } from "@/app/actions/stores";
import { getUserStoreRole } from "@/app/actions/members";
import { db } from "@/lib/db";
import { products, sales, saleItems, expenses } from "@/lib/schema";
import { eq, sql, desc, and } from "drizzle-orm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Receipt,
  AlertTriangle,
  Plus,
  ShoppingCart,
  Package,
  Truck,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  ChevronRight,
  Wallet,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function StoreDashboardPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const store = await getStoreById(storeId);
  if (!store) notFound();

  const role = await getUserStoreRole(storeId);
  const isStaff = role === "staff";

  const t = await getTranslations();

  // Fetch basic counts and totals for this store
  const [productsCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(products)
    .where(eq(products.storeId, storeId));

  const [lowStockCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(products)
    .where(
      and(
        eq(products.storeId, storeId),
        sql`${products.currentStock} <= ${products.lowStockThreshold}`
      )
    );

  const [salesSummary] = await db
    .select({
      totalRevenue: sql<string>`coalesce(sum(${sales.totalAmount}), 0)`,
      count: sql<number>`count(*)::int`,
    })
    .from(sales)
    .where(and(eq(sales.storeId, storeId), eq(sales.status, "completed")));

  // Calculate Cost of Goods Sold (COGS) from sold items
  const [cogsSummary] = await db
    .select({
      totalCOGS: sql<string>`coalesce(sum(${saleItems.quantity} * ${products.costPrice}), 0)`,
    })
    .from(saleItems)
    .innerJoin(sales, eq(sales.id, saleItems.saleId))
    .innerJoin(products, eq(products.id, saleItems.productId))
    .where(and(eq(sales.storeId, storeId), eq(sales.status, "completed")));

  const [expensesSummary] = await db
    .select({
      totalExpense: sql<string>`coalesce(sum(${expenses.amount}), 0)`,
    })
    .from(expenses)
    .where(eq(expenses.storeId, storeId));

  const recentSales = await db
    .select()
    .from(sales)
    .where(eq(sales.storeId, storeId))
    .orderBy(desc(sales.soldAt))
    .limit(6);

  const lowStockProducts = await db
    .select()
    .from(products)
    .where(
      and(
        eq(products.storeId, storeId),
        sql`${products.currentStock} <= ${products.lowStockThreshold}`
      )
    )
    .limit(6);

  const revenueNum = Number(salesSummary?.totalRevenue || 0);
  const cogsNum = Number(cogsSummary?.totalCOGS || 0);
  const expenseNum = Number(expensesSummary?.totalExpense || 0);
  const grossProfitNum = revenueNum - cogsNum;
  const netProfitNum = grossProfitNum - expenseNum;
  const grossMargin =
    revenueNum > 0 ? Math.round((grossProfitNum / revenueNum) * 100) : 0;
  const isNetPositive = netProfitNum >= 0;

  const formatCurrency = (val: number) => {
    return `${val.toLocaleString()} ${store.currency}`;
  };

  const hasLowStock = (lowStockCount?.count || 0) > 0;

  const PAYMENT_LABELS: Record<string, string> = {
    kbz_pay: "KBZPay",
    wave_pay: "WavePay",
    aya_pay: "AYA Pay",
    cash: t("sales.paymentMethods.cash") || "Cash",
    bank_transfer: t("sales.paymentMethods.bank_transfer") || "Bank Transfer",
    other: t("sales.paymentMethods.other") || "Other",
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Store Header & Desktop Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {store.name}
            </h1>
            <Badge
              variant="outline"
              className="text-xs font-semibold px-2 py-0.5 rounded-md border-primary/20 bg-primary/5 text-primary"
            >
              {store.currency}
            </Badge>
          </div>
          {store.description && (
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {store.description}
            </p>
          )}
        </div>

        {/* Desktop Header CTAs */}
        <div className="hidden sm:flex items-center gap-2">
          <Link href={`/stores/${storeId}/sales/new`}>
            <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs font-semibold">
              <ShoppingCart className="w-4 h-4" />
              <span>{t("sales.newSale")}</span>
            </Button>
          </Link>
          <Link href={`/stores/${storeId}/products/new`}>
            <Button variant="outline" className="gap-2 font-medium">
              <Plus className="w-4 h-4" />
              <span>{t("products.addProduct")}</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Featured FinTech Hero Card (Mobile & Desktop) */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 dark:from-zinc-950 dark:via-zinc-900 dark:to-slate-950 text-white p-5 sm:p-7 shadow-md">
        {/* Subtle background glow */}
        <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-48 h-48 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
              <Wallet className="w-4 h-4 text-emerald-400" />
              <span>
                {isStaff ? t("dashboard.revenue") : t("dashboard.netProfit")}
              </span>
            </div>
            <span className="text-[11px] font-semibold tracking-wide uppercase px-2.5 py-0.5 rounded-full bg-white/10 text-slate-200 backdrop-blur-xs">
              {isStaff
                ? `${salesSummary?.count || 0} Transactions`
                : `${t("reports.grossMargin")}: ${grossMargin}%`}
            </span>
          </div>

          <div>
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              <span className="text-emerald-400">
                +{formatCurrency(isStaff ? revenueNum : Math.abs(netProfitNum))}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {isStaff
                ? "Total completed sales revenue"
                : t("reports.pnlFormula")}
            </p>
          </div>

          {/* Pillars Breakdown */}
          {isStaff ? (
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/10 text-left">
              <div>
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
                  Total Sales
                </span>
                <span className="text-xs sm:text-sm font-bold text-emerald-300 block truncate">
                  {salesSummary?.count || 0}
                </span>
                <span className="text-[10px] text-slate-400">Recorded</span>
              </div>
              <div>
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
                  Products
                </span>
                <span className="text-xs sm:text-sm font-bold text-indigo-300 block truncate">
                  {productsCount?.count || 0}
                </span>
                <span className="text-[10px] text-slate-400">In Catalog</span>
              </div>
              <div>
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
                  Low Stock
                </span>
                <span className="text-xs sm:text-sm font-bold text-amber-300 block truncate">
                  {lowStockCount?.count || 0}
                </span>
                <span className="text-[10px] text-slate-400">Alerts</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/10 text-left">
              <div>
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
                  {t("dashboard.revenue")}
                </span>
                <span className="text-xs sm:text-sm font-bold text-emerald-300 block truncate">
                  +{formatCurrency(revenueNum)}
                </span>
                <span className="text-[10px] text-slate-400">
                  {salesSummary?.count || 0} {t("sales.title")}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
                  {t("dashboard.cogs")}
                </span>
                <span className="text-xs sm:text-sm font-bold text-amber-300 block truncate">
                  −{formatCurrency(cogsNum)}
                </span>
                <span className="text-[10px] text-slate-400">Stock cost</span>
              </div>

              <div>
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
                  {t("dashboard.expenses")}
                </span>
                <span className="text-xs sm:text-sm font-bold text-rose-300 block truncate">
                  −{formatCurrency(expenseNum)}
                </span>
                <span className="text-[10px] text-slate-400">Operating</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions Hub (Touch-First Action Grid for Mobile & Tablet) */}
      <div
        className={`grid ${
          isStaff ? "grid-cols-2" : "grid-cols-4"
        } gap-2.5 sm:gap-4`}
      >
        {/* New Sale */}
        <Link
          href={`/stores/${storeId}/sales/new`}
          className="flex flex-col items-center justify-center p-3 rounded-xl border bg-card hover:bg-accent/40 active:scale-95 transition-all text-center group shadow-2xs"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <span className="text-[11px] sm:text-xs font-semibold text-foreground truncate w-full">
            {t("sales.newSale")}
          </span>
        </Link>

        {/* View Products */}
        {isStaff && (
          <Link
            href={`/stores/${storeId}/products`}
            className="flex flex-col items-center justify-center p-3 rounded-xl border bg-card hover:bg-accent/40 active:scale-95 transition-all text-center group shadow-2xs"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
              <Package className="w-5 h-5" />
            </div>
            <span className="text-[11px] sm:text-xs font-semibold text-foreground truncate w-full">
              {t("products.title")}
            </span>
          </Link>
        )}

        {/* Stock In */}
        {!isStaff && (
          <Link
            href={`/stores/${storeId}/purchases/new`}
            className="flex flex-col items-center justify-center p-3 rounded-xl border bg-card hover:bg-accent/40 active:scale-95 transition-all text-center group shadow-2xs"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
              <Truck className="w-5 h-5" />
            </div>
            <span className="text-[11px] sm:text-xs font-semibold text-foreground truncate w-full">
              {t("purchases.newPurchase")}
            </span>
          </Link>
        )}

        {/* Add Expense */}
        {!isStaff && (
          <Link
            href={`/stores/${storeId}/expenses`}
            className="flex flex-col items-center justify-center p-3 rounded-xl border bg-card hover:bg-accent/40 active:scale-95 transition-all text-center group shadow-2xs"
          >
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
              <Receipt className="w-5 h-5" />
            </div>
            <span className="text-[11px] sm:text-xs font-semibold text-foreground truncate w-full">
              {t("expenses.addExpense")}
            </span>
          </Link>
        )}

        {/* Add Product */}
        {!isStaff && (
          <Link
            href={`/stores/${storeId}/products/new`}
            className="flex flex-col items-center justify-center p-3 rounded-xl border bg-card hover:bg-accent/40 active:scale-95 transition-all text-center group shadow-2xs"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
              <Package className="w-5 h-5" />
            </div>
            <span className="text-[11px] sm:text-xs font-semibold text-foreground truncate w-full">
              {t("products.addProduct")}
            </span>
          </Link>
        )}
      </div>

      {/* Stock Health Alert Banner */}
      {hasLowStock ? (
        <Link
          href={`/stores/${storeId}/products`}
          className="flex items-center justify-between p-3.5 rounded-xl border border-amber-300/80 bg-amber-50/70 dark:bg-amber-950/30 dark:border-amber-900/60 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-amber-950 dark:text-amber-200">
                {t("dashboard.lowStockAlert")} ({lowStockCount?.count || 0})
              </p>
              <p className="text-[11px] text-amber-800/80 dark:text-amber-400/80">
                Items reached threshold — reorder needed
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
        </Link>
      ) : (
        <div className="flex items-center justify-between p-3 rounded-xl border border-emerald-200/60 bg-emerald-50/40 dark:bg-emerald-950/20 dark:border-emerald-900/40">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-xs font-medium text-emerald-900 dark:text-emerald-300">
              Inventory status healthy · {productsCount?.count || 0} active products
            </span>
          </div>
          <Link
            href={`/stores/${storeId}/products`}
            className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
          >
            {t("products.title")} →
          </Link>
        </div>
      )}

      {/* Two Column Section: Recent Sales & Low Stock Watchlist */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales Activity */}
        <Card className="border bg-card shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-bold text-foreground">
                {t("dashboard.recentSales")}
              </CardTitle>
              <CardDescription className="text-xs">
                {t("sales.saleHistory")}
              </CardDescription>
            </div>
            <Link href={`/stores/${storeId}/sales`}>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs font-semibold text-primary hover:text-primary/90 h-8 px-2"
              >
                View all →
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="pt-0">
            {recentSales.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground space-y-2">
                <ShoppingCart className="w-9 h-9 mx-auto text-muted-foreground/40" />
                <p className="text-xs">{t("sales.noSales")}</p>
                <Link
                  href={`/stores/${storeId}/sales/new`}
                  className="inline-block mt-2"
                >
                  <Button size="sm" variant="outline" className="text-xs gap-1">
                    <Plus className="w-3.5 h-3.5" />
                    {t("sales.newSale")}
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {recentSales.map((sale) => (
                  <Link
                    key={sale.id}
                    href={`/stores/${storeId}/sales/${sale.id}`}
                    className="flex items-center justify-between py-2.5 px-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-foreground">
                          {sale.saleNumber}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[10px] font-normal py-0 px-1.5 text-muted-foreground"
                        >
                          {PAYMENT_LABELS[sale.paymentMethod] || sale.paymentMethod}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                        {new Date(sale.soldAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 block">
                        +{Number(sale.totalAmount).toLocaleString()} {store.currency}
                      </span>
                      <span className="text-[10px] text-muted-foreground capitalize">
                        {t("status." + sale.status) || sale.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Watchlist */}
        <Card className="border bg-card shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-bold text-foreground">
                {t("dashboard.lowStockAlert")}
              </CardTitle>
              <CardDescription className="text-xs">
                {t("products.currentStock")} ≤ {t("products.lowStockThreshold")}
              </CardDescription>
            </div>
            <Link href={`/stores/${storeId}/products`}>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs font-semibold text-primary hover:text-primary/90 h-8 px-2"
              >
                View all →
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="pt-0">
            {lowStockProducts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground space-y-2">
                <CheckCircle2 className="w-9 h-9 mx-auto text-emerald-500/50" />
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  All inventory levels are well stocked!
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {lowStockProducts.map((p) => (
                  <Link
                    key={p.id}
                    href={`/stores/${storeId}/products/${p.id}`}
                    className="flex items-center justify-between py-2.5 px-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-xs sm:text-sm font-semibold text-foreground truncate">
                        {p.name}
                      </p>
                      {p.sku && (
                        <p className="text-[11px] text-muted-foreground font-mono">
                          SKU: {p.sku}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <Badge
                        variant="destructive"
                        className="text-[11px] font-bold px-2 py-0.5"
                      >
                        {p.currentStock} left
                      </Badge>
                      <span className="text-[10px] text-muted-foreground block mt-0.5">
                        Threshold: {p.lowStockThreshold}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
