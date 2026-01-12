import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { computeCapitalGains } from "../calculating-context/capital-gains";
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

export function CapitalGainsTab() {
  const [disposalProceeds, setDisposalProceeds] = useState("");
  const [costBase, setCostBase] = useState("");
  const [disposalCosts, setDisposalCosts] = useState("");
  const [principalPrivateResidenceRelief, setPrincipalPrivateResidenceRelief] =
    useState("0");
  const [reinvestmentReliefShares, setReinvestmentReliefShares] = useState("0");
  const [digitalAssetLosses, setDigitalAssetLosses] = useState("0");
  const [ratePercent, setRatePercent] = useState("10");

  const computation = useMemo(() => {
    return computeCapitalGains({
      disposalProceeds: parseAmount(disposalProceeds),
      costBase: parseAmount(costBase),
      disposalCosts: parseAmount(disposalCosts),
      principalPrivateResidenceRelief: parseAmount(
        principalPrivateResidenceRelief
      ),
      reinvestmentReliefShares: parseAmount(reinvestmentReliefShares),
      digitalAssetLosses: parseAmount(digitalAssetLosses),
      ratePercent: parseAmount(ratePercent),
    });
  }, [
    disposalProceeds,
    costBase,
    disposalCosts,
    principalPrivateResidenceRelief,
    reinvestmentReliefShares,
    digitalAssetLosses,
    ratePercent,
  ]);

  const monthlyPlan = useMemo(() => {
    const startMonth = new Date().getMonth();
    return buildMonthlyPlan(computation.taxDue, startMonth, MONTH_NAMES);
  }, [computation.taxDue]);

  const buildEntry = (): CalculatorHistoryEntry | null => {
    const proceeds = parseAmount(disposalProceeds);
    if (proceeds <= 0) return null;
    return {
      kind: "flat-tax",
      tab: "capital-gains",
      id: `calc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      timestamp: Date.now(),
      inputs: {
        disposalProceeds: proceeds,
        costBase: parseAmount(costBase),
        disposalCosts: parseAmount(disposalCosts),
        principalPrivateResidenceRelief: parseAmount(
          principalPrivateResidenceRelief
        ),
        reinvestmentReliefShares: parseAmount(reinvestmentReliefShares),
        digitalAssetLosses: parseAmount(digitalAssetLosses),
        ratePercent: parseAmount(ratePercent),
      },
      summary: { label: "CGT due", taxDue: computation.taxDue },
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <MoneyField
                id="cgt-proceeds"
                label="Disposal proceeds (₦)"
                value={disposalProceeds}
                onChange={setDisposalProceeds}
              />
              <MoneyField
                id="cgt-cost"
                label="Cost base (₦)"
                value={costBase}
                onChange={setCostBase}
              />
              <MoneyField
                id="cgt-costs"
                label="Disposal costs (₦)"
                value={disposalCosts}
                onChange={setDisposalCosts}
              />
              <PercentField
                id="cgt-rate"
                label="CGT rate (%)"
                value={ratePercent}
                onChange={setRatePercent}
                helpText="Enter the applicable capital gains tax rate."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <MoneyField
                id="cgt-prr"
                label="Principal private residence relief (₦)"
                value={principalPrivateResidenceRelief}
                onChange={setPrincipalPrivateResidenceRelief}
              />
              <MoneyField
                id="cgt-reinvest"
                label="Reinvestment relief (shares) (₦)"
                value={reinvestmentReliefShares}
                onChange={setReinvestmentReliefShares}
              />
              <MoneyField
                id="cgt-digital"
                label="Digital asset losses (ring-fenced) (₦)"
                value={digitalAssetLosses}
                onChange={setDigitalAssetLosses}
              />
            </div>
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
                  parseAmount(disposalProceeds) <= 0
                    ? "Enter disposal proceeds to save"
                    : undefined
                }
              />
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <SummaryRow label="Gross gain" value={computation.grossGain} />
            <SummaryRow
              label="Total reliefs/losses"
              value={computation.reliefsTotal}
            />
            <SummaryRow
              label="Chargeable gain"
              value={computation.chargeableGain}
            />
            <div className="pt-2 border-t">
              <SummaryRow
                label="CGT due"
                value={computation.taxDue}
                valueClassName="font-semibold"
              />
            </div>
          </CardContent>
        </Card>

        <MonthlySavingsAccordion
          tableTitle="Set aside monthly to cover CGT"
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
