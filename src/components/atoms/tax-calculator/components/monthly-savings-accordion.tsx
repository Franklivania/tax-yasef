import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { MonthlySavingsRow } from "@/lib/types/calculator-breakdown";
import { MonthlySavingsTable } from "./monthly-savings-table";

type Props = Readonly<{
  /**
   * Text shown on the closed accordion trigger.
   */
  triggerLabel?: string;
  /**
   * Title shown inside the table content (kept for clarity once expanded).
   */
  tableTitle: string;
  rows: readonly MonthlySavingsRow[];
}>;

export function MonthlySavingsAccordion({
  triggerLabel = "Monthly savings plan",
  tableTitle,
  rows,
}: Props) {
  if (!rows.length) return null;

  return (
    <Card>
      <CardContent className="pt-0">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="monthly-savings">
            <AccordionTrigger className="py-3">{triggerLabel}</AccordionTrigger>
            <AccordionContent className="pt-2">
              <MonthlySavingsTable title={tableTitle} rows={rows} />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
