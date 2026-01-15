import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  calculateTaxWithExplanation,
  formatCurrency,
} from "@/lib/tax-calculator";

type Props = Readonly<{
  chargeableIncome: number;
  netTaxPayable?: number;
}>;

export function AiSummaryCard({ chargeableIncome, netTaxPayable }: Props) {
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState<string>("");
  const lastIncomeRef = useRef<number>(-1);
  const requestIdRef = useRef(0);

  const hasIncome = chargeableIncome > 0;
  const displayLoading = hasIncome ? loading : false;
  const displayText = hasIncome ? text : "";

  useEffect(() => {
    if (chargeableIncome <= 0) {
      // Avoid synchronous setState in effects; UI derives empty state from `hasIncome`.
      // Also invalidate any in-flight async callbacks.
      requestIdRef.current += 1;
      lastIncomeRef.current = -1;
      return;
    }

    if (lastIncomeRef.current === chargeableIncome) return;
    lastIncomeRef.current = chargeableIncome;

    const currentRequestId = (requestIdRef.current += 1);
    const t = setTimeout(() => {
      // Note: this runs outside the effect body to satisfy `react-hooks/set-state-in-effect`.
      setLoading(true);
      calculateTaxWithExplanation(chargeableIncome, false)
        .then((res) => {
          if (requestIdRef.current !== currentRequestId) return;
          setText(res.explanation ?? "");
        })
        .catch(() => {
          if (requestIdRef.current !== currentRequestId) return;
          setText("AI summary unavailable right now.");
        })
        .finally(() => {
          if (requestIdRef.current !== currentRequestId) return;
          setLoading(false);
        });
    }, 600);

    return () => clearTimeout(t);
  }, [chargeableIncome]);

  return (
    <Card className="h-fit">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">AI Summary</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-xs text-muted-foreground">Chargeable income</p>
          <p className="text-sm font-semibold">
            {formatCurrency(chargeableIncome)}
          </p>
        </div>
        {typeof netTaxPayable === "number" ? (
          <div className="flex flex-col gap-1">
            <p className="text-xs text-muted-foreground">Net tax payable</p>
            <p className="text-sm font-semibold">
              {formatCurrency(netTaxPayable)}
            </p>
          </div>
        ) : null}

        <div className="rounded-md border bg-muted/30 p-3">
          {displayLoading ? (
            <p className="text-sm text-muted-foreground">Generating summary…</p>
          ) : displayText ? (
            <p className="text-sm leading-relaxed">{displayText}</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Enter values to see a short explanation of your tax breakdown.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
