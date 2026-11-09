"use server";

import { getCurrentUser } from "@/lib/auth";
import { getStoreById } from "@/app/actions/stores";
import { db } from "@/lib/db";
import { categories } from "@/lib/schema";
import { eq, and, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getCategories(storeId: string) {
  try {
    const store = await getStoreById(storeId);
    if (!store) return [];

    return await db
      .select()
      .from(categories)
      .where(eq(categories.storeId, storeId))
      .orderBy(asc(categories.name));
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return [];
  }
}

export async function createCategoryAction(
  storeId: string,
  data: { name: string; color?: string }
) {
  const user = await getCurrentUser();
  if (!user) return { error: "Unauthorized" };

  const store = await getStoreById(storeId);
  if (!store) return { error: "Store not found" };

  if (!data.name?.trim()) {
    return { error: "Category name is required" };
  }

  try {
    const [category] = await db
      .insert(categories)
      .values({
        storeId,
        name: data.name.trim(),
        color: data.color?.trim() || "#6366f1",
      })
      .returning();

    revalidatePath(`/stores/${storeId}/products`);
    return { success: true, category };
  } catch (error) {
    console.error("Failed to create category:", error);
    return { error: "Failed to create category" };
  }
}

export async function deleteCategoryAction(storeId: string, categoryId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Unauthorized" };

  try {
    await db
      .delete(categories)
      .where(and(eq(categories.id, categoryId), eq(categories.storeId, storeId)));

    revalidatePath(`/stores/${storeId}/products`);
    return { success: true };
  } catch (error) {
    console.error("Failed to delete category:", error);
    return { error: "Failed to delete category" };
  }
}

