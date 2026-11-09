import { notFound } from "next/navigation";
import { getStoreById } from "@/app/actions/stores";
import { StoreSettingsForm } from "@/components/forms/store-settings-form";
import { getTranslations } from "next-intl/server";

export default async function StoreSettingsPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const store = await getStoreById(storeId);
  if (!store) notFound();

  const t = await getTranslations();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          {t("settings.title")}
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          {store.name} · Configure store preferences and currency
        </p>
      </div>

      <StoreSettingsForm store={store} />
    </div>
  );
}

