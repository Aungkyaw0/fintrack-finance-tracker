import {
  pgTable,
  uuid,
  text,
  timestamp,
  pgEnum,
  decimal,
  integer,
  boolean,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const userLanguageEnum = pgEnum("user_language", ["my", "en"]);

export const storeMemberRoleEnum = pgEnum("store_member_role", [
  "owner",
  "manager",
  "staff",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "cash",
  "kbz_pay",
  "wave_pay",
  "aya_pay",
  "bank_transfer",
  "other",
]);

export const saleStatusEnum = pgEnum("sale_status", [
  "completed",
  "cancelled",
  "refunded",
]);

export const purchaseStatusEnum = pgEnum("purchase_status", [
  "completed",
  "pending",
  "cancelled",
]);

export const stockMovementTypeEnum = pgEnum("stock_movement_type", [
  "sale",         // stock out via sale
  "purchase",     // stock in via purchase
  "adjustment",   // manual adjustment (loss, damage, correction)
  "refund",       // stock returned via refund
]);

export const referenceTypeEnum = pgEnum("reference_type", [
  "sale",
  "purchase",
  "adjustment",
]);

// ─── Tables ───────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").primaryKey(), // matches Supabase Auth user ID
  email: text("email").notNull().unique(),
  fullName: text("full_name"),
  avatarUrl: text("avatar_url"),
  preferredLanguage: userLanguageEnum("preferred_language")
    .notNull()
    .default("my"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const stores = pgTable("stores", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  currency: varchar("currency", { length: 10 }).notNull().default("MMK"),
  logoUrl: text("logo_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const storeMembers = pgTable("store_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  storeId: uuid("store_id")
    .notNull()
    .references(() => stores.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  role: storeMemberRoleEnum("role").notNull().default("staff"),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
});

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  storeId: uuid("store_id")
    .notNull()
    .references(() => stores.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  color: varchar("color", { length: 7 }).default("#6366f1"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  storeId: uuid("store_id")
    .notNull()
    .references(() => stores.id, { onDelete: "cascade" }),
  categoryId: uuid("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  name: text("name").notNull(),
  sku: varchar("sku", { length: 100 }),
  description: text("description"),
  imageUrl: text("image_url"),
  costPrice: decimal("cost_price", { precision: 15, scale: 2 })
    .notNull()
    .default("0"),
  sellingPrice: decimal("selling_price", { precision: 15, scale: 2 })
    .notNull()
    .default("0"),
  currentStock: integer("current_stock").notNull().default(0),
  lowStockThreshold: integer("low_stock_threshold").notNull().default(5),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const suppliers = pgTable("suppliers", {
  id: uuid("id").primaryKey().defaultRandom(),
  storeId: uuid("store_id")
    .notNull()
    .references(() => stores.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  phone: text("phone"),
  address: text("address"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const sales = pgTable("sales", {
  id: uuid("id").primaryKey().defaultRandom(),
  storeId: uuid("store_id")
    .notNull()
    .references(() => stores.id, { onDelete: "cascade" }),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id),
  saleNumber: varchar("sale_number", { length: 50 }).notNull(),
  subtotal: decimal("subtotal", { precision: 15, scale: 2 }).notNull(),
  discountAmount: decimal("discount_amount", { precision: 15, scale: 2 })
    .notNull()
    .default("0"),
  totalAmount: decimal("total_amount", { precision: 15, scale: 2 }).notNull(),
  paymentMethod: paymentMethodEnum("payment_method").notNull().default("cash"),
  notes: text("notes"),
  status: saleStatusEnum("status").notNull().default("completed"),
  soldAt: timestamp("sold_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const saleItems = pgTable("sale_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  saleId: uuid("sale_id")
    .notNull()
    .references(() => sales.id, { onDelete: "cascade" }),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 15, scale: 2 }).notNull(),
  discount: decimal("discount", { precision: 15, scale: 2 })
    .notNull()
    .default("0"),
  lineTotal: decimal("line_total", { precision: 15, scale: 2 }).notNull(),
});

export const purchases = pgTable("purchases", {
  id: uuid("id").primaryKey().defaultRandom(),
  storeId: uuid("store_id")
    .notNull()
    .references(() => stores.id, { onDelete: "cascade" }),
  supplierId: uuid("supplier_id").references(() => suppliers.id, {
    onDelete: "set null",
  }),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id),
  purchaseNumber: varchar("purchase_number", { length: 50 }).notNull(),
  totalAmount: decimal("total_amount", { precision: 15, scale: 2 }).notNull(),
  shippingCost: decimal("shipping_cost", { precision: 15, scale: 2 })
    .notNull()
    .default("0"),
  notes: text("notes"),
  status: purchaseStatusEnum("status").notNull().default("completed"),
  purchasedAt: timestamp("purchased_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const purchaseItems = pgTable("purchase_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  purchaseId: uuid("purchase_id")
    .notNull()
    .references(() => purchases.id, { onDelete: "cascade" }),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id),
  quantity: integer("quantity").notNull(),
  unitCost: decimal("unit_cost", { precision: 15, scale: 2 }).notNull(),
  lineTotal: decimal("line_total", { precision: 15, scale: 2 }).notNull(),
});

export const paymentScreenshots = pgTable("payment_screenshots", {
  id: uuid("id").primaryKey().defaultRandom(),
  referenceId: uuid("reference_id").notNull(),
  referenceType: referenceTypeEnum("reference_type").notNull(),
  storagePath: text("storage_path").notNull(), // Supabase storage path
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
});

export const stockMovements = pgTable("stock_movements", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  referenceId: uuid("reference_id"), // sale.id | purchase.id | null for manual
  referenceType: referenceTypeEnum("reference_type"),
  movementType: stockMovementTypeEnum("movement_type").notNull(),
  quantityChange: integer("quantity_change").notNull(), // negative = out, positive = in
  stockBefore: integer("stock_before").notNull(),
  stockAfter: integer("stock_after").notNull(),
  notes: text("notes"),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const expenses = pgTable("expenses", {
  id: uuid("id").primaryKey().defaultRandom(),
  storeId: uuid("store_id")
    .notNull()
    .references(() => stores.id, { onDelete: "cascade" }),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id),
  category: text("category").notNull(), // e.g. "rent", "salary", "packaging"
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  description: text("description"),
  receiptUrl: text("receipt_url"),
  expenseDate: timestamp("expense_date").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Relations ────────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  ownedStores: many(stores),
  storeMembers: many(storeMembers),
}));

export const storesRelations = relations(stores, ({ one, many }) => ({
  owner: one(users, { fields: [stores.ownerId], references: [users.id] }),
  members: many(storeMembers),
  categories: many(categories),
  products: many(products),
  suppliers: many(suppliers),
  sales: many(sales),
  purchases: many(purchases),
  expenses: many(expenses),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  store: one(stores, { fields: [products.storeId], references: [stores.id] }),
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  saleItems: many(saleItems),
  purchaseItems: many(purchaseItems),
  stockMovements: many(stockMovements),
}));

export const salesRelations = relations(sales, ({ one, many }) => ({
  store: one(stores, { fields: [sales.storeId], references: [stores.id] }),
  createdByUser: one(users, {
    fields: [sales.createdBy],
    references: [users.id],
  }),
  items: many(saleItems),
}));

export const purchasesRelations = relations(purchases, ({ one, many }) => ({
  store: one(stores, {
    fields: [purchases.storeId],
    references: [stores.id],
  }),
  supplier: one(suppliers, {
    fields: [purchases.supplierId],
    references: [suppliers.id],
  }),
  createdByUser: one(users, {
    fields: [purchases.createdBy],
    references: [users.id],
  }),
  items: many(purchaseItems),
}));

