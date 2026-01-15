import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { History, Info } from "lucide-react";
import { useMemo, useState } from "react";
import useDeviceSize from "@/lib/hooks/useDeviceSize";
import TaxInfoModalManager from "./tax-info-modal-manager";
import type { TaxTabConfig, TaxTabKey } from "./types";
import { isTaxTabKey } from "./types";
import { SelfAssessmentTab } from "./tabs/self-assessment-tab";
import { BusinessTradeTab } from "./tabs/business-trade-tab";
import { WhtCreditTab } from "./tabs/wht-credit-tab";
import { WhtFinalTab } from "./tabs/wht-final-tab";
import { PresumptiveTab } from "./tabs/presumptive-tab";
import { CapitalGainsTab } from "./tabs/capital-gains-tab";
import { VatSelfAccountingTab } from "./tabs/vat-self-accounting-tab";
import { PetroleumSpecialTab } from "./tabs/petroleum-special-tab";
import { CalculationHistoryDialog } from "./components/calculation-history-dialog";

const tabs: readonly TaxTabConfig[] = [
  {
    label: "Self Assessment",
    value: "self-assessment",
    infoMarkdownFile: "self-assessment.md",
  },
  {
    label: "Business/Trade",
    value: "business-trade",
    infoMarkdownFile: "business-trade.md",
  },
  {
    label: "WHT Credit",
    value: "wht-credit",
    infoMarkdownFile: "wht-credit.md",
  },
  { label: "WHT Final", value: "wht-final", infoMarkdownFile: "wht-final.md" },
  {
    label: "Presumptive Tax",
    value: "presumptive",
    infoMarkdownFile: "presumptive.md",
  },
  {
    label: "Capital Gains",
    value: "capital-gains",
    infoMarkdownFile: "capital-gains.md",
  },
  {
    label: "VAT (Self-Accounting)",
    value: "vat-self-accounting",
    infoMarkdownFile: "vat-self-accounting.md",
  },
  {
    label: "Petroleum/Special",
    value: "petroleum-special",
    infoMarkdownFile: "petroleum-special.md",
  },
] as const;

export default function TaxCalculator() {
  const defaultTab: TaxTabKey = "self-assessment";
  const [activeTab, setActiveTab] = useState<TaxTabKey>(defaultTab);
  const [infoOpen, setInfoOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const { isMobile } = useDeviceSize();

  const activeTabLabel = useMemo(
    () => tabs.find((t) => t.value === activeTab)?.label ?? "Tax Calculator",
    [activeTab]
  );

  return (
    <main className="w-full h-full bg-background">
      <section
        role="region"
        aria-label="Tax Calculator"
        className="w-full h-full flex flex-col flex-1 px-4 pb-20 mt-20 gap-6 overflow-y-auto fancy-scrollbar"
      >
        <header className="w-full flex flex-col">
          <h2 className="text-2xl font-bold font-roboto">Tax Calculator</h2>
          <h4 className="text-lg font-medium text-muted-foreground font-roboto">
            {activeTabLabel}
          </h4>
        </header>

        <section role="region" aria-label="Tax Calculator Container">
          <Tabs
            value={activeTab}
            onValueChange={(v) => {
              if (isTaxTabKey(v)) setActiveTab(v);
            }}
          >
            <section className="flex items-center gap-2 justify-between">
              {isMobile ? (
                <Select
                  value={activeTab}
                  onValueChange={(v) => {
                    if (isTaxTabKey(v)) setActiveTab(v);
                  }}
                >
                  <SelectTrigger className="h-10 w-full max-w-[260px]">
                    <SelectValue placeholder={activeTabLabel} />
                  </SelectTrigger>
                  <SelectContent>
                    {tabs.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <TabsList className="flex flex-wrap h-auto">
                  {tabs.map((t) => (
                    <TabsTrigger key={t.value} value={t.value}>
                      {t.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              )}

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setHistoryOpen(true)}
                >
                  <History className="size-4" />
                  History
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setInfoOpen(true)}
                >
                  <Info className="size-4" />
                  Info
                </Button>
              </div>
            </section>

            <div className="mt-6">
              <TabsContent value="self-assessment">
                <SelfAssessmentTab />
              </TabsContent>

              <TabsContent value="business-trade">
                <BusinessTradeTab />
              </TabsContent>

              <TabsContent value="wht-credit">
                <WhtCreditTab />
              </TabsContent>

              <TabsContent value="wht-final">
                <WhtFinalTab />
              </TabsContent>

              <TabsContent value="presumptive">
                <PresumptiveTab />
              </TabsContent>

              <TabsContent value="capital-gains">
                <CapitalGainsTab />
              </TabsContent>

              <TabsContent value="vat-self-accounting">
                <VatSelfAccountingTab />
              </TabsContent>

              <TabsContent value="petroleum-special">
                <PetroleumSpecialTab />
              </TabsContent>
            </div>

            <TaxInfoModalManager
              open={infoOpen}
              onOpenChange={setInfoOpen}
              activeTab={activeTab}
              tabs={tabs}
            />

            <CalculationHistoryDialog
              open={historyOpen}
              onOpenChange={setHistoryOpen}
            />
          </Tabs>
        </section>
      </section>
    </main>
  );
}
