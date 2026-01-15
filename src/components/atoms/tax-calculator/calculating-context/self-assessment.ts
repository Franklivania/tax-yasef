import type { TaxCalculationResult } from "@/lib/tax-calculator";
import { calculateTaxResult } from "@/lib/tax-calculator";
import { getDeductionDefinition } from "../deduction-relief-matrix";
import type { AppliedCredit, AppliedDeduction } from "../types";
import {
  applySimpleCredit,
  applySimpleDeduction,
  clampNonNegative,
  sum,
} from "./shared";

export type SelfAssessmentInputs = Readonly<{
  annualIncome: number;
  pensionApproved: number;
  nhf: number;
  nhis: number;
  lifeInsuranceOrAnnuity: number;
  rentPaid: number;
  mortgageInterestOwnerOccupied: number;
  payeCredit: number;
  whtCredit: number;
}>;

export type SelfAssessmentComputation = Readonly<{
  chargeableIncome: number;
  grossTax: number;
  creditsApplied: number;
  netTaxPayable: number;
  deductions: readonly AppliedDeduction[];
  credits: readonly AppliedCredit[];
  tax: TaxCalculationResult;
}>;

export function computeSelfAssessment(
  inputs: SelfAssessmentInputs
): SelfAssessmentComputation {
  const annualIncome = clampNonNegative(inputs.annualIncome);

  const pension = applySimpleDeduction(
    "pension_contributions_approved",
    `${getDeductionDefinition("pension_contributions_approved").label} ${getDeductionDefinition("pension_contributions_approved").note ?? ""}`.trim(),
    inputs.pensionApproved,
    inputs.pensionApproved
  );

  const nhf = applySimpleDeduction(
    "nhf_contributions",
    getDeductionDefinition("nhf_contributions").label,
    inputs.nhf,
    inputs.nhf
  );

  const nhis = applySimpleDeduction(
    "nhis_contributions",
    getDeductionDefinition("nhis_contributions").label,
    inputs.nhis,
    inputs.nhis
  );

  const life = applySimpleDeduction(
    "life_insurance_annuity",
    getDeductionDefinition("life_insurance_annuity").label,
    inputs.lifeInsuranceOrAnnuity,
    inputs.lifeInsuranceOrAnnuity
  );

  const rentPaid = clampNonNegative(inputs.rentPaid);
  const rentDeductible = Math.min(rentPaid * 0.2, 500_000);
  const rent = applySimpleDeduction(
    "rent_relief_20pct_cap_500k",
    `${getDeductionDefinition("rent_relief_20pct_cap_500k").label} ${getDeductionDefinition("rent_relief_20pct_cap_500k").note ?? ""}`.trim(),
    rentPaid,
    rentDeductible,
    rentPaid > 0 && rentDeductible < rentPaid * 0.2
      ? "Capped at ₦500,000"
      : undefined
  );

  const mortgage = applySimpleDeduction(
    "mortgage_interest_owner_occupied",
    `${getDeductionDefinition("mortgage_interest_owner_occupied").label} ${getDeductionDefinition("mortgage_interest_owner_occupied").note ?? ""}`.trim(),
    inputs.mortgageInterestOwnerOccupied,
    inputs.mortgageInterestOwnerOccupied
  );

  const deductions: AppliedDeduction[] = [
    pension,
    nhf,
    nhis,
    life,
    rent,
    mortgage,
  ].filter((d) => d.enteredAmount > 0);

  const totalDeductible = sum(deductions.map((d) => d.deductibleAmount));
  const chargeableIncome = Math.max(0, annualIncome - totalDeductible);
  const tax = calculateTaxResult(chargeableIncome);

  const payeCredit = applySimpleCredit(
    "paye_already_deducted_credit",
    `${getDeductionDefinition("paye_already_deducted_credit").label} ${getDeductionDefinition("paye_already_deducted_credit").note ?? ""}`.trim(),
    inputs.payeCredit,
    Math.min(clampNonNegative(inputs.payeCredit), tax.totalTax)
  );

  const whtCredit = applySimpleCredit(
    "wht_already_deducted_credit",
    `${getDeductionDefinition("wht_already_deducted_credit").label} ${getDeductionDefinition("wht_already_deducted_credit").note ?? ""}`.trim(),
    inputs.whtCredit,
    Math.min(
      clampNonNegative(inputs.whtCredit),
      Math.max(0, tax.totalTax - payeCredit.appliedAmount)
    )
  );

  const credits: AppliedCredit[] = [payeCredit, whtCredit].filter(
    (c) => c.enteredAmount > 0
  );
  const creditsApplied = sum(credits.map((c) => c.appliedAmount));
  const netTaxPayable = Math.max(0, tax.totalTax - creditsApplied);

  return {
    chargeableIncome,
    grossTax: tax.totalTax,
    creditsApplied,
    netTaxPayable,
    deductions,
    credits,
    tax,
  };
}
