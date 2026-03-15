import { DashboardLayout } from "@/components/DashboardLayout";
import { VersionHistoryPanel } from "@/components/VersionHistoryPanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle, CheckCircle2, LineChart, RefreshCw, Sliders,
  Save, History, Clock, Database, RotateCcw
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CostRates {
  [key: string]: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_COST_RATES: CostRates = {
  'Residential (Wood Frame)': 142,
  'Residential (Masonry)': 168,
  'Commercial (Office)': 195,
  'Commercial (Retail)': 178,
  'Industrial (Light)': 112,
  'Industrial (Heavy)': 138,
};

// ─── CostCurveEditor ──────────────────────────────────────────────────────────

interface CostCurveEditorProps {
  rates: CostRates;
  onRatesChange: (rates: CostRates) => void;
  isDirty: boolean;
  onReset: () => void;
}

function CostCurveEditor({ rates, onRatesChange, isDirty, onReset }: CostCurveEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<any>(null);

  const buildChartData = useCallback((currentRates: CostRates) => ({
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
  }), []);

  useEffect(() => {
    if (!canvasRef.current) return;
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
            tooltip: { callbacks: { label: (ctx: any) => ` $${ctx.parsed.y}/sq ft` } },
          },
          scales: {
            x: { ticks: { color: '#64748b', maxRotation: 30 }, grid: { color: 'rgba(255,255,255,0.05)' } },
            y: {
              ticks: { color: '#64748b', callback: (v: any) => `$${v}` },
              grid: { color: 'rgba(255,255,255,0.05)' },
              min: 80, max: 260,
            },
          },
        },
      });
    });
    return () => { chartRef.current?.destroy(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!chartRef.current) return;
    chartRef.current.data = buildChartData(rates);
    chartRef.current.update('active');
  }, [rates, buildChartData]);

  const handleRateChange = (key: string, value: number[]) => {
    onRatesChange({ ...rates, [key]: value[0] });
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
            {isDirty && (
              <Badge variant="outline" className="border-amber-500/50 text-amber-400 text-xs">
                Unsaved changes
              </Badge>
            )}
            <Button size="sm" variant="outline" className="border-white/10 text-slate-400 hover:text-white" onClick={onReset}>
              <RotateCcw className="w-3 h-3 mr-1" /> Reset
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-[260px]">
            <canvas ref={canvasRef} />
          </div>
          <div className="space-y-4">
            {Object.entries(rates).map(([key, value]) => (
              <div key={key} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 truncate max-w-[180px]">{key}</span>
                  <span className={`font-mono font-bold ${value !== DEFAULT_COST_RATES[key] ? 'text-amber-400' : 'text-[#00ffee]'}`}>
                    ${value}/sqft
                    {value !== DEFAULT_COST_RATES[key] && (
                      <span className="ml-1 text-slate-500">
                        ({value > DEFAULT_COST_RATES[key] ? '+' : ''}{(value - DEFAULT_COST_RATES[key]).toFixed(0)})
                      </span>
                    )}
                  </span>
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

// ─── Main Component ────────────────────────────────────────────────────────────

export default function CalibrationStudio() {
  const [costRates, setCostRates] = useState<CostRates>({ ...DEFAULT_COST_RATES });
  const [isDirty, setIsDirty] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [newSnapshotName, setNewSnapshotName] = useState("");
  const [newSnapshotDesc, setNewSnapshotDesc] = useState("");
  const [selectedCounty, setSelectedCounty] = useState("King");
  // ── Queries ──────────────────────────────────────────────────────────────────
  const utils = trpc.useUtils();

  const { data: activeSnapshot, isLoading: activeLoading } =
    trpc.calibration.getActive.useQuery({ countyName: selectedCounty });

  // ── Mutations ─────────────────────────────────────────────────────────────────
  const saveMutation = trpc.calibration.save.useMutation({
    onSuccess: (data) => {
      toast.success("Snapshot Saved", {
        description: `"${data.name}" saved to database (v${data.version}).`,
      });
      setIsSaveDialogOpen(false);
      setNewSnapshotName("");
      setNewSnapshotDesc("");
      setIsDirty(false);
      utils.calibration.list.invalidate();
      utils.calibration.getActive.invalidate();
    },
    onError: (err) => toast.error("Save failed", { description: err.message }),
  });

  // ── Load active snapshot on mount / county change ─────────────────────────────
  useEffect(() => {
    if (activeSnapshot?.costRates) {
      try {
        const parsed = typeof activeSnapshot.costRates === 'string'
          ? JSON.parse(activeSnapshot.costRates)
          : activeSnapshot.costRates;
        setCostRates(parsed as CostRates);
        setIsDirty(false);
      } catch {
        // ignore parse errors
      }
    } else if (!activeLoading) {
      setCostRates({ ...DEFAULT_COST_RATES });
      setIsDirty(false);
    }
  }, [activeSnapshot, activeLoading]);

  // ── Handlers ──────────────────────────────────────────────────────────────────
  const handleRatesChange = (rates: CostRates) => {
    setCostRates(rates);
    setIsDirty(true);
  };

  const handleReset = () => {
    setCostRates({ ...DEFAULT_COST_RATES });
    setIsDirty(false);
    toast.info("Cost rates reset to IAAO baseline");
  };

  const handleSave = () => {
    if (!newSnapshotName.trim()) return;
    saveMutation.mutate({
      name: newSnapshotName.trim(),
      description: newSnapshotDesc.trim() || undefined,
      countyName: selectedCounty,
      costRates,
      setAsActive: true,
    });
  };

  // ── Derived stats ─────────────────────────────────────────────────────────────
  const avgAdjustment = Object.entries(costRates).reduce((sum, [key, val]) => {
    return sum + (val - (DEFAULT_COST_RATES[key] ?? val));
  }, 0) / Object.keys(costRates).length;

  const changedCount = Object.entries(costRates).filter(
    ([key, val]) => val !== DEFAULT_COST_RATES[key]
  ).length;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <Sliders className="w-8 h-8 text-[#00ffee]" />
              Calibration Studio
            </h1>
            <p className="text-slate-400 mt-1">
              Tune cost tables to market conditions. Snapshots persist to the database.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* County selector */}
            <select
              value={selectedCounty}
              onChange={(e) => setSelectedCounty(e.target.value)}
              className="bg-white/5 border border-white/10 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#00ffee]/50"
            >
              {['King', 'Pierce', 'Snohomish', 'Spokane', 'Clark'].map(c => (
                <option key={c} value={c} className="bg-[#0b1020]">{c} County</option>
              ))}
            </select>

            <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="border-[#00ffee]/30 text-[#00ffee] hover:bg-[#00ffee]/10"
                  disabled={!isDirty}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Snapshot
                  {isDirty && <span className="ml-2 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />}
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#0b1020] border-[#00ffee]/30">
                <DialogHeader>
                  <DialogTitle className="text-[#00ffee]">Save Calibration Snapshot</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Snapshot Name *</Label>
                    <Input
                      placeholder="e.g., Aggressive 2026 Reval"
                      className="bg-white/5 border-white/10 text-white"
                      value={newSnapshotName}
                      onChange={(e) => setNewSnapshotName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Description (optional)</Label>
                    <Textarea
                      placeholder="Notes about this calibration scenario..."
                      className="bg-white/5 border-white/10 text-white resize-none"
                      rows={2}
                      value={newSnapshotDesc}
                      onChange={(e) => setNewSnapshotDesc(e.target.value)}
                    />
                  </div>
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-sm">
                    <p className="text-slate-400 mb-1">Summary of changes:</p>
                    <p className="text-[#00ffee] font-mono">
                      {changedCount} rate{changedCount !== 1 ? 's' : ''} adjusted
                      {avgAdjustment !== 0 && ` (avg ${avgAdjustment > 0 ? '+' : ''}${avgAdjustment.toFixed(1)}/sqft)`}
                    </p>
                  </div>
                  <Button
                    className="w-full bg-[#00ffee] text-[#0b1020] font-bold"
                    onClick={handleSave}
                    disabled={!newSnapshotName.trim() || saveMutation.isPending}
                  >
                    {saveMutation.isPending ? "Saving..." : "Save to Database"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button className="bg-[#00ffee] text-[#0b1020] hover:bg-[#00ffee]/90 font-bold">
              <RefreshCw className="w-4 h-4 mr-2" />
              Run Auto-Harmonization
            </Button>
          </div>
        </div>

        {/* ── Active snapshot banner ── */}
        {activeLoading ? (
          <Skeleton className="h-12 w-full rounded-lg" />
        ) : activeSnapshot ? (
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#00ffee]/5 border border-[#00ffee]/20">
            <Database className="w-4 h-4 text-[#00ffee] shrink-0" />
            <span className="text-sm text-slate-300">
              Active snapshot: <span className="text-[#00ffee] font-semibold">{activeSnapshot.name}</span>
              <span className="text-slate-500 ml-2">v{activeSnapshot.version}</span>
              {activeSnapshot.countyName && (
                <span className="text-slate-500 ml-2">· {activeSnapshot.countyName} County</span>
              )}
            </span>
            <span className="ml-auto text-xs text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(activeSnapshot.createdAt).toLocaleDateString()}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-sm text-amber-300">
              No active snapshot for {selectedCounty} County — using IAAO baseline defaults.
              Adjust rates and save a snapshot to persist your calibration.
            </span>
          </div>
        )}

        {/* ── Drift Alerts + Calibration Health ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 terra-card border-l-4 border-l-amber-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-500">
                <AlertTriangle className="w-5 h-5" />
                Market Drift Detected
              </CardTitle>
              <CardDescription>
                Neighborhoods where assessed values are drifting from market sales.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { name: "Neighborhood 4 (Richland)", ratio: 0.88, drift: "-12%", recommendation: "+2% Land Factor" },
                { name: "Sector 7G (Industrial)", ratio: 0.91, drift: "-9%", recommendation: "+1.5% Cost Factor" },
                { name: "Waterfront District", ratio: 1.14, drift: "+14%", recommendation: "-3% Location Modifier" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                  <div>
                    <h4 className="font-medium text-white">{item.name}</h4>
                    <div className="flex items-center gap-4 mt-1 text-sm text-slate-400">
                      <span className="flex items-center gap-1">
                        <LineChart className="w-3 h-3" /> Ratio:{" "}
                        <span className={item.ratio < 0.9 || item.ratio > 1.1 ? "text-red-400" : "text-green-400"}>
                          {item.ratio}
                        </span>
                      </span>
                      <span>Drift: {item.drift}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <span className="text-xs text-slate-500 uppercase tracking-wider">AI Recommendation</span>
                      <p className="text-[#00ffee] font-mono font-bold">{item.recommendation}</p>
                    </div>
                    <Button size="sm" variant="outline" className="border-[#00ffee]/30 text-[#00ffee] hover:bg-[#00ffee]/10">
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
              <CardDescription>Current model accuracy metrics.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Median Sales Ratio</span>
                  <span className="text-white font-mono">0.96</span>
                </div>
                <Progress value={96} className="h-2 bg-white/10 [&>div]:bg-green-500" />
                <p className="text-xs text-green-500 flex items-center">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Within target (0.90 – 1.10)
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
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Perfect Balance (0.98 – 1.03)
                </p>
              </div>
              {changedCount > 0 && (
                <div className="pt-2 border-t border-white/10">
                  <p className="text-xs text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {changedCount} unsaved rate adjustment{changedCount !== 1 ? 's' : ''}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Calibration Controls + Version History ── */}
        <Tabs defaultValue="cost" className="w-full">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <TabsList className="bg-white/5 border border-white/10 p-1">
              <TabsTrigger value="cost">Cost Tables</TabsTrigger>
              <TabsTrigger value="land">Land Models</TabsTrigger>
              <TabsTrigger value="depreciation">Depreciation</TabsTrigger>
              <TabsTrigger value="modifiers">Neighborhood Modifiers</TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-1.5">
                <History className="w-3.5 h-3.5" />
                Version History
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="cost">
            <CostCurveEditor
              rates={costRates}
              onRatesChange={handleRatesChange}
              isDirty={isDirty}
              onReset={handleReset}
            />
          </TabsContent>

          <TabsContent value="land">
            <Card className="terra-card">
              <CardContent className="py-12 text-center text-slate-500">
                <Sliders className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                Land model editor coming in a future release.
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="depreciation">
            <Card className="terra-card">
              <CardContent className="py-12 text-center text-slate-500">
                <Sliders className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                Depreciation table editor coming in a future release.
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="modifiers">
            <Card className="terra-card">
              <CardContent className="py-12 text-center text-slate-500">
                <Sliders className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                Neighborhood modifier editor coming in a future release.
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Version History Tab ── */}
          <TabsContent value="history">
            <Card className="terra-card">
              <CardContent className="pt-6">
                <VersionHistoryPanel
                  countyName={selectedCounty}
                  onLoad={(snapshot) => {
                    try {
                      const parsed = typeof snapshot.costRates === 'string'
                        ? JSON.parse(snapshot.costRates as unknown as string)
                        : snapshot.costRates;
                      setCostRates(parsed as CostRates);
                      setIsDirty(false);
                      toast.success("Snapshot Loaded", {
                        description: `Calibration set to "${snapshot.name}" (v${snapshot.version}). Switch to Cost Tables to edit.`,
                      });
                    } catch {
                      toast.error("Failed to load snapshot — invalid cost rates format.");
                    }
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
