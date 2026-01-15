import type { FlatSection } from "@/lib/types/calculator-breakdown";
import { clampNonNegative, roundMoney } from "./shared";

export type VatSelfAccountingInputs = Readonly<{
  taxableValue: number;
  vatRatePercent: number;
  inputVatCredit: number;
  nonRecoverableVat: number;
}>;

export type VatSelfAccountingComputation = Readonly<{
  taxableValue: number;
  vatRatePercent: number;
  outputVat: number;
  inputVatCreditEntered: number;
  inputVatCreditApplied: number;
  nonRecoverableVat: number;
  netVatPayable: number;
  totalVatCost: number;
  sections: readonly FlatSection[];
  aiContext: string;
}>;

export function computeVatSelfAccounting(
  inputs: VatSelfAccountingInputs
): VatSelfAccountingComputation {
  const taxableValue = clampNonNegative(inputs.taxableValue);
  const vatRatePercent = clampNonNegative(inputs.vatRatePercent);
  const rate = Math.min(vatRatePercent / 100, 1);

  const outputVat = roundMoney(taxableValue * rate);

  const inputVatCreditEntered = clampNonNegative(inputs.inputVatCredit);
  const inputVatCreditApplied = Math.min(inputVatCreditEntered, outputVat);
  const nonRecoverableVat = clampNonNegative(inputs.nonRecoverableVat);

  const netVatPayable = roundMoney(
    Math.max(0, outputVat - inputVatCreditApplied)
  );
  const totalVatCost = roundMoney(netVatPayable + nonRecoverableVat);

  const sections: FlatSection[] = [
    {
      title: "Inputs",
      lines: [
        { label: "Taxable value", value: taxableValue, format: "currency" },
        { label: "VAT rate", value: vatRatePercent, format: "percent" },
        {
          label: "Input VAT credit (entered)",
          value: inputVatCreditEntered,
          format: "currency",
        },
        {
          label: "Non-recoverable VAT",
          value: nonRecoverableVat,
          format: "currency",
        },
      ],
    },
    {
      title: "Computation",
      lines: [
        {
          label: "Output VAT",
          value: outputVat,
          format: "currency",
          formula: "Taxable value × Rate",
        },
        {
          label: "Input VAT credit (applied)",
          value: inputVatCreditApplied,
          format: "currency",
          note: "Capped at Output VAT",
        },
        {
          label: "Net VAT payable",
          value: netVatPayable,
          format: "currency",
          formula: "Output VAT − Input VAT credit",
        },
        {
          label: "Total VAT cost (incl. non-recoverable)",
          value: totalVatCost,
          format: "currency",
          formula: "Net VAT payable + Non-recoverable VAT",
        },
      ],
    },
  ];

  const aiContext = `VAT (Self-Accounting) Calculation:
- Taxable value: ₦${taxableValue}
- VAT rate: ${vatRatePercent}%
- Output VAT: ₦${outputVat}
- Input VAT credit applied: ₦${inputVatCreditApplied}
- Net VAT payable: ₦${netVatPayable}
- Non-recoverable VAT: ₦${nonRecoverableVat}
- Total VAT cost: ₦${totalVatCost}`;

  return {
    taxableValue,
    vatRatePercent,
    outputVat,
    inputVatCreditEntered,
    inputVatCreditApplied,
    nonRecoverableVat,
    netVatPayable,
    totalVatCost,
    sections,
    aiContext,
  };
}
