"use server";

import { getCurrentUser } from "@/lib/auth";
import { getStoreById } from "@/app/actions/stores";
import { db } from "@/lib/db";
import { suppliers } from "@/lib/schema";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export interface SupplierInput {
  name: string;
  phone?: string;
  address?: string;
  notes?: string;
}

export async function getSuppliers(storeId: string) {
  try {
    const store = await getStoreById(storeId);
    if (!store) return [];

    return await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.storeId, storeId))
      .orderBy(desc(suppliers.createdAt));
  } catch (error) {
    console.error("Failed to fetch suppliers:", error);
    return [];
  }
}

export async function createSupplierAction(
  storeId: string,
  data: SupplierInput
) {
  const user = await getCurrentUser();
  if (!user) return { error: "Unauthorized" };

  const store = await getStoreById(storeId);
  if (!store) return { error: "Store not found" };

  if (!data.name?.trim()) {
    return { error: "Supplier name is required" };
  }

  try {
    const [supplier] = await db
      .insert(suppliers)
      .values({
        storeId,
        name: data.name.trim(),
        phone: data.phone?.trim() || null,
        address: data.address?.trim() || null,
        notes: data.notes?.trim() || null,
      })
      .returning();

    revalidatePath(`/stores/${storeId}/suppliers`);
    revalidatePath(`/stores/${storeId}/purchases/new`);
    return { success: true, supplier };
  } catch (error) {
    console.error("Failed to create supplier:", error);
    return { error: "Failed to create supplier" };
  }
}

export async function updateSupplierAction(
  storeId: string,
  supplierId: string,
  data: SupplierInput
) {
  const user = await getCurrentUser();
  if (!user) return { error: "Unauthorized" };

  try {
    const [updated] = await db
      .update(suppliers)
      .set({
        name: data.name.trim(),
        phone: data.phone?.trim() || null,
        address: data.address?.trim() || null,
        notes: data.notes?.trim() || null,
      })
      .where(
        and(eq(suppliers.id, supplierId), eq(suppliers.storeId, storeId))
      )
      .returning();

    revalidatePath(`/stores/${storeId}/suppliers`);
    return { success: true, supplier: updated };
  } catch (error) {
    console.error("Failed to update supplier:", error);
    return { error: "Failed to update supplier" };
  }
}

export async function deleteSupplierAction(
  storeId: string,
  supplierId: string
) {
  const user = await getCurrentUser();
  if (!user) return { error: "Unauthorized" };

  try {
    await db
      .delete(suppliers)
      .where(
        and(eq(suppliers.id, supplierId), eq(suppliers.storeId, storeId))
      );

    revalidatePath(`/stores/${storeId}/suppliers`);
    return { success: true };
  } catch (error) {
    console.error("Failed to delete supplier:", error);
    return { error: "Failed to delete supplier" };
  }
}

