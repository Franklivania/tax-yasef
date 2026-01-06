import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { computePetroleumSpecial } from "../calculating-context/petroleum-special";
import { AppliedDeductions } from "../components/applied-deductions";
import { FlatBreakdownAccordion } from "../components/flat-breakdown-accordion";
import { MoneyField } from "../components/money-field";
import { PercentField } from "../components/percent-field";
import { parseAmount } from "../components/parse-amount";
import { SummaryRow } from "../components/summary-row";
import { GenericAiSummaryCard } from "../components/generic-ai-summary-card";
import { SaveCalculationButton } from "../components/save-calculation-button";
import { MonthlySavingsTable } from "../components/monthly-savings-table";
import { MONTH_NAMES, buildMonthlyPlan } from "@/lib/types/calculator-history";
import type {
  CalculatorHistoryEntry,
  AppliedAmountLine,
} from "@/lib/types/calculator-history";

export function PetroleumSpecialTab() {
  const [taxableProfit, setTaxableProfit] = useState("");
  const [specialRatePercent, setSpecialRatePercent] = useState("30");

  const [businessOperatingExpenses, setBusinessOperatingExpenses] =
    useState("0");
  const [costOfSales, setCostOfSales] = useState("0");
  const [staffSalariesWages, setStaffSalariesWages] = useState("0");
  const [utilitiesBusinessUse, setUtilitiesBusinessUse] = useState("0");
  const [internetToolsBusinessUse, setInternetToolsBusinessUse] = useState("0");
  const [repairsMaintenance, setRepairsMaintenance] = useState("0");
  const [capitalAllowance, setCapitalAllowance] = useState("0");
  const [badDoubtfulDebts, setBadDoubtfulDebts] = useState("0");
  const [researchDevelopment, setResearchDevelopment] = useState("0");
  const [decommissioningFunds, setDecommissioningFunds] = useState("0");
  const [sectorSpecificAllowances, setSectorSpecificAllowances] = useState("0");

  const computation = useMemo(() => {
    return computePetroleumSpecial({
      taxableProfit: parseAmount(taxableProfit),
      specialRatePercent: parseAmount(specialRatePercent),
      businessOperatingExpenses: parseAmount(businessOperatingExpenses),
      costOfSales: parseAmount(costOfSales),
      staffSalariesWages: parseAmount(staffSalariesWages),
      utilitiesBusinessUse: parseAmount(utilitiesBusinessUse),
      internetToolsBusinessUse: parseAmount(internetToolsBusinessUse),
      repairsMaintenance: parseAmount(repairsMaintenance),
      capitalAllowance: parseAmount(capitalAllowance),
      badDoubtfulDebts: parseAmount(badDoubtfulDebts),
      researchDevelopment: parseAmount(researchDevelopment),
      decommissioningFunds: parseAmount(decommissioningFunds),
      sectorSpecificAllowances: parseAmount(sectorSpecificAllowances),
    });
  }, [
    taxableProfit,
    specialRatePercent,
    businessOperatingExpenses,
    costOfSales,
    staffSalariesWages,
    utilitiesBusinessUse,
    internetToolsBusinessUse,
    repairsMaintenance,
    capitalAllowance,
    badDoubtfulDebts,
    researchDevelopment,
    decommissioningFunds,
    sectorSpecificAllowances,
  ]);

  const monthlyPlan = useMemo(() => {
    const startMonth = new Date().getMonth();
    return buildMonthlyPlan(computation.taxDue, startMonth, MONTH_NAMES);
  }, [computation.taxDue]);

  const buildEntry = (): CalculatorHistoryEntry | null => {
    const profit = parseAmount(taxableProfit);
    if (profit <= 0) return null;
    const adjustments: AppliedAmountLine[] = computation.deductions.map(
      (d) => ({
        kind: "deduction" as const,
        key: d.key,
        label: d.label,
        enteredAmount: d.enteredAmount,
        appliedAmount: d.deductibleAmount,
        reason: d.reason,
      })
    );

    return {
      kind: "flat-tax",
      tab: "petroleum-special",
      id: `calc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      timestamp: Date.now(),
      inputs: {
        taxableProfit: profit,
        specialRatePercent: parseAmount(specialRatePercent),
        businessOperatingExpenses: parseAmount(businessOperatingExpenses),
        costOfSales: parseAmount(costOfSales),
        staffSalariesWages: parseAmount(staffSalariesWages),
        utilitiesBusinessUse: parseAmount(utilitiesBusinessUse),
        internetToolsBusinessUse: parseAmount(internetToolsBusinessUse),
        repairsMaintenance: parseAmount(repairsMaintenance),
        capitalAllowance: parseAmount(capitalAllowance),
        badDoubtfulDebts: parseAmount(badDoubtfulDebts),
        researchDevelopment: parseAmount(researchDevelopment),
        decommissioningFunds: parseAmount(decommissioningFunds),
        sectorSpecificAllowances: parseAmount(sectorSpecificAllowances),
      },
      summary: { label: "Tax due", taxDue: computation.taxDue },
      sections: computation.sections,
      monthlyPlan,
      adjustments,
    };
  };

  return (
    <section className="grid grid-cols-1 lg:grid-cols-[1.1fr_1.3fr_0.9fr] gap-4 lg:gap-6 items-start">
      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Inputs & Allowable Deductions
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <MoneyField
              id="ps-profit"
              label="Taxable profit (₦)"
              value={taxableProfit}
              onChange={setTaxableProfit}
            />
            <PercentField
              id="ps-rate"
              label="Special sector rate (%)"
              value={specialRatePercent}
              onChange={setSpecialRatePercent}
              helpText="Set the applicable rate for the specific sector regime."
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <MoneyField
                id="ps-opex"
                label="Business operating expenses (₦)"
                value={businessOperatingExpenses}
                onChange={setBusinessOperatingExpenses}
              />
              <MoneyField
                id="ps-cogs"
                label="Cost of sales (₦)"
                value={costOfSales}
                onChange={setCostOfSales}
              />
              <MoneyField
                id="ps-wages"
                label="Staff salaries & wages (₦)"
                value={staffSalariesWages}
                onChange={setStaffSalariesWages}
              />
              <MoneyField
                id="ps-utilities"
                label="Utilities (business use) (₦)"
                value={utilitiesBusinessUse}
                onChange={setUtilitiesBusinessUse}
              />
              <MoneyField
                id="ps-tools"
                label="Internet / tools (business use) (₦)"
                value={internetToolsBusinessUse}
                onChange={setInternetToolsBusinessUse}
              />
              <MoneyField
                id="ps-repairs"
                label="Repairs & maintenance (₦)"
                value={repairsMaintenance}
                onChange={setRepairsMaintenance}
              />
              <MoneyField
                id="ps-capital"
                label="Capital allowance (₦)"
                value={capitalAllowance}
                onChange={setCapitalAllowance}
              />
              <MoneyField
                id="ps-baddebt"
                label="Bad & doubtful debts (₦)"
                value={badDoubtfulDebts}
                onChange={setBadDoubtfulDebts}
                helpText="Subject to strict rules."
              />
              <MoneyField
                id="ps-rd"
                label="Research & development (₦)"
                value={researchDevelopment}
                onChange={setResearchDevelopment}
              />
              <MoneyField
                id="ps-decom"
                label="Decommissioning / abandonment funds (₦)"
                value={decommissioningFunds}
                onChange={setDecommissioningFunds}
              />
              <MoneyField
                id="ps-sector"
                label="Sector-specific allowances (₦)"
                value={sectorSpecificAllowances}
                onChange={setSectorSpecificAllowances}
              />
            </div>
          </CardContent>
        </Card>

        <AppliedDeductions deductions={computation.deductions} />
      </div>

      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-base">Summary</CardTitle>
              <SaveCalculationButton
                buildEntry={buildEntry}
                disabledReason={
                  parseAmount(taxableProfit) <= 0
                    ? "Enter taxable profit to save"
                    : undefined
                }
              />
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <SummaryRow
              label="Taxable profit"
              value={computation.taxableProfit}
            />
            <SummaryRow
              label="Total deductible"
              value={computation.totalDeductible}
            />
            <SummaryRow
              label="Chargeable profit"
              value={computation.chargeableProfit}
            />
            <div className="pt-2 border-t">
              <SummaryRow
                label="Tax due"
                value={computation.taxDue}
                valueClassName="font-semibold"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Monthly savings plan</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <MonthlySavingsTable
              title="Set aside monthly to cover tax"
              rows={monthlyPlan}
            />
          </CardContent>
        </Card>

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
