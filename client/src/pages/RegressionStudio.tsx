import { CorrelationMatrixHeatmap } from "@/components/CorrelationMatrixHeatmap";
import { VariableImportanceChart } from "@/components/VariableImportanceChart";
import { ResidualsVsFittedPlot } from "@/components/ResidualsVsFittedPlot";
import { CooksDistancePlot } from "@/components/CooksDistancePlot";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ModelComparisonPanel } from "@/components/ModelComparisonPanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { multipleRegression, generateDiagnosticPlots, calculateCorrelationMatrix, type RegressionResult } from "@/lib/regression";
import { Activity, AlertCircle, BarChart3, BarChart2, CheckCircle2, TrendingUp, Save, FolderOpen, Download, Trash2, FileText, GitCompare, Network } from "lucide-react";
import { exportRegressionToPDF } from "@/lib/pdfExport";
import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, LineChart, ReferenceLine } from "recharts";
import { toast } from "sonner";

export default function RegressionStudio() {
  const [selectedVariables, setSelectedVariables] = useState<string[]>(["squareFeet", "yearBuilt"]);
  const [regressionResult, setRegressionResult] = useState<RegressionResult | null>(null);
  const [diagnosticPlots, setDiagnosticPlots] = useState<any>(null);
  const [correlationMatrix, setCorrelationMatrix] = useState<{ variables: string[]; matrix: number[][] } | null>(null);
  const [regressionX, setRegressionX] = useState<{ [key: string]: number[] } | null>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [modelName, setModelName] = useState("");
  const [modelDescription, setModelDescription] = useState("");
  
  const saveModelMutation = trpc.regressionModels.save.useMutation();
  const { data: savedModels, refetch: refetchModels } = trpc.regressionModels.list.useQuery();
  const deleteModelMutation = trpc.regressionModels.delete.useMutation();
  const autoLoadedRef = useRef(false);

  // Auto-load the most recent saved model on first mount
  useEffect(() => {
    if (autoLoadedRef.current || !savedModels || savedModels.length === 0) return;
    autoLoadedRef.current = true;
    const latest = savedModels[savedModels.length - 1];
    try {
      const vars: string[] = JSON.parse(latest.independentVariables || '[]');
      const coefRaw: Record<string, number> = JSON.parse(latest.coefficients || '{}');
      const { intercept: _intercept, ...coefs } = coefRaw;
      const reconstructed: RegressionResult = {
        coefficients: coefs,
        intercept: _intercept ?? 0,
        rSquared: Number(latest.rSquared ?? 0),
        adjustedRSquared: Number(latest.adjustedRSquared ?? 0),
        fStatistic: Number(latest.fStatistic ?? 0),
        fPValue: Number(latest.fPValue ?? 0),
        // Placeholder arrays — will be recalculated when user re-runs
        residuals: [],
        fitted: [],
        pValues: Object.fromEntries(vars.map(v => [v, 0.05])),
        standardErrors: Object.fromEntries(vars.map(v => [v, 0])),
        tStatistics: Object.fromEntries(vars.map(v => [v, 0])),
        confidenceIntervals: Object.fromEntries(vars.map(v => [v, [0, 0] as [number, number]])),
        vif: Object.fromEntries(vars.map(v => [v, 1])),
        diagnostics: {
          normalityTest: { statistic: 0, pValue: 1 },
          homoscedasticityTest: { statistic: 0, pValue: 1 },
        },
      };
      setSelectedVariables(vars.length > 0 ? vars : ['squareFeet', 'yearBuilt']);
      setRegressionResult(reconstructed);
      toast.info(`Restored last model: ${latest.name}`, { duration: 3000 });
    } catch {
      // silently ignore parse errors
    }
  }, [savedModels]);

  // Real property data from tRPC — use up to 500 records with all required fields
  const { data: allParcels, isLoading: parcelsLoading } = trpc.parcels.list.useQuery();

  // Build regression dataset from real parcels — filter to rows with all required numeric fields
  const regressionData = (() => {
    if (!allParcels || allParcels.length === 0) return null;
    const valid = allParcels
      .filter((p: any) =>
        p.totalValue != null && p.totalValue > 0 &&
        p.squareFeet != null && p.squareFeet > 0 &&
        p.yearBuilt != null && p.yearBuilt > 1800 &&
        p.landValue != null && p.landValue >= 0
      )
      .slice(0, 500); // cap at 500 for regression performance
    if (valid.length < 5) return null;
    // Map neighborhood string to numeric code for regression
    const neighborhoodCodes = Array.from(new Set(valid.map((p: any) => p.neighborhood || 'Unknown')));
    return {
      totalValue: valid.map((p: any) => Number(p.totalValue)),
      squareFeet: valid.map((p: any) => Number(p.squareFeet)),
      yearBuilt: valid.map((p: any) => Number(p.yearBuilt)),
      landValue: valid.map((p: any) => Number(p.landValue)),
      neighborhood: valid.map((p: any) => neighborhoodCodes.indexOf(p.neighborhood || 'Unknown') + 1),
      _count: valid.length,
    };
  })();

  const availableVariables = [
    { name: "squareFeet", label: "Square Feet", description: "Living area in sq ft" },
    { name: "yearBuilt", label: "Year Built", description: "Construction year" },
    { name: "landValue", label: "Land Value", description: "Assessed land value" },
    { name: "neighborhood", label: "Neighborhood", description: "Neighborhood code (1-3)" }
  ];

  const handleVariableToggle = (varName: string) => {
    setSelectedVariables(prev =>
      prev.includes(varName)
        ? prev.filter(v => v !== varName)
        : [...prev, varName]
    );
  };

  const runRegression = () => {
    if (selectedVariables.length === 0 || !regressionData) return;

    const X: { [key: string]: number[] } = {};
    selectedVariables.forEach(varName => {
      X[varName] = regressionData[varName as keyof typeof regressionData] as number[];
    });

    const result = multipleRegression(regressionData.totalValue, X);
    setRegressionResult(result);
    setRegressionX(X);
    setDiagnosticPlots(generateDiagnosticPlots(result, X));
    
    // Calculate correlation matrix for all selected variables
    const corrMatrix = calculateCorrelationMatrix(X);
    setCorrelationMatrix(corrMatrix);
  };

  const formatNumber = (num: number, decimals: number = 4) => {
    return num.toFixed(decimals);
  };

  const formatPValue = (p: number) => {
    if (p < 0.001) return "< 0.001";
    if (p < 0.01) return "< 0.01";
    if (p < 0.05) return "< 0.05";
    return p.toFixed(4);
  };

  const getSignificanceLabel = (p: number) => {
    if (p < 0.001) return "***";
    if (p < 0.01) return "**";
    if (p < 0.05) return "*";
    return "";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Regression Studio</h1>
            <p className="text-muted-foreground">
              Advanced statistical analysis with PhD-level regression tools
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant={compareOpen ? "default" : "outline"}
              size="sm"
              onClick={() => setCompareOpen((v) => !v)}
              disabled={!savedModels || savedModels.length < 2}
              title={!savedModels || savedModels.length < 2 ? "Save at least 2 models to compare" : "Compare top saved models"}
            >
              <GitCompare className="w-4 h-4 mr-2" />
              Compare Models
              {savedModels && savedModels.length >= 2 && (
                <span className="ml-2 text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                  {Math.min(savedModels.length, 3)}
                </span>
              )}
            </Button>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              <Activity className="w-3 h-3 mr-1" />
              Statistical Engine
            </Badge>
          </div>
        </div>

        {/* Model Comparison Panel */}
        {compareOpen && savedModels && (
          <ModelComparisonPanel
            savedModels={savedModels}
            onLoadModel={(model) => {
              setSelectedVariables(model.variables.length > 0 ? model.variables : ["squareFeet", "yearBuilt"]);
              setRegressionResult({
                coefficients: model.coefficients,
                intercept: model.intercept,
                rSquared: model.rSquared,
                adjustedRSquared: model.adjustedRSquared,
                fStatistic: model.fStatistic,
                fPValue: model.fPValue,
                residuals: [],
                fitted: [],
                pValues: Object.fromEntries(model.variables.map((v) => [v, 0.05])),
                standardErrors: Object.fromEntries(model.variables.map((v) => [v, 0])),
                tStatistics: Object.fromEntries(model.variables.map((v) => [v, 0])),
                confidenceIntervals: Object.fromEntries(model.variables.map((v) => [v, [0, 0] as [number, number]])),
                vif: Object.fromEntries(model.variables.map((v) => [v, 1])),
                diagnostics: {
                  normalityTest: { statistic: 0, pValue: 1 },
                  homoscedasticityTest: { statistic: 0, pValue: 1 },
                },
              });
              setCompareOpen(false);
            }}
            onClose={() => setCompareOpen(false)}
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Variable Selection */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Variable Selection</CardTitle>
              <CardDescription>
                Choose independent variables for the regression model
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Dependent Variable</Label>
                <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <span className="font-medium">Total Value</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Target variable (Y)</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label className="text-sm font-medium">Independent Variables</Label>
                {availableVariables.map((variable) => (
                  <div key={variable.name} className="flex items-start space-x-3 p-2 rounded hover:bg-accent/50 transition-colors">
                    <Checkbox
                      id={variable.name}
                      checked={selectedVariables.includes(variable.name)}
                      onCheckedChange={() => handleVariableToggle(variable.name)}
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor={variable.name}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {variable.label}
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        {variable.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                onClick={runRegression}
                disabled={selectedVariables.length === 0}
                className="w-full"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Run Regression Analysis
              </Button>

              {/* Load Saved Model */}
              <Dialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <FolderOpen className="w-4 h-4 mr-2" />
                    Load Saved Model
                    {savedModels && savedModels.length > 0 && (
                      <span className="ml-2 text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                        {savedModels.length}
                      </span>
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Load Saved Model</DialogTitle>
                    <DialogDescription>
                      Select a previously saved regression model to restore its coefficients and variables.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {!savedModels || savedModels.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-6">No saved models yet.</p>
                    ) : (
                      savedModels.slice().reverse().map((model) => {
                        const vars: string[] = (() => { try { return JSON.parse(model.independentVariables || '[]'); } catch { return []; } })();
                        return (
                          <div key={model.id} className="flex items-start justify-between p-3 rounded-lg border border-border hover:bg-accent/30 transition-colors">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{model.name}</p>
                              <p className="text-xs text-muted-foreground">
                                R² = {Number(model.rSquared ?? 0).toFixed(4)} · {vars.join(', ')}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(model.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex gap-2 ml-3">
                              <Button
                                size="sm"
                                onClick={() => {
                                  try {
                                    const coefRaw: Record<string, number> = JSON.parse(model.coefficients || '{}');
                                    const { intercept: _intercept, ...coefs } = coefRaw;
                                    const reconstructed: RegressionResult = {
                                      coefficients: coefs,
                                      intercept: _intercept ?? 0,
                                      rSquared: Number(model.rSquared ?? 0),
                                      adjustedRSquared: Number(model.adjustedRSquared ?? 0),
                                      fStatistic: Number(model.fStatistic ?? 0),
                                      fPValue: Number(model.fPValue ?? 0),
                                      residuals: [], fitted: [],
                                      pValues: Object.fromEntries(vars.map(v => [v, 0.05])),
                                      standardErrors: Object.fromEntries(vars.map(v => [v, 0])),
                                      tStatistics: Object.fromEntries(vars.map(v => [v, 0])),
                                      confidenceIntervals: Object.fromEntries(vars.map(v => [v, [0, 0] as [number, number]])),
                                      vif: Object.fromEntries(vars.map(v => [v, 1])),
                                      diagnostics: { normalityTest: { statistic: 0, pValue: 1 }, homoscedasticityTest: { statistic: 0, pValue: 1 } },
                                    };
                                    setSelectedVariables(vars.length > 0 ? vars : ['squareFeet', 'yearBuilt']);
                                    setRegressionResult(reconstructed);
                                    setLoadDialogOpen(false);
                                    toast.success(`Loaded: ${model.name}`);
                                  } catch {
                                    toast.error('Failed to parse model data');
                                  }
                                }}
                              >
                                Load
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive hover:text-destructive"
                                onClick={() => {
                                  deleteModelMutation.mutate({ id: model.id }, {
                                    onSuccess: () => { refetchModels(); toast.success('Model deleted'); },
                                    onError: (e) => toast.error(e.message),
                                  });
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </DialogContent>
              </Dialog>

              {regressionResult && (
                <div className="space-y-2">
                  <Button
                    onClick={() => {
                      const modelData = {
                        name: `Model_${new Date().toISOString().split('T')[0]}`,
                        description: `Regression model with variables: ${selectedVariables.join(', ')}`,
                        dependentVariable: 'totalValue',
                        independentVariables: selectedVariables,
                        coefficients: regressionResult.coefficients,
                        intercept: regressionResult.intercept,
                        rSquared: regressionResult.rSquared,
                        adjustedRSquared: regressionResult.adjustedRSquared,
                        fStatistic: regressionResult.fStatistic,
                        fPValue: regressionResult.fPValue,
                      };
                      saveModelMutation.mutate(modelData, {
                        onSuccess: () => {
                          toast.success('Model saved successfully!');
                          refetchModels();
                        },
                        onError: (error) => {
                          toast.error('Failed to save model', { description: error.message });
                        },
                      });
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Model
                  </Button>

                  <Button
                    onClick={() => {
                      if (regressionResult) {
                        exportRegressionToPDF({
                          coefficients: regressionResult.coefficients,
                          rSquared: regressionResult.rSquared,
                          adjustedRSquared: regressionResult.adjustedRSquared,
                          fStatistic: regressionResult.fStatistic,
                          pValues: regressionResult.pValues,
                          standardErrors: regressionResult.standardErrors,
                          confidenceIntervals: regressionResult.confidenceIntervals,
                          residualStandardError: Math.sqrt(regressionResult.residuals.reduce((sum, r) => sum + r * r, 0) / regressionResult.residuals.length),
                          observations: regressionResult.residuals.length,
                        });
                        toast.success('PDF report generated successfully!');
                      }
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Export to PDF
                  </Button>
                </div>
              )}

              {selectedVariables.length === 0 && (
                <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5" />
                  <p className="text-xs text-yellow-500">
                    Select at least one independent variable to run the analysis
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results */}
          <div className="lg:col-span-2 space-y-6">
            {!regressionResult ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <BarChart3 className="w-12 h-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground text-center">
                    Select variables and run regression analysis to see results
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Model Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Model Summary</CardTitle>
                    <CardDescription>Overall regression statistics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">R-squared</p>
                        <p className="text-2xl font-bold">{formatNumber(regressionResult.rSquared, 4)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Adj. R-squared</p>
                        <p className="text-2xl font-bold">{formatNumber(regressionResult.adjustedRSquared, 4)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">F-statistic</p>
                        <p className="text-2xl font-bold">{formatNumber(regressionResult.fStatistic, 2)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">F p-value</p>
                        <p className="text-2xl font-bold text-primary">{formatPValue(regressionResult.fPValue)}</p>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        {regressionResult.fPValue < 0.05 ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            <p className="text-sm text-green-500 font-medium">
                              Model is statistically significant (p &lt; 0.05)
                            </p>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-4 h-4 text-yellow-500" />
                            <p className="text-sm text-yellow-500 font-medium">
                              Model may not be statistically significant (p ≥ 0.05)
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Coefficients */}
                <Card>
                  <CardHeader>
                    <CardTitle>Regression Coefficients</CardTitle>
                    <CardDescription>Parameter estimates with significance tests</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-3">Variable</th>
                            <th className="text-right py-2 px-3">Coefficient</th>
                            <th className="text-right py-2 px-3">Std. Error</th>
                            <th className="text-right py-2 px-3">t-statistic</th>
                            <th className="text-right py-2 px-3">p-value</th>
                            <th className="text-right py-2 px-3">95% CI</th>
                            <th className="text-center py-2 px-3">VIF</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b">
                            <td className="py-2 px-3 font-medium">(Intercept)</td>
                            <td className="text-right py-2 px-3 font-mono">{formatNumber(regressionResult.intercept)}</td>
                            <td className="text-right py-2 px-3 text-muted-foreground">—</td>
                            <td className="text-right py-2 px-3 text-muted-foreground">—</td>
                            <td className="text-right py-2 px-3 text-muted-foreground">—</td>
                            <td className="text-right py-2 px-3 text-muted-foreground">—</td>
                            <td className="text-center py-2 px-3 text-muted-foreground">—</td>
                          </tr>
                          {selectedVariables.map((varName) => {
                            const coef = regressionResult.coefficients[varName];
                            const se = regressionResult.standardErrors[varName];
                            const tStat = regressionResult.tStatistics[varName];
                            const pValue = regressionResult.pValues[varName];
                            const ci = regressionResult.confidenceIntervals[varName];
                            const vif = regressionResult.vif[varName];
                            const sig = getSignificanceLabel(pValue);

                            return (
                              <tr key={varName} className="border-b hover:bg-accent/50">
                                <td className="py-2 px-3 font-medium">
                                  {availableVariables.find(v => v.name === varName)?.label}
                                  {sig && <span className="ml-1 text-primary">{sig}</span>}
                                </td>
                                <td className="text-right py-2 px-3 font-mono">{formatNumber(coef)}</td>
                                <td className="text-right py-2 px-3 font-mono text-muted-foreground">{formatNumber(se)}</td>
                                <td className="text-right py-2 px-3 font-mono">{formatNumber(tStat, 2)}</td>
                                <td className="text-right py-2 px-3 font-mono">
                                  <span className={pValue < 0.05 ? "text-primary font-medium" : ""}>
                                    {formatPValue(pValue)}
                                  </span>
                                </td>
                                <td className="text-right py-2 px-3 font-mono text-xs">
                                  [{formatNumber(ci[0], 2)}, {formatNumber(ci[1], 2)}]
                                </td>
                                <td className="text-center py-2 px-3 font-mono">
                                  <span className={vif > 5 ? "text-red-500 font-medium" : vif > 2.5 ? "text-yellow-500" : ""}>
                                    {formatNumber(vif, 2)}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                      <p>Significance codes: *** p &lt; 0.001, ** p &lt; 0.01, * p &lt; 0.05</p>
                      <p>VIF &gt; 5 indicates potential multicollinearity issues</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Diagnostic Tests */}
                <Card>
                  <CardHeader>
                    <CardTitle>Diagnostic Tests</CardTitle>
                    <CardDescription>Assumption validation for regression model</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">Normality Test (Shapiro-Wilk)</h4>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">
                            W-statistic: <span className="font-mono">{formatNumber(regressionResult.diagnostics.normalityTest.statistic)}</span>
                          </p>
                          <p className="text-sm text-muted-foreground">
                            p-value: <span className="font-mono">{formatPValue(regressionResult.diagnostics.normalityTest.pValue)}</span>
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            {regressionResult.diagnostics.normalityTest.pValue > 0.05 ? (
                              <>
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                <p className="text-xs text-green-500">Residuals appear normally distributed</p>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-4 h-4 text-yellow-500" />
                                <p className="text-xs text-yellow-500">Residuals may not be normal</p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">Homoscedasticity Test (Breusch-Pagan)</h4>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">
                            LM-statistic: <span className="font-mono">{formatNumber(regressionResult.diagnostics.homoscedasticityTest.statistic)}</span>
                          </p>
                          <p className="text-sm text-muted-foreground">
                            p-value: <span className="font-mono">{formatPValue(regressionResult.diagnostics.homoscedasticityTest.pValue)}</span>
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            {regressionResult.diagnostics.homoscedasticityTest.pValue > 0.05 ? (
                              <>
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                <p className="text-xs text-green-500">Constant variance assumption met</p>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-4 h-4 text-yellow-500" />
                                <p className="text-xs text-yellow-500">Heteroscedasticity detected</p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Residuals vs Fitted — full diagnostic component */}
                {regressionResult && regressionResult.residuals.length > 0 && (
                  <Card className="border-[#1e2a3a] bg-[#0d1220]">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-[#00FFEE]" />
                            Residuals vs. Fitted
                          </CardTitle>
                          <CardDescription className="text-slate-400">
                            Diagnostic scatter of residuals against predicted values — reveals non-linearity,
                            heteroscedasticity, and influential observations.
                          </CardDescription>
                        </div>
                        <Badge variant="outline" className="border-[#1e2a3a] text-slate-400 text-xs">
                          {regressionResult.residuals.length} observations
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ResidualsVsFittedPlot
                        residuals={regressionResult.residuals}
                        fitted={regressionResult.fitted}
                        diagnostics={regressionResult.diagnostics}
                        n={regressionData?._count}
                        k={selectedVariables.length}
                      />
                    </CardContent>
                  </Card>
                )}

                {/* Remaining Diagnostic Plots (Q-Q, Scale-Location, Residuals vs Leverage) */}
                {diagnosticPlots && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Q-Q Plot */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Normal Q-Q Plot</CardTitle>
                        <CardDescription className="text-xs">Check normality of residuals</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                          <ScatterChart>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                            <XAxis
                              dataKey="x"
                              type="number"
                              name="Theoretical"
                              stroke="#888"
                              tick={{ fill: '#888', fontSize: 11 }}
                            />
                            <YAxis
                              dataKey="y"
                              type="number"
                              name="Sample"
                              stroke="#888"
                              tick={{ fill: '#888', fontSize: 11 }}
                            />
                            <Tooltip
                              contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                              labelStyle={{ color: '#fff' }}
                            />
                            <Scatter data={diagnosticPlots.qqPlot} fill="#00ffee" fillOpacity={0.6} />
                          </ScatterChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* Scale-Location */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Scale-Location</CardTitle>
                        <CardDescription className="text-xs">Check homoscedasticity</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                          <ScatterChart>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                            <XAxis
                              dataKey="x"
                              type="number"
                              name="Fitted"
                              stroke="#888"
                              tick={{ fill: '#888', fontSize: 11 }}
                            />
                            <YAxis
                              dataKey="y"
                              type="number"
                              name="Sqrt Std Residuals"
                              stroke="#888"
                              tick={{ fill: '#888', fontSize: 11 }}
                            />
                            <Tooltip
                              contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                              labelStyle={{ color: '#fff' }}
                            />
                            <Scatter data={diagnosticPlots.scaleLocation} fill="#00ffee" fillOpacity={0.6} />
                          </ScatterChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                  </div>
                )}

                {/* Cook's Distance — full-width influential observation chart */}
                {diagnosticPlots && regressionResult && diagnosticPlots.cooksD && diagnosticPlots.cooksD.length > 0 && (
                  <Card className="col-span-full">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <BarChart2 className="w-4 h-4 text-primary" />
                            Cook's Distance — Influential Observations
                          </CardTitle>
                          <CardDescription>
                            IAAO-standard measure of each observation's influence on the regression coefficients.
                            Bars coloured by influence tier; threshold lines at 4/n and D = 1.0.
                          </CardDescription>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {diagnosticPlots.cooksD.filter((d: number) => d > 1.0).length} strong ·{" "}
                          {diagnosticPlots.cooksD.filter((d: number) => d > 4 / diagnosticPlots.cooksD.length && d <= 1.0).length} moderate
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CooksDistancePlot
                        residuals={regressionResult.residuals}
                        cooksD={diagnosticPlots.cooksD}
                        leverage={diagnosticPlots.leverage}
                        k={selectedVariables.length}
                      />
                    </CardContent>
                  </Card>
                )}

                {/* Correlation Matrix Heatmap */}
                {correlationMatrix && (
                  <Card className="col-span-full">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Network className="w-4 h-4 text-primary" />
                            Correlation Matrix
                          </CardTitle>
                          <CardDescription>
                            Pearson r coefficients — run regression to compute. Hover cells for details.
                          </CardDescription>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {correlationMatrix.variables.length} variables · {correlationMatrix.variables.length * correlationMatrix.variables.length} pairs
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CorrelationMatrixHeatmap
                        variables={correlationMatrix.variables}
                        matrix={correlationMatrix.matrix}
                        labels={Object.fromEntries(
                          availableVariables.map(v => [v.name, v.label])
                        )}
                        vif={regressionResult?.vif}
                      />
                    </CardContent>
                  </Card>
                )}

                {/* Variable Importance Chart */}
                {regressionResult && regressionData && (
                  <Card className="border-[#1e2a3a] bg-[#0d1220]">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <BarChart2 className="w-4 h-4 text-[#00FFEE]" />
                            Variable Importance
                          </CardTitle>
                          <CardDescription className="text-slate-400">
                            Standardized beta coefficients (β*) sorted by absolute magnitude.
                            Bars show each variable's relative contribution to assessed value.
                          </CardDescription>
                        </div>
                        <Badge variant="outline" className="border-[#1e2a3a] text-slate-400 text-xs">
                          {Object.keys(regressionResult.coefficients).length} variables
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <VariableImportanceChart
                        coefficients={regressionResult.coefficients}
                        standardErrors={regressionResult.standardErrors}
                        tStatistics={regressionResult.tStatistics}
                        pValues={regressionResult.pValues}
                        vif={regressionResult.vif}
                        variableData={Object.fromEntries(
                          selectedVariables.map(v => [
                            v,
                            regressionData[v as keyof typeof regressionData] as number[] ?? []
                          ])
                        )}
                        outcomeData={regressionData.totalValue}
                        variableLabels={Object.fromEntries(
                          availableVariables.map(v => [v.name, v.label])
                        )}
                      />
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
