import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type RegressionResult } from "@/lib/regression";
import { Award, BarChart2, CheckCircle2, Download, TrendingUp, X } from "lucide-react";
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
  createdAt: Date;
}

interface ParsedModel {
  id: number;
  name: string;
  createdAt: Date;
  variables: string[];
  coefficients: Record<string, number>;
  intercept: number;
  rSquared: number;
  adjustedRSquared: number;
  fStatistic: number;
  fPValue: number;
}

interface ModelComparisonPanelProps {
  savedModels: SavedModel[];
  onLoadModel: (model: ParsedModel) => void;
  onClose: () => void;
}

// ─── Variable label map ────────────────────────────────────────────────────────

const VARIABLE_LABELS: Record<string, string> = {
  squareFeet: "Square Feet",
  yearBuilt: "Year Built",
  bedrooms: "Bedrooms",
  bathrooms: "Bathrooms",
  lotSize: "Lot Size",
  garageSpaces: "Garage Spaces",
  hasPool: "Has Pool",
  distanceToSchool: "Dist. to School",
  distanceToHighway: "Dist. to Highway",
  neighborhoodScore: "Neighborhood Score",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseModel(m: SavedModel): ParsedModel | null {
  try {
    const vars: string[] = JSON.parse(m.independentVariables || "[]");
    const coefRaw: Record<string, number> = JSON.parse(m.coefficients || "{}");
    const { intercept: _intercept, ...coefs } = coefRaw;
    return {
      id: m.id,
      name: m.name,
      createdAt: m.createdAt,
      variables: vars,
      coefficients: coefs,
      intercept: _intercept ?? 0,
      rSquared: Number(m.rSquared ?? 0),
      adjustedRSquared: Number(m.adjustedRSquared ?? 0),
      fStatistic: Number(m.fStatistic ?? 0),
      fPValue: Number(m.fPValue ?? 0),
    };
  } catch {
    return null;
  }
}

function MetricBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mt-1">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}

function CoefficientCell({ value, absent }: { value: number | undefined; absent: boolean }) {
  if (absent) {
    return <span className="text-muted-foreground/40 text-xs">—</span>;
  }
  const isPos = value! >= 0;
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span
        className="font-mono text-xs font-semibold"
        style={{ color: isPos ? "rgb(0, 220, 200)" : "rgb(255, 100, 100)" }}
      >
        {isPos ? "+" : ""}{value!.toFixed(4)}
      </span>
      <div
        className="w-6 h-1 rounded-full"
        style={{ backgroundColor: isPos ? "rgba(0,220,200,0.4)" : "rgba(255,100,100,0.4)" }}
      />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ModelComparisonPanel({ savedModels, onLoadModel, onClose }: ModelComparisonPanelProps) {
  // Take the top 3 by R² (highest first)
  const parsed = savedModels
    .map(parseModel)
    .filter((m): m is ParsedModel => m !== null)
    .sort((a, b) => b.rSquared - a.rSquared)
    .slice(0, 3);

  if (parsed.length === 0) {
    return (
      <Card className="border border-white/10 bg-background/60 backdrop-blur-sm">
        <CardContent className="py-12 text-center text-muted-foreground">
          No saved models to compare. Run and save at least one regression model first.
        </CardContent>
      </Card>
    );
  }

  // Collect all unique variables across the top 3 models
  const allVars = Array.from(new Set(parsed.flatMap((m) => m.variables))).sort();

  // Metric maxima for bar scaling
  const maxR2 = Math.max(...parsed.map((m) => m.rSquared));
  const maxAdjR2 = Math.max(...parsed.map((m) => m.adjustedRSquared));
  const maxF = Math.max(...parsed.map((m) => m.fStatistic));

  // Medal colors
  const medals = ["#FFD700", "#C0C0C0", "#CD7F32"];
  const medalLabels = ["1st", "2nd", "3rd"];

  // Export comparison as CSV
  function exportCSV() {
    const rows: string[] = [];
    rows.push(`"Metric","${parsed.map((m) => m.name).join('","')}"`);
    rows.push(`"R²","${parsed.map((m) => m.rSquared.toFixed(6)).join('","')}"`);
    rows.push(`"Adj. R²","${parsed.map((m) => m.adjustedRSquared.toFixed(6)).join('","')}"`);
    rows.push(`"F-statistic","${parsed.map((m) => m.fStatistic.toFixed(4)).join('","')}"`);
    rows.push(`"F p-value","${parsed.map((m) => m.fPValue.toFixed(6)).join('","')}"`);
    rows.push(`"Variables","${parsed.map((m) => m.variables.join('; ')).join('","')}"`);
    rows.push(`"Intercept","${parsed.map((m) => m.intercept.toFixed(4)).join('","')}"`);
    allVars.forEach((v) => {
      const label = VARIABLE_LABELS[v] || v;
      rows.push(`"${label}","${parsed.map((m) => m.coefficients[v] !== undefined ? m.coefficients[v].toFixed(4) : '—').join('","')}"`);
    });
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `model-comparison-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Comparison exported as CSV");
  }

  return (
    <Card className="border border-white/10 bg-background/60 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <BarChart2 className="w-4 h-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Model Comparison</CardTitle>
              <CardDescription>
                Top {parsed.length} saved model{parsed.length > 1 ? "s" : ""} ranked by R²
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={exportCSV}>
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Export CSV
            </Button>
            <Button size="sm" variant="ghost" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* ── Model Header Cards ─────────────────────────────────── */}
        <div className={`grid gap-4 ${parsed.length === 1 ? "grid-cols-1" : parsed.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
          {parsed.map((model, idx) => (
            <div
              key={model.id}
              className="relative rounded-xl border p-4 space-y-3"
              style={{
                borderColor: idx === 0 ? "rgba(255,215,0,0.4)" : "rgba(255,255,255,0.08)",
                background: idx === 0 ? "rgba(255,215,0,0.04)" : "rgba(255,255,255,0.02)",
              }}
            >
              {/* Medal badge */}
              <div className="flex items-start justify-between">
                <div
                  className="flex items-center gap-1.5 text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: `${medals[idx]}22`, color: medals[idx] }}
                >
                  {idx === 0 && <Award className="w-3 h-3" />}
                  {medalLabels[idx]}
                </div>
                {idx === 0 && (
                  <Badge variant="outline" className="text-[10px] border-yellow-500/40 text-yellow-400 bg-yellow-500/10">
                    Best Model
                  </Badge>
                )}
              </div>

              <div>
                <p className="font-semibold text-sm truncate" title={model.name}>{model.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {model.variables.length} variable{model.variables.length !== 1 ? "s" : ""} · {new Date(model.createdAt).toLocaleDateString()}
                </p>
              </div>

              {/* R² highlight */}
              <div>
                <div className="flex justify-between items-end">
                  <span className="text-xs text-muted-foreground">R²</span>
                  <span
                    className="text-xl font-bold font-mono"
                    style={{ color: idx === 0 ? "#FFD700" : "inherit" }}
                  >
                    {model.rSquared.toFixed(4)}
                  </span>
                </div>
                <MetricBar value={model.rSquared} max={maxR2} color={medals[idx]} />
              </div>

              <Button
                size="sm"
                variant={idx === 0 ? "default" : "outline"}
                className="w-full text-xs"
                onClick={() => {
                  onLoadModel(model);
                  toast.success(`Loaded: ${model.name}`);
                }}
              >
                <TrendingUp className="w-3 h-3 mr-1.5" />
                Load This Model
              </Button>
            </div>
          ))}
        </div>

        {/* ── Side-by-Side Metrics Table ─────────────────────────── */}
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-40">
                  Metric
                </th>
                {parsed.map((m, idx) => (
                  <th
                    key={m.id}
                    className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wide"
                    style={{ color: medals[idx] }}
                  >
                    {m.name.length > 18 ? m.name.slice(0, 16) + "…" : m.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {/* R² */}
              <tr className="hover:bg-white/[0.02]">
                <td className="px-4 py-3 text-xs text-muted-foreground font-medium">R²</td>
                {parsed.map((m, idx) => (
                  <td key={m.id} className="px-4 py-3 text-center">
                    <div className="flex flex-col items-center">
                      <span className="font-mono font-semibold text-sm">{m.rSquared.toFixed(6)}</span>
                      <MetricBar value={m.rSquared} max={maxR2} color={medals[idx]} />
                    </div>
                    {idx === 0 && (
                      <div className="flex justify-center mt-1">
                        <CheckCircle2 className="w-3 h-3 text-yellow-400" />
                      </div>
                    )}
                  </td>
                ))}
              </tr>

              {/* Adj. R² */}
              <tr className="hover:bg-white/[0.02]">
                <td className="px-4 py-3 text-xs text-muted-foreground font-medium">Adj. R²</td>
                {parsed.map((m, idx) => {
                  const isBest = m.adjustedRSquared === maxAdjR2;
                  return (
                    <td key={m.id} className="px-4 py-3 text-center">
                      <div className="flex flex-col items-center">
                        <span className={`font-mono text-sm ${isBest ? "font-semibold" : ""}`}>
                          {m.adjustedRSquared.toFixed(6)}
                        </span>
                        <MetricBar value={m.adjustedRSquared} max={maxAdjR2} color={medals[idx]} />
                      </div>
                    </td>
                  );
                })}
              </tr>

              {/* F-statistic */}
              <tr className="hover:bg-white/[0.02]">
                <td className="px-4 py-3 text-xs text-muted-foreground font-medium">F-statistic</td>
                {parsed.map((m, idx) => {
                  const isBest = m.fStatistic === maxF;
                  return (
                    <td key={m.id} className="px-4 py-3 text-center">
                      <div className="flex flex-col items-center">
                        <span className={`font-mono text-sm ${isBest ? "font-semibold" : ""}`}>
                          {m.fStatistic.toFixed(2)}
                        </span>
                        <MetricBar value={m.fStatistic} max={maxF} color={medals[idx]} />
                      </div>
                    </td>
                  );
                })}
              </tr>

              {/* F p-value */}
              <tr className="hover:bg-white/[0.02]">
                <td className="px-4 py-3 text-xs text-muted-foreground font-medium">F p-value</td>
                {parsed.map((m) => (
                  <td key={m.id} className="px-4 py-3 text-center">
                    <span
                      className="font-mono text-xs"
                      style={{ color: m.fPValue < 0.05 ? "rgb(0,220,200)" : "rgb(255,150,50)" }}
                    >
                      {m.fPValue < 0.0001 ? "< 0.0001" : m.fPValue.toFixed(4)}
                    </span>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {m.fPValue < 0.05 ? "Significant" : "Not significant"}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Variables count */}
              <tr className="hover:bg-white/[0.02]">
                <td className="px-4 py-3 text-xs text-muted-foreground font-medium">Variables</td>
                {parsed.map((m) => (
                  <td key={m.id} className="px-4 py-3 text-center">
                    <span className="font-mono text-sm">{m.variables.length}</span>
                    <div className="text-[10px] text-muted-foreground mt-0.5 truncate max-w-[120px] mx-auto" title={m.variables.join(", ")}>
                      {m.variables.map(v => VARIABLE_LABELS[v] || v).join(", ")}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Intercept */}
              <tr className="bg-white/[0.015] hover:bg-white/[0.03]">
                <td className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide" colSpan={parsed.length + 1}>
                  Coefficients
                </td>
              </tr>
              <tr className="hover:bg-white/[0.02]">
                <td className="px-4 py-3 text-xs text-muted-foreground font-medium pl-6">Intercept</td>
                {parsed.map((m) => (
                  <td key={m.id} className="px-4 py-3 text-center">
                    <CoefficientCell value={m.intercept} absent={false} />
                  </td>
                ))}
              </tr>

              {/* One row per unique variable */}
              {allVars.map((varName) => (
                <tr key={varName} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-xs text-muted-foreground font-medium pl-6">
                    {VARIABLE_LABELS[varName] || varName}
                  </td>
                  {parsed.map((m) => (
                    <td key={m.id} className="px-4 py-3 text-center">
                      <CoefficientCell
                        value={m.coefficients[varName]}
                        absent={m.coefficients[varName] === undefined}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Legend ────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-1">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "rgba(0,220,200,0.6)" }} />
            <span>Positive coefficient</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "rgba(255,100,100,0.6)" }} />
            <span>Negative coefficient</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground/40">—</span>
            <span>Variable not in model</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-yellow-400" />
            <span>Best performer in metric</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
