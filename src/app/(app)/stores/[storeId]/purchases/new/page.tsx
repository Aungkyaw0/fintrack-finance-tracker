import { notFound } from "next/navigation";
import { getStoreById } from "@/app/actions/stores";
import { getSuppliers } from "@/app/actions/suppliers";
import { getProducts } from "@/app/actions/products";
import { PurchaseForm } from "@/components/forms/purchase-form";
import { BackButton } from "@/components/ui/back-button";
import { getTranslations } from "next-intl/server";

export default async function NewPurchasePage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const store = await getStoreById(storeId);
  if (!store) notFound();

  const suppliers = await getSuppliers(storeId);
  const products = await getProducts(storeId);
  const t = await getTranslations();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BackButton href={`/stores/${storeId}/purchases`} />
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t("purchases.newPurchase")} (Stock-In)
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {store.name} · Record supplier purchases and increase product stock
          </p>
        </div>
      </div>

      <PurchaseForm
        storeId={storeId}
        currency={store.currency}
        suppliers={suppliers}
        products={products}
      />
    </div>
  );
}

