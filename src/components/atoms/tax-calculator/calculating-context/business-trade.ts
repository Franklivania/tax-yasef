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

export type BusinessTradeInputs = Readonly<{
  annualProfit: number;
  businessOperatingExpenses: number;
  costOfSales: number;
  staffSalariesWages: number;
  utilitiesBusinessUse: number;
  internetToolsBusinessUse: number;
  repairsMaintenance: number;
  capitalAllowance: number;
  businessLossCarryforward: number;
  ownersPensionApproved: number;
  whtCredit: number;
}>;

export type BusinessTradeComputation = Readonly<{
  chargeableIncome: number;
  grossTax: number;
  creditsApplied: number;
  netTaxPayable: number;
  deductions: readonly AppliedDeduction[];
  credits: readonly AppliedCredit[];
  tax: TaxCalculationResult;
}>;

export function computeBusinessTrade(
  inputs: BusinessTradeInputs
): BusinessTradeComputation {
  const annualProfit = clampNonNegative(inputs.annualProfit);

  const deductions: AppliedDeduction[] = [
    applySimpleDeduction(
      "business_operating_expenses",
      getDeductionDefinition("business_operating_expenses").label,
      inputs.businessOperatingExpenses,
      inputs.businessOperatingExpenses
    ),
    applySimpleDeduction(
      "cost_of_sales",
      getDeductionDefinition("cost_of_sales").label,
      inputs.costOfSales,
      inputs.costOfSales
    ),
    applySimpleDeduction(
      "staff_salaries_wages",
      getDeductionDefinition("staff_salaries_wages").label,
      inputs.staffSalariesWages,
      inputs.staffSalariesWages
    ),
    applySimpleDeduction(
      "utilities_business_use",
      `${getDeductionDefinition("utilities_business_use").label} ${getDeductionDefinition("utilities_business_use").note ?? ""}`.trim(),
      inputs.utilitiesBusinessUse,
      inputs.utilitiesBusinessUse
    ),
    applySimpleDeduction(
      "internet_tools_business_use",
      `${getDeductionDefinition("internet_tools_business_use").label} ${getDeductionDefinition("internet_tools_business_use").note ?? ""}`.trim(),
      inputs.internetToolsBusinessUse,
      inputs.internetToolsBusinessUse
    ),
    applySimpleDeduction(
      "repairs_maintenance_business",
      `${getDeductionDefinition("repairs_maintenance_business").label} ${getDeductionDefinition("repairs_maintenance_business").note ?? ""}`.trim(),
      inputs.repairsMaintenance,
      inputs.repairsMaintenance
    ),
    applySimpleDeduction(
      "capital_allowance_instead_of_depreciation",
      `${getDeductionDefinition("capital_allowance_instead_of_depreciation").label} ${getDeductionDefinition("capital_allowance_instead_of_depreciation").note ?? ""}`.trim(),
      inputs.capitalAllowance,
      inputs.capitalAllowance
    ),
    applySimpleDeduction(
      "business_loss_carryforward",
      getDeductionDefinition("business_loss_carryforward").label,
      inputs.businessLossCarryforward,
      inputs.businessLossCarryforward
    ),
    applySimpleDeduction(
      "pension_contributions_approved",
      `${getDeductionDefinition("pension_contributions_approved").label} ${getDeductionDefinition("pension_contributions_approved").note ?? ""}`.trim(),
      inputs.ownersPensionApproved,
      inputs.ownersPensionApproved,
      inputs.ownersPensionApproved > 0
        ? "Owner’s approved personal pension only"
        : undefined
    ),
  ].filter((d) => d.enteredAmount > 0);

  const totalDeductible = sum(deductions.map((d) => d.deductibleAmount));
  const chargeableIncome = Math.max(0, annualProfit - totalDeductible);
  const tax = calculateTaxResult(chargeableIncome);

  const whtCredit = applySimpleCredit(
    "wht_already_deducted_credit",
    `${getDeductionDefinition("wht_already_deducted_credit").label} ${getDeductionDefinition("wht_already_deducted_credit").note ?? ""}`.trim(),
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
    deductions,
    credits,
    tax,
  };
}
