import { DashboardLayout } from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, ArrowRight, CheckCircle2, LineChart, RefreshCw, Sliders, Zap, Save, History, Trash2, RotateCcw } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface Scenario {
  id: string;
  name: string;
  date: string;
  metrics: {
    ratio: number;
    cod: number;
    prd: number;
  };
}

// Default cost rates per sq ft for construction types (IAAO Marshall & Swift indices)
const DEFAULT_COST_RATES: Record<string, number> = {
  'Residential (Wood Frame)': 142,
  'Residential (Masonry)': 168,
  'Commercial (Office)': 195,
  'Commercial (Retail)': 178,
  'Industrial (Light)': 112,
  'Industrial (Heavy)': 138,
};

function CostCurveEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<any>(null);
  const [rates, setRates] = useState<Record<string, number>>({ ...DEFAULT_COST_RATES });
  const [isDirty, setIsDirty] = useState(false);

  // Build chart data from current rates
  const buildChartData = (currentRates: Record<string, number>) => ({
    labels: Object.keys(currentRates),
    datasets: [
      {
        label: 'Adjusted Rate ($/sq ft)',
        data: Object.values(currentRates),
        backgroundColor: 'rgba(0,255,238,0.15)',
        borderColor: '#00FFEE',
        borderWidth: 2,
        pointBackgroundColor: '#00FFEE',
        pointRadius: 5,
        tension: 0.35,
        fill: true,
      },
      {
        label: 'Baseline Rate ($/sq ft)',
        data: Object.values(DEFAULT_COST_RATES),
        backgroundColor: 'transparent',
        borderColor: 'rgba(255,255,255,0.2)',
        borderWidth: 1,
        borderDash: [4, 4],
        pointRadius: 0,
        tension: 0.35,
        fill: false,
      },
    ],
  });

  useEffect(() => {
    if (!canvasRef.current) return;
    // Lazy-load Chart.js to avoid SSR issues
    import('chart.js').then(({ Chart, CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend }) => {
      Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);
      if (chartRef.current) chartRef.current.destroy();
      chartRef.current = new Chart(canvasRef.current!, {
        type: 'line',
        data: buildChartData(rates),
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: '#94a3b8', font: { size: 11 } } },
            tooltip: { callbacks: { label: (ctx) => ` $${ctx.parsed.y}/sq ft` } },
          },
          scales: {
            x: { ticks: { color: '#64748b', maxRotation: 30 }, grid: { color: 'rgba(255,255,255,0.05)' } },
            y: {
              ticks: { color: '#64748b', callback: (v) => `$${v}` },
              grid: { color: 'rgba(255,255,255,0.05)' },
              min: 80, max: 260,
            },
          },
        },
      });
    });
    return () => { chartRef.current?.destroy(); };
  }, []);

  // Update chart when rates change
  useEffect(() => {
    if (!chartRef.current) return;
    chartRef.current.data = buildChartData(rates);
    chartRef.current.update('active');
  }, [rates]);

  const handleRateChange = (key: string, value: number[]) => {
    setRates(prev => ({ ...prev, [key]: value[0] }));
    setIsDirty(true);
  };

  const handleReset = () => {
    setRates({ ...DEFAULT_COST_RATES });
    setIsDirty(false);
    toast.info('Cost rates reset to IAAO baseline');
  };

  const handleApply = () => {
    setIsDirty(false);
    toast.success('Cost table applied', { description: 'Model will recalibrate on next run.' });
  };

  return (
    <Card className="terra-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Base Cost Calibration</CardTitle>
            <CardDescription>Adjust base rates per sq ft. Chart updates live. Baseline (dashed) = IAAO Marshall &amp; Swift indices.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="border-white/10 text-slate-400 hover:text-white" onClick={handleReset}>
              <RotateCcw className="w-3 h-3 mr-1" /> Reset
            </Button>
            <Button size="sm" className="bg-[#00ffee] text-[#0b1020] font-bold" onClick={handleApply} disabled={!isDirty}>
              Apply Changes
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Live Chart */}
          <div className="h-[260px]">
            <canvas ref={canvasRef} />
          </div>
          {/* Sliders */}
          <div className="space-y-4">
            {Object.entries(rates).map(([key, value]) => (
              <div key={key} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 truncate max-w-[180px]">{key}</span>
                  <span className="font-mono text-[#00ffee] font-bold">${value}/sqft</span>
                </div>
                <Slider
                  min={80}
                  max={260}
                  step={1}
                  value={[value]}
                  onValueChange={(v) => handleRateChange(key, v)}
                  className="[&_[role=slider]]:bg-[#00ffee] [&_[role=slider]]:border-[#00ffee]"
                />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CalibrationStudio() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [newScenarioName, setNewScenarioName] = useState("");
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);

  // Load scenarios from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('terra_scenarios');
    if (saved) {
      setScenarios(JSON.parse(saved));
    }
  }, []);

  const saveScenario = () => {
    if (!newScenarioName) return;

    const newScenario: Scenario = {
      id: Date.now().toString(),
      name: newScenarioName,
      date: new Date().toLocaleDateString(),
      metrics: {
        ratio: 0.96,
        cod: 8.4,
        prd: 1.01
      }
    };

    const updated = [...scenarios, newScenario];
    setScenarios(updated);
    localStorage.setItem('terra_scenarios', JSON.stringify(updated));
    setNewScenarioName("");
    setIsSaveDialogOpen(false);
    toast.success("Scenario Saved", {
      description: `"${newScenario.name}" has been stored in the local simulation matrix.`
    });
  };

  const deleteScenario = (id: string) => {
    const updated = scenarios.filter(s => s.id !== id);
    setScenarios(updated);
    localStorage.setItem('terra_scenarios', JSON.stringify(updated));
    toast.info("Scenario Deleted");
  };

  const loadScenario = (scenario: Scenario) => {
    toast.success("Scenario Loaded", {
      description: `System recalibrated to "${scenario.name}" parameters.`
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <Sliders className="w-8 h-8 text-[#00ffee]" />
              Calibration Studio
            </h1>
            <p className="text-slate-400 mt-1">
              The "Truth" Engine. Tune the math to the market with auto-harmonization.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-[#00ffee]/30 text-[#00ffee] hover:bg-[#00ffee]/10">
                  <Save className="w-4 h-4 mr-2" />
                  Save Scenario
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#0b1020] border-[#00ffee]/30">
                <DialogHeader>
                  <DialogTitle className="text-[#00ffee]">Save Calibration Scenario</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Scenario Name</Label>
                    <Input 
                      placeholder="e.g., Aggressive 2026 Reval" 
                      className="bg-white/5 border-white/10 text-white"
                      value={newScenarioName}
                      onChange={(e) => setNewScenarioName(e.target.value)}
                    />
                  </div>
                  <Button className="w-full bg-[#00ffee] text-[#0b1020] font-bold" onClick={saveScenario}>
                    Confirm Save
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button className="bg-[#00ffee] text-[#0b1020] hover:bg-[#00ffee]/90 font-bold active-recoil">
              <RefreshCw className="w-4 h-4 mr-2" />
              Run Auto-Harmonization
            </Button>
          </div>
        </div>

        {/* Drift Alerts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 terra-card border-l-4 border-l-amber-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-500">
                <AlertTriangle className="w-5 h-5" />
                Market Drift Detected
              </CardTitle>
              <CardDescription>
                The AI Agent has identified 3 neighborhoods where assessed values are drifting from market sales.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { name: "Neighborhood 4 (Richland)", ratio: 0.88, drift: "-12%", recommendation: "+2% Land Factor" },
                { name: "Sector 7G (Industrial)", ratio: 0.91, drift: "-9%", recommendation: "+5% Cost Table" },
                { name: "Riverfront Estates", ratio: 1.08, drift: "+8%", recommendation: "-3% Quality Adj" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                  <div>
                    <h4 className="font-medium text-white">{item.name}</h4>
                    <div className="flex items-center gap-4 mt-1 text-sm text-slate-400">
                      <span className="flex items-center gap-1">
                        <LineChart className="w-3 h-3" /> Ratio: <span className={item.ratio < 0.9 ? "text-red-400" : "text-green-400"}>{item.ratio}</span>
                      </span>
                      <span>Drift: {item.drift}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <span className="text-xs text-slate-500 uppercase tracking-wider">AI Recommendation</span>
                      <p className="text-[#00ffee] font-mono font-bold">{item.recommendation}</p>
                    </div>
                    <Button size="sm" variant="outline" className="border-[#00ffee]/30 text-[#00ffee] hover:bg-[#00ffee]/10 active-recoil">
                      Review
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Calibration Health */}
          <Card className="terra-card">
            <CardHeader>
              <CardTitle className="text-[#00ffee]">System Calibration</CardTitle>
              <CardDescription>Overall model accuracy metrics.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Median Sales Ratio</span>
                  <span className="text-white font-mono">0.96</span>
                </div>
                <Progress value={96} className="h-2 bg-white/10 [&>div]:bg-green-500" />
                <p className="text-xs text-green-500 flex items-center">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Within target (0.90 - 1.10)
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">COD (Uniformity)</span>
                  <span className="text-white font-mono">8.4%</span>
                </div>
                <Progress value={84} className="h-2 bg-white/10 [&>div]:bg-[#00ffee]" />
                <p className="text-xs text-[#00ffee] flex items-center">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Excellent (&lt; 10%)
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">PRD (Vertical Equity)</span>
                  <span className="text-white font-mono">1.01</span>
                </div>
                <Progress value={99} className="h-2 bg-white/10 [&>div]:bg-purple-500" />
                <p className="text-xs text-purple-500 flex items-center">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Perfect Balance (0.98 - 1.03)
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Scenarios & Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Saved Scenarios List */}
          <Card className="terra-card lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <History className="w-5 h-5 text-purple-400" />
                Saved Scenarios
              </CardTitle>
              <CardDescription>Load past calibration states.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {scenarios.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  No scenarios saved yet.
                </div>
              ) : (
                scenarios.map((scenario) => (
                  <div key={scenario.id} className="p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all group">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-[#00ffee]">{scenario.name}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 text-slate-500 hover:text-red-400"
                        onClick={(e) => { e.stopPropagation(); deleteScenario(scenario.id); }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="flex justify-between text-xs text-slate-400 mb-3">
                      <span>{scenario.date}</span>
                      <span className="font-mono">Ratio: {scenario.metrics.ratio}</span>
                    </div>
                    <Button 
                      size="sm" 
                      className="w-full bg-white/5 hover:bg-[#00ffee]/20 text-white hover:text-[#00ffee] border border-white/10"
                      onClick={() => loadScenario(scenario)}
                    >
                      Load Scenario
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Calibration Controls */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="cost" className="w-full">
              <TabsList className="bg-white/5 border border-white/10 p-1 w-full justify-start">
                <TabsTrigger value="cost">Cost Tables</TabsTrigger>
                <TabsTrigger value="land">Land Models</TabsTrigger>
                <TabsTrigger value="depreciation">Depreciation</TabsTrigger>
                <TabsTrigger value="modifiers">Neighborhood Modifiers</TabsTrigger>
              </TabsList>
              <TabsContent value="cost" className="mt-6">
                <CostCurveEditor />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
