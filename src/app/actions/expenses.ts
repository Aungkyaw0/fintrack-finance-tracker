"use server";

import { getCurrentUser } from "@/lib/auth";
import { getStoreById } from "@/app/actions/stores";
import { db } from "@/lib/db";
import { expenses, users } from "@/lib/schema";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export interface ExpenseInput {
  category: string;
  amount: number;
  description?: string;
  receiptUrl?: string | null;
  expenseDate?: string;
}

export async function getExpenses(
  storeId: string,
  options?: { category?: string }
) {
  try {
    const store = await getStoreById(storeId);
    if (!store) return [];

    const conditions = [eq(expenses.storeId, storeId)];

    if (options?.category && options.category !== "all") {
      conditions.push(eq(expenses.category, options.category));
    }

    return await db
      .select({
        id: expenses.id,
        storeId: expenses.storeId,
        category: expenses.category,
        amount: expenses.amount,
        description: expenses.description,
        receiptUrl: expenses.receiptUrl,
        expenseDate: expenses.expenseDate,
        createdAt: expenses.createdAt,
        createdByName: users.fullName,
        createdByEmail: users.email,
      })
      .from(expenses)
      .leftJoin(users, eq(users.id, expenses.createdBy))
      .where(and(...conditions))
      .orderBy(desc(expenses.expenseDate));
  } catch (error) {
    console.error("Failed to fetch expenses:", error);
    return [];
  }
}

export async function createExpenseAction(
  storeId: string,
  data: ExpenseInput
) {
  const user = await getCurrentUser();
  if (!user) return { error: "Unauthorized" };

  const store = await getStoreById(storeId);
  if (!store) return { error: "Store not found" };

  const amount = Math.max(0, Number(data.amount) || 0);
  if (amount <= 0) {
    return { error: "Expense amount must be greater than 0" };
  }

  try {
    const [newExpense] = await db
      .insert(expenses)
      .values({
        storeId,
        createdBy: user.id,
        category: data.category.trim(),
        amount: amount.toString(),
        description: data.description?.trim() || null,
        receiptUrl: data.receiptUrl || null,
        expenseDate: data.expenseDate ? new Date(data.expenseDate) : new Date(),
      })
      .returning();

    revalidatePath(`/stores/${storeId}/expenses`);
    revalidatePath(`/stores/${storeId}/dashboard`);
    return { success: true, expense: newExpense };
  } catch (error) {
    console.error("Failed to create expense:", error);
    return { error: "Failed to record expense. Please try again." };
  }
}

export async function deleteExpenseAction(
  storeId: string,
  expenseId: string
) {
  const user = await getCurrentUser();
  if (!user) return { error: "Unauthorized" };

  try {
    await db
      .delete(expenses)
      .where(and(eq(expenses.id, expenseId), eq(expenses.storeId, storeId)));

    revalidatePath(`/stores/${storeId}/expenses`);
    revalidatePath(`/stores/${storeId}/dashboard`);
    return { success: true };
  } catch (error) {
    console.error("Failed to delete expense:", error);
    return { error: "Failed to delete expense" };
  }
}

