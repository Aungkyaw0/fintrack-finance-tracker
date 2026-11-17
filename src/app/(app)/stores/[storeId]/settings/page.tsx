import { notFound, redirect } from "next/navigation";
import { getStoreById } from "@/app/actions/stores";
import { getStoreMembers, getUserStoreRole } from "@/app/actions/members";
import { StoreSettingsForm } from "@/components/forms/store-settings-form";
import { StoreMembersManager } from "@/components/forms/store-members-manager";
import { getTranslations } from "next-intl/server";

export default async function StoreSettingsPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const store = await getStoreById(storeId);
  if (!store) notFound();

  const currentUserRole = await getUserStoreRole(storeId);
  if (!currentUserRole || currentUserRole === "staff") {
    redirect(`/stores/${storeId}/dashboard`);
  }

  const members = await getStoreMembers(storeId);
  const t = await getTranslations();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {t("settings.title")}
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          {store.name} · Configure store preferences and currency
        </p>
      </div>

      <StoreMembersManager
        storeId={storeId}
        members={members}
        currentUserRole={currentUserRole}
      />

      <StoreSettingsForm store={store} />
    </div>
  );
}

