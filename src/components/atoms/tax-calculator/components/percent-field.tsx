import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = Readonly<{
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  helpText?: string;
}>;

export function PercentField({ id, label, value, onChange, helpText }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        inputMode="decimal"
        placeholder="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-describedby={helpText ? `${id}-help` : undefined}
      />
      {helpText ? (
        <p id={`${id}-help`} className="text-xs text-muted-foreground">
          {helpText}
        </p>
      ) : null}
    </div>
  );
}
