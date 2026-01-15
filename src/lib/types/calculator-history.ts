import type { BandBreakdown } from "./tax";
import type { FlatSection, MonthlySavingsRow } from "./calculator-breakdown";

export type CalculatorTabKey =
  | "self-assessment"
  | "business-trade"
  | "wht-credit"
  | "wht-final"
  | "presumptive"
  | "capital-gains"
  | "vat-self-accounting"
  | "petroleum-special";

export type AppliedAmountLine = Readonly<{
  kind: "deduction" | "credit";
  key: string;
  label: string;
  enteredAmount: number;
  appliedAmount: number;
  reason?: string;
}>;

export type IncomeTaxHistoryEntry = Readonly<{
  kind: "income-tax";
  tab: "self-assessment" | "business-trade" | "wht-credit";
  id: string;
  timestamp: number;
  inputs: Record<string, number>;
  summary: Readonly<{
    chargeableIncome: number;
    grossTax: number;
    creditsApplied: number;
    netTaxPayable: number;
    totalDeductible?: number;
  }>;
  adjustments: readonly AppliedAmountLine[];
  bands: readonly BandBreakdown[];
  monthlyPlan: readonly MonthlySavingsRow[];
}>;

export type FlatTaxHistoryEntry = Readonly<{
  kind: "flat-tax";
  tab:
    | "wht-final"
    | "presumptive"
    | "capital-gains"
    | "vat-self-accounting"
    | "petroleum-special";
  id: string;
  timestamp: number;
  inputs: Record<string, number>;
  summary: Readonly<{
    taxDue: number;
    label: string;
  }>;
  sections: readonly FlatSection[];
  monthlyPlan: readonly MonthlySavingsRow[];
  adjustments?: readonly AppliedAmountLine[];
}>;

export type CalculatorHistoryEntry =
  | IncomeTaxHistoryEntry
  | FlatTaxHistoryEntry;

export const MONTH_NAMES: readonly string[] = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export function buildMonthlyPlan(
  annualAmount: number,
  startMonthIndex: number,
  monthNames: readonly string[]
): MonthlySavingsRow[] {
  const safeAmount =
    Number.isFinite(annualAmount) && annualAmount > 0
      ? Math.round(annualAmount)
      : 0;
  if (safeAmount <= 0) return [];

  const base = Math.floor(safeAmount / 12);
  let remainder = safeAmount - base * 12;

  const rows: MonthlySavingsRow[] = [];
  let cumulative = 0;
  for (let i = 0; i < 12; i++) {
    const monthIndex = (startMonthIndex + i) % 12;
    const extra = remainder > 0 ? 1 : 0;
    if (remainder > 0) remainder -= 1;
    const amount = base + extra;
    cumulative += amount;
    rows.push({
      monthIndex,
      monthName: monthNames[monthIndex] ?? `Month ${monthIndex + 1}`,
      amount,
      cumulative,
    });
  }
  return rows;
}

export function serializeCalculatorHistoryForChat(
  entries: readonly CalculatorHistoryEntry[],
  maxEntries: number = 5
): string {
  const slice = entries.slice(0, Math.max(0, maxEntries));
  if (slice.length === 0) return "";

  return slice
    .map((e, idx) => {
      const date = new Date(e.timestamp).toLocaleDateString();
      if (e.kind === "income-tax") {
        return `Saved Calculation ${idx + 1} (${e.tab}) - ${date}:
- Chargeable Income: ₦${e.summary.chargeableIncome}
- Gross Tax: ₦${e.summary.grossTax}
- Credits Applied: ₦${e.summary.creditsApplied}
- Net Tax Payable: ₦${e.summary.netTaxPayable}`;
      }
      return `Saved Calculation ${idx + 1} (${e.tab}) - ${date}:
- ${e.summary.label}: ₦${e.summary.taxDue}`;
    })
    .join("\n\n");
}
