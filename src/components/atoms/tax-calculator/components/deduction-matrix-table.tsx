import { Check, TriangleAlert, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DEDUCTION_DEFINITIONS,
  DEDUCTION_RELIEF_MATRIX,
} from "../deduction-relief-matrix";
import type { TaxTabConfig, TaxTabKey } from "../types";

type Props = Readonly<{
  tabs: readonly TaxTabConfig[];
  activeTab: TaxTabKey;
}>;

function CellIcon({
  value,
}: {
  value: "allowed" | "not_allowed" | "conditional";
}) {
  if (value === "allowed")
    return <Check className="size-4 text-emerald-500" aria-hidden="true" />;
  if (value === "conditional")
    return (
      <TriangleAlert className="size-4 text-amber-500" aria-hidden="true" />
    );
  return <X className="size-4 text-rose-500" aria-hidden="true" />;
}

export function DeductionMatrixTable({ tabs, activeTab }: Props) {
  return (
    <div className="w-full overflow-x-auto fancy-scrollbar -mx-2 px-2">
      <table className="w-full min-w-[900px] border-collapse text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left font-semibold py-2 pr-4">
              Deduction / Relief Type
            </th>
            {tabs.map((t) => (
              <th
                key={t.value}
                className={cn(
                  "text-center font-semibold py-2 px-2",
                  t.value === activeTab ? "bg-muted/50" : ""
                )}
              >
                {t.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DEDUCTION_DEFINITIONS.map((d) => (
            <tr key={d.key} className="border-b last:border-b-0">
              <td className="py-3 pr-4 align-top">
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium">
                    {d.label}{" "}
                    {d.note ? (
                      <span className="text-muted-foreground">{d.note}</span>
                    ) : null}
                  </span>
                  {d.helpText ? (
                    <span className="text-xs text-muted-foreground">
                      {d.helpText}
                    </span>
                  ) : null}
                </div>
              </td>
              {tabs.map((t) => {
                const cell = DEDUCTION_RELIEF_MATRIX[d.key][t.value];
                return (
                  <td
                    key={`${d.key}-${t.value}`}
                    className={cn(
                      "py-3 px-2 align-top text-center",
                      t.value === activeTab ? "bg-muted/30" : ""
                    )}
                    title={cell.note ?? cell.applicability}
                  >
                    <span className="inline-flex items-center justify-center gap-1">
                      <CellIcon value={cell.applicability} />
                      <span className="sr-only">{cell.applicability}</span>
                    </span>
                    {cell.note ? (
                      <div className="mt-1 text-[11px] text-muted-foreground">
                        {cell.note}
                      </div>
                    ) : null}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
