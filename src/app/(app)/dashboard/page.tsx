import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getUserStores } from "@/app/actions/stores";
import { AppHeader } from "@/components/layout/app-header";
import { CreateStoreDialog } from "@/components/forms/create-store-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Store, Plus, ArrowRight, Sparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function DashboardOverviewPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const stores = await getUserStores();
  const t = await getTranslations();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <AppHeader />

      <main className="flex-1 p-4 sm:p-8 max-w-6xl w-full mx-auto space-y-8">
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
              {t("stores.myStores")}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {user.fullName ? `Hello, ${user.fullName}!` : "Welcome back!"} —{" "}
              {t("stores.switchStore")}
            </p>
          </div>

          <CreateStoreDialog />
        </div>

        {/* Stores Grid or Empty State */}
        {stores.length === 0 ? (
          <div className="bg-white border border-dashed rounded-2xl p-8 sm:p-12 text-center max-w-lg mx-auto shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
              <Store className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {t("stores.noStores")}
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Create your first store project to start tracking products, stock,
              sales, and net profit.
            </p>
            <CreateStoreDialog
              trigger={
                <Button size="lg" className="gap-2 shadow-sm">
                  <Plus className="w-5 h-5" />
                  <span>{t("stores.createStore")}</span>
                </Button>
              }
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {stores.map((store) => (
              <Card
                key={store.id}
                className="hover:shadow-md transition-shadow flex flex-col justify-between border-slate-200"
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
                      <Store className="w-5 h-5" />
                    </div>
                    <Badge variant="secondary" className="font-semibold text-xs">
                      {store.currency}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg font-bold text-gray-900 mt-2 truncate">
                    {store.name}
                  </CardTitle>
                  {store.description && (
                    <CardDescription className="line-clamp-2 text-xs">
                      {store.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardFooter className="pt-2 border-t bg-slate-50/50 rounded-b-xl flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">
                    {new Date(store.createdAt).toLocaleDateString()}
                  </span>
                  <Link href={`/stores/${store.id}/dashboard`}>
                    <Button size="sm" className="gap-1 text-xs">
                      <span>{t("dashboard.title")}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
