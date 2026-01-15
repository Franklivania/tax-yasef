import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { groqService } from "@/lib/services/groq";

type Props = Readonly<{
  title: string;
  promptContext: string;
}>;

export function GenericAiSummaryCard({ title, promptContext }: Props) {
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState<string>("");
  const lastPromptRef = useRef<string>("");
  const requestIdRef = useRef(0);

  const trimmed = promptContext.trim();
  const hasPrompt = Boolean(trimmed);
  const displayLoading = hasPrompt ? loading : false;
  const displayText = hasPrompt ? text : "";

  useEffect(() => {
    if (!trimmed) {
      // Avoid synchronous setState in effects; UI derives empty state from `hasPrompt`.
      // Also invalidate any in-flight async callbacks.
      requestIdRef.current += 1;
      lastPromptRef.current = "";
      return;
    }

    if (lastPromptRef.current === trimmed) return;
    lastPromptRef.current = trimmed;

    const currentRequestId = (requestIdRef.current += 1);
    const t = setTimeout(() => {
      // Note: this runs outside the effect body to satisfy `react-hooks/set-state-in-effect`.
      setLoading(true);
      const prompt = `You are a tax assistant. Provide a brief, clear explanation (2-3 sentences max) of this tax calculation. Be professional and concise.\n\n${trimmed}`;
      groqService
        .createCompletion(prompt)
        .then((res) => {
          if (requestIdRef.current !== currentRequestId) return;
          setText(res || "AI summary unavailable right now.");
        })
        .catch(() => {
          if (requestIdRef.current !== currentRequestId) return;
          setText("AI summary unavailable right now.");
        })
        .finally(() => {
          if (requestIdRef.current !== currentRequestId) return;
          setLoading(false);
        });
    }, 600);

    return () => clearTimeout(t);
  }, [trimmed]);

  return (
    <Card className="h-fit">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border bg-muted/30 p-3">
          {displayLoading ? (
            <p className="text-sm text-muted-foreground">Generating summary…</p>
          ) : displayText ? (
            <p className="text-sm leading-relaxed">{displayText}</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Enter values to see a short explanation of your tax calculation.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
