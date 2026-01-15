import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { computeWhtFinal } from "../calculating-context/wht-final";
import { FlatBreakdownAccordion } from "../components/flat-breakdown-accordion";
import { MoneyField } from "../components/money-field";
import { PercentField } from "../components/percent-field";
import { parseAmount } from "../components/parse-amount";
import { SummaryRow } from "../components/summary-row";
import { GenericAiSummaryCard } from "../components/generic-ai-summary-card";
import { SaveCalculationButton } from "../components/save-calculation-button";

import { MonthlySavingsAccordion } from "../components/monthly-savings-accordion";
import { MONTH_NAMES, buildMonthlyPlan } from "@/lib/types/calculator-history";
import type { CalculatorHistoryEntry } from "@/lib/types/calculator-history";

export function WhtFinalTab() {
  const [grossPayment, setGrossPayment] = useState("");
  const [ratePercent, setRatePercent] = useState("10");

  const computation = useMemo(() => {
    return computeWhtFinal({
      grossPayment: parseAmount(grossPayment),
      ratePercent: parseAmount(ratePercent),
    });
  }, [grossPayment, ratePercent]);

  const monthlyPlan = useMemo(() => {
    const startMonth = new Date().getMonth();
    return buildMonthlyPlan(computation.taxWithheld, startMonth, MONTH_NAMES);
  }, [computation.taxWithheld]);

  const buildEntry = (): CalculatorHistoryEntry | null => {
    const gp = parseAmount(grossPayment);
    if (gp <= 0) return null;
    return {
      kind: "flat-tax",
      tab: "wht-final",
      id: `calc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      timestamp: Date.now(),
      inputs: {
        grossPayment: gp,
        ratePercent: parseAmount(ratePercent),
      },
      summary: {
        label: "WHT withheld",
        taxDue: computation.taxWithheld,
      },
      sections: computation.sections,
      monthlyPlan,
    };
  };

  return (
    <section className="grid grid-cols-1 lg:grid-cols-[1.1fr_1.3fr_0.9fr] gap-4 lg:gap-6 items-start">
      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Inputs</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <MoneyField
              id="whtf-gross"
              label="Gross payment (₦)"
              value={grossPayment}
              onChange={setGrossPayment}
            />
            <PercentField
              id="whtf-rate"
              label="WHT rate (%)"
              value={ratePercent}
              onChange={setRatePercent}
              helpText="Enter the applicable final WHT rate for this transaction."
            />
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-base">Summary</CardTitle>
              <SaveCalculationButton
                buildEntry={buildEntry}
                disabledReason={
                  parseAmount(grossPayment) <= 0
                    ? "Enter gross payment to save"
                    : undefined
                }
              />
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <SummaryRow
              label="Gross payment"
              value={computation.grossPayment}
            />
            <SummaryRow label="WHT withheld" value={computation.taxWithheld} />
            <div className="pt-2 border-t">
              <SummaryRow
                label="Net payment"
                value={computation.netPayment}
                valueClassName="font-semibold"
              />
            </div>
          </CardContent>
        </Card>

        <MonthlySavingsAccordion
          tableTitle="Set aside monthly to cover WHT"
          rows={monthlyPlan}
        />

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">How it was calculated</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <FlatBreakdownAccordion sections={computation.sections} />
          </CardContent>
        </Card>

        <Card className="lg:hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">AI Summary</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <GenericAiSummaryCard
              title="AI Summary"
              promptContext={computation.aiContext}
            />
          </CardContent>
        </Card>
      </div>

      <div className="hidden lg:block">
        <GenericAiSummaryCard
          title="AI Summary"
          promptContext={computation.aiContext}
        />
      </div>
    </section>
  );
}
