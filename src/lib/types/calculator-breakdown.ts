export type FlatLine = Readonly<{
  label: string;
  value: number;
  format?: "currency" | "percent" | "number";
  note?: string;
  formula?: string;
}>;

export type FlatSection = Readonly<{
  title: string;
  lines: readonly FlatLine[];
}>;

export type MonthlySavingsRow = Readonly<{
  monthIndex: number; // 0-11
  monthName: string;
  amount: number;
  cumulative: number;
}>;
