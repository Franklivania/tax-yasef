import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { parseMarkdown } from "@/lib/markdown-renderer";
import type { TaxTabConfig, TaxTabKey } from "./types";
import { DeductionMatrixTable } from "./components/deduction-matrix-table";

type Props = Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeTab: TaxTabKey;
  tabs: readonly TaxTabConfig[];
}>;

const mdFiles = import.meta.glob("./tax-info/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

function getMarkdownForTab(
  tabs: readonly TaxTabConfig[],
  tab: TaxTabKey
): string {
  const cfg = tabs.find((t) => t.value === tab);
  if (!cfg) return "";
  const key = `./tax-info/${cfg.infoMarkdownFile}`;
  return mdFiles[key] ?? "";
}

export default function TaxInfoModalManager({
  open,
  onOpenChange,
  activeTab,
  tabs,
}: Props) {
  const cfg = useMemo(
    () => tabs.find((t) => t.value === activeTab),
    [activeTab, tabs]
  );
  const md = useMemo(
    () => getMarkdownForTab(tabs, activeTab),
    [activeTab, tabs]
  );
  const nodes = useMemo(() => parseMarkdown(md), [md]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl! max-h-[85vh] fancy-scrollbar overflow-x-hidden">
        <DialogHeader>
          <DialogTitle>{cfg?.label ?? "Info"}</DialogTitle>
        </DialogHeader>

        <section className="w-full overflow-y-auto fancy-scrollbar pr-2">
          <div className="prose prose-invert dark:prose-invert max-w-none">
            {nodes}
          </div>

          <div className="mt-8">
            <h3 className="text-base font-semibold mb-3">
              Deduction & Relief Matrix
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Green = allowed, Amber = conditional, Red = not allowed. The
              active tab column is highlighted.
            </p>
            <DeductionMatrixTable tabs={tabs} activeTab={activeTab} />
          </div>
        </section>
      </DialogContent>
    </Dialog>
  );
}
