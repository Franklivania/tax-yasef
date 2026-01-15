import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { computeWhtCredit } from "../calculating-context/wht-credit";
import { AppliedDeductions } from "../components/applied-deductions";
import { BandBreakdownAccordion } from "../components/band-breakdown-accordion";
import { MoneyField } from "../components/money-field";
import { parseAmount } from "../components/parse-amount";
import { SummaryRow } from "../components/summary-row";
import { AiSummaryCard } from "../components/ai-summary-card";
import { SaveCalculationButton } from "../components/save-calculation-button";

import { MonthlySavingsAccordion } from "../components/monthly-savings-accordion";
import { MONTH_NAMES, buildMonthlyPlan } from "@/lib/types/calculator-history";
import type {
  CalculatorHistoryEntry,
  AppliedAmountLine,
} from "@/lib/types/calculator-history";

export function WhtCreditTab() {
  const [chargeableIncome, setChargeableIncome] = useState("");
  const [whtCredit, setWhtCredit] = useState("");

  const computation = useMemo(() => {
    return computeWhtCredit({
      chargeableIncome: parseAmount(chargeableIncome),
      whtCredit: parseAmount(whtCredit),
    });
  }, [chargeableIncome, whtCredit]);

  const monthlyPlan = useMemo(() => {
    const startMonth = new Date().getMonth();
    return buildMonthlyPlan(computation.netTaxPayable, startMonth, MONTH_NAMES);
  }, [computation.netTaxPayable]);

  const buildEntry = (): CalculatorHistoryEntry | null => {
    const ci = parseAmount(chargeableIncome);
    if (ci <= 0) return null;
    const adjustments: AppliedAmountLine[] = computation.credits.map((c) => ({
      kind: "credit" as const,
      key: c.key,
      label: c.label,
      enteredAmount: c.enteredAmount,
      appliedAmount: c.appliedAmount,
      reason: c.reason,
    }));

    return {
      kind: "income-tax",
      tab: "wht-credit",
      id: `calc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      timestamp: Date.now(),
      inputs: {
        chargeableIncome: ci,
        whtCredit: parseAmount(whtCredit),
      },
      summary: {
        chargeableIncome: computation.chargeableIncome,
        grossTax: computation.grossTax,
        creditsApplied: computation.creditsApplied,
        netTaxPayable: computation.netTaxPayable,
      },
      adjustments,
      bands: computation.tax.bands,
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
              id="whtc-chargeable"
              label="Chargeable income (₦)"
              value={chargeableIncome}
              onChange={setChargeableIncome}
            />
            <MoneyField
              id="whtc-credit"
              label="WHT already deducted (credit) (₦)"
              value={whtCredit}
              onChange={setWhtCredit}
            />
          </CardContent>
        </Card>

        <AppliedDeductions deductions={[]} credits={computation.credits} />
      </div>

      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-base">Summary</CardTitle>
              <SaveCalculationButton
                buildEntry={buildEntry}
                disabledReason={
                  parseAmount(chargeableIncome) <= 0
                    ? "Enter chargeable income to save"
                    : undefined
                }
              />
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <SummaryRow
              label="Chargeable income"
              value={computation.chargeableIncome}
            />
            <SummaryRow
              label="Gross tax (before credits)"
              value={computation.grossTax}
            />
            <SummaryRow
              label="Credits applied"
              value={computation.creditsApplied}
            />
            <div className="pt-2 border-t">
              <SummaryRow
                label="Net tax payable"
                value={computation.netTaxPayable}
                valueClassName="font-semibold"
              />
            </div>
          </CardContent>
        </Card>

        <MonthlySavingsAccordion
          tableTitle="Set aside monthly to cover net tax"
          rows={monthlyPlan}
        />

        <Card className="lg:hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Tax bands breakdown</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <BandBreakdownAccordion bands={computation.tax.bands} />
          </CardContent>
        </Card>

        <Card className="lg:hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">AI Summary</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <AiSummaryCard
              chargeableIncome={computation.chargeableIncome}
              netTaxPayable={computation.netTaxPayable}
            />
          </CardContent>
        </Card>
      </div>

      <div className="hidden lg:block space-y-4">
        <AiSummaryCard
          chargeableIncome={computation.chargeableIncome}
          netTaxPayable={computation.netTaxPayable}
        />

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Tax bands breakdown</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <BandBreakdownAccordion bands={computation.tax.bands} />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
