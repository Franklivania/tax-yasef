import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/tax-calculator";
import { computeSelfAssessment } from "../calculating-context/self-assessment";
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
import { Switch } from "@/components/ui/switch";

export function SelfAssessmentTab() {
  const [annualIncome, setAnnualIncome] = useState("");
  const [pensionApproved, setPensionApproved] = useState("");
  const [nhf, setNhf] = useState("");
  const [nhis, setNhis] = useState("");
  const [lifeInsuranceOrAnnuity, setLifeInsuranceOrAnnuity] = useState("");
  const [rentPaid, setRentPaid] = useState("");
  const [mortgageInterestOwnerOccupied, setMortgageInterestOwnerOccupied] =
    useState("");
  const [payeCredit, setPayeCredit] = useState("");
  const [whtCredit, setWhtCredit] = useState("");
  const [additionalDeductions, setAdditionalDeductions] = useState(false);

  const handleDeducttionsTrigger = () => {
    setAdditionalDeductions((prev) => !prev);
  };

  const computation = useMemo(() => {
    return computeSelfAssessment({
      annualIncome: parseAmount(annualIncome),
      pensionApproved: parseAmount(pensionApproved),
      nhf: parseAmount(nhf),
      nhis: parseAmount(nhis),
      lifeInsuranceOrAnnuity: parseAmount(lifeInsuranceOrAnnuity),
      rentPaid: parseAmount(rentPaid),
      mortgageInterestOwnerOccupied: parseAmount(mortgageInterestOwnerOccupied),
      payeCredit: parseAmount(payeCredit),
      whtCredit: parseAmount(whtCredit),
    });
  }, [
    annualIncome,
    pensionApproved,
    nhf,
    nhis,
    lifeInsuranceOrAnnuity,
    rentPaid,
    mortgageInterestOwnerOccupied,
    payeCredit,
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
    const annual = parseAmount(annualIncome);
    if (annual <= 0) return null;
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
      tab: "self-assessment",
      id: `calc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      timestamp: Date.now(),
      inputs: {
        annualIncome: annual,
        pensionApproved: parseAmount(pensionApproved),
        nhf: parseAmount(nhf),
        nhis: parseAmount(nhis),
        lifeInsuranceOrAnnuity: parseAmount(lifeInsuranceOrAnnuity),
        rentPaid: parseAmount(rentPaid),
        mortgageInterestOwnerOccupied: parseAmount(
          mortgageInterestOwnerOccupied
        ),
        payeCredit: parseAmount(payeCredit),
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
            <CardTitle className="text-base">Inputs & Deductions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <MoneyField
              id="sa-annual-income"
              label="Annual income (₦)"
              value={annualIncome}
              onChange={setAnnualIncome}
            />

            <div className="w-full flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {additionalDeductions
                  ? "Hide Additional deductions"
                  : "Show Additional deductions"}
              </p>

              <Switch
                checked={additionalDeductions}
                onCheckedChange={handleDeducttionsTrigger}
              />
            </div>

            {additionalDeductions && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <MoneyField
                    id="sa-pension"
                    label="Approved pension (₦)"
                    value={pensionApproved}
                    onChange={setPensionApproved}
                  />
                  <MoneyField
                    id="sa-nhf"
                    label="NHF (₦)"
                    value={nhf}
                    onChange={setNhf}
                  />
                  <MoneyField
                    id="sa-nhis"
                    label="NHIS (₦)"
                    value={nhis}
                    onChange={setNhis}
                  />
                  <MoneyField
                    id="sa-life"
                    label="Life insurance / annuity (₦)"
                    value={lifeInsuranceOrAnnuity}
                    onChange={setLifeInsuranceOrAnnuity}
                  />
                  <MoneyField
                    id="sa-rent"
                    label="Rent paid (₦)"
                    value={rentPaid}
                    onChange={setRentPaid}
                    helpText="Relief = min(20% of rent, ₦500,000)"
                  />
                  <MoneyField
                    id="sa-mortgage"
                    label="Mortgage interest (owner-occupied) (₦)"
                    value={mortgageInterestOwnerOccupied}
                    onChange={setMortgageInterestOwnerOccupied}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <MoneyField
                    id="sa-paye"
                    label="PAYE already deducted (credit) (₦)"
                    value={payeCredit}
                    onChange={setPayeCredit}
                  />
                  <MoneyField
                    id="sa-wht"
                    label="WHT already deducted (credit) (₦)"
                    value={whtCredit}
                    onChange={setWhtCredit}
                  />
                </div>
              </>
            )}
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
                  parseAmount(annualIncome) <= 0
                    ? "Enter annual income to save"
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
            <p className="text-xs text-muted-foreground">
              Note: ₦800,000 is already covered as a 0% band in the tax bands.
            </p>
          </CardContent>
        </Card>

        <MonthlySavingsAccordion
          tableTitle="Set aside monthly to cover net tax"
          rows={monthlyPlan}
        />

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

        <Card className="lg:hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Tax bands breakdown</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {computation.tax.bands.length > 0 ? (
              <BandBreakdownAccordion bands={computation.tax.bands} />
            ) : (
              <p className="text-sm text-muted-foreground">
                Enter an income to see band-by-band calculations.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="hidden lg:block space-y-4">
        <AiSummaryCard
          chargeableIncome={computation.chargeableIncome}
          netTaxPayable={computation.netTaxPayable}
        />
        {parseAmount(annualIncome) > 0 ? (
          <p className="mt-3 text-xs text-muted-foreground">
            Gross income entered:{" "}
            <span className="font-medium">
              {formatCurrency(parseAmount(annualIncome))}
            </span>
          </p>
        ) : null}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Tax bands breakdown</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {computation.tax.bands.length > 0 ? (
              <BandBreakdownAccordion bands={computation.tax.bands} />
            ) : (
              <p className="text-sm text-muted-foreground">
                Enter an income to see band-by-band calculations.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
