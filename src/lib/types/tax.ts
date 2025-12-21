export type TaxBand = {
  band: number;
  minIncome: number;
  maxIncome: number | null; // null means no upper limit
  rate: number;
  taxableRange: number; // The amount in this band that can be taxed
};

export type BandBreakdown = {
  band: number;
  incomeRange: string;
  rate: number;
  taxableAmount: number;
  taxDue: number;
  calculation: string;
};

export type TaxCalculationResult = {
  chargeableIncome: number;
  totalTax: number;
  netIncome: number;
  effectiveRate: number;
  bands: BandBreakdown[];
  timestamp: number;
  id: string;
};

export type MonthlyBreakdown = {
  month: number;
  monthName: string;
  chargeableIncome: number;
  tax: number;
  netIncome: number;
};

export type TaxCalculationWithExplanation = TaxCalculationResult & {
  explanation?: string;
  monthlyBreakdown?: MonthlyBreakdown[];
};
