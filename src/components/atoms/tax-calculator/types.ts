export type TaxTabKey =
  | "self-assessment"
  | "business-trade"
  | "wht-credit"
  | "wht-final"
  | "presumptive"
  | "capital-gains"
  | "vat-self-accounting"
  | "petroleum-special";

export const TAX_TAB_KEYS: readonly TaxTabKey[] = [
  "self-assessment",
  "business-trade",
  "wht-credit",
  "wht-final",
  "presumptive",
  "capital-gains",
  "vat-self-accounting",
  "petroleum-special",
] as const;

export function isTaxTabKey(value: string): value is TaxTabKey {
  return (TAX_TAB_KEYS as readonly string[]).includes(value);
}

export type DeductionApplicability = "allowed" | "not_allowed" | "conditional";

export type DeductionKey =
  | "tax_free_band_800k"
  | "pension_contributions_approved"
  | "nhf_contributions"
  | "nhis_contributions"
  | "life_insurance_annuity"
  | "rent_relief_20pct_cap_500k"
  | "mortgage_interest_owner_occupied"
  | "business_operating_expenses"
  | "cost_of_sales"
  | "staff_salaries_wages"
  | "utilities_business_use"
  | "internet_tools_business_use"
  | "repairs_maintenance_business"
  | "bad_doubtful_debts"
  | "research_development"
  | "capital_allowance_instead_of_depreciation"
  | "business_loss_carryforward"
  | "digital_asset_losses"
  | "paye_already_deducted_credit"
  | "wht_already_deducted_credit"
  | "final_tax_income_exclusion"
  | "capital_disposal_costs"
  | "reinvestment_relief_shares"
  | "principal_private_residence_relief"
  | "input_vat_credit"
  | "vat_on_expenses_non_recoverable"
  | "decommissioning_abandonment_funds"
  | "sector_specific_allowances";

export type DeductionDefinition = Readonly<{
  key: DeductionKey;
  label: string;
  /** Optional extra note shown in UI, e.g. "(strict rules)" */
  note?: string;
  /** Optional help text shown under inputs */
  helpText?: string;
}>;

export type DeductionMatrixCell = Readonly<{
  applicability: DeductionApplicability;
  note?: string;
}>;

export type DeductionReliefMatrix = Readonly<
  Record<DeductionKey, Readonly<Record<TaxTabKey, DeductionMatrixCell>>>
>;

export type TaxTabConfig = Readonly<{
  label: string;
  value: TaxTabKey;
  infoMarkdownFile:
    | "self-assessment.md"
    | "business-trade.md"
    | "wht-credit.md"
    | "wht-final.md"
    | "presumptive.md"
    | "capital-gains.md"
    | "vat-self-accounting.md"
    | "petroleum-special.md";
}>;

export type AppliedDeduction = Readonly<{
  key: DeductionKey;
  label: string;
  enteredAmount: number;
  deductibleAmount: number;
  reason?: string;
}>;

export type CreditKey =
  | "paye_already_deducted_credit"
  | "wht_already_deducted_credit";

export type AppliedCredit = Readonly<{
  key: CreditKey;
  label: string;
  enteredAmount: number;
  appliedAmount: number;
  reason?: string;
}>;
