import { formatCurrency } from "@/lib/tax-calculator";
import type { MonthlySavingsRow } from "@/lib/types/calculator-breakdown";

type Props = Readonly<{
  title: string;
  rows: readonly MonthlySavingsRow[];
}>;

export function MonthlySavingsTable({ title, rows }: Props) {
  if (rows.length === 0) return null;

  return (
    <div className="w-full">
      <p className="text-sm font-semibold mb-2">{title}</p>
      <div className="w-full overflow-x-auto fancy-scrollbar">
        <table className="w-full min-w-[520px] border-collapse text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 pr-2 font-semibold">Month</th>
              <th className="text-right py-2 px-2 font-semibold">Save</th>
              <th className="text-right py-2 pl-2 font-semibold">Cumulative</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={`${r.monthIndex}-${r.monthName}`}
                className="border-b last:border-b-0"
              >
                <td className="py-2 pr-2">{r.monthName}</td>
                <td className="py-2 px-2 text-right font-medium">
                  {formatCurrency(r.amount)}
                </td>
                <td className="py-2 pl-2 text-right text-muted-foreground">
                  {formatCurrency(r.cumulative)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        This is a simple monthly “set-aside” plan based on your annual payable
        amount.
      </p>
    </div>
  );
}
