import { useTaxCalculationStore } from "../../tax-calculator";
import { formatCurrency } from "../../tax-calculator";
import { useCalculatorHistoryStore } from "@/lib/store/useCalculatorHistoryStore";
import { serializeCalculatorHistoryForChat } from "@/lib/types/calculator-history";

export function buildCalculationsContext(): string {
  const legacyCalculations = useTaxCalculationStore
    .getState()
    .getAllCalculations();
  const history = useCalculatorHistoryStore.getState().getAll();

  const parts: string[] = [];

  const modern = serializeCalculatorHistoryForChat(history, 5);
  if (modern) parts.push(modern);

  if (legacyCalculations.length > 0) {
    const legacy = legacyCalculations
      .slice(0, 3)
      .map((calc, index) => {
        return `Legacy Calculation ${index + 1}:
- Chargeable Income: ${formatCurrency(calc.chargeableIncome)}
- Total Tax: ${formatCurrency(calc.totalTax)}
- Net Income: ${formatCurrency(calc.netIncome)}
- Effective Tax Rate: ${calc.effectiveRate.toFixed(2)}%
- Date: ${new Date(calc.timestamp).toLocaleDateString()}`;
      })
      .join("\n\n");
    parts.push(legacy);
  }

  return parts.join("\n\n");
}
