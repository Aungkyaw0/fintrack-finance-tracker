import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getStoreById } from "@/app/actions/stores";
import { AppHeader } from "@/components/layout/app-header";
import { StoreNav } from "@/components/layout/store-nav";
import { BottomNav } from "@/components/layout/bottom-nav";

export default async function StoreLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const store = await getStoreById(storeId);
  if (!store) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <AppHeader currentStoreId={storeId} />
      <StoreNav storeId={storeId} />
      <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto pb-24 sm:pb-8">
        {children}
      </main>
      <BottomNav storeId={storeId} />
    </div>
  );
}

