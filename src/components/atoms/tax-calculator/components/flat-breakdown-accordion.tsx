import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { formatCurrency, formatPercentage } from "@/lib/tax-calculator";
import type { FlatLine, FlatSection } from "@/lib/types/calculator-breakdown";

type Props = Readonly<{
  sections: readonly FlatSection[];
}>;

function formatLineValue(line: FlatLine): string {
  if (line.format === "percent") return formatPercentage(line.value, 2);
  if (line.format === "number") return String(line.value);
  return formatCurrency(line.value);
}

export function FlatBreakdownAccordion({ sections }: Props) {
  return (
    <Accordion type="single" collapsible className="w-full">
      {sections.map((s, idx) => (
        <AccordionItem key={`${s.title}-${idx}`} value={`section-${idx}`}>
          <AccordionTrigger>
            <div className="flex w-full items-start justify-between gap-3">
              <p className="text-sm font-semibold">{s.title}</p>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-2">
              {s.lines.map((l, i) => (
                <div key={`${l.label}-${i}`} className="rounded-md border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{l.label}</p>
                      {l.formula ? (
                        <p className="mt-0.5 text-xs font-mono text-muted-foreground">
                          {l.formula}
                        </p>
                      ) : null}
                      {l.note ? (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {l.note}
                        </p>
                      ) : null}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold">
                        {formatLineValue(l)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
