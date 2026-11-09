import { notFound } from "next/navigation";
import { getStoreById } from "@/app/actions/stores";
import { getSuppliers } from "@/app/actions/suppliers";
import { SupplierDialog } from "@/components/forms/supplier-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, Phone, MapPin, Edit } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function SuppliersPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const store = await getStoreById(storeId);
  if (!store) notFound();

  const suppliers = await getSuppliers(storeId);
  const t = await getTranslations();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t("suppliers.title")}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {suppliers.length} {t("suppliers.title").toLowerCase()}
          </p>
        </div>

        <SupplierDialog storeId={storeId} />
      </div>

      {/* Suppliers List */}
      {suppliers.length === 0 ? (
        <Card className="bg-card">
          <CardContent className="py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">
              {t("suppliers.noSuppliers")}
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Add your suppliers to link them with inventory purchases and invoices.
            </p>
            <SupplierDialog storeId={storeId} />
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobile Card List (No horizontal scroll!) */}
          <div className="space-y-3 md:hidden">
            {suppliers.map((s) => (
              <Card key={s.id} className="bg-card shadow-2xs hover:border-primary/40 transition-colors">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-foreground">{s.name}</h4>
                      {s.phone && (
                        <p className="text-xs text-primary font-mono mt-0.5 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-muted-foreground/60" />
                          {s.phone}
                        </p>
                      )}
                    </div>

                    <SupplierDialog
                      storeId={storeId}
                      initialData={s}
                      isEdit={true}
                      trigger={
                        <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
                          <Edit className="w-3 h-3 mr-1" />
                          {t("common.edit")}
                        </Button>
                      }
                    />
                  </div>

                  {s.address && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 pt-1 border-t">
                      <MapPin className="w-3 h-3 text-muted-foreground/60 shrink-0" />
                      <span>{s.address}</span>
                    </p>
                  )}

                  {s.notes && (
                    <p className="text-xs text-muted-foreground italic">
                      {s.notes}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop Table View */}
          <Card className="hidden md:block overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("suppliers.supplierName")}</TableHead>
                    <TableHead>{t("suppliers.phone")}</TableHead>
                    <TableHead>{t("suppliers.address")}</TableHead>
                    <TableHead>{t("common.notes")}</TableHead>
                    <TableHead className="w-[80px] text-right">
                      {t("common.actions")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suppliers.map((s) => (
                    <TableRow key={s.id} className="hover:bg-muted/40">
                      <TableCell className="font-medium text-foreground">
                        {s.name}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {s.phone ? (
                          <span className="flex items-center gap-1.5 font-mono">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            {s.phone}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {s.address ? (
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            {s.address}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                        {s.notes || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <SupplierDialog
                          storeId={storeId}
                          initialData={s}
                          isEdit={true}
                          trigger={
                            <Button variant="ghost" size="sm" className="h-8 px-2 text-indigo-600">
                              <Edit className="w-3.5 h-3.5 mr-1" />
                              <span className="text-xs">{t("common.edit")}</span>
                            </Button>
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

