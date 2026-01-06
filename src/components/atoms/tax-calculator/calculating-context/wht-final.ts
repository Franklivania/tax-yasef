import { clampNonNegative, roundMoney } from "./shared";
import type { FlatSection } from "@/lib/types/calculator-breakdown";

export type WhtFinalInputs = Readonly<{
  grossPayment: number;
  ratePercent: number;
}>;

export type WhtFinalComputation = Readonly<{
  grossPayment: number;
  ratePercent: number;
  rate: number;
  taxWithheld: number;
  netPayment: number;
  sections: readonly FlatSection[];
  aiContext: string;
}>;

export function computeWhtFinal(inputs: WhtFinalInputs): WhtFinalComputation {
  const grossPayment = clampNonNegative(inputs.grossPayment);
  const ratePercent = clampNonNegative(inputs.ratePercent);
  const rate = Math.min(ratePercent / 100, 1);

  const taxWithheld = roundMoney(grossPayment * rate);
  const netPayment = roundMoney(Math.max(0, grossPayment - taxWithheld));

  const sections: FlatSection[] = [
    {
      title: "Inputs",
      lines: [
        { label: "Gross payment", value: grossPayment, format: "currency" },
        { label: "WHT rate", value: ratePercent, format: "percent" },
      ],
    },
    {
      title: "Computation",
      lines: [
        {
          label: "WHT withheld",
          value: taxWithheld,
          format: "currency",
          formula: `Gross × Rate`,
        },
        {
          label: "Net payment after WHT",
          value: netPayment,
          format: "currency",
          formula: `Gross − WHT`,
        },
      ],
    },
  ];

  const aiContext = `WHT Final Calculation:
- Gross payment: ₦${grossPayment}
- WHT rate: ${ratePercent}%
- WHT withheld: ₦${taxWithheld}
- Net payment: ₦${netPayment}`;

  return {
    grossPayment,
    ratePercent,
    rate,
    taxWithheld,
    netPayment,
    sections,
    aiContext,
  };
}
