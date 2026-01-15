import type { FlatSection } from "@/lib/types/calculator-breakdown";
import { clampNonNegative, roundMoney } from "./shared";

export type PresumptiveInputs = Readonly<{
  turnover: number;
  ratePercent: number;
  exemptThreshold: number;
}>;

export type PresumptiveComputation = Readonly<{
  turnover: number;
  ratePercent: number;
  taxBase: number;
  taxDue: number;
  sections: readonly FlatSection[];
  aiContext: string;
}>;

export function computePresumptive(
  inputs: PresumptiveInputs
): PresumptiveComputation {
  const turnover = clampNonNegative(inputs.turnover);
  const ratePercent = clampNonNegative(inputs.ratePercent);
  const exemptThreshold = clampNonNegative(inputs.exemptThreshold);
  const rate = Math.min(ratePercent / 100, 1);

  const taxBase = Math.max(0, turnover - exemptThreshold);
  const taxDue = roundMoney(taxBase * rate);

  const sections: FlatSection[] = [
    {
      title: "Inputs",
      lines: [
        { label: "Turnover", value: turnover, format: "currency" },
        {
          label: "Exempt threshold",
          value: exemptThreshold,
          format: "currency",
          note: "Optional",
        },
        { label: "Presumptive rate", value: ratePercent, format: "percent" },
      ],
    },
    {
      title: "Computation",
      lines: [
        {
          label: "Tax base",
          value: taxBase,
          format: "currency",
          formula: "Turnover − Threshold",
        },
        {
          label: "Presumptive tax due",
          value: taxDue,
          format: "currency",
          formula: "Tax base × Rate",
        },
      ],
    },
  ];

  const aiContext = `Presumptive Tax Calculation:
- Turnover: ₦${turnover}
- Threshold: ₦${exemptThreshold}
- Tax base: ₦${taxBase}
- Rate: ${ratePercent}%
- Tax due: ₦${taxDue}`;

  return { turnover, ratePercent, taxBase, taxDue, sections, aiContext };
}
