import { DashboardLayout } from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, ArrowRight, BarChart3, Calculator, Database, Layers, RefreshCw, Save, Settings2, TrendingUp } from "lucide-react";
import { useState } from "react";

export default function CostMatrix() {
  const [baseRate, setBaseRate] = useState(145.50);
  const [marketFactor, setMarketFactor] = useState(1.05);
  const [editMode, setEditMode] = useState<string | null>(null);
  const [matrixData, setMatrixData] = useState([
    { code: "RES-101", desc: "Single Family - Ranch", quality: "Q3 - Average", base: 142.00, trend: "+2.1%" },
    { code: "RES-102", desc: "Single Family - 2 Story", quality: "Q3 - Average", base: 138.50, trend: "+1.8%" },
    { code: "RES-103", desc: "Single Family - Custom", quality: "Q4 - Good", base: 185.00, trend: "+3.5%" },
    { code: "RES-104", desc: "Single Family - Luxury", quality: "Q5 - Excellent", base: 245.00, trend: "+4.2%" },
    { code: "RES-201", desc: "Duplex / Triplex", quality: "Q3 - Average", base: 125.00, trend: "+1.5%" },
    { code: "RES-301", desc: "Townhouse - End Unit", quality: "Q3 - Average", base: 135.00, trend: "+2.0%" },
  ]);

  const handleBaseRateChange = (code: string, newValue: number) => {
    setMatrixData(prev => prev.map(row => 
      row.code === code ? { ...row, base: newValue } : row
    ));
  };

  // Simulated impact calculation
  const totalValuation = 42500000000; // $42.5B
  const projectedImpact = (baseRate * marketFactor * 1000000).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                Engine: construction_cost_engine.py
              </Badge>
              <Badge variant="outline" className="bg-sidebar-primary/10 text-sidebar-primary border-sidebar-primary/20">
                Status: CALIBRATED
              </Badge>
            </div>
            <h1 className="h1 text-gradient-primary mb-2">
              Master Cost Matrix
            </h1>
            <p className="body-text max-w-2xl">
              The quantum heart of the valuation system. Calibrate base rates, adjust market modifiers, and simulate county-wide impacts in real-time.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Reset to 2025 Baseline
            </Button>
            <Button className="bg-primary text-primary-foreground gap-2 shadow-lg shadow-primary/20">
              <Save className="w-4 h-4" />
              Commit to Production
            </Button>
          </div>
        </div>

        {/* Simulation Control Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 terra-card bg-gradient-to-br from-[rgba(10,14,26,0.8)] to-[rgba(0,255,255,0.05)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#00FFFF]">
                <Settings2 className="w-5 h-5" />
                Calibration Controls
              </CardTitle>
              <CardDescription className="text-slate-400">Adjust global factors to see immediate impact on the Master Cost Index.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Base Rate Slider */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">Base Residential Rate ($/sq.ft)</label>
                  <div className="flex items-center gap-2">
                    <Input 
                      type="number" 
                      value={baseRate} 
                      onChange={(e) => setBaseRate(Number(e.target.value))}
                      className="w-24 text-right font-mono font-bold" 
                    />
                    <span className="text-muted-foreground text-sm">USD</span>
                  </div>
                </div>
                <Slider 
                  value={[baseRate]} 
                  min={100} 
                  max={200} 
                  step={0.5} 
                  onValueChange={(v) => setBaseRate(v[0])}
                  className="py-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Conservative ($100)</span>
                  <span>Aggressive ($200)</span>
                </div>
              </div>

              {/* Market Factor Slider */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">Market Condition Factor (MCM)</label>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="font-mono text-lg">
                      {marketFactor.toFixed(3)}x
                    </Badge>
                  </div>
                </div>
                <Slider 
                  value={[marketFactor]} 
                  min={0.8} 
                  max={1.5} 
                  step={0.01} 
                  onValueChange={(v) => setMarketFactor(v[0])}
                  className="py-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Depressed (0.8x)</span>
                  <span>Overheated (1.5x)</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Real-time Impact Card */}
          <Card className="terra-card bg-[rgba(0,255,255,0.05)] border-[rgba(0,255,255,0.2)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#00FFFF]">
                <Activity className="w-5 h-5" />
                Projected Impact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400 mb-1">Total Assessed Value (Simulated)</p>
                <div className="text-3xl font-light tracking-tight font-mono text-white">
                  ${(totalValuation * (baseRate / 145.5) * marketFactor).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </div>
                <div className="flex items-center gap-2 mt-2 text-sm text-[#00FF88]">
                  <TrendingUp className="w-4 h-4" />
                  <span>+{((((baseRate / 145.5) * marketFactor) - 1) * 100).toFixed(2)}% vs Baseline</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-sidebar-foreground/70">Confidence Interval</span>
                  <span className="text-sidebar-primary font-bold">99.2%</span>
                </div>
                <Progress value={99.2} className="h-1 bg-sidebar-foreground/10" />
              </div>

              <div className="pt-4 border-t border-[rgba(0,255,255,0.1)]">
                <Button className="w-full btn-terra-primary">
                  Run Deep Simulation
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Matrix Data Tabs */}
        <Tabs defaultValue="residential" className="w-full">
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="residential">Residential</TabsTrigger>
              <TabsTrigger value="commercial">Commercial</TabsTrigger>
              <TabsTrigger value="industrial">Industrial</TabsTrigger>
              <TabsTrigger value="agricultural">Agricultural</TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2">
              <Input placeholder="Search matrix codes..." className="w-64" />
              <Button variant="outline" size="icon">
                <Database className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <TabsContent value="residential" className="space-y-4">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Code</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Quality Class</TableHead>
                      <TableHead className="text-right">Base Rate</TableHead>
                      <TableHead className="text-right">Adj. Rate</TableHead>
                      <TableHead className="text-right">Trend</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {matrixData.map((row) => (
                      <TableRow key={row.code}>
                        <TableCell className="font-mono font-medium">{row.code}</TableCell>
                        <TableCell>{row.desc}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{row.quality}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono text-muted-foreground">
                          {editMode === row.code ? (
                            <Input 
                              type="number" 
                              value={row.base} 
                              onChange={(e) => handleBaseRateChange(row.code, Number(e.target.value))}
                              className="w-24 text-right h-8"
                              autoFocus
                              onBlur={() => setEditMode(null)}
                            />
                          ) : (
                            <span 
                              className="cursor-pointer hover:text-white border-b border-dashed border-transparent hover:border-white/50"
                              onClick={() => setEditMode(row.code)}
                            >
                              ${row.base.toFixed(2)}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-primary">
                          ${(row.base * (baseRate / 145.5) * marketFactor).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right text-green-500 text-xs">
                          {row.trend}
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => setEditMode(editMode === row.code ? null : row.code)}
                          >
                            {editMode === row.code ? <Save className="w-4 h-4 text-green-400" /> : <Settings2 className="w-4 h-4" />}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="commercial">
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                <Layers className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>Commercial matrix data loaded from `backend/valuator-core/src/income_approach.rs`</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
