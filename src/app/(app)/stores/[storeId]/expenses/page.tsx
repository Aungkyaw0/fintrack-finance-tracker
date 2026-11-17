import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { getStoreById } from "@/app/actions/stores";
import { getExpenses } from "@/app/actions/expenses";
import { getUserStoreRole } from "@/app/actions/members";
import { ExpenseDialog } from "@/components/forms/expense-dialog";
import { ExportCsvButton } from "@/components/common/export-csv-button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Receipt, Plus, Calendar } from "lucide-react";
import { getTranslations } from "next-intl/server";

const CAT_LABELS: Record<string, string> = {
  rent: "Rent",
  salary: "Salary",
  packaging: "Packaging",
  delivery: "Delivery",
  advertising: "Advertising",
  electricity: "Electricity",
  internet: "Internet",
  other: "Other",
};

export default async function ExpensesPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const store = await getStoreById(storeId);
  if (!store) notFound();

  const role = await getUserStoreRole(storeId);
  if (!role || role === "staff") {
    redirect(`/stores/${storeId}/dashboard`);
  }

  const expenses = await getExpenses(storeId);
  const t = await getTranslations();

  const expenseCsvHeaders = [
    "Date",
    "Category",
    `Amount (${store.currency})`,
    "Description",
    "Recorded By",
  ];

  const expenseCsvRows = expenses.map((e) => [
    new Date(e.expenseDate).toLocaleDateString(),
    CAT_LABELS[e.category] || e.category,
    Number(e.amount) || 0,
    e.description || "",
    e.createdByName || e.createdByEmail || "Staff",
  ]);

  const totalExpenseSum = expenses.reduce(
    (acc, e) => acc + Number(e.amount),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t("expenses.title")}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Total:{" "}
            <b className="text-rose-600 dark:text-rose-400">
              {totalExpenseSum.toLocaleString()} {store.currency}
            </b>{" "}
            across {expenses.length} records
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <ExportCsvButton
            filename={`${store.name}-expenses-${new Date().toISOString().slice(0, 10)}`}
            headers={expenseCsvHeaders}
            rows={expenseCsvRows}
          />
          <ExpenseDialog storeId={storeId} currency={store.currency} />
        </div>
      </div>

      {/* Expenses List */}
      {expenses.length === 0 ? (
        <Card className="bg-card">
          <CardContent className="py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-3">
              <Receipt className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">
              {t("expenses.noExpenses")}
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Track rent, salaries, packaging, and utilities to see accurate net profit calculations.
            </p>
            <ExpenseDialog storeId={storeId} currency={store.currency} />
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobile Card List (No horizontal scroll!) */}
          <div className="space-y-3 md:hidden">
            {expenses.map((e) => (
              <Card key={e.id} className="bg-card shadow-2xs hover:border-primary/40 transition-colors">
                <CardContent className="p-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {e.receiptUrl ? (
                      <a
                        href={e.receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block relative w-12 h-12 rounded-lg overflow-hidden border bg-muted shrink-0 shadow-xs"
                      >
                        <Image
                          src={e.receiptUrl}
                          alt="Receipt"
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      </a>
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500 shrink-0">
                        <Receipt className="w-5 h-5" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-[10px] capitalize font-medium py-0 px-1.5">
                          {CAT_LABELS[e.category] || e.category}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground">
                          {new Date(e.expenseDate).toLocaleDateString()}
                        </span>
                      </div>
                      {e.description && (
                        <p className="text-xs text-foreground font-medium truncate mt-1">
                          {e.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-sm font-bold text-rose-600 dark:text-rose-400 block">
                      −{Number(e.amount).toLocaleString()} {store.currency}
                    </span>
                  </div>
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
                    <TableHead className="w-[60px]">Receipt</TableHead>
                    <TableHead>{t("expenses.category")}</TableHead>
                    <TableHead>{t("expenses.description")}</TableHead>
                    <TableHead>{t("common.date")}</TableHead>
                    <TableHead className="text-right">{t("expenses.amount")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((e) => (
                    <TableRow key={e.id} className="hover:bg-muted/40">
                      <TableCell>
                        {e.receiptUrl ? (
                          <a
                            href={e.receiptUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block relative w-9 h-9 rounded-lg overflow-hidden border bg-muted shrink-0 hover:opacity-80 transition-opacity"
                          >
                            <Image
                              src={e.receiptUrl}
                              alt="Receipt"
                              fill
                              className="object-cover"
                              sizes="36px"
                            />
                          </a>
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                            <Receipt className="w-4 h-4" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs capitalize font-medium">
                          {CAT_LABELS[e.category] || e.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-foreground max-w-sm truncate">
                        {e.description || "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(e.expenseDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right font-bold text-xs sm:text-sm text-rose-600 dark:text-rose-400">
                        −{Number(e.amount).toLocaleString()} {store.currency}
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

