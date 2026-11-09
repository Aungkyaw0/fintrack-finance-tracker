"use server";

import { getCurrentUser } from "@/lib/auth";
import { getStoreById } from "@/app/actions/stores";
import { db } from "@/lib/db";
import {
  sales,
  saleItems,
  products,
  stockMovements,
  paymentScreenshots,
} from "@/lib/schema";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type PaymentMethod =
  | "cash"
  | "kbz_pay"
  | "wave_pay"
  | "aya_pay"
  | "bank_transfer"
  | "other";

export interface SaleItemInput {
  productId: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
}

export interface CreateSaleInput {
  paymentMethod: PaymentMethod;
  discountAmount?: number;
  notes?: string;
  paymentScreenshot?: string | null;
  items: SaleItemInput[];
}

export async function getSales(
  storeId: string,
  options?: {
    paymentMethod?: string;
    status?: string;
  }
) {
  try {
    const store = await getStoreById(storeId);
    if (!store) return [];

    const conditions = [eq(sales.storeId, storeId)];

    if (options?.paymentMethod && options.paymentMethod !== "all") {
      conditions.push(
        eq(sales.paymentMethod, options.paymentMethod as PaymentMethod)
      );
    }

    if (options?.status && options.status !== "all") {
      conditions.push(
        eq(
          sales.status,
          options.status as "completed" | "cancelled" | "refunded"
        )
      );
    }

    const rows = await db
      .select()
      .from(sales)
      .where(and(...conditions))
      .orderBy(desc(sales.soldAt));

    return rows;
  } catch (error) {
    console.error("Failed to fetch sales:", error);
    return [];
  }
}

export async function getSaleById(storeId: string, saleId: string) {
  try {
    const store = await getStoreById(storeId);
    if (!store) return null;

    const [sale] = await db
      .select()
      .from(sales)
      .where(and(eq(sales.id, saleId), eq(sales.storeId, storeId)))
      .limit(1);

    if (!sale) return null;

    // Fetch items
    const items = await db
      .select({
        id: saleItems.id,
        productId: saleItems.productId,
        productName: products.name,
        productSku: products.sku,
        productImageUrl: products.imageUrl,
        quantity: saleItems.quantity,
        unitPrice: saleItems.unitPrice,
        discount: saleItems.discount,
        lineTotal: saleItems.lineTotal,
      })
      .from(saleItems)
      .leftJoin(products, eq(products.id, saleItems.productId))
      .where(eq(saleItems.saleId, saleId));

    // Fetch screenshots
    const screenshots = await db
      .select()
      .from(paymentScreenshots)
      .where(
        and(
          eq(paymentScreenshots.referenceId, saleId),
          eq(paymentScreenshots.referenceType, "sale")
        )
      );

    return { sale, items, screenshots };
  } catch (error) {
    console.error("Failed to fetch sale details:", error);
    return null;
  }
}

export async function createSaleAction(
  storeId: string,
  data: CreateSaleInput
) {
  const user = await getCurrentUser();
  if (!user) return { error: "Unauthorized" };

  const store = await getStoreById(storeId);
  if (!store) return { error: "Store not found" };

  if (!data.items || data.items.length === 0) {
    return { error: "Please add at least one product to the sale." };
  }

  // Calculate totals
  let subtotal = 0;
  for (const it of data.items) {
    if (it.quantity <= 0) return { error: "Item quantity must be at least 1." };
    if (it.unitPrice < 0) return { error: "Item price cannot be negative." };
    const itemDisc = Math.max(0, it.discount || 0);
    subtotal += it.quantity * it.unitPrice - itemDisc;
  }

  const overallDiscount = Math.max(0, Number(data.discountAmount) || 0);
  const totalAmount = Math.max(0, subtotal - overallDiscount);

  const saleNumber = `SL-${Date.now().toString().slice(-6)}`;

  try {
    const result = await db.transaction(async (tx) => {
      // 1. Verify stocks for all products first
      for (const it of data.items) {
        const [prod] = await tx
          .select({
            id: products.id,
            name: products.name,
            currentStock: products.currentStock,
          })
          .from(products)
          .where(eq(products.id, it.productId))
          .limit(1);

        if (!prod) {
          throw new Error("One or more selected products no longer exist.");
        }

        if (prod.currentStock < it.quantity) {
          throw new Error(
            `Insufficient stock for "${prod.name}". Available: ${prod.currentStock}, Requested: ${it.quantity}`
          );
        }
      }

      // 2. Insert sale record
      const [newSale] = await tx
        .insert(sales)
        .values({
          storeId,
          createdBy: user.id,
          saleNumber,
          subtotal: subtotal.toString(),
          discountAmount: overallDiscount.toString(),
          totalAmount: totalAmount.toString(),
          paymentMethod: data.paymentMethod,
          notes: data.notes?.trim() || null,
          status: "completed",
        })
        .returning();

      // 3. Insert sale items & deduct stocks atomically
      for (const it of data.items) {
        const itemDisc = Math.max(0, it.discount || 0);
        const lineTotal = it.quantity * it.unitPrice - itemDisc;

        await tx.insert(saleItems).values({
          saleId: newSale.id,
          productId: it.productId,
          quantity: it.quantity,
          unitPrice: it.unitPrice.toString(),
          discount: itemDisc.toString(),
          lineTotal: lineTotal.toString(),
        });

        const [prod] = await tx
          .select({ currentStock: products.currentStock })
          .from(products)
          .where(eq(products.id, it.productId))
          .limit(1);

        const stockBefore = prod.currentStock;
        const stockAfter = stockBefore - it.quantity;

        // Deduct inventory
        await tx
          .update(products)
          .set({
            currentStock: stockAfter,
            updatedAt: new Date(),
          })
          .where(eq(products.id, it.productId));

        // Record stock movement
        await tx.insert(stockMovements).values({
          productId: it.productId,
          referenceId: newSale.id,
          referenceType: "sale",
          movementType: "sale",
          quantityChange: -it.quantity,
          stockBefore,
          stockAfter,
          notes: `Sold via ${saleNumber}`,
          createdBy: user.id,
        });
      }

      // 4. Attach payment screenshot if provided
      if (data.paymentScreenshot) {
        await tx.insert(paymentScreenshots).values({
          referenceId: newSale.id,
          referenceType: "sale",
          storagePath: data.paymentScreenshot,
        });
      }

      return newSale;
    });

    revalidatePath(`/stores/${storeId}/sales`);
    revalidatePath(`/stores/${storeId}/products`);
    revalidatePath(`/stores/${storeId}/dashboard`);
    return { success: true, saleId: result.id };
  } catch (error: unknown) {
    console.error("Sale transaction failed:", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "Sale failed. Please try again.",
    };
  }
}

export async function cancelSaleAction(
  storeId: string,
  saleId: string,
  reason: string
) {
  const user = await getCurrentUser();
  if (!user) return { error: "Unauthorized" };

  try {
    await db.transaction(async (tx) => {
      const [sale] = await tx
        .select()
        .from(sales)
        .where(and(eq(sales.id, saleId), eq(sales.storeId, storeId)))
        .limit(1);

      if (!sale) throw new Error("Sale not found");
      if (sale.status === "cancelled") {
        throw new Error("This sale is already cancelled.");
      }

      // 1. Mark as cancelled
      await tx
        .update(sales)
        .set({ status: "cancelled", notes: `${sale.notes ? sale.notes + " | " : ""}CANCELLED: ${reason}` })
        .where(eq(sales.id, saleId));

      // 2. Fetch sale items to restore inventory
      const items = await tx
        .select()
        .from(saleItems)
        .where(eq(saleItems.saleId, saleId));

      for (const it of items) {
        const [prod] = await tx
          .select({ currentStock: products.currentStock })
          .from(products)
          .where(eq(products.id, it.productId))
          .limit(1);

        if (prod) {
          const stockBefore = prod.currentStock;
          const stockAfter = stockBefore + it.quantity;

          await tx
            .update(products)
            .set({ currentStock: stockAfter, updatedAt: new Date() })
            .where(eq(products.id, it.productId));

          await tx.insert(stockMovements).values({
            productId: it.productId,
            referenceId: sale.id,
            referenceType: "sale",
            movementType: "refund",
            quantityChange: it.quantity,
            stockBefore,
            stockAfter,
            notes: `Restored from cancelled sale (${sale.saleNumber}): ${reason}`,
            createdBy: user.id,
          });
        }
      }
    });

    revalidatePath(`/stores/${storeId}/sales`);
    revalidatePath(`/stores/${storeId}/sales/${saleId}`);
    revalidatePath(`/stores/${storeId}/products`);
    revalidatePath(`/stores/${storeId}/dashboard`);
    return { success: true };
  } catch (error: unknown) {
    console.error("Cancel sale failed:", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to cancel sale.",
    };
  }
}

