import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getStoreById } from "@/app/actions/stores";
import { getProducts } from "@/app/actions/products";
import { getCategories } from "@/app/actions/categories";
import { CategoryManagerDialog } from "@/components/forms/category-manager-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Package,
  Search,
  Eye,
  SlidersHorizontal,
  AlertTriangle,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function ProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ storeId: string }>;
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { storeId } = await params;
  const { q, category } = await searchParams;

  const store = await getStoreById(storeId);
  if (!store) notFound();

  const t = await getTranslations();
  const products = await getProducts(storeId, {
    search: q,
    categoryId: category,
  });
  const categories = await getCategories(storeId);

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            {t("products.title")}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {products.length} {t("products.title").toLowerCase()}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <CategoryManagerDialog
            storeId={storeId}
            categories={categories}
          />
          <Link href={`/stores/${storeId}/products/new`}>
            <Button className="gap-1.5 shadow-sm">
              <Plus className="w-4 h-4" />
              <span>{t("products.addProduct")}</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter / Search bar */}
      <Card className="bg-white">
        <CardContent className="p-3">
          <form method="GET" className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="q"
                placeholder={`${t("common.search")} ${t("products.productName")} / SKU...`}
                defaultValue={q || ""}
                className="pl-9 h-9 text-sm"
              />
            </div>
            {/* Category filter pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              <Link
                href={`/stores/${storeId}/products${q ? `?q=${q}` : ""}`}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  !category
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                All
              </Link>
              {categories.map((c) => (
                <Link
                  key={c.id}
                  href={`/stores/${storeId}/products?category=${c.id}${
                    q ? `&q=${q}` : ""
                  }`}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    category === c.id
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <span
                    className="inline-block w-2 h-2 rounded-full mr-1.5"
                    style={{ backgroundColor: c.color || "#6366f1" }}
                  />
                  {c.name}
                </Link>
              ))}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Products Table */}
      {products.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
              <Package className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">
              {t("products.noProducts")}
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Add your first product to start tracking your inventory.
            </p>
            <Link href={`/stores/${storeId}/products/new`}>
              <Button size="sm" className="gap-1.5">
                <Plus className="w-4 h-4" />
                {t("products.addProduct")}
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Image</TableHead>
                  <TableHead>{t("products.productName")}</TableHead>
                  <TableHead>{t("categories.title")}</TableHead>
                  <TableHead className="text-right">
                    {t("products.costPrice")}
                  </TableHead>
                  <TableHead className="text-right">
                    {t("products.sellingPrice")}
                  </TableHead>
                  <TableHead className="text-center">
                    {t("products.currentStock")}
                  </TableHead>
                  <TableHead className="w-[80px] text-right">
                    {t("common.actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => {
                  const isOutOfStock = p.currentStock <= 0;
                  const isLowStock =
                    !isOutOfStock && p.currentStock <= p.lowStockThreshold;

                  return (
                    <TableRow key={p.id} className="hover:bg-slate-50/70">
                      {/* Thumbnail */}
                      <TableCell>
                        <div className="w-11 h-11 rounded-lg bg-slate-100 overflow-hidden relative border shrink-0 flex items-center justify-center">
                          {p.imageUrl ? (
                            <Image
                              src={p.imageUrl}
                              alt={p.name}
                              fill
                              className="object-cover"
                              sizes="44px"
                            />
                          ) : (
                            <Package className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                      </TableCell>

                      {/* Product Name & SKU */}
                      <TableCell>
                        <Link
                          href={`/stores/${storeId}/products/${p.id}`}
                          className="font-medium text-gray-900 hover:text-indigo-600 transition-colors line-clamp-1"
                        >
                          {p.name}
                        </Link>
                        {p.sku && (
                          <span className="text-[11px] text-muted-foreground block font-mono">
                            SKU: {p.sku}
                          </span>
                        )}
                      </TableCell>

                      {/* Category */}
                      <TableCell>
                        {p.categoryName ? (
                          <Badge
                            variant="outline"
                            className="text-xs font-normal"
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full mr-1.5"
                              style={{
                                backgroundColor: p.categoryColor || "#6366f1",
                              }}
                            />
                            {p.categoryName}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>

                      {/* Cost Price */}
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {Number(p.costPrice).toLocaleString()} {store.currency}
                      </TableCell>

                      {/* Selling Price */}
                      <TableCell className="text-right font-semibold text-xs sm:text-sm text-gray-900">
                        {Number(p.sellingPrice).toLocaleString()} {store.currency}
                      </TableCell>

                      {/* Stock Badge */}
                      <TableCell className="text-center">
                        <Badge
                          variant={
                            isOutOfStock
                              ? "destructive"
                              : isLowStock
                              ? "default"
                              : "secondary"
                          }
                          className={`text-xs font-semibold ${
                            isLowStock
                              ? "bg-amber-100 text-amber-800 hover:bg-amber-100"
                              : ""
                          }`}
                        >
                          {p.currentStock}{" "}
                          {isOutOfStock
                            ? `(${t("products.outOfStock")})`
                            : isLowStock
                            ? `(${t("products.lowStock")})`
                            : ""}
                        </Badge>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <Link href={`/stores/${storeId}/products/${p.id}`}>
                          <Button variant="ghost" size="sm" className="h-8 px-2 text-indigo-600">
                            <Eye className="w-4 h-4 mr-1" />
                            <span className="text-xs">View</span>
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}

