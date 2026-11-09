"use server";

import { getCurrentUser } from "@/lib/auth";
import { getStoreById } from "@/app/actions/stores";
import { db } from "@/lib/db";
import { sales, saleItems, products, expenses, purchases } from "@/lib/schema";
import { eq, and, sql, gte, lte } from "drizzle-orm";

export interface FinancialReportData {
  totalRevenue: number;
  totalCOGS: number;
  grossProfit: number;
  totalExpenses: number;
  netProfit: number;
  salesCount: number;
  paymentMethodBreakdown: { method: string; total: number; count: number }[];
  topProducts: {
    productId: string;
    productName: string;
    quantitySold: number;
    revenue: number;
  }[];
  expenseCategoriesBreakdown: { category: string; total: number }[];
}

export async function getStoreReport(
  storeId: string,
  days: number = 30
): Promise<FinancialReportData | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const store = await getStoreById(storeId);
  if (!store) return null;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  try {
    // 1. Sales summary (completed only)
    const [salesSum] = await db
      .select({
        totalRevenue: sql<string>`coalesce(sum(${sales.totalAmount}), 0)`,
        count: sql<number>`count(*)::int`,
      })
      .from(sales)
      .where(
        and(
          eq(sales.storeId, storeId),
          eq(sales.status, "completed"),
          gte(sales.soldAt, startDate)
        )
      );

    // 2. COGS calculation from sale_items * products.costPrice
    const [cogsSum] = await db
      .select({
        totalCOGS: sql<string>`coalesce(sum(${saleItems.quantity} * ${products.costPrice}), 0)`,
      })
      .from(saleItems)
      .innerJoin(sales, eq(sales.id, saleItems.saleId))
      .innerJoin(products, eq(products.id, saleItems.productId))
      .where(
        and(
          eq(sales.storeId, storeId),
          eq(sales.status, "completed"),
          gte(sales.soldAt, startDate)
        )
      );

    // 3. Operating expenses
    const [expensesSum] = await db
      .select({
        total: sql<string>`coalesce(sum(${expenses.amount}), 0)`,
      })
      .from(expenses)
      .where(
        and(eq(expenses.storeId, storeId), gte(expenses.expenseDate, startDate))
      );

    // 4. Payment method breakdown
    const pmRows = await db
      .select({
        method: sales.paymentMethod,
        total: sql<string>`coalesce(sum(${sales.totalAmount}), 0)`,
        count: sql<number>`count(*)::int`,
      })
      .from(sales)
      .where(
        and(
          eq(sales.storeId, storeId),
          eq(sales.status, "completed"),
          gte(sales.soldAt, startDate)
        )
      )
      .groupBy(sales.paymentMethod);

    // 5. Top products sold
    const topProdRows = await db
      .select({
        productId: saleItems.productId,
        productName: products.name,
        quantitySold: sql<number>`coalesce(sum(${saleItems.quantity}), 0)::int`,
        revenue: sql<string>`coalesce(sum(${saleItems.lineTotal}), 0)`,
      })
      .from(saleItems)
      .innerJoin(sales, eq(sales.id, saleItems.saleId))
      .innerJoin(products, eq(products.id, saleItems.productId))
      .where(
        and(
          eq(sales.storeId, storeId),
          eq(sales.status, "completed"),
          gte(sales.soldAt, startDate)
        )
      )
      .groupBy(saleItems.productId, products.name)
      .orderBy(sql`sum(${saleItems.quantity}) desc`)
      .limit(5);

    // 6. Expense category breakdown
    const expCatRows = await db
      .select({
        category: expenses.category,
        total: sql<string>`coalesce(sum(${expenses.amount}), 0)`,
      })
      .from(expenses)
      .where(
        and(eq(expenses.storeId, storeId), gte(expenses.expenseDate, startDate))
      )
      .groupBy(expenses.category);

    const totalRevenue = Number(salesSum?.totalRevenue || 0);
    const totalCOGS = Number(cogsSum?.totalCOGS || 0);
    const grossProfit = totalRevenue - totalCOGS;
    const totalExpenses = Number(expensesSum?.total || 0);
    const netProfit = grossProfit - totalExpenses;

    return {
      totalRevenue,
      totalCOGS,
      grossProfit,
      totalExpenses,
      netProfit,
      salesCount: salesSum?.count || 0,
      paymentMethodBreakdown: pmRows.map((r) => ({
        method: r.method,
        total: Number(r.total),
        count: r.count,
      })),
      topProducts: topProdRows.map((r) => ({
        productId: r.productId,
        productName: r.productName,
        quantitySold: r.quantitySold,
        revenue: Number(r.revenue),
      })),
      expenseCategoriesBreakdown: expCatRows.map((r) => ({
        category: r.category,
        total: Number(r.total),
      })),
    };
  } catch (error) {
    console.error("Failed to generate financial report:", error);
    return null;
  }
}

