import { useTaxCalculationStore } from "../tax-calculator";
import { formatCurrency } from "../tax-calculator";

export function buildCalculationsContext(): string {
  const calculations = useTaxCalculationStore.getState().getAllCalculations();

  if (calculations.length === 0) {
    return "";
  }

  const context = calculations
    .slice(0, 5)
    .map((calc, index) => {
      return `Calculation ${index + 1}:
- Chargeable Income: ${formatCurrency(calc.chargeableIncome)}
- Total Tax: ${formatCurrency(calc.totalTax)}
- Net Income: ${formatCurrency(calc.netIncome)}
- Effective Tax Rate: ${calc.effectiveRate.toFixed(2)}%
- Date: ${new Date(calc.timestamp).toLocaleDateString()}`;
    })
    .join("\n\n");

  return context;
}
