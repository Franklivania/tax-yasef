import { getDeductionDefinition } from "../deduction-relief-matrix";
import type { AppliedDeduction } from "../types";
import type { FlatSection } from "@/lib/types/calculator-breakdown";
import {
  applySimpleDeduction,
  clampNonNegative,
  roundMoney,
  sum,
} from "./shared";

export type PetroleumSpecialInputs = Readonly<{
  taxableProfit: number;
  specialRatePercent: number;
  businessOperatingExpenses: number;
  costOfSales: number;
  staffSalariesWages: number;
  utilitiesBusinessUse: number;
  internetToolsBusinessUse: number;
  repairsMaintenance: number;
  capitalAllowance: number;
  badDoubtfulDebts: number;
  researchDevelopment: number;
  decommissioningFunds: number;
  sectorSpecificAllowances: number;
}>;

export type PetroleumSpecialComputation = Readonly<{
  taxableProfit: number;
  totalDeductible: number;
  chargeableProfit: number;
  specialRatePercent: number;
  taxDue: number;
  deductions: readonly AppliedDeduction[];
  sections: readonly FlatSection[];
  aiContext: string;
}>;

export function computePetroleumSpecial(
  inputs: PetroleumSpecialInputs
): PetroleumSpecialComputation {
  const taxableProfit = clampNonNegative(inputs.taxableProfit);
  const specialRatePercent = clampNonNegative(inputs.specialRatePercent);
  const rate = Math.min(specialRatePercent / 100, 1);

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
      `${getDeductionDefinition("utilities_business_use").label} ${
        getDeductionDefinition("utilities_business_use").note ?? ""
      }`.trim(),
      inputs.utilitiesBusinessUse,
      inputs.utilitiesBusinessUse
    ),
    applySimpleDeduction(
      "internet_tools_business_use",
      `${getDeductionDefinition("internet_tools_business_use").label} ${
        getDeductionDefinition("internet_tools_business_use").note ?? ""
      }`.trim(),
      inputs.internetToolsBusinessUse,
      inputs.internetToolsBusinessUse
    ),
    applySimpleDeduction(
      "repairs_maintenance_business",
      `${getDeductionDefinition("repairs_maintenance_business").label} ${
        getDeductionDefinition("repairs_maintenance_business").note ?? ""
      }`.trim(),
      inputs.repairsMaintenance,
      inputs.repairsMaintenance
    ),
    applySimpleDeduction(
      "capital_allowance_instead_of_depreciation",
      `${getDeductionDefinition("capital_allowance_instead_of_depreciation").label} ${
        getDeductionDefinition("capital_allowance_instead_of_depreciation")
          .note ?? ""
      }`.trim(),
      inputs.capitalAllowance,
      inputs.capitalAllowance
    ),
    applySimpleDeduction(
      "bad_doubtful_debts",
      `${getDeductionDefinition("bad_doubtful_debts").label} ${
        getDeductionDefinition("bad_doubtful_debts").note ?? ""
      }`.trim(),
      inputs.badDoubtfulDebts,
      inputs.badDoubtfulDebts,
      inputs.badDoubtfulDebts > 0 ? "Subject to strict rules" : undefined
    ),
    applySimpleDeduction(
      "research_development",
      getDeductionDefinition("research_development").label,
      inputs.researchDevelopment,
      inputs.researchDevelopment
    ),
    applySimpleDeduction(
      "decommissioning_abandonment_funds",
      getDeductionDefinition("decommissioning_abandonment_funds").label,
      inputs.decommissioningFunds,
      inputs.decommissioningFunds
    ),
    applySimpleDeduction(
      "sector_specific_allowances",
      getDeductionDefinition("sector_specific_allowances").label,
      inputs.sectorSpecificAllowances,
      inputs.sectorSpecificAllowances
    ),
  ].filter((d) => d.enteredAmount > 0);

  const totalDeductible = sum(deductions.map((d) => d.deductibleAmount));
  const chargeableProfit = Math.max(0, taxableProfit - totalDeductible);
  const taxDue = roundMoney(chargeableProfit * rate);

  const sections: FlatSection[] = [
    {
      title: "Summary",
      lines: [
        { label: "Taxable profit", value: taxableProfit, format: "currency" },
        {
          label: "Total deductible",
          value: totalDeductible,
          format: "currency",
        },
        {
          label: "Chargeable profit",
          value: chargeableProfit,
          format: "currency",
        },
        { label: "Special rate", value: specialRatePercent, format: "percent" },
        {
          label: "Tax due",
          value: taxDue,
          format: "currency",
          formula: "Chargeable profit × Rate",
        },
      ],
    },
  ];

  const aiContext = `Petroleum/Special Sector Calculation:
- Taxable profit: ₦${taxableProfit}
- Total deductible: ₦${totalDeductible}
- Chargeable profit: ₦${chargeableProfit}
- Rate: ${specialRatePercent}%
- Tax due: ₦${taxDue}`;

  return {
    taxableProfit,
    totalDeductible,
    chargeableProfit,
    specialRatePercent,
    taxDue,
    deductions,
    sections,
    aiContext,
  };
}
