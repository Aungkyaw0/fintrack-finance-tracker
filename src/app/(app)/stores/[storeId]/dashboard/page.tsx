import Link from "next/link";
import { notFound } from "next/navigation";
import { getStoreById } from "@/app/actions/stores";
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
  Store as StoreIcon,
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
    .limit(5);

  const lowStockProducts = await db
    .select()
    .from(products)
    .where(
      and(
        eq(products.storeId, storeId),
        sql`${products.currentStock} <= ${products.lowStockThreshold}`
      )
    )
    .limit(5);

  const revenueNum = Number(salesSummary?.totalRevenue || 0);
  const cogsNum = Number(cogsSummary?.totalCOGS || 0);
  const expenseNum = Number(expensesSummary?.totalExpense || 0);
  const grossProfitNum = revenueNum - cogsNum;
  const netProfitNum = grossProfitNum - expenseNum;

  const formatCurrency = (val: number) => {
    return `${val.toLocaleString()} ${store.currency}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Store Name */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
              {store.name}
            </h1>
            <Badge variant="outline" className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200">
              {store.currency}
            </Badge>
          </div>
          {store.description && (
            <p className="text-sm text-muted-foreground mt-1">
              {store.description}
            </p>
          )}
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/stores/${storeId}/sales/new`}>
            <Button className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
              <ShoppingCart className="w-4 h-4" />
              <span>{t("sales.newSale")}</span>
            </Button>
          </Link>
          <Link href={`/stores/${storeId}/products/new`}>
            <Button variant="outline" className="gap-1.5">
              <Plus className="w-4 h-4" />
              <span>{t("products.addProduct")}</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <Card className="border-indigo-100 bg-white shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("dashboard.totalRevenue")}
            </CardTitle>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(revenueNum)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {salesSummary?.count || 0} {t("sales.title")}
            </p>
          </CardContent>
        </Card>

        {/* Total Expenses */}
        <Card className="border-indigo-100 bg-white shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("dashboard.totalExpenses")}
            </CardTitle>
            <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(expenseNum)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("expenses.title")}
            </p>
          </CardContent>
        </Card>

        {/* Net Profit */}
        <Card className="border-indigo-100 bg-white shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("dashboard.netProfit")}
            </CardTitle>
            <div
              className={`p-2 rounded-lg ${
                netProfitNum >= 0
                  ? "bg-indigo-50 text-indigo-600"
                  : "bg-amber-50 text-amber-600"
              }`}
            >
              <TrendingUp className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                netProfitNum >= 0 ? "text-indigo-600" : "text-amber-600"
              }`}
            >
              {formatCurrency(netProfitNum)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("dashboard.revenue")} − {t("dashboard.cogs")} − {t("dashboard.expenses")}
            </p>
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card className="border-indigo-100 bg-white shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("dashboard.lowStockAlert")}
            </CardTitle>
            <div
              className={`p-2 rounded-lg ${
                (lowStockCount?.count || 0) > 0
                  ? "bg-amber-50 text-amber-600"
                  : "bg-slate-50 text-slate-500"
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                (lowStockCount?.count || 0) > 0
                  ? "text-amber-600"
                  : "text-gray-900"
              }`}
            >
              {lowStockCount?.count || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {productsCount?.count || 0} {t("products.title")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Grid: Recent Sales + Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">
                {t("dashboard.recentSales")}
              </CardTitle>
              <CardDescription>{t("sales.saleHistory")}</CardDescription>
            </div>
            <Link href={`/stores/${storeId}/sales`}>
              <Button variant="ghost" size="sm" className="text-xs text-indigo-600">
                {t("common.next")} →
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentSales.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingCart className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="text-sm">{t("sales.noSales")}</p>
                <Link href={`/stores/${storeId}/sales/new`} className="mt-3 inline-block">
                  <Button size="sm" variant="outline" className="gap-1 text-xs">
                    <Plus className="w-3.5 h-3.5" />
                    {t("sales.newSale")}
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y">
                {recentSales.map((sale) => (
                  <Link
                    key={sale.id}
                    href={`/stores/${storeId}/sales/${sale.id}`}
                    className="flex items-center justify-between py-3 hover:bg-accent/40 rounded px-2 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium">{sale.saleNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(sale.soldAt).toLocaleDateString()} · {sale.paymentMethod}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-emerald-600">
                        +{Number(sale.totalAmount).toLocaleString()} {store.currency}
                      </p>
                      <Badge variant="outline" className="text-[10px] uppercase">
                        {sale.status}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Watchlist */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">
                {t("dashboard.lowStockAlert")}
              </CardTitle>
              <CardDescription>
                {t("products.currentStock")} ≤ {t("products.lowStockThreshold")}
              </CardDescription>
            </div>
            <Link href={`/stores/${storeId}/products`}>
              <Button variant="ghost" size="sm" className="text-xs text-indigo-600">
                {t("common.next")} →
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {lowStockProducts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="text-sm text-emerald-600 font-medium">
                  {t("products.title")} stock levels are healthy!
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {lowStockProducts.map((p) => (
                  <Link
                    key={p.id}
                    href={`/stores/${storeId}/products/${p.id}`}
                    className="flex items-center justify-between py-3 hover:bg-accent/40 rounded px-2 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium">{p.name}</p>
                      {p.sku && (
                        <p className="text-xs text-muted-foreground">
                          SKU: {p.sku}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <Badge
                        variant="destructive"
                        className="text-xs font-semibold"
                      >
                        {p.currentStock} left
                      </Badge>
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
