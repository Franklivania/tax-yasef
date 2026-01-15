import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { formatCurrency, formatPercentage } from "@/lib/tax-calculator";
import type { BandBreakdown } from "@/lib/types/tax";

type Props = Readonly<{
  bands: readonly BandBreakdown[];
}>;

export function BandBreakdownAccordion({ bands }: Props) {
  return (
    <Accordion type="single" collapsible className="w-full">
      {bands.map((b) => (
        <AccordionItem key={b.band} value={`band-${b.band}`}>
          <AccordionTrigger>
            <div className="flex w-full items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">
                  Band {b.band}: {b.incomeRange}
                </p>
                <p className="text-xs text-muted-foreground">
                  Rate: {formatPercentage(b.rate * 100, 0)}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs text-muted-foreground">Tax due</p>
                <p className="text-sm font-semibold">
                  {formatCurrency(b.taxDue)}
                </p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">Taxable in band</span>
                <span className="font-medium">
                  {formatCurrency(b.taxableAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">Calculation</span>
                <span className="font-mono text-xs">{b.calculation}</span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
