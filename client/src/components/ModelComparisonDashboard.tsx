import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Award,
  BarChart2,
  CheckCircle2,
  ChevronDown,
  Download,
  Rocket,
  Star,
  TrendingDown,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────
interface SavedModel {
  id: number;
  name: string;
  description?: string | null;
  independentVariables: string;
  coefficients: string;
  rSquared?: string | null;
  adjustedRSquared?: string | null;
  fStatistic?: string | null;
  fPValue?: string | null;
  isProduction?: number | null;
  createdAt: Date;
}

interface ModelComparisonDashboardProps {
  savedModels: SavedModel[];
  onLoadModel: (model: ParsedModel) => void;
  onClose: () => void;
}

interface ParsedModel {
  id: number;
  name: string;
  variables: string[];
  coefficients: Record<string, number>;
  intercept: number;
  rSquared: number;
  adjustedRSquared: number;
  fStatistic: number;
  fPValue: number;
  isProduction: boolean;
  createdAt: Date;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const VARIABLE_LABELS: Record<string, string> = {
  squareFeet: "Sq Ft",
  yearBuilt: "Year Built",
  bedrooms: "Bedrooms",
  bathrooms: "Bathrooms",
  lotSize: "Lot Size",
  garageSpaces: "Garage",
  hasPool: "Pool",
  distanceToSchool: "School Dist.",
  distanceToHighway: "Hwy Dist.",
  neighborhoodScore: "Nbhd Score",
  landValue: "Land Value",
  buildingValue: "Bldg Value",
  totalValue: "Total Value",
};

const MODEL_COLORS = ["#00DCDC", "#FFD700", "#FF6B6B"];
const MODEL_COLORS_DIM = ["rgba(0,220,220,0.25)", "rgba(255,215,0,0.25)", "rgba(255,107,107,0.25)"];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function parseModel(m: SavedModel): ParsedModel | null {
  try {
    const vars: string[] = JSON.parse(m.independentVariables || "[]");
    const coefRaw: Record<string, number> = JSON.parse(m.coefficients || "{}");
    const { intercept, ...coefs } = coefRaw;
    return {
      id: m.id,
      name: m.name,
      variables: vars,
      coefficients: coefs,
      intercept: intercept ?? 0,
      rSquared: Number(m.rSquared ?? 0),
      adjustedRSquared: Number(m.adjustedRSquared ?? 0),
      fStatistic: Number(m.fStatistic ?? 0),
      fPValue: Number(m.fPValue ?? 0),
      isProduction: m.isProduction === 1,
      createdAt: m.createdAt,
    };
  } catch {
    return null;
  }
}

function fmt(n: number, decimals = 4) {
  return n.toFixed(decimals);
}

function fmtCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

// ─── Winner logic ─────────────────────────────────────────────────────────────
function pickWinner(models: ComparedModel[]): number {
  // Score: +3 for best adj R², +2 for lowest AIC, +1 for lowest BIC, +1 for lowest RMSE
  const scores = models.map(() => 0);
  const maxAdjR2 = Math.max(...models.map((m) => m.adjustedRSquared));
  const minAIC = Math.min(...models.map((m) => m.aic));
  const minBIC = Math.min(...models.map((m) => m.bic));
  const minRMSE = Math.min(...models.map((m) => m.rmse));
  models.forEach((m, i) => {
    if (m.adjustedRSquared === maxAdjR2) scores[i] += 3;
    if (m.aic === minAIC) scores[i] += 2;
    if (m.bic === minBIC) scores[i] += 1;
    if (m.rmse === minRMSE) scores[i] += 1;
  });
  return scores.indexOf(Math.max(...scores));
}

// ─── Server-enriched model type ───────────────────────────────────────────────
interface ComparedModel {
  id: number;
  name: string;
  description?: string | null;
  variables: string[];
  coefficients: Record<string, number>;
  intercept: number;
  rSquared: number;
  adjustedRSquared: number;
  fStatistic: number;
  fPValue: number;
  rmse: number;
  aic: number;
  bic: number;
  variableCount: number;
  isProduction: boolean;
  createdAt: Date;
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatRow({
  label,
  values,
  format,
  lowerIsBetter = false,
  colors,
}: {
  label: string;
  values: number[];
  format: (v: number) => string;
  lowerIsBetter?: boolean;
  colors: string[];
}) {
  const best = lowerIsBetter ? Math.min(...values) : Math.max(...values);
  return (
    <tr className="border-b border-white/5 hover:bg-white/[0.02]">
      <td className="px-4 py-3 text-xs text-muted-foreground font-medium whitespace-nowrap">{label}</td>
      {values.map((v, i) => {
        const isBest = v === best;
        return (
          <td key={i} className="px-4 py-3 text-center">
            <div className="flex flex-col items-center gap-1">
              <span
                className="font-mono text-sm font-semibold"
                style={{ color: isBest ? colors[i] : undefined }}
              >
                {format(v)}
              </span>
              {isBest && (
                <CheckCircle2 className="w-3 h-3" style={{ color: colors[i] }} />
              )}
            </div>
          </td>
        );
      })}
    </tr>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function ModelComparisonDashboard({ savedModels, onLoadModel, onClose }: ModelComparisonDashboardProps) {
  const utils = trpc.useUtils();
  const allParsed = useMemo(
    () => savedModels.map(parseModel).filter((m): m is ParsedModel => m !== null),
    [savedModels]
  );

  // Model selector: up to 3
  const [selectedIds, setSelectedIds] = useState<number[]>(() =>
    allParsed.slice(0, Math.min(3, allParsed.length)).map((m) => m.id)
  );

  const [promotingId, setPromotingId] = useState<number | null>(null);

  const promoteToProduction = trpc.regressionModels.promoteToProduction.useMutation({
    onSuccess: () => {
      toast.success("Model promoted to production");
      setPromotingId(null);
      utils.regressionModels.list.invalidate();
      utils.regressionModels.getProductionModel.invalidate();
    },
    onError: (err) => {
      toast.error(`Failed to promote: ${err.message}`);
      setPromotingId(null);
    },
  });

  // Fetch enriched comparison data from server
  const { data: comparedModels, isLoading } = trpc.regressionModels.compare.useQuery(
    { ids: selectedIds },
    { enabled: selectedIds.length >= 2 }
  );

  const models = comparedModels ?? [];
  const winnerIdx = models.length >= 2 ? pickWinner(models) : -1;

  // All unique variables across selected models
  const allVars = useMemo(
    () => Array.from(new Set(models.flatMap((m) => m.variables))).sort(),
    [models]
  );

  // Coefficient chart data: one entry per variable
  const coeffChartData = useMemo(() => {
    return allVars.map((varName) => {
      const entry: Record<string, number | string> = { variable: VARIABLE_LABELS[varName] || varName };
      models.forEach((m) => {
        entry[m.name] = m.coefficients[varName] ?? 0;
      });
      return entry;
    });
  }, [allVars, models]);

  // Export CSV
  function exportCSV() {
    if (models.length === 0) return;
    const rows: string[] = [];
    rows.push(`"TerraFusion Model Comparison Report"`);
    rows.push(`"Generated","${new Date().toLocaleDateString()}"`);
    rows.push(`"Models","${models.map((m) => m.name).join(" vs ")}"`);
    rows.push("");
    rows.push(`"Metric","${models.map((m) => m.name).join('","')}"`);
    rows.push(`"R²","${models.map((m) => fmt(m.rSquared, 6)).join('","')}"`);
    rows.push(`"Adj. R²","${models.map((m) => fmt(m.adjustedRSquared, 6)).join('","')}"`);
    rows.push(`"RMSE","${models.map((m) => fmt(m.rmse, 2)).join('","')}"`);
    rows.push(`"AIC","${models.map((m) => fmt(m.aic, 2)).join('","')}"`);
    rows.push(`"BIC","${models.map((m) => fmt(m.bic, 2)).join('","')}"`);
    rows.push(`"F-statistic","${models.map((m) => fmt(m.fStatistic, 4)).join('","')}"`);
    rows.push(`"F p-value","${models.map((m) => fmt(m.fPValue, 6)).join('","')}"`);
    rows.push(`"Variable Count","${models.map((m) => m.variableCount).join('","')}"`);
    rows.push(`"Production","${models.map((m) => (m.isProduction ? "Yes" : "No")).join('","')}"`);
    rows.push("");
    rows.push(`"Coefficients"`);
    rows.push(`"Variable","${models.map((m) => m.name).join('","')}"`);
    rows.push(`"Intercept","${models.map((m) => fmt(m.intercept, 4)).join('","')}"`);
    allVars.forEach((v) => {
      rows.push(`"${VARIABLE_LABELS[v] || v}","${models.map((m) => fmt(m.coefficients[v] ?? 0, 4)).join('","')}"`);
    });
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `model-comparison-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Comparison exported as CSV");
  }

  function toggleModel(id: number) {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        if (prev.length <= 2) {
          toast.error("Select at least 2 models to compare");
          return prev;
        }
        return prev.filter((x) => x !== id);
      } else {
        if (prev.length >= 3) {
          toast.error("Maximum 3 models can be compared at once");
          return prev;
        }
        return [...prev, id];
      }
    });
  }

  if (allParsed.length < 2) {
    return (
      <Card className="border border-white/10 bg-background/60 backdrop-blur-sm">
        <CardContent className="py-16 text-center">
          <BarChart2 className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground font-medium">Save at least 2 regression models to compare them.</p>
          <p className="text-xs text-muted-foreground/60 mt-2">Run a regression, then click "Save Model" in the toolbar.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-cyan-400" />
            Model Comparison Dashboard
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Side-by-side evaluation of saved regression models — select 2–3 to compare
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV} disabled={models.length < 2}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* ── Model Selector ────────────────────────────────────────────── */}
      <Card className="border border-white/10 bg-background/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Select Models to Compare
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {allParsed.map((m, idx) => {
              const isSelected = selectedIds.includes(m.id);
              const colorIdx = selectedIds.indexOf(m.id);
              return (
                <button
                  key={m.id}
                  onClick={() => toggleModel(m.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
                    isSelected
                      ? "border-white/20 bg-white/10"
                      : "border-white/5 bg-white/[0.02] text-muted-foreground hover:bg-white/5"
                  }`}
                  style={isSelected ? { borderColor: MODEL_COLORS[colorIdx] + "60" } : {}}
                >
                  {isSelected && (
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: MODEL_COLORS[colorIdx] }}
                    />
                  )}
                  <span className="font-medium truncate max-w-[160px]">{m.name}</span>
                  {m.isProduction && (
                    <Badge variant="outline" className="text-[10px] px-1 py-0 border-cyan-500/40 text-cyan-400">
                      PROD
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground/60">R²={fmt(m.rSquared, 3)}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      )}

      {!isLoading && models.length >= 2 && (
        <>
          {/* ── Winner Recommendation ──────────────────────────────────── */}
          {winnerIdx >= 0 && (
            <Card className="border border-yellow-500/20 bg-yellow-500/5">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
                    <Award className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-yellow-400">Recommended Model</span>
                      <Badge
                        className="text-xs"
                        style={{ backgroundColor: MODEL_COLORS[winnerIdx] + "20", color: MODEL_COLORS[winnerIdx], borderColor: MODEL_COLORS[winnerIdx] + "40" }}
                      >
                        {models[winnerIdx].name}
                      </Badge>
                      {models[winnerIdx].isProduction && (
                        <Badge variant="outline" className="text-[10px] border-cyan-500/40 text-cyan-400">
                          Already in Production
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Highest composite score across Adj. R² (+3), AIC (+2), BIC (+1), and RMSE (+1).
                      Adj. R² = <span className="font-mono text-yellow-400">{fmt(models[winnerIdx].adjustedRSquared, 4)}</span>,
                      AIC = <span className="font-mono text-yellow-400">{fmt(models[winnerIdx].aic, 1)}</span>,
                      RMSE = <span className="font-mono text-yellow-400">{fmtCurrency(models[winnerIdx].rmse)}</span>.
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const m = allParsed.find((p) => p.id === models[winnerIdx].id);
                        if (m) onLoadModel(m);
                      }}
                    >
                      Load into Studio
                    </Button>
                    {!models[winnerIdx].isProduction && (
                      <Button
                        size="sm"
                        className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30"
                        disabled={promotingId === models[winnerIdx].id}
                        onClick={() => {
                          setPromotingId(models[winnerIdx].id);
                          promoteToProduction.mutate({ id: models[winnerIdx].id });
                        }}
                      >
                        <Rocket className="w-3.5 h-3.5 mr-1.5" />
                        Promote to Production
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Fit Statistics Table ───────────────────────────────────── */}
          <Card className="border border-white/10 bg-background/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                Fit Statistics
              </CardTitle>
              <CardDescription>
                IAAO-recommended metrics for model selection. Lower AIC/BIC/RMSE and higher R² indicate better fit.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.02]">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide w-40">
                        Metric
                      </th>
                      {models.map((m, i) => (
                        <th key={m.id} className="px-4 py-3 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: MODEL_COLORS[i] }}
                            />
                            <span className="font-semibold text-xs truncate max-w-[120px]">{m.name}</span>
                            {m.isProduction && (
                              <Badge variant="outline" className="text-[9px] px-1 py-0 border-cyan-500/40 text-cyan-400">
                                PROD
                              </Badge>
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Section: Goodness of Fit */}
                    <tr className="bg-white/[0.015]">
                      <td colSpan={models.length + 1} className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                        Goodness of Fit
                      </td>
                    </tr>
                    <StatRow
                      label="R²"
                      values={models.map((m) => m.rSquared)}
                      format={(v) => fmt(v, 4)}
                      colors={MODEL_COLORS}
                    />
                    <StatRow
                      label="Adj. R²"
                      values={models.map((m) => m.adjustedRSquared)}
                      format={(v) => fmt(v, 4)}
                      colors={MODEL_COLORS}
                    />
                    <StatRow
                      label="RMSE"
                      values={models.map((m) => m.rmse)}
                      format={fmtCurrency}
                      lowerIsBetter
                      colors={MODEL_COLORS}
                    />
                    {/* Section: Information Criteria */}
                    <tr className="bg-white/[0.015]">
                      <td colSpan={models.length + 1} className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                        Information Criteria
                      </td>
                    </tr>
                    <StatRow
                      label="AIC"
                      values={models.map((m) => m.aic)}
                      format={(v) => fmt(v, 1)}
                      lowerIsBetter
                      colors={MODEL_COLORS}
                    />
                    <StatRow
                      label="BIC"
                      values={models.map((m) => m.bic)}
                      format={(v) => fmt(v, 1)}
                      lowerIsBetter
                      colors={MODEL_COLORS}
                    />
                    {/* Section: Significance */}
                    <tr className="bg-white/[0.015]">
                      <td colSpan={models.length + 1} className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                        Model Significance
                      </td>
                    </tr>
                    <StatRow
                      label="F-statistic"
                      values={models.map((m) => m.fStatistic)}
                      format={(v) => fmt(v, 2)}
                      colors={MODEL_COLORS}
                    />
                    <tr className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="px-4 py-3 text-xs text-muted-foreground font-medium">F p-value</td>
                      {models.map((m, i) => (
                        <td key={m.id} className="px-4 py-3 text-center">
                          <span
                            className="font-mono text-xs font-semibold"
                            style={{ color: m.fPValue < 0.05 ? MODEL_COLORS[i] : "rgb(255,150,50)" }}
                          >
                            {m.fPValue < 0.0001 ? "< 0.0001" : fmt(m.fPValue, 4)}
                          </span>
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            {m.fPValue < 0.05 ? "Significant" : "Not significant"}
                          </div>
                        </td>
                      ))}
                    </tr>
                    {/* Section: Complexity */}
                    <tr className="bg-white/[0.015]">
                      <td colSpan={models.length + 1} className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                        Complexity
                      </td>
                    </tr>
                    <tr className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="px-4 py-3 text-xs text-muted-foreground font-medium">Variables</td>
                      {models.map((m) => (
                        <td key={m.id} className="px-4 py-3 text-center">
                          <span className="font-mono text-sm">{m.variableCount}</span>
                          <div className="text-[10px] text-muted-foreground mt-0.5 truncate max-w-[120px] mx-auto" title={m.variables.join(", ")}>
                            {m.variables.map((v) => VARIABLE_LABELS[v] || v).join(", ")}
                          </div>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* ── Coefficient Comparison Chart ───────────────────────────── */}
          {allVars.length > 0 && (
            <Card className="border border-white/10 bg-background/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-cyan-400" />
                  Coefficient Comparison
                </CardTitle>
                <CardDescription>
                  Grouped bars show each model's raw coefficient per variable. Positive = value-increasing, negative = value-decreasing.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div style={{ height: 320 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={coeffChartData} margin={{ top: 10, right: 20, left: 20, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis
                        dataKey="variable"
                        tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
                        angle={-35}
                        textAnchor="end"
                        interval={0}
                        height={60}
                      />
                      <YAxis
                        tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
                        tickFormatter={(v) => v >= 1000 || v <= -1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
                      />
                      <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(10,14,26,0.95)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                        formatter={(value: number, name: string) => [
                          value >= 1000 || value <= -1000
                            ? `${value.toLocaleString()}`
                            : value.toFixed(4),
                          name,
                        ]}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
                        formatter={(value) => <span style={{ color: "rgba(255,255,255,0.7)" }}>{value}</span>}
                      />
                      {models.map((m, i) => (
                        <Bar key={m.id} dataKey={m.name} fill={MODEL_COLORS[i]} radius={[2, 2, 0, 0]} maxBarSize={28} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Variable Presence Heatmap ──────────────────────────────── */}
          {allVars.length > 0 && (
            <Card className="border border-white/10 bg-background/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Star className="w-4 h-4 text-cyan-400" />
                  Variable Presence Matrix
                </CardTitle>
                <CardDescription>
                  Which variables each model includes. Shared variables allow direct coefficient comparison.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="px-4 py-2 text-left text-xs text-muted-foreground font-medium w-40">Variable</th>
                        {models.map((m, i) => (
                          <th key={m.id} className="px-4 py-2 text-center text-xs font-medium" style={{ color: MODEL_COLORS[i] }}>
                            {m.name}
                          </th>
                        ))}
                        <th className="px-4 py-2 text-center text-xs text-muted-foreground font-medium">Shared</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allVars.map((varName) => {
                        const presentIn = models.filter((m) => m.variables.includes(varName));
                        const isShared = presentIn.length === models.length;
                        return (
                          <tr key={varName} className="border-b border-white/5 hover:bg-white/[0.02]">
                            <td className="px-4 py-2.5 text-xs text-muted-foreground font-medium">
                              {VARIABLE_LABELS[varName] || varName}
                            </td>
                            {models.map((m, i) => {
                              const has = m.variables.includes(varName);
                              const coef = m.coefficients[varName];
                              return (
                                <td key={m.id} className="px-4 py-2.5 text-center">
                                  {has ? (
                                    <div className="flex flex-col items-center gap-0.5">
                                      <div
                                        className="w-5 h-5 rounded flex items-center justify-center"
                                        style={{ backgroundColor: MODEL_COLORS_DIM[i] }}
                                      >
                                        <CheckCircle2 className="w-3 h-3" style={{ color: MODEL_COLORS[i] }} />
                                      </div>
                                      <span className="font-mono text-[10px] text-muted-foreground">
                                        {coef !== undefined
                                          ? (coef >= 0 ? "+" : "") + coef.toFixed(2)
                                          : ""}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground/30 text-xs">—</span>
                                  )}
                                </td>
                              );
                            })}
                            <td className="px-4 py-2.5 text-center">
                              {isShared ? (
                                <Badge variant="outline" className="text-[10px] border-cyan-500/30 text-cyan-400">
                                  All
                                </Badge>
                              ) : (
                                <span className="text-[10px] text-muted-foreground">
                                  {presentIn.length}/{models.length}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Per-Model Action Cards ─────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {models.map((m, i) => {
              const parsed = allParsed.find((p) => p.id === m.id);
              const isWinner = i === winnerIdx;
              return (
                <Card
                  key={m.id}
                  className="border bg-background/40"
                  style={{ borderColor: isWinner ? MODEL_COLORS[i] + "40" : "rgba(255,255,255,0.08)" }}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: MODEL_COLORS[i] }} />
                        <CardTitle className="text-sm font-semibold truncate">{m.name}</CardTitle>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        {isWinner && <Award className="w-4 h-4 text-yellow-400" />}
                        {m.isProduction && <Zap className="w-4 h-4 text-cyan-400" />}
                      </div>
                    </div>
                    {m.description && (
                      <CardDescription className="text-xs truncate">{m.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-white/5 rounded p-2">
                        <div className="text-muted-foreground">R²</div>
                        <div className="font-mono font-bold" style={{ color: MODEL_COLORS[i] }}>
                          {fmt(m.rSquared, 4)}
                        </div>
                      </div>
                      <div className="bg-white/5 rounded p-2">
                        <div className="text-muted-foreground">Adj. R²</div>
                        <div className="font-mono font-bold" style={{ color: MODEL_COLORS[i] }}>
                          {fmt(m.adjustedRSquared, 4)}
                        </div>
                      </div>
                      <div className="bg-white/5 rounded p-2">
                        <div className="text-muted-foreground">RMSE</div>
                        <div className="font-mono font-bold text-[11px]">{fmtCurrency(m.rmse)}</div>
                      </div>
                      <div className="bg-white/5 rounded p-2">
                        <div className="text-muted-foreground">AIC</div>
                        <div className="font-mono font-bold text-[11px]">{fmt(m.aic, 1)}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {parsed && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-xs"
                          onClick={() => onLoadModel(parsed)}
                        >
                          Load into Studio
                        </Button>
                      )}
                      {!m.isProduction && (
                        <Button
                          size="sm"
                          className="flex-1 text-xs"
                          style={{
                            backgroundColor: MODEL_COLORS[i] + "20",
                            color: MODEL_COLORS[i],
                            borderColor: MODEL_COLORS[i] + "40",
                            border: "1px solid",
                          }}
                          disabled={promotingId === m.id}
                          onClick={() => {
                            setPromotingId(m.id);
                            promoteToProduction.mutate({ id: m.id });
                          }}
                        >
                          <Rocket className="w-3 h-3 mr-1" />
                          {promotingId === m.id ? "Promoting…" : "Promote"}
                        </Button>
                      )}
                      {m.isProduction && (
                        <div className="flex-1 flex items-center justify-center gap-1 text-xs text-cyan-400">
                          <Zap className="w-3 h-3" />
                          In Production
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* ── IAAO Guidance ─────────────────────────────────────────── */}
          <Card className="border border-white/5 bg-background/20">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                <span className="font-semibold text-foreground">IAAO Model Selection Guidance:</span>{" "}
                Prefer the model with the highest Adjusted R² (penalises unnecessary variables) and lowest AIC/BIC
                (information-theoretic parsimony). RMSE should be evaluated relative to the median assessed value.
                A model with fewer variables and comparable Adj. R² is generally preferred for mass appraisal
                (IAAO Standard on Mass Appraisal of Real Property, §7.3).
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
