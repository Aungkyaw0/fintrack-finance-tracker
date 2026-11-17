import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getStoreById } from "@/app/actions/stores";
import { getUserStoreRole } from "@/app/actions/members";
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

  // Concurrently fetch user, store, and role to cut latency
  const [user, store, userRole] = await Promise.all([
    getCurrentUser(),
    getStoreById(storeId),
    getUserStoreRole(storeId),
  ]);

  if (!user) redirect("/auth/login");
  if (!store) redirect("/dashboard");

  const role = userRole || "staff";

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground overflow-x-hidden w-full max-w-full">
      <AppHeader currentStoreId={storeId} />
      <StoreNav storeId={storeId} userRole={role} />
      <main className="flex-1 p-3.5 sm:p-6 max-w-7xl w-full mx-auto pb-24 sm:pb-8 overflow-x-hidden">
        {children}
      </main>
      <BottomNav storeId={storeId} userRole={role} />
    </div>
  );
}

