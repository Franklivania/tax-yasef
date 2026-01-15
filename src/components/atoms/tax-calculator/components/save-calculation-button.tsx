import { Button } from "@/components/ui/button";
import { useNotificationStore } from "@/lib/store/useNotificationStore";
import { useCalculatorHistoryStore } from "@/lib/store/useCalculatorHistoryStore";
import type { CalculatorHistoryEntry } from "@/lib/types/calculator-history";
import { Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Props = Readonly<{
  buildEntry: () => CalculatorHistoryEntry | null;
  disabledReason?: string;
}>;

export function SaveCalculationButton({ buildEntry, disabledReason }: Props) {
  const addEntry = useCalculatorHistoryStore((s) => s.addEntry);
  const addNotification = useNotificationStore((s) => s.addNotification);
  const [justSaved, setJustSaved] = useState(false);
  const timerRef = useRef<number | null>(null);

  const disabled = Boolean(disabledReason);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <Button
      variant="secondary"
      size="sm"
      disabled={disabled || justSaved}
      title={disabledReason}
      className={justSaved ? "opacity-60" : undefined}
      onClick={() => {
        if (justSaved) return;
        const entry = buildEntry();
        if (!entry) {
          addNotification(
            "error",
            "Nothing to save yet. Enter values and try again."
          );
          return;
        }
        addEntry(entry);
        addNotification("success", "Saved to calculation history.");

        setJustSaved(true);
        if (timerRef.current !== null) {
          window.clearTimeout(timerRef.current);
        }
        timerRef.current = window.setTimeout(() => {
          setJustSaved(false);
          timerRef.current = null;
        }, 1500);
      }}
    >
      {justSaved ? (
        <span className="inline-flex items-center gap-2">
          <Check className="size-4" />
          Saved
        </span>
      ) : (
        "Save"
      )}
    </Button>
  );
}
