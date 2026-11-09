"use server";

import { getCurrentUser } from "@/lib/auth";
import { getStoreById } from "@/app/actions/stores";
import { db } from "@/lib/db";
import {
  purchases,
  purchaseItems,
  products,
  stockMovements,
  paymentScreenshots,
  suppliers,
  users,
} from "@/lib/schema";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export interface PurchaseItemInput {
  productId: string;
  quantity: number;
  unitCost: number;
}

export interface CreatePurchaseInput {
  supplierId?: string | null;
  shippingCost?: number;
  notes?: string;
  invoiceScreenshot?: string | null;
  items: PurchaseItemInput[];
}

export async function getPurchases(storeId: string) {
  try {
    const store = await getStoreById(storeId);
    if (!store) return [];

    const rows = await db
      .select({
        id: purchases.id,
        purchaseNumber: purchases.purchaseNumber,
        supplierId: purchases.supplierId,
        supplierName: suppliers.name,
        totalAmount: purchases.totalAmount,
        shippingCost: purchases.shippingCost,
        status: purchases.status,
        notes: purchases.notes,
        purchasedAt: purchases.purchasedAt,
        createdAt: purchases.createdAt,
        createdByName: users.fullName,
        createdByEmail: users.email,
      })
      .from(purchases)
      .leftJoin(suppliers, eq(suppliers.id, purchases.supplierId))
      .leftJoin(users, eq(users.id, purchases.createdBy))
      .where(eq(purchases.storeId, storeId))
      .orderBy(desc(purchases.purchasedAt));

    return rows;
  } catch (error) {
    console.error("Failed to fetch purchases:", error);
    return [];
  }
}

export async function getPurchaseById(storeId: string, purchaseId: string) {
  try {
    const store = await getStoreById(storeId);
    if (!store) return null;

    const [purchase] = await db
      .select({
        id: purchases.id,
        storeId: purchases.storeId,
        purchaseNumber: purchases.purchaseNumber,
        supplierId: purchases.supplierId,
        supplierName: suppliers.name,
        supplierPhone: suppliers.phone,
        totalAmount: purchases.totalAmount,
        shippingCost: purchases.shippingCost,
        status: purchases.status,
        notes: purchases.notes,
        purchasedAt: purchases.purchasedAt,
        createdByName: users.fullName,
        createdByEmail: users.email,
      })
      .from(purchases)
      .leftJoin(suppliers, eq(suppliers.id, purchases.supplierId))
      .leftJoin(users, eq(users.id, purchases.createdBy))
      .where(
        and(eq(purchases.id, purchaseId), eq(purchases.storeId, storeId))
      )
      .limit(1);

    if (!purchase) return null;

    // Fetch items with product details
    const items = await db
      .select({
        id: purchaseItems.id,
        productId: purchaseItems.productId,
        productName: products.name,
        productSku: products.sku,
        productImageUrl: products.imageUrl,
        quantity: purchaseItems.quantity,
        unitCost: purchaseItems.unitCost,
        lineTotal: purchaseItems.lineTotal,
      })
      .from(purchaseItems)
      .leftJoin(products, eq(products.id, purchaseItems.productId))
      .where(eq(purchaseItems.purchaseId, purchaseId));

    // Fetch screenshots/invoices
    const screenshots = await db
      .select()
      .from(paymentScreenshots)
      .where(
        and(
          eq(paymentScreenshots.referenceId, purchaseId),
          eq(paymentScreenshots.referenceType, "purchase")
        )
      );

    return { purchase, items, screenshots };
  } catch (error) {
    console.error("Failed to fetch purchase details:", error);
    return null;
  }
}

export async function createPurchaseAction(
  storeId: string,
  data: CreatePurchaseInput
) {
  const user = await getCurrentUser();
  if (!user) return { error: "Unauthorized" };

  const store = await getStoreById(storeId);
  if (!store) return { error: "Store not found" };

  if (!data.items || data.items.length === 0) {
    return { error: "At least one product is required for stock-in" };
  }

  // Calculate items sum
  const shipping = Math.max(0, Number(data.shippingCost) || 0);
  let subtotal = 0;
  for (const it of data.items) {
    if (it.quantity <= 0) return { error: "Quantity must be greater than 0" };
    if (it.unitCost < 0) return { error: "Unit cost cannot be negative" };
    subtotal += it.quantity * it.unitCost;
  }
  const totalAmount = subtotal + shipping;

  // Auto-generate PO number
  const purchaseNumber = `PO-${Date.now().toString().slice(-6)}`;

  try {
    const result = await db.transaction(async (tx) => {
      // 1. Insert purchase
      const [newPurchase] = await tx
        .insert(purchases)
        .values({
          storeId,
          supplierId: data.supplierId || null,
          createdBy: user.id,
          purchaseNumber,
          totalAmount: totalAmount.toString(),
          shippingCost: shipping.toString(),
          notes: data.notes?.trim() || null,
          status: "completed",
        })
        .returning();

      // 2. Insert items and update product stocks
      for (const it of data.items) {
        const lineTotal = it.quantity * it.unitCost;
        await tx.insert(purchaseItems).values({
          purchaseId: newPurchase.id,
          productId: it.productId,
          quantity: it.quantity,
          unitCost: it.unitCost.toString(),
          lineTotal: lineTotal.toString(),
        });

        // Get current stock
        const [prod] = await tx
          .select({ currentStock: products.currentStock })
          .from(products)
          .where(eq(products.id, it.productId))
          .limit(1);

        const stockBefore = prod ? prod.currentStock : 0;
        const stockAfter = stockBefore + it.quantity;

        // Update product stock and optionally update costPrice
        await tx
          .update(products)
          .set({
            currentStock: stockAfter,
            costPrice: it.unitCost.toString(), // sync latest cost price
            updatedAt: new Date(),
          })
          .where(eq(products.id, it.productId));

        // Insert stock movement
        await tx.insert(stockMovements).values({
          productId: it.productId,
          referenceId: newPurchase.id,
          referenceType: "purchase",
          movementType: "purchase",
          quantityChange: it.quantity,
          stockBefore,
          stockAfter,
          notes: `Stock-In (${purchaseNumber})`,
          createdBy: user.id,
        });
      }

      // 3. Attach invoice screenshot if provided
      if (data.invoiceScreenshot) {
        await tx.insert(paymentScreenshots).values({
          referenceId: newPurchase.id,
          referenceType: "purchase",
          storagePath: data.invoiceScreenshot,
        });
      }

      return newPurchase;
    });

    revalidatePath(`/stores/${storeId}/purchases`);
    revalidatePath(`/stores/${storeId}/products`);
    revalidatePath(`/stores/${storeId}/dashboard`);
    return { success: true, purchaseId: result.id };
  } catch (error) {
    console.error("Failed to create purchase:", error);
    return { error: "Failed to record purchase. Please try again." };
  }
}

