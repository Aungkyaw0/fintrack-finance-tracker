import Link from "next/link";
import { notFound } from "next/navigation";
import { getStoreById } from "@/app/actions/stores";
import { getStoreReport } from "@/app/actions/reports";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  Receipt,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingCart,
  Package,
  Calendar,
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

export default async function ReportsPage({
  params,
  searchParams,
}: {
  params: Promise<{ storeId: string }>;
  searchParams: Promise<{ days?: string }>;
}) {
  const { storeId } = await params;
  const { days: daysParam } = await searchParams;

  const store = await getStoreById(storeId);
  if (!store) notFound();

  const days = daysParam ? parseInt(daysParam) || 30 : 30;
  const report = await getStoreReport(storeId, days);
  const t = await getTranslations();

  if (!report) {
    return <div className="p-6">Failed to load reports.</div>;
  }

  const formatCurrency = (n: number) =>
    `${n.toLocaleString()} ${store.currency}`;

  const grossMarginPercent =
    report.totalRevenue > 0
      ? Math.round((report.grossProfit / report.totalRevenue) * 100)
      : 0;

  const netMarginPercent =
    report.totalRevenue > 0
      ? Math.round((report.netProfit / report.totalRevenue) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Header & Date Range switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            {t("reports.title")}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {store.name} · {t("reports.subtitle")}
          </p>
        </div>

        {/* Days Filter Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          {[
            { label: t("reports.days7"), d: 7 },
            { label: t("reports.days30"), d: 30 },
            { label: t("reports.days90"), d: 90 },
          ].map((item) => (
            <Link
              key={item.d}
              href={`/stores/${storeId}/reports?days=${item.d}`}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                days === item.d
                  ? "bg-white text-indigo-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Primary Profit & Loss Statement Card */}
      <Card className="border-indigo-100 bg-linear-to-br from-white to-indigo-50/20 shadow-xs">
        <CardHeader>
          <CardTitle className="text-base font-bold text-gray-900">
            {t("reports.incomeStatement")} — {t("reports.lastDays", { days })}
          </CardTitle>
          <CardDescription className="text-xs">
            {t("reports.pnlFormula")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Total Revenue */}
            <div className="flex justify-between items-center py-2 border-b">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-sm font-medium text-gray-900">
                  {t("reports.totalSalesRevenue")}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t("reports.salesCount", { count: report.salesCount })}
                </span>
              </div>
              <span className="text-base font-bold text-emerald-600">
                +{formatCurrency(report.totalRevenue)}
              </span>
            </div>

            {/* COGS */}
            <div className="flex justify-between items-center py-2 border-b">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-sm font-medium text-gray-900">
                  {t("reports.cogsTitle")}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t("reports.cogsSub")}
                </span>
              </div>
              <span className="text-base font-medium text-amber-700">
                −{formatCurrency(report.totalCOGS)}
              </span>
            </div>

            {/* Gross Profit */}
            <div className="flex justify-between items-center py-2 border-b bg-indigo-50/50 px-3 rounded-lg">
              <span className="text-sm font-bold text-indigo-900">
                {t("reports.grossProfitTitle")}
              </span>
              <div className="text-right">
                <span className="text-base font-bold text-indigo-700">
                  {formatCurrency(report.grossProfit)}
                </span>
                <span className="text-[11px] text-indigo-600 block">
                  {t("reports.grossMargin")}: {grossMarginPercent}%
                </span>
              </div>
            </div>

            {/* Operating Expenses */}
            <div className="flex justify-between items-center py-2 border-b">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="text-sm font-medium text-gray-900">
                  {t("reports.totalOperatingExpenses")}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t("reports.operatingExpensesSub")}
                </span>
              </div>
              <span className="text-base font-medium text-rose-600">
                −{formatCurrency(report.totalExpenses)}
              </span>
            </div>

            {/* Net Profit */}
            <div
              className={`flex justify-between items-center py-3 px-3 rounded-xl border ${
                report.netProfit >= 0
                  ? "bg-emerald-50 border-emerald-200 text-emerald-950"
                  : "bg-rose-50 border-rose-200 text-rose-950"
              }`}
            >
              <div>
                <span className="text-base font-extrabold block">
                  {t("reports.netProfitTitle")}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t("reports.netMargin")}: {netMarginPercent}%
                </span>
              </div>
              <span
                className={`text-2xl font-black ${
                  report.netProfit >= 0 ? "text-emerald-700" : "text-rose-600"
                }`}
              >
                {report.netProfit >= 0 ? "+" : ""}
                {formatCurrency(report.netProfit)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid: Payment Method Breakdown & Top Products */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("reports.paymentBreakdown")}</CardTitle>
            <CardDescription className="text-xs">
              {t("reports.paymentBreakdownSub")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {report.paymentMethodBreakdown.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">
                {t("reports.noPaymentData")}
              </p>
            ) : (
              report.paymentMethodBreakdown.map((pm) => {
                const percent =
                  report.totalRevenue > 0
                    ? Math.round((pm.total / report.totalRevenue) * 100)
                    : 0;

                return (
                  <div key={pm.method} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-gray-800">
                        {METHOD_LABELS[pm.method] || pm.method}
                      </span>
                      <span className="text-muted-foreground">
                        {formatCurrency(pm.total)} ({percent}%)
                      </span>
                    </div>
                    <Progress value={percent} className="h-2" />
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Best-selling Products */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("reports.bestSelling")}</CardTitle>
            <CardDescription className="text-xs">
              {t("reports.bestSellingSub")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {report.topProducts.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">
                {t("reports.noSalesData")}
              </p>
            ) : (
              <div className="divide-y">
                {report.topProducts.map((p, idx) => (
                  <div
                    key={p.productId}
                    className="flex items-center justify-between py-2.5"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-semibold text-gray-900">
                        {p.productName}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-emerald-600 block">
                        +{formatCurrency(p.revenue)}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {t("reports.unitsSold", { count: p.quantitySold })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Operating Expenses Breakdown */}
      {report.expenseCategoriesBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("reports.expensesByCategory")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {report.expenseCategoriesBreakdown.map((exp) => (
                <div
                  key={exp.category}
                  className="p-3 rounded-xl bg-slate-50 border space-y-1"
                >
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase capitalize block truncate">
                    {exp.category}
                  </span>
                  <span className="text-sm font-bold text-rose-600">
                    −{formatCurrency(exp.total)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

