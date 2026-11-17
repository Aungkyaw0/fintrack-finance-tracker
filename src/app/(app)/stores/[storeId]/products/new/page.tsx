import { notFound } from "next/navigation";
import { getStoreById } from "@/app/actions/stores";
import { getCategories } from "@/app/actions/categories";
import { ProductForm } from "@/components/forms/product-form";
import { BackButton } from "@/components/ui/back-button";
import { getTranslations } from "next-intl/server";

export default async function NewProductPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const store = await getStoreById(storeId);
  if (!store) notFound();

  const categories = await getCategories(storeId);
  const t = await getTranslations();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BackButton href={`/stores/${storeId}/products`} />
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t("products.addProduct")}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {store.name} · Enter product details and pricing
          </p>
        </div>
      </div>

      <ProductForm
        storeId={storeId}
        currency={store.currency}
        categories={categories}
      />
    </div>
  );
}

