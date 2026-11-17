import { notFound } from "next/navigation";
import { getStoreById } from "@/app/actions/stores";
import { getProducts } from "@/app/actions/products";
import { SaleForm } from "@/components/forms/sale-form";
import { BackButton } from "@/components/ui/back-button";
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
      <div className="flex items-center gap-3">
        <BackButton href={`/stores/${storeId}/sales`} />
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t("sales.newSale")}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {store.name} · Select products, enter quantities, and upload payment slip
          </p>
        </div>
      </div>

      <SaleForm
        storeId={storeId}
        currency={store.currency}
        products={products}
      />
    </div>
  );
}

