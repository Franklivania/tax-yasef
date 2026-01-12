import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { computeVatSelfAccounting } from "../calculating-context/vat-self-accounting";
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

export function VatSelfAccountingTab() {
  const [taxableValue, setTaxableValue] = useState("");
  const [vatRatePercent, setVatRatePercent] = useState("7.5");
  const [inputVatCredit, setInputVatCredit] = useState("0");
  const [nonRecoverableVat, setNonRecoverableVat] = useState("0");

  const computation = useMemo(() => {
    return computeVatSelfAccounting({
      taxableValue: parseAmount(taxableValue),
      vatRatePercent: parseAmount(vatRatePercent),
      inputVatCredit: parseAmount(inputVatCredit),
      nonRecoverableVat: parseAmount(nonRecoverableVat),
    });
  }, [taxableValue, vatRatePercent, inputVatCredit, nonRecoverableVat]);

  const monthlyPlan = useMemo(() => {
    const startMonth = new Date().getMonth();
    return buildMonthlyPlan(computation.netVatPayable, startMonth, MONTH_NAMES);
  }, [computation.netVatPayable]);

  const buildEntry = (): CalculatorHistoryEntry | null => {
    const tv = parseAmount(taxableValue);
    if (tv <= 0) return null;
    return {
      kind: "flat-tax",
      tab: "vat-self-accounting",
      id: `calc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      timestamp: Date.now(),
      inputs: {
        taxableValue: tv,
        vatRatePercent: parseAmount(vatRatePercent),
        inputVatCredit: parseAmount(inputVatCredit),
        nonRecoverableVat: parseAmount(nonRecoverableVat),
      },
      summary: { label: "Net VAT payable", taxDue: computation.netVatPayable },
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
              id="vat-taxable"
              label="Taxable value (₦)"
              value={taxableValue}
              onChange={setTaxableValue}
            />
            <PercentField
              id="vat-rate"
              label="VAT rate (%)"
              value={vatRatePercent}
              onChange={setVatRatePercent}
              helpText="Set VAT rate applicable to this transaction."
            />
            <MoneyField
              id="vat-input"
              label="Input VAT credit (₦)"
              value={inputVatCredit}
              onChange={setInputVatCredit}
              helpText="Recoverable input VAT credit to offset output VAT."
            />
            <MoneyField
              id="vat-nonrec"
              label="Non-recoverable VAT (₦)"
              value={nonRecoverableVat}
              onChange={setNonRecoverableVat}
              helpText="VAT that cannot be recovered (treated as cost)."
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
                  parseAmount(taxableValue) <= 0
                    ? "Enter taxable value to save"
                    : undefined
                }
              />
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <SummaryRow label="Output VAT" value={computation.outputVat} />
            <SummaryRow
              label="Input VAT credit (applied)"
              value={computation.inputVatCreditApplied}
            />
            <SummaryRow
              label="Net VAT payable"
              value={computation.netVatPayable}
            />
            <div className="pt-2 border-t">
              <SummaryRow
                label="Total VAT cost (incl. non-recoverable)"
                value={computation.totalVatCost}
                valueClassName="font-semibold"
              />
            </div>
          </CardContent>
        </Card>

        <MonthlySavingsAccordion
          tableTitle="Set aside monthly to cover net VAT"
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
