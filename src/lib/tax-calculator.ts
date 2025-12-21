/**
 * Tax Calculator Utilities
 * Nigerian Personal Income Tax Calculation based on Tax Act 2025
 * Implements marginal rate calculation with breakdown and AI explanations
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { groqService } from "./services/groq";
import type {
  BandBreakdown,
  MonthlyBreakdown,
  TaxBand,
  TaxCalculationResult,
  TaxCalculationWithExplanation,
} from "./types/tax";

// Re-export types for convenience
export type {
  BandBreakdown,
  MonthlyBreakdown,
  TaxBand,
  TaxCalculationResult,
  TaxCalculationWithExplanation,
};

// ============================================================================
// TYPES
// ============================================================================

// ============================================================================
// TAX BANDS CONFIGURATION
// ============================================================================

export const TAX_BANDS: readonly TaxBand[] = [
  {
    band: 1,
    minIncome: 0,
    maxIncome: 800_000,
    rate: 0,
    taxableRange: 800_000,
  },
  {
    band: 2,
    minIncome: 800_001,
    maxIncome: 3_000_000,
    rate: 0.15,
    taxableRange: 2_200_000,
  },
  {
    band: 3,
    minIncome: 3_000_001,
    maxIncome: 12_000_000,
    rate: 0.18,
    taxableRange: 9_000_000,
  },
  {
    band: 4,
    minIncome: 12_000_001,
    maxIncome: 25_000_000,
    rate: 0.21,
    taxableRange: 13_000_000,
  },
  {
    band: 5,
    minIncome: 25_000_001,
    maxIncome: 50_000_000,
    rate: 0.23,
    taxableRange: 25_000_000,
  },
  {
    band: 6,
    minIncome: 50_000_001,
    maxIncome: null,
    rate: 0.25,
    taxableRange: Infinity,
  },
] as const;

// ============================================================================
// PURE CALCULATION FUNCTIONS
// ============================================================================

/**
 * Calculate tax for a single band
 */
export function calculateBandTax(
  chargeableIncome: number,
  band: TaxBand
): { taxableAmount: number; taxDue: number } {
  if (chargeableIncome <= band.minIncome) {
    return { taxableAmount: 0, taxDue: 0 };
  }

  const upperLimit = band.maxIncome ?? Infinity;
  const lowerLimit = band.minIncome;

  // Calculate taxable amount in this band
  const taxableAmount = Math.min(
    band.taxableRange,
    Math.max(0, Math.min(chargeableIncome, upperLimit) - lowerLimit)
  );

  const taxDue = taxableAmount * band.rate;

  return { taxableAmount, taxDue };
}

/**
 * Calculate total tax using universal formula
 * Tax Due = 0
 *   + 15% × min(2,200,000, max(0, CI - 800,000))
 *   + 18% × min(9,000,000, max(0, CI - 3,000,000))
 *   + 21% × min(13,000,000, max(0, CI - 12,000,000))
 *   + 23% × min(25,000,000, max(0, CI - 25,000,000))
 *   + 25% × max(0, CI - 50,000,000)
 */
export function calculateTax(chargeableIncome: number): number {
  if (chargeableIncome <= 0) return 0;

  let taxDue = 0;

  // Band 2: 15% on next 2,200,000
  taxDue += 0.15 * Math.min(2_200_000, Math.max(0, chargeableIncome - 800_000));

  // Band 3: 18% on next 9,000,000
  taxDue +=
    0.18 * Math.min(9_000_000, Math.max(0, chargeableIncome - 3_000_000));

  // Band 4: 21% on next 13,000,000
  taxDue +=
    0.21 * Math.min(13_000_000, Math.max(0, chargeableIncome - 12_000_000));

  // Band 5: 23% on next 25,000,000
  taxDue +=
    0.23 * Math.min(25_000_000, Math.max(0, chargeableIncome - 25_000_000));

  // Band 6: 25% on excess above 50,000,000
  taxDue += 0.25 * Math.max(0, chargeableIncome - 50_000_000);

  return Math.round(taxDue);
}

/**
 * Calculate detailed breakdown by band
 */
export function calculateTaxBreakdown(
  chargeableIncome: number
): BandBreakdown[] {
  const breakdown: BandBreakdown[] = [];

  for (const band of TAX_BANDS) {
    const { taxableAmount, taxDue } = calculateBandTax(chargeableIncome, band);

    if (taxableAmount > 0 || band.band === 1) {
      const incomeRange =
        band.maxIncome === null
          ? `Above ${formatCurrency(band.minIncome - 1)}`
          : `${formatCurrency(band.minIncome)} - ${formatCurrency(band.maxIncome)}`;

      const calculation =
        band.rate === 0
          ? `${formatCurrency(taxableAmount)} × ${band.rate * 100}%`
          : `${formatCurrency(taxableAmount)} × ${band.rate * 100}%`;

      breakdown.push({
        band: band.band,
        incomeRange,
        rate: band.rate,
        taxableAmount,
        taxDue: Math.round(taxDue),
        calculation,
      });
    }
  }

  return breakdown;
}

/**
 * Calculate complete tax result
 */
export function calculateTaxResult(
  chargeableIncome: number
): TaxCalculationResult {
  const totalTax = calculateTax(chargeableIncome);
  const netIncome = chargeableIncome - totalTax;
  const effectiveRate =
    chargeableIncome > 0 ? (totalTax / chargeableIncome) * 100 : 0;
  const bands = calculateTaxBreakdown(chargeableIncome);

  return {
    chargeableIncome,
    totalTax,
    netIncome,
    effectiveRate: Math.round(effectiveRate * 100) / 100,
    bands,
    timestamp: Date.now(),
    id: `tax-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  };
}

// ============================================================================
// MONTHLY BREAKDOWN UTILITIES
// ============================================================================

const MONTH_NAMES = [
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
];

/**
 * Calculate monthly breakdown from annual income
 */
export function calculateMonthlyBreakdown(
  annualIncome: number
): MonthlyBreakdown[] {
  const monthlyIncome = annualIncome / 12;
  const monthlyTax = calculateTax(monthlyIncome);
  const monthlyNet = monthlyIncome - monthlyTax;

  return MONTH_NAMES.map((monthName, index) => ({
    month: index + 1,
    monthName,
    chargeableIncome: Math.round(monthlyIncome),
    tax: Math.round(monthlyTax),
    netIncome: Math.round(monthlyNet),
  }));
}

/**
 * Calculate monthly breakdown from annual tax result
 */
export function getMonthlyFromAnnual(
  result: TaxCalculationResult
): MonthlyBreakdown[] {
  return calculateMonthlyBreakdown(result.chargeableIncome);
}

// ============================================================================
// FORMATTING UTILITIES
// ============================================================================

/**
 * Format number as Nigerian Naira currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format number with commas (no currency symbol)
 */
export function formatNumber(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

// ============================================================================
// AI EXPLANATION GENERATION
// ============================================================================

/**
 * Generate AI explanation for tax calculation
 * Brief, token-efficient explanation of what was taxed and how
 */
export async function generateTaxExplanation(
  result: TaxCalculationResult
): Promise<string> {
  const prompt = `You are a tax assistant explaining Nigerian Personal Income Tax calculations.

Based on the Nigeria Tax Act 2025, provide a brief, clear explanation (2-3 sentences max) of this tax calculation:

Chargeable Income: ₦${formatNumber(result.chargeableIncome)}
Total Tax Due: ₦${formatNumber(result.totalTax)}
Effective Rate: ${formatPercentage(result.effectiveRate)}%
Net Income After Tax: ₦${formatNumber(result.netIncome)}

Tax Breakdown:
${result.bands
  .filter((b) => b.taxDue > 0)
  .map(
    (b) =>
      `- Band ${b.band}: ${b.incomeRange} at ${b.rate * 100}% = ₦${formatNumber(b.taxDue)}`
  )
  .join("\n")}

Explain:
1. What portion of income was taxed
2. How the marginal rate system works for this income level
3. What the taxpayer receives after tax

Keep it brief, clear, and professional. Use Nigerian English where appropriate.`;

  try {
    const explanation = await groqService.createCompletion(prompt);
    return explanation || "Unable to generate explanation at this time.";
  } catch (error) {
    console.error("Failed to generate tax explanation:", error);
    return "Explanation unavailable. Please refer to the breakdown above.";
  }
}

/**
 * Calculate tax with AI explanation
 */
export async function calculateTaxWithExplanation(
  chargeableIncome: number,
  includeMonthly: boolean = false
): Promise<TaxCalculationWithExplanation> {
  const result = calculateTaxResult(chargeableIncome);
  const explanation = await generateTaxExplanation(result);

  const response: TaxCalculationWithExplanation = {
    ...result,
    explanation,
  };

  if (includeMonthly) {
    response.monthlyBreakdown = getMonthlyFromAnnual(result);
  }

  return response;
}

// ============================================================================
// LOCAL STORAGE PERSISTENCE
// ============================================================================

type TaxCalculationStore = {
  calculations: TaxCalculationResult[];
  addCalculation: (calculation: TaxCalculationResult) => void;
  getCalculation: (id: string) => TaxCalculationResult | undefined;
  getAllCalculations: () => TaxCalculationResult[];
  clearCalculations: () => void;
  removeCalculation: (id: string) => void;
  getLatestCalculation: () => TaxCalculationResult | undefined;
};

export const useTaxCalculationStore = create<TaxCalculationStore>()(
  persist(
    (set, get) => ({
      calculations: [],

      addCalculation: (calculation) => {
        set((state) => ({
          calculations: [calculation, ...state.calculations].slice(0, 50), // Keep last 50
        }));
      },

      getCalculation: (id) => {
        return get().calculations.find((calc) => calc.id === id);
      },

      getAllCalculations: () => {
        return get().calculations;
      },

      clearCalculations: () => {
        set({ calculations: [] });
      },

      removeCalculation: (id) => {
        set((state) => ({
          calculations: state.calculations.filter((calc) => calc.id !== id),
        }));
      },

      getLatestCalculation: () => {
        const calculations = get().calculations;
        return calculations.length > 0 ? calculations[0] : undefined;
      },
    }),
    {
      name: "tax-yasef-calculations-storage",
      partialize: (state) => ({ calculations: state.calculations }),
    }
  )
);

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Validate chargeable income input
 */
export function validateChargeableIncome(income: number | string): {
  valid: boolean;
  value?: number;
  error?: string;
} {
  const numValue = typeof income === "string" ? parseFloat(income) : income;

  if (isNaN(numValue)) {
    return { valid: false, error: "Please enter a valid number" };
  }

  if (numValue < 0) {
    return { valid: false, error: "Income cannot be negative" };
  }

  if (numValue > 1_000_000_000_000) {
    return {
      valid: false,
      error: "Income value is too large. Please enter a reasonable amount.",
    };
  }

  return { valid: true, value: numValue };
}

// ============================================================================
// QUICK CALCULATION HELPERS
// ============================================================================

/**
 * Quick tax calculation (no breakdown, no storage)
 */
export function quickCalculateTax(chargeableIncome: number): {
  tax: number;
  netIncome: number;
  effectiveRate: number;
} {
  const tax = calculateTax(chargeableIncome);
  const netIncome = chargeableIncome - tax;
  const effectiveRate =
    chargeableIncome > 0 ? (tax / chargeableIncome) * 100 : 0;

  return {
    tax,
    netIncome,
    effectiveRate: Math.round(effectiveRate * 100) / 100,
  };
}

/**
 * Get tax band for a given income
 */
export function getTaxBandForIncome(chargeableIncome: number): TaxBand | null {
  for (const band of TAX_BANDS) {
    if (
      chargeableIncome >= band.minIncome &&
      (band.maxIncome === null || chargeableIncome <= band.maxIncome)
    ) {
      return band;
    }
  }
  return null;
}

/**
 * Check if income falls in a specific band
 */
export function isIncomeInBand(
  chargeableIncome: number,
  bandNumber: number
): boolean {
  const band = TAX_BANDS.find((b) => b.band === bandNumber);
  if (!band) return false;

  return (
    chargeableIncome >= band.minIncome &&
    (band.maxIncome === null || chargeableIncome <= band.maxIncome)
  );
}
