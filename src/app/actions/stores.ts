"use server";

import { cache } from "react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { stores, storeMembers } from "@/lib/schema";
import { eq, or, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export const getUserStores = cache(async function getUserStores() {
  const user = await getCurrentUser();
  if (!user) return [];

  try {
    // Get stores where user is owner or member
    const userStores = await db
      .select({
        id: stores.id,
        name: stores.name,
        description: stores.description,
        currency: stores.currency,
        logoUrl: stores.logoUrl,
        ownerId: stores.ownerId,
        createdAt: stores.createdAt,
      })
      .from(stores)
      .leftJoin(storeMembers, eq(storeMembers.storeId, stores.id))
      .where(or(eq(stores.ownerId, user.id), eq(storeMembers.userId, user.id)))
      .orderBy(desc(stores.createdAt));

    // Deduplicate in case joined with multiple roles
    const uniqueStores = Array.from(
      new Map(userStores.map((item) => [item.id, item])).values()
    );

    return uniqueStores;
  } catch (error) {
    console.error("Failed to fetch stores:", error);
    return [];
  }
});

export const getStoreById = cache(async function getStoreById(storeId: string) {
  const user = await getCurrentUser();
  if (!user) return null;

  try {
    const [store] = await db
      .select()
      .from(stores)
      .where(eq(stores.id, storeId))
      .limit(1);

    if (!store) return null;

    // Check if user is owner or member
    if (store.ownerId === user.id) return store;

    const [member] = await db
      .select()
      .from(storeMembers)
      .where(
        and(
          eq(storeMembers.storeId, storeId),
          eq(storeMembers.userId, user.id)
        )
      )
      .limit(1);

    if (member) return store;

    return null;
  } catch (error) {
    console.error("Failed to get store by id:", error);
    return null;
  }
});

export async function createStoreAction(formData: {
  name: string;
  description?: string;
  currency?: string;
  logoUrl?: string;
}) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Unauthorized" };
  }

  if (!formData.name?.trim()) {
    return { error: "Store name is required" };
  }

  try {
    const [newStore] = await db
      .insert(stores)
      .values({
        ownerId: user.id,
        name: formData.name.trim(),
        description: formData.description?.trim() || null,
        currency: formData.currency?.trim() || "MMK",
        logoUrl: formData.logoUrl?.trim() || null,
      })
      .returning();

    // Also add as owner member
    await db.insert(storeMembers).values({
      storeId: newStore.id,
      userId: user.id,
      role: "owner",
    });

    revalidatePath("/dashboard");
    return { success: true, store: newStore };
  } catch (error: unknown) {
    console.error("Failed to create store:", error);
    return { error: "Failed to create store. Please try again." };
  }
}

export async function updateStoreAction(
  storeId: string,
  formData: {
    name: string;
    description?: string;
    currency?: string;
    logoUrl?: string;
  }
) {
  const user = await getCurrentUser();
  if (!user) return { error: "Unauthorized" };

  try {
    const [existing] = await db
      .select()
      .from(stores)
      .where(eq(stores.id, storeId))
      .limit(1);

    if (!existing || existing.ownerId !== user.id) {
      return { error: "Only the owner can update store settings" };
    }

    const [updated] = await db
      .update(stores)
      .set({
        name: formData.name.trim(),
        description: formData.description?.trim() || null,
        currency: formData.currency?.trim() || "MMK",
        logoUrl: formData.logoUrl?.trim() || null,
        updatedAt: new Date(),
      })
      .where(eq(stores.id, storeId))
      .returning();

    revalidatePath(`/stores/${storeId}`);
    revalidatePath("/dashboard");
    return { success: true, store: updated };
  } catch (error) {
    console.error("Failed to update store:", error);
    return { error: "Failed to update store" };
  }
}

export async function deleteStoreAction(storeId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Unauthorized" };

  try {
    const [existing] = await db
      .select()
      .from(stores)
      .where(eq(stores.id, storeId))
      .limit(1);

    if (!existing || existing.ownerId !== user.id) {
      return { error: "Only the store owner can delete this store" };
    }

    await db.delete(stores).where(eq(stores.id, storeId));

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete store:", error);
    return { error: "Failed to delete store" };
  }
}
