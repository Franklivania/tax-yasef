import { formatCurrency } from "@/lib/tax-calculator";
import type { AppliedCredit, AppliedDeduction } from "../types";

type Props = Readonly<{
  deductions: readonly AppliedDeduction[];
  credits?: readonly AppliedCredit[];
}>;

export function AppliedDeductions({ deductions, credits }: Props) {
  if (deductions.length === 0 && (!credits || credits.length === 0))
    return null;

  return (
    <div className="flex flex-col gap-3">
      {deductions.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold">Deductions</p>
          <div className="flex flex-col gap-2">
            {deductions.map((d) => (
              <div key={d.key} className="rounded-md border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{d.label}</p>
                    {d.reason ? (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {d.reason}
                      </p>
                    ) : null}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-muted-foreground">Deductible</p>
                    <p className="text-sm font-semibold">
                      {formatCurrency(d.deductibleAmount)}
                    </p>
                    {d.enteredAmount !== d.deductibleAmount ? (
                      <p className="text-xs text-muted-foreground">
                        Entered: {formatCurrency(d.enteredAmount)}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {credits && credits.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold">Credits</p>
          <div className="flex flex-col gap-2">
            {credits.map((c) => (
              <div key={c.key} className="rounded-md border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{c.label}</p>
                    {c.reason ? (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {c.reason}
                      </p>
                    ) : null}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-muted-foreground">Applied</p>
                    <p className="text-sm font-semibold">
                      {formatCurrency(c.appliedAmount)}
                    </p>
                    {c.enteredAmount !== c.appliedAmount ? (
                      <p className="text-xs text-muted-foreground">
                        Entered: {formatCurrency(c.enteredAmount)}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
