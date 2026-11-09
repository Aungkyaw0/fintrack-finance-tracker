import { notFound } from "next/navigation";
import { getStoreById } from "@/app/actions/stores";
import { getProducts } from "@/app/actions/products";
import { SaleForm } from "@/components/forms/sale-form";
import { getTranslations } from "next-intl/server";

export default async function NewSalePage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const store = await getStoreById(storeId);
  if (!store) notFound();

  const products = await getProducts(storeId);
  const t = await getTranslations();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {t("sales.newSale")}
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          {store.name} · Select products, enter quantities, and upload payment slip
        </p>
      </div>

      <SaleForm
        storeId={storeId}
        currency={store.currency}
        products={products}
      />
    </div>
  );
}

