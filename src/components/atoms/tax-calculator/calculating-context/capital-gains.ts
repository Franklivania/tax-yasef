import type { FlatSection } from "@/lib/types/calculator-breakdown";
import { clampNonNegative, roundMoney } from "./shared";

export type CapitalGainsInputs = Readonly<{
  disposalProceeds: number;
  costBase: number;
  disposalCosts: number;
  principalPrivateResidenceRelief: number;
  reinvestmentReliefShares: number;
  digitalAssetLosses: number;
  ratePercent: number;
}>;

export type CapitalGainsComputation = Readonly<{
  disposalProceeds: number;
  costBase: number;
  disposalCosts: number;
  reliefsTotal: number;
  grossGain: number;
  chargeableGain: number;
  ratePercent: number;
  taxDue: number;
  sections: readonly FlatSection[];
  aiContext: string;
}>;

export function computeCapitalGains(
  inputs: CapitalGainsInputs
): CapitalGainsComputation {
  const disposalProceeds = clampNonNegative(inputs.disposalProceeds);
  const costBase = clampNonNegative(inputs.costBase);
  const disposalCosts = clampNonNegative(inputs.disposalCosts);
  const principalPrivateResidenceRelief = clampNonNegative(
    inputs.principalPrivateResidenceRelief
  );
  const reinvestmentReliefShares = clampNonNegative(
    inputs.reinvestmentReliefShares
  );
  const digitalAssetLosses = clampNonNegative(inputs.digitalAssetLosses);
  const ratePercent = clampNonNegative(inputs.ratePercent);
  const rate = Math.min(ratePercent / 100, 1);

  const grossGain = Math.max(0, disposalProceeds - costBase - disposalCosts);
  const reliefsTotal =
    principalPrivateResidenceRelief +
    reinvestmentReliefShares +
    digitalAssetLosses;
  const chargeableGain = Math.max(0, grossGain - reliefsTotal);
  const taxDue = roundMoney(chargeableGain * rate);

  const sections: FlatSection[] = [
    {
      title: "Inputs",
      lines: [
        {
          label: "Disposal proceeds",
          value: disposalProceeds,
          format: "currency",
        },
        { label: "Cost base", value: costBase, format: "currency" },
        { label: "Disposal costs", value: disposalCosts, format: "currency" },
        { label: "CGT rate", value: ratePercent, format: "percent" },
      ],
    },
    {
      title: "Gain computation",
      lines: [
        {
          label: "Gross gain",
          value: grossGain,
          format: "currency",
          formula: "Proceeds − Cost base − Disposal costs",
        },
      ],
    },
    {
      title: "Reliefs & losses",
      lines: [
        {
          label: "Principal private residence relief",
          value: principalPrivateResidenceRelief,
          format: "currency",
        },
        {
          label: "Reinvestment relief (shares)",
          value: reinvestmentReliefShares,
          format: "currency",
        },
        {
          label: "Digital asset losses (ring-fenced)",
          value: digitalAssetLosses,
          format: "currency",
        },
        {
          label: "Total reliefs/losses",
          value: reliefsTotal,
          format: "currency",
        },
      ],
    },
    {
      title: "Tax due",
      lines: [
        {
          label: "Chargeable gain",
          value: chargeableGain,
          format: "currency",
          formula: "Gross gain − Reliefs",
        },
        {
          label: "CGT due",
          value: taxDue,
          format: "currency",
          formula: "Chargeable gain × Rate",
        },
      ],
    },
  ];

  const aiContext = `Capital Gains Calculation:
- Proceeds: ₦${disposalProceeds}
- Cost base: ₦${costBase}
- Disposal costs: ₦${disposalCosts}
- Gross gain: ₦${grossGain}
- Reliefs/losses total: ₦${reliefsTotal}
- Chargeable gain: ₦${chargeableGain}
- Rate: ${ratePercent}%
- CGT due: ₦${taxDue}`;

  return {
    disposalProceeds,
    costBase,
    disposalCosts,
    reliefsTotal,
    grossGain,
    chargeableGain,
    ratePercent,
    taxDue,
    sections,
    aiContext,
  };
}
