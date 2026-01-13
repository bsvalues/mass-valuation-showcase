import { DashboardLayout } from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGlobalSimulation } from "@/contexts/GlobalSimulationContext";
import { Box, Calculator, LineChart, RefreshCw, Sigma, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import * as ss from 'simple-statistics';

export default function ModelsAlgorithms() {
  const { realData, hasRealData } = useGlobalSimulation();
  const [independentVar, setIndependentVar] = useState("total_sqft");
  const [dependentVar, setDependentVar] = useState("total_value");
  const [regressionResult, setRegressionResult] = useState<{ m: number, b: number, r2: number } | null>(null);

  const runRegression = () => {
    if (!hasRealData) {
      toast.error("No Data Loaded", { description: "Please upload data via 'The Uplink' first." });
      return;
    }

    try {
      const points = realData.map(d => [
        parseFloat(d[independentVar] || 0),
        parseFloat(d[dependentVar] || 0)
      ]).filter(p => !isNaN(p[0]) && !isNaN(p[1]) && p[0] > 0 && p[1] > 0);

      if (points.length < 10) {
        toast.error("Insufficient Data", { description: "Need at least 10 valid data points." });
        return;
      }

      const regression = ss.linearRegression(points);
      const line = ss.linearRegressionLine(regression);
      const r2 = ss.rSquared(points, line);

      setRegressionResult({ m: regression.m, b: regression.b, r2 });
      toast.success("Model Calibrated", { description: `R² = ${r2.toFixed(4)}` });
    } catch (e) {
      toast.error("Calculation Failed", { description: "Check your data types." });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <Box className="w-8 h-8 text-[#00ffee]" />
              Models & Algorithms
            </h1>
            <p className="text-slate-400 mt-1">
              The "Brain". Construct and calibrate valuation formulas using statistical regression.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-[#00ffee]/10 text-[#00ffee] border-[#00ffee]/20 px-3 py-1">
              <Zap className="w-3 h-3 mr-1 animate-pulse" />
              Auto-Modeler Active
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Regression Controls */}
          <Card className="terra-card lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#00ffee]">
                <Calculator className="w-5 h-5" />
                Linear Regression
              </CardTitle>
              <CardDescription>Calculate coefficients from market data.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Independent Variable (X)</Label>
                <Select value={independentVar} onValueChange={setIndependentVar}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select X" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="total_sqft">Total SqFt</SelectItem>
                    <SelectItem value="land_sqft">Land SqFt</SelectItem>
                    <SelectItem value="age">Building Age</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Dependent Variable (Y)</Label>
                <Select value={dependentVar} onValueChange={setDependentVar}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select Y" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="total_value">Total Value</SelectItem>
                    <SelectItem value="land_value">Land Value</SelectItem>
                    <SelectItem value="imp_value">Improvement Value</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                className="w-full bg-[#00ffee] text-[#0b1020] hover:bg-[#00ffee]/90 font-bold active-recoil mt-4"
                onClick={runRegression}
              >
                <Sigma className="w-4 h-4 mr-2" />
                Calculate Formula
              </Button>
            </CardContent>
          </Card>

          {/* Results Display */}
          <Card className="terra-card lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <LineChart className="w-5 h-5 text-purple-400" />
                Model Output
              </CardTitle>
              <CardDescription>Statistical summary and derived formula.</CardDescription>
            </CardHeader>
            <CardContent>
              {regressionResult ? (
                <div className="space-y-6">
                  <div className="p-6 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center justify-center text-center">
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-widest mb-2">Derived Valuation Formula</h3>
                    <div className="text-2xl md:text-4xl font-mono font-bold text-[#00ffee] break-all">
                      Y = {regressionResult.m.toFixed(2)}X {regressionResult.b >= 0 ? '+' : '-'} {Math.abs(regressionResult.b).toFixed(2)}
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      Value = ({regressionResult.m.toFixed(2)} × {independentVar}) {regressionResult.b >= 0 ? '+' : '-'} {Math.abs(regressionResult.b).toFixed(2)}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10 text-center">
                      <div className="text-xs text-slate-400 uppercase">Slope (m)</div>
                      <div className="text-xl font-bold text-white">{regressionResult.m.toFixed(4)}</div>
                    </div>
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10 text-center">
                      <div className="text-xs text-slate-400 uppercase">Intercept (b)</div>
                      <div className="text-xl font-bold text-white">{regressionResult.b.toFixed(2)}</div>
                    </div>
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10 text-center">
                      <div className="text-xs text-slate-400 uppercase">R-Squared</div>
                      <div className={`text-xl font-bold ${regressionResult.r2 > 0.8 ? 'text-green-400' : 'text-amber-400'}`}>
                        {regressionResult.r2.toFixed(4)}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-[300px] flex flex-col items-center justify-center text-slate-500 border border-dashed border-white/10 rounded-lg bg-black/20">
                  <Sigma className="w-12 h-12 mb-4 opacity-20" />
                  <p>Run regression to generate model statistics.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
