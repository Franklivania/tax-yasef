import type { TaxCalculationResult } from "@/lib/tax-calculator";
import { calculateTaxResult } from "@/lib/tax-calculator";
import { getDeductionDefinition } from "../deduction-relief-matrix";
import type { AppliedCredit } from "../types";
import { applySimpleCredit, clampNonNegative, sum } from "./shared";

export type WhtCreditInputs = Readonly<{
  chargeableIncome: number;
  whtCredit: number;
}>;

export type WhtCreditComputation = Readonly<{
  chargeableIncome: number;
  grossTax: number;
  creditsApplied: number;
  netTaxPayable: number;
  credits: readonly AppliedCredit[];
  tax: TaxCalculationResult;
}>;

export function computeWhtCredit(
  inputs: WhtCreditInputs
): WhtCreditComputation {
  const chargeableIncome = clampNonNegative(inputs.chargeableIncome);
  const tax = calculateTaxResult(chargeableIncome);

  const whtCredit = applySimpleCredit(
    "wht_already_deducted_credit",
    `${getDeductionDefinition("wht_already_deducted_credit").label} ${
      getDeductionDefinition("wht_already_deducted_credit").note ?? ""
    }`.trim(),
    inputs.whtCredit,
    Math.min(clampNonNegative(inputs.whtCredit), tax.totalTax)
  );

  const credits: AppliedCredit[] = [whtCredit].filter(
    (c) => c.enteredAmount > 0
  );
  const creditsApplied = sum(credits.map((c) => c.appliedAmount));
  const netTaxPayable = Math.max(0, tax.totalTax - creditsApplied);

  return {
    chargeableIncome,
    grossTax: tax.totalTax,
    creditsApplied,
    netTaxPayable,
    credits,
    tax,
  };
}
