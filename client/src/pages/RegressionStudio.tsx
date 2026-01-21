import { DashboardLayout } from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { multipleRegression, generateDiagnosticPlots, calculateCorrelationMatrix, type RegressionResult } from "@/lib/regression";
import { Activity, AlertCircle, BarChart3, CheckCircle2, TrendingUp, Save, FolderOpen, Download, Trash2, FileText } from "lucide-react";
import { exportRegressionToPDF } from "@/lib/pdfExport";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, LineChart, ReferenceLine } from "recharts";

export default function RegressionStudio() {
  const [selectedVariables, setSelectedVariables] = useState<string[]>(["squareFeet", "yearBuilt"]);
  const [regressionResult, setRegressionResult] = useState<RegressionResult | null>(null);
  const [diagnosticPlots, setDiagnosticPlots] = useState<any>(null);
  const [correlationMatrix, setCorrelationMatrix] = useState<{ variables: string[]; matrix: number[][] } | null>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [modelName, setModelName] = useState("");
  const [modelDescription, setModelDescription] = useState("");
  
  // Toast notifications handled via alerts for now
  const saveModelMutation = trpc.regressionModels.save.useMutation();
  const { data: savedModels, refetch: refetchModels } = trpc.regressionModels.list.useQuery();
  const deleteModelMutation = trpc.regressionModels.delete.useMutation();

  // Mock data for demonstration
  const mockData = {
    totalValue: [450000, 520000, 380000, 610000, 490000, 550000, 420000, 580000, 470000, 530000,
      460000, 510000, 490000, 540000, 480000, 520000, 500000, 560000, 490000, 530000],
    squareFeet: [2000, 2400, 1800, 2800, 2200, 2600, 1900, 2700, 2100, 2500,
      2050, 2450, 2200, 2550, 2150, 2400, 2250, 2650, 2200, 2500],
    yearBuilt: [2010, 2015, 2005, 2018, 2012, 2016, 2008, 2017, 2011, 2014,
      2009, 2013, 2011, 2015, 2010, 2014, 2012, 2016, 2011, 2014],
    landValue: [150000, 180000, 120000, 210000, 160000, 190000, 130000, 200000, 155000, 185000,
      145000, 175000, 160000, 188000, 152000, 178000, 165000, 195000, 158000, 182000],
    neighborhood: [1, 2, 1, 3, 2, 3, 1, 3, 2, 2, 1, 2, 2, 3, 1, 2, 2, 3, 2, 2]
  };

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
    if (selectedVariables.length === 0) return;

    const X: { [key: string]: number[] } = {};
    selectedVariables.forEach(varName => {
      X[varName] = mockData[varName as keyof typeof mockData] as number[];
    });

    const result = multipleRegression(mockData.totalValue, X);
    setRegressionResult(result);
    setDiagnosticPlots(generateDiagnosticPlots(result));
    
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
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
            <Activity className="w-3 h-3 mr-1" />
            Statistical Engine
          </Badge>
        </div>

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
                          alert('Model saved successfully!');
                          refetchModels();
                        },
                        onError: (error) => {
                          alert(`Failed to save model: ${error.message}`);
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
                        alert('PDF report generated successfully!');
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

                {/* Diagnostic Plots */}
                {diagnosticPlots && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Residuals vs Fitted */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Residuals vs Fitted</CardTitle>
                        <CardDescription className="text-xs">Check for non-linearity and heteroscedasticity</CardDescription>
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
                              name="Residuals"
                              stroke="#888"
                              tick={{ fill: '#888', fontSize: 11 }}
                            />
                            <Tooltip
                              contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                              labelStyle={{ color: '#fff' }}
                            />
                            <ReferenceLine y={0} stroke="#00ffee" strokeDasharray="3 3" />
                            <Scatter data={diagnosticPlots.residualsVsFitted} fill="#00ffee" fillOpacity={0.6} />
                          </ScatterChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

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

                    {/* Residuals vs Leverage */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Residuals vs Leverage</CardTitle>
                        <CardDescription className="text-xs">Identify influential observations</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                          <ScatterChart>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                            <XAxis
                              dataKey="x"
                              type="number"
                              name="Leverage"
                              stroke="#888"
                              tick={{ fill: '#888', fontSize: 11 }}
                            />
                            <YAxis
                              dataKey="y"
                              type="number"
                              name="Std. Residuals"
                              stroke="#888"
                              tick={{ fill: '#888', fontSize: 11 }}
                            />
                            <Tooltip
                              contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                              labelStyle={{ color: '#fff' }}
                            />
                            <Scatter data={diagnosticPlots.residualsVsLeverage} fill="#00ffee" fillOpacity={0.6} />
                          </ScatterChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Correlation Matrix Heatmap */}
                {correlationMatrix && (
                  <Card className="col-span-full">
                    <CardHeader>
                      <CardTitle>Correlation Matrix</CardTitle>
                      <CardDescription>Pearson correlation coefficients between variables</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr>
                              <th className="border border-white/10 p-2"></th>
                              {correlationMatrix.variables.map((varName) => (
                                <th key={varName} className="border border-white/10 p-2 text-sm font-medium">
                                  {availableVariables.find(v => v.name === varName)?.label || varName}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {correlationMatrix.variables.map((rowVar, i) => (
                              <tr key={rowVar}>
                                <td className="border border-white/10 p-2 text-sm font-medium">
                                  {availableVariables.find(v => v.name === rowVar)?.label || rowVar}
                                </td>
                                {correlationMatrix.variables.map((colVar, j) => {
                                  const corr = correlationMatrix.matrix[i][j];
                                  const absCorr = Math.abs(corr);
                                  
                                  // Color intensity based on correlation strength
                                  const getColor = (value: number) => {
                                    if (value > 0) {
                                      // Positive correlation: cyan
                                      const intensity = Math.round(value * 255);
                                      return `rgba(0, 255, 238, ${value * 0.8})`;
                                    } else {
                                      // Negative correlation: red
                                      const intensity = Math.round(Math.abs(value) * 255);
                                      return `rgba(255, 100, 100, ${Math.abs(value) * 0.8})`;
                                    }
                                  };

                                  return (
                                    <td
                                      key={colVar}
                                      className="border border-white/10 p-2 text-center font-mono text-sm"
                                      style={{ backgroundColor: getColor(corr) }}
                                    >
                                      {corr.toFixed(3)}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="mt-4 flex items-center gap-6 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(0, 255, 238, 0.8)' }}></div>
                          <span>Positive correlation</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(255, 100, 100, 0.8)' }}></div>
                          <span>Negative correlation</span>
                        </div>
                        <p>|r| &gt; 0.7 indicates strong correlation</p>
                      </div>
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
