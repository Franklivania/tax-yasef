import { useState, type FormEvent } from "react";
import { Icon } from "@iconify/react";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import Loader from "../ui/loader";
import {
  calculateTaxWithExplanation,
  formatCurrency,
  formatPercentage,
  validateChargeableIncome,
  useTaxCalculationStore,
  type TaxCalculationWithExplanation,
  type BandBreakdown,
  type MonthlyBreakdown,
} from "@/lib/tax-calculator";
import { parseMarkdown } from "@/lib/markdown-renderer";
import { ArrowLeft } from "lucide-react";

export default function TaxCalculator() {
  const [income, setIncome] = useState<string>("");
  const [result, setResult] = useState<TaxCalculationWithExplanation | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMonthly, setShowMonthly] = useState(false);

  // Format number with commas for display
  const formatInputValue = (value: string): string => {
    // Remove all non-digit characters except decimal point
    const numericValue = value.replace(/[^\d.]/g, "");

    // If empty, return empty string
    if (!numericValue) return "";

    // Split by decimal point if present
    const parts = numericValue.split(".");
    const integerPart = parts[0];
    const decimalPart = parts[1];

    // Format integer part with commas
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    // Combine with decimal part if present
    return decimalPart !== undefined
      ? `${formattedInteger}.${decimalPart}`
      : formattedInteger;
  };

  // Parse formatted value back to number string
  const parseInputValue = (value: string): string => {
    return value.replace(/,/g, "");
  };

  const handleIncomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const parsedValue = parseInputValue(rawValue);

    // Only allow numbers and decimal point
    if (parsedValue === "" || /^\d*\.?\d*$/.test(parsedValue)) {
      setIncome(parsedValue);
    }
  };

  const { addCalculation, clearCalculations, getAllCalculations } =
    useTaxCalculationStore();
  const savedCalculations = getAllCalculations();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    const validation = validateChargeableIncome(income);
    if (!validation.valid || !validation.value) {
      setError(validation.error || "Invalid input");
      return;
    }

    setLoading(true);

    try {
      // Calculate with AI explanation
      const calculation = await calculateTaxWithExplanation(
        validation.value,
        true // Include monthly breakdown
      );

      setResult(calculation);
      addCalculation(calculation);
      setShowMonthly(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to calculate tax. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClearStorage = () => {
    if (confirm("Are you sure you want to clear all saved calculations?")) {
      clearCalculations();
      setResult(null);
      setIncome("");
    }
  };

  return (
    <div
      role="region"
      aria-label="Tax Calculator"
      className="relative w-full h-screen px-5 bg-background border-left border-muted"
    >
      <div className="absolute top-0 left-0 bg-foreground/5 w-full h-full flex flex-col z-0 overflow-y-auto no-scrollbar">
        <header className="w-full flex items-center justify-between px-4 py-6 border-b border-foreground/10 sticky top-0 backdrop-blur-sm z-10">
          <h2 className="text-2xl font-bold font-roboto">Tax Calculator</h2>

          <div className="flex items-center gap-2">
            {savedCalculations.length > 0 && (
              <Button
                variant="outline"
                size="default"
                onClick={handleClearStorage}
                className="flex items-center gap-1 text-destructive hover:text-destructive"
              >
                <Icon
                  icon="material-symbols:delete-outline"
                  className="size-4"
                />
                <span className="text-base font-nunito">Clear History</span>
              </Button>
            )}

            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="default"
                  className="flex items-center gap-1"
                >
                  <Icon
                    icon="material-symbols:info-rounded"
                    className="size-4"
                  />
                  <span className="text-base font-nunito">Info</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>About Tax Calculator</DialogTitle>
                  <DialogDescription>
                    This calculator computes Nigerian Personal Income Tax based
                    on the Tax Act 2025 marginal rate system.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 font-nunito text-sm">
                  <p>
                    The calculator uses a progressive marginal rate system where
                    different portions of your income are taxed at increasing
                    rates.
                  </p>
                  <div className="space-y-2">
                    <p className="font-semibold">Tax Bands:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>₦0 - ₦800,000: 0%</li>
                      <li>₦800,001 - ₦3,000,000: 15%</li>
                      <li>₦3,000,001 - ₦12,000,000: 18%</li>
                      <li>₦12,000,001 - ₦25,000,000: 21%</li>
                      <li>₦25,000,001 - ₦50,000,000: 23%</li>
                      <li>Above ₦50,000,000: 25%</li>
                    </ul>
                  </div>
                  <p className="text-muted-foreground text-xs italic">
                    Calculations are saved locally for your reference.
                  </p>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <section className="w-full h-max flex flex-col flex-1 p-4 mt-4 gap-6 overflow-y-auto no-scrollbar">
          <form onSubmit={handleSubmit} className="w-full grid gap-4">
            <span className="space-y-2">
              <Label htmlFor="annual-income">Annual Chargeable Income</Label>
              <Input
                id="annual-income"
                type="text"
                inputMode="numeric"
                placeholder="e.g 1,000,000"
                className="shadow-none bg-background"
                value={formatInputValue(income)}
                onChange={handleIncomeChange}
                disabled={loading}
              />
              {error && (
                <p className="text-sm text-destructive font-nunito">{error}</p>
              )}
            </span>

            <Button
              type="submit"
              className="w-max justify-self-end"
              disabled={loading || !income}
            >
              {loading ? (
                <>
                  <Loader className="size-4" />
                  <span className="ml-2">Calculating...</span>
                </>
              ) : (
                "Calculate"
              )}
            </Button>
          </form>

          {/* RESULTS */}
          {result && (
            <div className="w-full space-y-4">
              <Tabs
                defaultValue="annual"
                value={showMonthly ? "monthly" : "annual"}
                onValueChange={(value) => setShowMonthly(value === "monthly")}
              >
                <section className="w-full flex items-center justify-between">
                  <TabsList>
                    <TabsTrigger value="annual">Annual View</TabsTrigger>
                    <TabsTrigger value="monthly">Monthly View</TabsTrigger>
                  </TabsList>

                  <Button
                    variant="outline"
                    size="default"
                    className="w-max justify-self-end"
                    onClick={() => {
                      setResult(null);
                      setError(null);
                    }}
                  >
                    <ArrowLeft className="size-4" />
                    Back
                  </Button>
                </section>

                <TabsContent value="annual" className="space-y-4">
                  {/* Summary Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Tax Calculation Summary</CardTitle>
                      <CardDescription>
                        Based on Nigeria Tax Act 2025
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground font-nunito">
                            Chargeable Income
                          </p>
                          <p className="text-2xl font-bold font-roboto">
                            {formatCurrency(result.chargeableIncome)}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground font-nunito">
                            Total Tax Due
                          </p>
                          <p className="text-2xl font-bold font-roboto text-destructive">
                            {formatCurrency(result.totalTax)}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground font-nunito">
                            Net Income After Tax
                          </p>
                          <p className="text-2xl font-bold font-roboto text-green-600 dark:text-green-400">
                            {formatCurrency(result.netIncome)}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground font-nunito">
                            Effective Tax Rate
                          </p>
                          <p className="text-2xl font-bold font-roboto">
                            {formatPercentage(result.effectiveRate)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* AI Explanation */}
                  {result.explanation && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Icon
                            icon="material-symbols:lightbulb-outline"
                            className="size-5"
                          />
                          Explanation
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="prose prose-sm max-w-none font-nunito">
                          {parseMarkdown(result.explanation)}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Breakdown by Bands */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Tax Breakdown by Income Bands</CardTitle>
                      <CardDescription>
                        Marginal rate calculation showing what portion is taxed
                        at each rate
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Accordion type="single" collapsible className="w-full">
                        {result.bands
                          .filter(
                            (band: BandBreakdown) =>
                              band.taxDue > 0 || band.band === 1
                          )
                          .map((band: BandBreakdown) => (
                            <AccordionItem
                              key={band.band}
                              value={`band-${band.band}`}
                            >
                              <AccordionTrigger className="hover:no-underline">
                                <div className="flex items-center justify-between w-full pr-4">
                                  <div className="flex items-center gap-3">
                                    <span className="font-bold font-roboto whitespace-nowrap">
                                      Band {band.band}
                                    </span>
                                    <span className="text-sm text-muted-foreground font-nunito">
                                      {band.incomeRange}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <span className="text-sm font-nunito">
                                      {formatPercentage(band.rate * 100)}%
                                    </span>
                                    <span className="font-semibold font-roboto">
                                      {formatCurrency(band.taxDue)}
                                    </span>
                                  </div>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="space-y-2 pt-2 font-nunito text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                      Taxable Amount:
                                    </span>
                                    <span className="font-semibold">
                                      {formatCurrency(band.taxableAmount)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                      Tax Rate:
                                    </span>
                                    <span className="font-semibold">
                                      {formatPercentage(band.rate * 100)}%
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                      Calculation:
                                    </span>
                                    <span className="font-mono text-xs">
                                      {band.calculation}
                                    </span>
                                  </div>
                                  <div className="flex justify-between pt-2 border-t">
                                    <span className="text-muted-foreground">
                                      Tax Due:
                                    </span>
                                    <span className="font-bold text-destructive">
                                      {formatCurrency(band.taxDue)}
                                    </span>
                                  </div>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                      </Accordion>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="monthly" className="space-y-4">
                  {result.monthlyBreakdown && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Monthly Breakdown</CardTitle>
                        <CardDescription>
                          Estimated monthly values based on annual income
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {result.monthlyBreakdown.map(
                            (month: MonthlyBreakdown) => (
                              <div
                                key={month.month}
                                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border"
                              >
                                <div className="space-y-1">
                                  <p className="font-semibold font-roboto">
                                    {month.monthName}
                                  </p>
                                  <p className="text-sm text-muted-foreground font-nunito">
                                    Income:{" "}
                                    {formatCurrency(month.chargeableIncome)}
                                  </p>
                                </div>
                                <div className="text-right space-y-1">
                                  <p className="text-sm text-destructive font-nunito">
                                    Tax: {formatCurrency(month.tax)}
                                  </p>
                                  <p className="font-semibold text-green-600 dark:text-green-400 font-roboto">
                                    Net: {formatCurrency(month.netIncome)}
                                  </p>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* Saved Calculations History */}
          {savedCalculations.length > 0 && !result && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Calculations</CardTitle>
                <CardDescription>
                  Click to view a previous calculation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {savedCalculations.slice(0, 5).map((calc) => (
                    <Button
                      key={calc.id}
                      variant="outline"
                      className="w-full justify-between"
                      onClick={() => {
                        setResult({
                          ...calc,
                          explanation: undefined,
                          monthlyBreakdown: undefined,
                        });
                        setIncome(calc.chargeableIncome.toString());
                      }}
                    >
                      <span className="font-nunito">
                        {formatCurrency(calc.chargeableIncome)} →{" "}
                        {formatCurrency(calc.totalTax)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(calc.timestamp).toLocaleDateString()}
                      </span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Disclaimer */}
        </section>

        <div className="w-full max-w-[95%] h-max p-4 rounded-xl bg-muted border border-muted mx-auto mt-auto">
          <p className="font-nunito text-sm text-muted-foreground">
            Please be informed that the calculations done here are in regards to
            the Nigeria Tax Act 2025 document as is stipulated in the Act.
            Contents here do not exceed the scope of the Act. For professional
            tax advice, please consult a qualified tax advisor.
          </p>
        </div>
      </div>
    </div>
  );
}
