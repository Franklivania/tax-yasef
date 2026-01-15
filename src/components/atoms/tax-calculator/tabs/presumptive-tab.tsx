import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { computePresumptive } from "../calculating-context/presumptive";
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

export function PresumptiveTab() {
  const [turnover, setTurnover] = useState("");
  const [exemptThreshold, setExemptThreshold] = useState("0");
  const [ratePercent, setRatePercent] = useState("1");

  const computation = useMemo(() => {
    return computePresumptive({
      turnover: parseAmount(turnover),
      exemptThreshold: parseAmount(exemptThreshold),
      ratePercent: parseAmount(ratePercent),
    });
  }, [turnover, exemptThreshold, ratePercent]);

  const monthlyPlan = useMemo(() => {
    const startMonth = new Date().getMonth();
    return buildMonthlyPlan(computation.taxDue, startMonth, MONTH_NAMES);
  }, [computation.taxDue]);

  const buildEntry = (): CalculatorHistoryEntry | null => {
    const t = parseAmount(turnover);
    if (t <= 0) return null;
    return {
      kind: "flat-tax",
      tab: "presumptive",
      id: `calc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      timestamp: Date.now(),
      inputs: {
        turnover: t,
        exemptThreshold: parseAmount(exemptThreshold),
        ratePercent: parseAmount(ratePercent),
      },
      summary: { label: "Presumptive tax due", taxDue: computation.taxDue },
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
              id="pt-turnover"
              label="Turnover (₦)"
              value={turnover}
              onChange={setTurnover}
            />
            <MoneyField
              id="pt-threshold"
              label="Exempt threshold (₦)"
              value={exemptThreshold}
              onChange={setExemptThreshold}
              helpText="Optional threshold/allowance to exclude from turnover before applying presumptive rate."
            />
            <PercentField
              id="pt-rate"
              label="Presumptive rate (%)"
              value={ratePercent}
              onChange={setRatePercent}
              helpText="Enter the applicable presumptive rate for your sector/threshold."
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
                  parseAmount(turnover) <= 0
                    ? "Enter turnover to save"
                    : undefined
                }
              />
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <SummaryRow label="Turnover" value={computation.turnover} />
            <SummaryRow label="Tax base" value={computation.taxBase} />
            <div className="pt-2 border-t">
              <SummaryRow
                label="Tax due"
                value={computation.taxDue}
                valueClassName="font-semibold"
              />
            </div>
          </CardContent>
        </Card>

        <MonthlySavingsAccordion
          tableTitle="Set aside monthly to cover presumptive tax"
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
