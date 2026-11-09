"use server";

import { getCurrentUser } from "@/lib/auth";
import { getStoreById } from "@/app/actions/stores";
import { db } from "@/lib/db";
import { products, categories, stockMovements, users } from "@/lib/schema";
import { eq, and, desc, sql, ilike } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export interface ProductFormData {
  name: string;
  sku?: string;
  categoryId?: string | null;
  description?: string;
  imageUrl?: string;
  costPrice: number;
  sellingPrice: number;
  initialStock: number;
  lowStockThreshold: number;
}

export async function getProducts(
  storeId: string,
  options?: {
    search?: string;
    categoryId?: string;
  }
) {
  try {
    const store = await getStoreById(storeId);
    if (!store) return [];

    const conditions = [
      eq(products.storeId, storeId),
      eq(products.isActive, true),
    ];

    if (options?.search?.trim()) {
      const q = `%${options.search.trim()}%`;
      conditions.push(sql`(${products.name} ILIKE ${q} OR ${products.sku} ILIKE ${q})`);
    }

    if (options?.categoryId && options.categoryId !== "all") {
      conditions.push(eq(products.categoryId, options.categoryId));
    }

    const rows = await db
      .select({
        id: products.id,
        storeId: products.storeId,
        categoryId: products.categoryId,
        categoryName: categories.name,
        categoryColor: categories.color,
        name: products.name,
        sku: products.sku,
        description: products.description,
        imageUrl: products.imageUrl,
        costPrice: products.costPrice,
        sellingPrice: products.sellingPrice,
        currentStock: products.currentStock,
        lowStockThreshold: products.lowStockThreshold,
        isActive: products.isActive,
        createdAt: products.createdAt,
      })
      .from(products)
      .leftJoin(categories, eq(categories.id, products.categoryId))
      .where(and(...conditions))
      .orderBy(desc(products.createdAt));

    return rows;
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return [];
  }
}

export async function getProductById(storeId: string, productId: string) {
  try {
    const store = await getStoreById(storeId);
    if (!store) return null;

    const [product] = await db
      .select({
        id: products.id,
        storeId: products.storeId,
        categoryId: products.categoryId,
        categoryName: categories.name,
        categoryColor: categories.color,
        name: products.name,
        sku: products.sku,
        description: products.description,
        imageUrl: products.imageUrl,
        costPrice: products.costPrice,
        sellingPrice: products.sellingPrice,
        currentStock: products.currentStock,
        lowStockThreshold: products.lowStockThreshold,
        isActive: products.isActive,
        createdAt: products.createdAt,
      })
      .from(products)
      .leftJoin(categories, eq(categories.id, products.categoryId))
      .where(and(eq(products.id, productId), eq(products.storeId, storeId)))
      .limit(1);

    if (!product) return null;

    // Fetch stock movements with audit user info
    const movements = await db
      .select({
        id: stockMovements.id,
        productId: stockMovements.productId,
        referenceId: stockMovements.referenceId,
        referenceType: stockMovements.referenceType,
        movementType: stockMovements.movementType,
        quantityChange: stockMovements.quantityChange,
        stockBefore: stockMovements.stockBefore,
        stockAfter: stockMovements.stockAfter,
        notes: stockMovements.notes,
        createdAt: stockMovements.createdAt,
        createdByName: users.fullName,
        createdByEmail: users.email,
      })
      .from(stockMovements)
      .leftJoin(users, eq(users.id, stockMovements.createdBy))
      .where(eq(stockMovements.productId, productId))
      .orderBy(desc(stockMovements.createdAt))
      .limit(50);

    return { product, movements };
  } catch (error) {
    console.error("Failed to fetch product details:", error);
    return null;
  }
}

export async function createProductAction(
  storeId: string,
  data: ProductFormData
) {
  const user = await getCurrentUser();
  if (!user) return { error: "Unauthorized" };

  const store = await getStoreById(storeId);
  if (!store) return { error: "Store not found" };

  if (!data.name?.trim()) {
    return { error: "Product name is required" };
  }

  const costPrice = Math.max(0, Number(data.costPrice) || 0);
  const sellingPrice = Math.max(0, Number(data.sellingPrice) || 0);
  const initialStock = Math.max(0, Math.floor(Number(data.initialStock) || 0));
  const lowStockThreshold = Math.max(
    0,
    Math.floor(Number(data.lowStockThreshold) || 5)
  );

  try {
    const [newProduct] = await db
      .insert(products)
      .values({
        storeId,
        name: data.name.trim(),
        sku: data.sku?.trim() || null,
        categoryId: data.categoryId || null,
        description: data.description?.trim() || null,
        imageUrl: data.imageUrl?.trim() || null,
        costPrice: costPrice.toString(),
        sellingPrice: sellingPrice.toString(),
        currentStock: initialStock,
        lowStockThreshold,
        isActive: true,
      })
      .returning();

    // If initial stock was provided, log stock movement
    if (initialStock > 0) {
      await db.insert(stockMovements).values({
        productId: newProduct.id,
        referenceId: null,
        referenceType: "adjustment",
        movementType: "adjustment",
        quantityChange: initialStock,
        stockBefore: 0,
        stockAfter: initialStock,
        notes: "Initial inventory setup",
        createdBy: user.id,
      });
    }

    revalidatePath(`/stores/${storeId}/products`);
    revalidatePath(`/stores/${storeId}/dashboard`);
    return { success: true, product: newProduct };
  } catch (error) {
    console.error("Failed to create product:", error);
    return { error: "Failed to create product" };
  }
}

export async function updateProductAction(
  storeId: string,
  productId: string,
  data: Partial<ProductFormData>
) {
  const user = await getCurrentUser();
  if (!user) return { error: "Unauthorized" };

  try {
    const updatePayload: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) updatePayload.name = data.name.trim();
    if (data.sku !== undefined) updatePayload.sku = data.sku?.trim() || null;
    if (data.categoryId !== undefined) updatePayload.categoryId = data.categoryId || null;
    if (data.description !== undefined) updatePayload.description = data.description?.trim() || null;
    if (data.imageUrl !== undefined) updatePayload.imageUrl = data.imageUrl?.trim() || null;
    if (data.costPrice !== undefined) updatePayload.costPrice = Math.max(0, Number(data.costPrice)).toString();
    if (data.sellingPrice !== undefined) updatePayload.sellingPrice = Math.max(0, Number(data.sellingPrice)).toString();
    if (data.lowStockThreshold !== undefined) updatePayload.lowStockThreshold = Math.max(0, Math.floor(Number(data.lowStockThreshold)));

    const [updated] = await db
      .update(products)
      .set(updatePayload)
      .where(and(eq(products.id, productId), eq(products.storeId, storeId)))
      .returning();

    revalidatePath(`/stores/${storeId}/products`);
    revalidatePath(`/stores/${storeId}/products/${productId}`);
    return { success: true, product: updated };
  } catch (error) {
    console.error("Failed to update product:", error);
    return { error: "Failed to update product" };
  }
}

export async function adjustStockAction(
  storeId: string,
  productId: string,
  change: number,
  notes: string,
  reason: "loss" | "damage" | "correction" | "other"
) {
  const user = await getCurrentUser();
  if (!user) return { error: "Unauthorized" };

  if (change === 0) {
    return { error: "Quantity change cannot be 0" };
  }

  try {
    const [existing] = await db
      .select()
      .from(products)
      .where(and(eq(products.id, productId), eq(products.storeId, storeId)))
      .limit(1);

    if (!existing) return { error: "Product not found" };

    const stockBefore = existing.currentStock;
    const stockAfter = Math.max(0, stockBefore + change);
    const actualChange = stockAfter - stockBefore;

    // Update product stock
    await db
      .update(products)
      .set({
        currentStock: stockAfter,
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId));

    // Log stock movement
    await db.insert(stockMovements).values({
      productId,
      referenceId: null,
      referenceType: "adjustment",
      movementType: "adjustment",
      quantityChange: actualChange,
      stockBefore,
      stockAfter,
      notes: `${reason.toUpperCase()}: ${notes.trim()}`,
      createdBy: user.id,
    });

    revalidatePath(`/stores/${storeId}/products`);
    revalidatePath(`/stores/${storeId}/products/${productId}`);
    revalidatePath(`/stores/${storeId}/dashboard`);
    return { success: true, stockAfter };
  } catch (error) {
    console.error("Failed to adjust stock:", error);
    return { error: "Failed to adjust stock" };
  }
}

export async function deleteProductAction(storeId: string, productId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Unauthorized" };

  try {
    // Soft delete to protect financial audit trail
    await db
      .update(products)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(products.id, productId), eq(products.storeId, storeId)));

    revalidatePath(`/stores/${storeId}/products`);
    revalidatePath(`/stores/${storeId}/dashboard`);
    return { success: true };
  } catch (error) {
    console.error("Failed to delete product:", error);
    return { error: "Failed to delete product" };
  }
}

