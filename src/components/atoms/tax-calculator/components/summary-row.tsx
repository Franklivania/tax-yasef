import { formatCurrency } from "@/lib/tax-calculator";

type Props = Readonly<{
  label: string;
  value: number;
  valueClassName?: string;
}>;

export function SummaryRow({ label, value, valueClassName }: Props) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={valueClassName ?? "font-medium"}>
        {formatCurrency(value)}
      </span>
    </div>
  );
}
