import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { computeBusinessTrade } from "../calculating-context/business-trade";
import { AppliedDeductions } from "../components/applied-deductions";
import { BandBreakdownAccordion } from "../components/band-breakdown-accordion";
import { MoneyField } from "../components/money-field";
import { parseAmount } from "../components/parse-amount";
import { SummaryRow } from "../components/summary-row";
import { AiSummaryCard } from "../components/ai-summary-card";
import { SaveCalculationButton } from "../components/save-calculation-button";
import { MonthlySavingsTable } from "../components/monthly-savings-table";
import { MONTH_NAMES, buildMonthlyPlan } from "@/lib/types/calculator-history";
import type {
  CalculatorHistoryEntry,
  AppliedAmountLine,
} from "@/lib/types/calculator-history";

export function BusinessTradeTab() {
  const [annualProfit, setAnnualProfit] = useState("");
  const [businessOperatingExpenses, setBusinessOperatingExpenses] =
    useState("");
  const [costOfSales, setCostOfSales] = useState("");
  const [staffSalariesWages, setStaffSalariesWages] = useState("");
  const [utilitiesBusinessUse, setUtilitiesBusinessUse] = useState("");
  const [internetToolsBusinessUse, setInternetToolsBusinessUse] = useState("");
  const [repairsMaintenance, setRepairsMaintenance] = useState("");
  const [capitalAllowance, setCapitalAllowance] = useState("");
  const [businessLossCarryforward, setBusinessLossCarryforward] = useState("");
  const [ownersPensionApproved, setOwnersPensionApproved] = useState("");
  const [whtCredit, setWhtCredit] = useState("");

  const computation = useMemo(() => {
    return computeBusinessTrade({
      annualProfit: parseAmount(annualProfit),
      businessOperatingExpenses: parseAmount(businessOperatingExpenses),
      costOfSales: parseAmount(costOfSales),
      staffSalariesWages: parseAmount(staffSalariesWages),
      utilitiesBusinessUse: parseAmount(utilitiesBusinessUse),
      internetToolsBusinessUse: parseAmount(internetToolsBusinessUse),
      repairsMaintenance: parseAmount(repairsMaintenance),
      capitalAllowance: parseAmount(capitalAllowance),
      businessLossCarryforward: parseAmount(businessLossCarryforward),
      ownersPensionApproved: parseAmount(ownersPensionApproved),
      whtCredit: parseAmount(whtCredit),
    });
  }, [
    annualProfit,
    businessOperatingExpenses,
    costOfSales,
    staffSalariesWages,
    utilitiesBusinessUse,
    internetToolsBusinessUse,
    repairsMaintenance,
    capitalAllowance,
    businessLossCarryforward,
    ownersPensionApproved,
    whtCredit,
  ]);

  const totalDeductible = computation.deductions.reduce(
    (acc, d) => acc + d.deductibleAmount,
    0
  );
  const monthlyPlan = useMemo(() => {
    const startMonth = new Date().getMonth();
    return buildMonthlyPlan(computation.netTaxPayable, startMonth, MONTH_NAMES);
  }, [computation.netTaxPayable]);

  const buildEntry = (): CalculatorHistoryEntry | null => {
    const profit = parseAmount(annualProfit);
    if (profit <= 0) return null;
    const adjustments: AppliedAmountLine[] = [
      ...computation.deductions.map((d) => ({
        kind: "deduction" as const,
        key: d.key,
        label: d.label,
        enteredAmount: d.enteredAmount,
        appliedAmount: d.deductibleAmount,
        reason: d.reason,
      })),
      ...computation.credits.map((c) => ({
        kind: "credit" as const,
        key: c.key,
        label: c.label,
        enteredAmount: c.enteredAmount,
        appliedAmount: c.appliedAmount,
        reason: c.reason,
      })),
    ];

    return {
      kind: "income-tax",
      tab: "business-trade",
      id: `calc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      timestamp: Date.now(),
      inputs: {
        annualProfit: profit,
        businessOperatingExpenses: parseAmount(businessOperatingExpenses),
        costOfSales: parseAmount(costOfSales),
        staffSalariesWages: parseAmount(staffSalariesWages),
        utilitiesBusinessUse: parseAmount(utilitiesBusinessUse),
        internetToolsBusinessUse: parseAmount(internetToolsBusinessUse),
        repairsMaintenance: parseAmount(repairsMaintenance),
        capitalAllowance: parseAmount(capitalAllowance),
        businessLossCarryforward: parseAmount(businessLossCarryforward),
        ownersPensionApproved: parseAmount(ownersPensionApproved),
        whtCredit: parseAmount(whtCredit),
      },
      summary: {
        totalDeductible,
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
            <CardTitle className="text-base">Inputs & Expenses</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <MoneyField
              id="bt-profit"
              label="Annual profit (₦)"
              value={annualProfit}
              onChange={setAnnualProfit}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <MoneyField
                id="bt-opex"
                label="Business operating expenses (₦)"
                value={businessOperatingExpenses}
                onChange={setBusinessOperatingExpenses}
              />
              <MoneyField
                id="bt-cogs"
                label="Cost of sales (₦)"
                value={costOfSales}
                onChange={setCostOfSales}
              />
              <MoneyField
                id="bt-wages"
                label="Staff salaries & wages (₦)"
                value={staffSalariesWages}
                onChange={setStaffSalariesWages}
              />
              <MoneyField
                id="bt-utilities"
                label="Utilities (business use) (₦)"
                value={utilitiesBusinessUse}
                onChange={setUtilitiesBusinessUse}
              />
              <MoneyField
                id="bt-tools"
                label="Internet / tools (business use) (₦)"
                value={internetToolsBusinessUse}
                onChange={setInternetToolsBusinessUse}
              />
              <MoneyField
                id="bt-repairs"
                label="Repairs & maintenance (₦)"
                value={repairsMaintenance}
                onChange={setRepairsMaintenance}
              />
              <MoneyField
                id="bt-capital"
                label="Capital allowance (₦)"
                value={capitalAllowance}
                onChange={setCapitalAllowance}
              />
              <MoneyField
                id="bt-loss"
                label="Business loss carryforward (₦)"
                value={businessLossCarryforward}
                onChange={setBusinessLossCarryforward}
              />
              <MoneyField
                id="bt-pension"
                label="Owner’s approved pension (₦)"
                value={ownersPensionApproved}
                onChange={setOwnersPensionApproved}
                helpText="Only the owner’s approved personal pension is deductible here."
              />
              <MoneyField
                id="bt-wht"
                label="WHT already deducted (credit) (₦)"
                value={whtCredit}
                onChange={setWhtCredit}
              />
            </div>
          </CardContent>
        </Card>

        <AppliedDeductions
          deductions={computation.deductions}
          credits={computation.credits}
        />
      </div>

      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-base">Summary</CardTitle>
              <SaveCalculationButton
                buildEntry={buildEntry}
                disabledReason={
                  parseAmount(annualProfit) <= 0
                    ? "Enter annual profit to save"
                    : undefined
                }
              />
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <SummaryRow label="Total deductible" value={totalDeductible} />
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

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Monthly savings plan</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <MonthlySavingsTable
              title="Set aside monthly to cover net tax"
              rows={monthlyPlan}
            />
          </CardContent>
        </Card>

        <Card className="lg:hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Tax bands breakdown</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {computation.tax.bands.length > 0 ? (
              <BandBreakdownAccordion bands={computation.tax.bands} />
            ) : (
              <p className="text-sm text-muted-foreground">
                Enter a profit figure to see band-by-band calculations.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">AI Summary</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground">
              On desktop, the AI summary appears on the right. On mobile, it
              appears here.
            </p>
            <div className="mt-3">
              <AiSummaryCard
                chargeableIncome={computation.chargeableIncome}
                netTaxPayable={computation.netTaxPayable}
              />
            </div>
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
            {computation.tax.bands.length > 0 ? (
              <BandBreakdownAccordion bands={computation.tax.bands} />
            ) : (
              <p className="text-sm text-muted-foreground">
                Enter a profit figure to see band-by-band calculations.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
