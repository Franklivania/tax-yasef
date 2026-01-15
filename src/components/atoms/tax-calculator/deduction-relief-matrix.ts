import type {
  DeductionDefinition,
  DeductionKey,
  DeductionReliefMatrix,
  TaxTabKey,
} from "./types";

const TAX_TABS: readonly TaxTabKey[] = [
  "self-assessment",
  "business-trade",
  "wht-credit",
  "wht-final",
  "presumptive",
  "capital-gains",
  "vat-self-accounting",
  "petroleum-special",
] as const;

function cell(
  applicability: "allowed" | "not_allowed" | "conditional",
  note?: string
) {
  return { applicability, note } as const;
}

function allNotAllowed(): Record<TaxTabKey, ReturnType<typeof cell>> {
  return Object.fromEntries(
    TAX_TABS.map((t) => [t, cell("not_allowed")])
  ) as Record<TaxTabKey, ReturnType<typeof cell>>;
}

export const DEDUCTION_DEFINITIONS: readonly DeductionDefinition[] = [
  { key: "tax_free_band_800k", label: "₦800,000 tax-free band" },
  {
    key: "pension_contributions_approved",
    label: "Pension contributions",
    note: "(approved)",
    helpText:
      "Only approved pension contributions are deductible. For business income, only the owner's personal approved pension counts.",
  },
  { key: "nhf_contributions", label: "NHF contributions" },
  { key: "nhis_contributions", label: "NHIS contributions" },
  { key: "life_insurance_annuity", label: "Life insurance / annuity" },
  {
    key: "rent_relief_20pct_cap_500k",
    label: "Rent relief",
    note: "(20% / ₦500k cap)",
    helpText: "Deduction is the lower of 20% of rent paid and ₦500,000.",
  },
  {
    key: "mortgage_interest_owner_occupied",
    label: "Mortgage interest",
    note: "(owner-occupied)",
  },
  { key: "business_operating_expenses", label: "Business operating expenses" },
  { key: "cost_of_sales", label: "Cost of sales" },
  { key: "staff_salaries_wages", label: "Staff salaries & wages" },
  { key: "utilities_business_use", label: "Utilities", note: "(business use)" },
  {
    key: "internet_tools_business_use",
    label: "Internet / tools",
    note: "(business use)",
  },
  {
    key: "repairs_maintenance_business",
    label: "Repairs & maintenance",
    note: "(business)",
  },
  {
    key: "bad_doubtful_debts",
    label: "Bad & doubtful debts",
    note: "(strict rules)",
  },
  { key: "research_development", label: "Research & development" },
  {
    key: "capital_allowance_instead_of_depreciation",
    label: "Capital allowance",
    note: "(instead of depreciation)",
  },
  { key: "business_loss_carryforward", label: "Business loss carryforward" },
  {
    key: "digital_asset_losses",
    label: "Digital asset losses",
    note: "(ring-fenced)",
  },
  {
    key: "paye_already_deducted_credit",
    label: "PAYE already deducted",
    note: "(credit)",
  },
  {
    key: "wht_already_deducted_credit",
    label: "WHT already deducted",
    note: "(credit)",
  },
  { key: "final_tax_income_exclusion", label: "Final-tax income exclusion" },
  { key: "capital_disposal_costs", label: "Capital disposal costs" },
  {
    key: "reinvestment_relief_shares",
    label: "Reinvestment relief",
    note: "(shares)",
  },
  {
    key: "principal_private_residence_relief",
    label: "Principal private residence relief",
  },
  { key: "input_vat_credit", label: "Input VAT credit" },
  {
    key: "vat_on_expenses_non_recoverable",
    label: "VAT on expenses",
    note: "(non-recoverable)",
  },
  {
    key: "decommissioning_abandonment_funds",
    label: "Decommissioning / abandonment funds",
  },
  { key: "sector_specific_allowances", label: "Sector-specific allowances" },
] as const;

function def(key: DeductionKey): DeductionDefinition {
  const found = DEDUCTION_DEFINITIONS.find((d) => d.key === key);
  if (!found) throw new Error(`Missing deduction definition for ${key}`);
  return found;
}

export const DEDUCTION_RELIEF_MATRIX: DeductionReliefMatrix = {
  tax_free_band_800k: {
    ...allNotAllowed(),
    "self-assessment": cell("allowed"),
    "business-trade": cell("allowed"),
  },
  pension_contributions_approved: {
    ...allNotAllowed(),
    "self-assessment": cell("allowed"),
    "business-trade": cell("conditional", "owner’s personal"),
  },
  nhf_contributions: {
    ...allNotAllowed(),
    "self-assessment": cell("allowed"),
  },
  nhis_contributions: {
    ...allNotAllowed(),
    "self-assessment": cell("allowed"),
  },
  life_insurance_annuity: {
    ...allNotAllowed(),
    "self-assessment": cell("allowed"),
  },
  rent_relief_20pct_cap_500k: {
    ...allNotAllowed(),
    "self-assessment": cell("allowed"),
  },
  mortgage_interest_owner_occupied: {
    ...allNotAllowed(),
    "self-assessment": cell("allowed"),
  },
  business_operating_expenses: {
    ...allNotAllowed(),
    "business-trade": cell("allowed"),
    "petroleum-special": cell("allowed"),
  },
  cost_of_sales: {
    ...allNotAllowed(),
    "business-trade": cell("allowed"),
    "petroleum-special": cell("allowed"),
  },
  staff_salaries_wages: {
    ...allNotAllowed(),
    "business-trade": cell("allowed"),
    "petroleum-special": cell("allowed"),
  },
  utilities_business_use: {
    ...allNotAllowed(),
    "business-trade": cell("allowed"),
    "petroleum-special": cell("allowed"),
  },
  internet_tools_business_use: {
    ...allNotAllowed(),
    "business-trade": cell("allowed"),
    "petroleum-special": cell("allowed"),
  },
  repairs_maintenance_business: {
    ...allNotAllowed(),
    "business-trade": cell("allowed"),
    "petroleum-special": cell("allowed"),
  },
  bad_doubtful_debts: {
    ...allNotAllowed(),
    "business-trade": cell("conditional", "strict rules"),
    "petroleum-special": cell("conditional"),
  },
  research_development: {
    ...allNotAllowed(),
    "business-trade": cell("conditional"),
    "petroleum-special": cell("conditional"),
  },
  capital_allowance_instead_of_depreciation: {
    ...allNotAllowed(),
    "business-trade": cell("allowed"),
    "petroleum-special": cell("allowed"),
  },
  business_loss_carryforward: {
    ...allNotAllowed(),
    "business-trade": cell("allowed"),
    "petroleum-special": cell("allowed"),
  },
  digital_asset_losses: {
    ...allNotAllowed(),
    "self-assessment": cell("conditional", "ring-fenced"),
    "business-trade": cell("conditional"),
    "capital-gains": cell("conditional"),
  },
  paye_already_deducted_credit: {
    ...allNotAllowed(),
    "self-assessment": cell("allowed"),
  },
  wht_already_deducted_credit: {
    ...allNotAllowed(),
    "self-assessment": cell("allowed"),
    "business-trade": cell("allowed"),
    "wht-credit": cell("allowed"),
  },
  final_tax_income_exclusion: {
    ...allNotAllowed(),
    "self-assessment": cell("allowed"),
    "wht-final": cell("allowed"),
  },
  capital_disposal_costs: {
    ...allNotAllowed(),
    "capital-gains": cell("allowed"),
  },
  reinvestment_relief_shares: {
    ...allNotAllowed(),
    "capital-gains": cell("conditional"),
  },
  principal_private_residence_relief: {
    ...allNotAllowed(),
    "capital-gains": cell("allowed"),
  },
  input_vat_credit: {
    ...allNotAllowed(),
    "vat-self-accounting": cell("allowed"),
  },
  vat_on_expenses_non_recoverable: {
    ...allNotAllowed(),
  },
  decommissioning_abandonment_funds: {
    ...allNotAllowed(),
    "petroleum-special": cell("conditional"),
  },
  sector_specific_allowances: {
    ...allNotAllowed(),
    "petroleum-special": cell("allowed"),
  },
} as const;

export function getDeductionDefinition(key: DeductionKey): DeductionDefinition {
  return def(key);
}

export function getApplicableDeductionsForTab(tab: TaxTabKey): ReadonlyArray<{
  definition: DeductionDefinition;
  applicability: "allowed" | "not_allowed" | "conditional";
  note?: string;
}> {
  return DEDUCTION_DEFINITIONS.map((d) => {
    const cell = DEDUCTION_RELIEF_MATRIX[d.key][tab];
    return {
      definition: d,
      applicability: cell.applicability,
      note: cell.note,
    };
  });
}
