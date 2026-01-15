import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/tax-calculator";
import { useCalculatorHistoryStore } from "@/lib/store/useCalculatorHistoryStore";
import type { CalculatorHistoryEntry } from "@/lib/types/calculator-history";

import { MonthlySavingsAccordion } from "./monthly-savings-accordion";
import { BandBreakdownAccordion } from "./band-breakdown-accordion";
import { FlatBreakdownAccordion } from "./flat-breakdown-accordion";

type Props = Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
}>;

function formatEntryTitle(e: CalculatorHistoryEntry): string {
  const date = new Date(e.timestamp).toLocaleString();
  return `${e.tab} • ${date}`;
}

export function CalculationHistoryDialog({ open, onOpenChange }: Props) {
  const entries = useCalculatorHistoryStore((s) => s.entries);
  const clear = useCalculatorHistoryStore((s) => s.clear);
  const removeEntry = useCalculatorHistoryStore((s) => s.removeEntry);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = useMemo(
    () => entries.find((e) => e.id === selectedId) ?? null,
    [entries, selectedId]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl! max-h-[75vh] overflow-x-hidden fancy-scrollbar">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3">
            <DialogTitle>Calculation History</DialogTitle>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                clear();
                setSelectedId(null);
              }}
              disabled={entries.length === 0}
            >
              Clear all
            </Button>
          </div>
        </DialogHeader>

        <section className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.4fr] gap-4 h-full">
          <div className="overflow-y-auto fancy-scrollbar pr-2">
            {entries.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No saved calculations yet.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {entries.map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => setSelectedId(e.id)}
                    className={`w-full text-left rounded-md border p-3 hover:bg-muted/30 transition-colors ${
                      selectedId === e.id ? "bg-muted/40" : ""
                    }`}
                  >
                    <p className="text-sm font-semibold">{e.tab}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(e.timestamp).toLocaleString()}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="overflow-y-auto fancy-scrollbar pr-2">
            {selected ? (
              <div className="flex flex-col gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">
                      {formatEntryTitle(selected)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2">
                    {selected.kind === "income-tax" ? (
                      <>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Chargeable income
                          </span>
                          <span className="font-semibold">
                            {formatCurrency(selected.summary.chargeableIncome)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Gross tax
                          </span>
                          <span className="font-medium">
                            {formatCurrency(selected.summary.grossTax)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Credits applied
                          </span>
                          <span className="font-medium">
                            {formatCurrency(selected.summary.creditsApplied)}
                          </span>
                        </div>
                        <div className="pt-2 border-t flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Net tax payable
                          </span>
                          <span className="font-semibold">
                            {formatCurrency(selected.summary.netTaxPayable)}
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {selected.summary.label}
                          </span>
                          <span className="font-semibold">
                            {formatCurrency(selected.summary.taxDue)}
                          </span>
                        </div>
                      </>
                    )}

                    <div className="pt-3 flex items-center justify-end">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          removeEntry(selected.id);
                          setSelectedId(null);
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Inputs</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {Object.entries(selected.inputs).map(([k, v]) => (
                        <div
                          key={k}
                          className="flex items-center justify-between gap-3 text-sm rounded-md border p-2"
                        >
                          <span className="text-muted-foreground">{k}</span>
                          <span className="font-medium">
                            {formatCurrency(v)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {selected.adjustments && selected.adjustments.length > 0 ? (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">
                        Adjustments (deductions / credits)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex flex-col gap-2">
                        {selected.adjustments.map((a) => (
                          <div
                            key={`${a.kind}-${a.key}`}
                            className="rounded-md border p-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold">
                                  {a.kind === "credit" ? "Credit" : "Deduction"}
                                  : {a.label}
                                </p>
                                {a.reason ? (
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {a.reason}
                                  </p>
                                ) : null}
                              </div>
                              <div className="shrink-0 text-right">
                                <p className="text-xs text-muted-foreground">
                                  Applied
                                </p>
                                <p className="text-sm font-semibold">
                                  {formatCurrency(a.appliedAmount)}
                                </p>
                                {a.enteredAmount !== a.appliedAmount ? (
                                  <p className="text-xs text-muted-foreground">
                                    Entered: {formatCurrency(a.enteredAmount)}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : null}

                <MonthlySavingsAccordion
                  tableTitle="12-month savings target"
                  rows={selected.monthlyPlan}
                />

                {selected.kind === "income-tax" ? (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">
                        Band breakdown
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <BandBreakdownAccordion bands={selected.bands} />
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <FlatBreakdownAccordion sections={selected.sections} />
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Select a saved calculation to view details.
              </p>
            )}
          </div>
        </section>
      </DialogContent>
    </Dialog>
  );
}
