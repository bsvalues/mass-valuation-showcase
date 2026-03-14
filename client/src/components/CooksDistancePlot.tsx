/**
 * CooksDistancePlot — IAAO-standard influential observation diagnostic
 *
 * Replaces the simplified "Residuals vs Leverage" placeholder with a proper
 * Cook's Distance bar chart.  Each bar represents one observation; bars are
 * coloured by influence tier:
 *   - Green  : D_i ≤ 4/n  (normal)
 *   - Amber  : 4/n < D_i ≤ 1.0  (moderate influence)
 *   - Red    : D_i > 1.0  (strong influence — IAAO flag)
 *
 * Two reference lines are drawn:
 *   - Dashed amber at 4/n  (conventional "watch" threshold)
 *   - Solid red   at 1.0   (strong-influence threshold)
 */

import { useMemo, useState } from "react";
import {
  ComposedChart,
  Bar,
  ReferenceLine,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface CooksDistancePlotProps {
  /** Raw residuals from the regression (length n) */
  residuals: number[];
  /** Cook's Distance values (length n) — one per observation */
  cooksD: number[];
  /** Hat-matrix diagonal leverage values (length n) */
  leverage: number[];
  /** Number of predictors k (excluding intercept) */
  k: number;
}

interface InfluenceRow {
  index: number;
  cooksD: number;
  stdResidual: number;
  leverage: number;
  tier: "normal" | "moderate" | "strong";
}

// ─────────────────────────────────────────────────────────────────────────────
// Colour helpers
// ─────────────────────────────────────────────────────────────────────────────

const COLOUR_NORMAL   = "#22c55e"; // green-500
const COLOUR_MODERATE = "#f59e0b"; // amber-500
const COLOUR_STRONG   = "#ef4444"; // red-500
const COLOUR_GRID     = "#1e2a3a";
const COLOUR_AXIS     = "#64748b";

function tierColour(d: number, threshold: number): string {
  if (d > 1.0)        return COLOUR_STRONG;
  if (d > threshold)  return COLOUR_MODERATE;
  return COLOUR_NORMAL;
}

function tierLabel(d: number, threshold: number): "normal" | "moderate" | "strong" {
  if (d > 1.0)       return "strong";
  if (d > threshold) return "moderate";
  return "normal";
}

// ─────────────────────────────────────────────────────────────────────────────
// Custom tooltip
// ─────────────────────────────────────────────────────────────────────────────

function CooksTooltip({ active, payload }: { active?: boolean; payload?: any[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const tierColors: Record<string, string> = {
    normal:   "text-green-400",
    moderate: "text-amber-400",
    strong:   "text-red-400",
  };
  const tierLabels: Record<string, string> = {
    normal:   "Normal",
    moderate: "Moderate Influence",
    strong:   "Strong Influence ⚠",
  };
  return (
    <div className="bg-[#0d1829] border border-[#1e2a3a] rounded-lg p-3 text-xs shadow-xl min-w-[200px]">
      <p className="text-slate-300 font-semibold mb-2">Observation #{d.index + 1}</p>
      <div className="space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-slate-400">Cook's D</span>
          <span className="text-white font-mono">{d.cooksD.toFixed(5)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-400">Std. Residual</span>
          <span className="text-white font-mono">{d.stdResidual.toFixed(3)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-400">Leverage h_ii</span>
          <span className="text-white font-mono">{d.leverage.toFixed(4)}</span>
        </div>
        <div className="flex justify-between gap-4 pt-1 border-t border-[#1e2a3a]">
          <span className="text-slate-400">Classification</span>
          <span className={`font-semibold ${tierColors[d.tier]}`}>
            {tierLabels[d.tier]}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export function CooksDistancePlot({
  residuals,
  cooksD,
  leverage,
  k,
}: CooksDistancePlotProps) {
  const [showGuide, setShowGuide] = useState(false);
  const n = residuals.length;
  const threshold4n = 4 / Math.max(n, 1);

  // Standardised residuals
  const residualStd = useMemo(() => {
    const mse = residuals.reduce((s, r) => s + r * r, 0) / Math.max(n - k - 1, 1);
    return Math.sqrt(mse);
  }, [residuals, n, k]);

  // Build chart data — show all observations (up to 500 for perf)
  const chartData = useMemo(() => {
    const MAX_DISPLAY = 500;
    const step = n > MAX_DISPLAY ? Math.ceil(n / MAX_DISPLAY) : 1;
    const data: {
      index: number;
      cooksD: number;
      stdResidual: number;
      leverage: number;
      tier: "normal" | "moderate" | "strong";
      fill: string;
    }[] = [];
    for (let i = 0; i < n; i += step) {
      const d = cooksD[i];
      const tier = tierLabel(d, threshold4n);
      data.push({
        index: i,
        cooksD: d,
        stdResidual: residuals[i] / Math.max(residualStd, 1e-10),
        leverage: leverage[i],
        tier,
        fill: tierColour(d, threshold4n),
      });
    }
    return data;
  }, [cooksD, residuals, leverage, residualStd, threshold4n, n]);

  // Top-10 most influential observations
  const top10: InfluenceRow[] = useMemo(() => {
    return cooksD
      .map((d, i) => ({
        index: i,
        cooksD: d,
        stdResidual: residuals[i] / Math.max(residualStd, 1e-10),
        leverage: leverage[i],
        tier: tierLabel(d, threshold4n),
      }))
      .sort((a, b) => b.cooksD - a.cooksD)
      .slice(0, 10);
  }, [cooksD, residuals, leverage, residualStd, threshold4n]);

  // Summary counts
  const strongCount   = cooksD.filter(d => d > 1.0).length;
  const moderateCount = cooksD.filter(d => d > threshold4n && d <= 1.0).length;
  const maxD          = Math.max(...cooksD, 0);

  return (
    <div className="space-y-4">
      {/* ── Warning banners ─────────────────────────────────────────── */}
      {strongCount > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
          <div className="text-xs text-red-300">
            <span className="font-semibold">{strongCount} strongly influential observation{strongCount > 1 ? "s" : ""} detected</span>
            {" "}(Cook's D &gt; 1.0). These observations may be distorting the regression coefficients.
            Investigate for data entry errors, outlier property characteristics, or non-representative sales.
          </div>
        </div>
      )}
      {moderateCount > 0 && strongCount === 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <Info className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
          <div className="text-xs text-amber-300">
            <span className="font-semibold">{moderateCount} moderately influential observation{moderateCount > 1 ? "s" : ""}</span>
            {" "}(Cook's D &gt; 4/n = {threshold4n.toFixed(4)}). Review the top-10 table below before promoting this model to production.
          </div>
        </div>
      )}

      {/* ── Summary strip ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Observations",         value: n.toLocaleString(),          sub: "total" },
          { label: "Max Cook's D",          value: maxD.toFixed(4),             sub: maxD > 1 ? "⚠ strong" : maxD > threshold4n ? "moderate" : "normal" },
          { label: "Influential (4/n)",     value: (strongCount + moderateCount).toString(), sub: `of ${n}` },
          { label: "Strong (D > 1.0)",      value: strongCount.toString(),      sub: strongCount > 0 ? "⚠ review" : "none" },
        ].map(s => (
          <div key={s.label} className="rounded-lg bg-[rgba(0,255,238,0.04)] border border-[#1e2a3a] px-3 py-2">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">{s.label}</p>
            <p className="text-lg font-bold text-white font-mono">{s.value}</p>
            <p className="text-[10px] text-slate-500">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Bar chart ───────────────────────────────────────────────── */}
      <div style={{ height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={COLOUR_GRID} vertical={false} />
            <XAxis
              dataKey="index"
              stroke={COLOUR_AXIS}
              tick={{ fill: COLOUR_AXIS, fontSize: 10 }}
              label={{ value: "Observation Index", position: "insideBottom", offset: -4, fill: COLOUR_AXIS, fontSize: 11 }}
              tickFormatter={(v: number) => `#${v + 1}`}
              interval={Math.max(Math.floor(chartData.length / 10) - 1, 0)}
            />
            <YAxis
              stroke={COLOUR_AXIS}
              tick={{ fill: COLOUR_AXIS, fontSize: 10 }}
              label={{ value: "Cook's D", angle: -90, position: "insideLeft", offset: 12, fill: COLOUR_AXIS, fontSize: 11 }}
              tickFormatter={(v: number) => v.toFixed(3)}
            />
            <Tooltip content={<CooksTooltip />} />

            {/* 4/n threshold — amber dashed */}
            <ReferenceLine
              y={threshold4n}
              stroke="#f59e0b"
              strokeDasharray="6 3"
              strokeWidth={1.5}
              label={{ value: `4/n = ${threshold4n.toFixed(4)}`, position: "right", fill: "#f59e0b", fontSize: 10 }}
            />
            {/* D = 1.0 strong-influence line — red solid */}
            {maxD >= 0.5 && (
              <ReferenceLine
                y={1.0}
                stroke="#ef4444"
                strokeWidth={1.5}
                label={{ value: "D = 1.0", position: "right", fill: "#ef4444", fontSize: 10 }}
              />
            )}

            <Bar dataKey="cooksD" maxBarSize={12} radius={[2, 2, 0, 0]}>
              {chartData.map((entry, idx) => (
                <Cell key={`cell-${idx}`} fill={entry.fill} fillOpacity={0.85} />
              ))}
            </Bar>
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* ── Legend ──────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-4 text-xs text-slate-400">
        {[
          { colour: COLOUR_NORMAL,   label: `Normal (D ≤ 4/n)` },
          { colour: COLOUR_MODERATE, label: `Moderate (4/n < D ≤ 1.0)` },
          { colour: COLOUR_STRONG,   label: `Strong Influence (D > 1.0)` },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: l.colour }} />
            <span>{l.label}</span>
          </div>
        ))}
      </div>

      {/* ── Top-10 influence table ───────────────────────────────────── */}
      <div>
        <p className="text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
          Top 10 Most Influential Observations
        </p>
        <div className="overflow-x-auto rounded-lg border border-[#1e2a3a]">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#1e2a3a] bg-[rgba(0,255,238,0.04)]">
                {["Rank", "Obs #", "Cook's D", "Std. Residual", "Leverage h_ii", "Classification"].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-slate-400 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {top10.map((row, rank) => {
                const tierColors: Record<string, string> = {
                  normal:   "text-green-400",
                  moderate: "text-amber-400",
                  strong:   "text-red-400",
                };
                const tierBadge: Record<string, string> = {
                  normal:   "Normal",
                  moderate: "Moderate",
                  strong:   "Strong ⚠",
                };
                return (
                  <tr
                    key={row.index}
                    className="border-b border-[#1e2a3a] last:border-0 hover:bg-[rgba(0,255,238,0.03)] transition-colors"
                  >
                    <td className="px-3 py-2 text-slate-500 font-mono">{rank + 1}</td>
                    <td className="px-3 py-2 text-white font-mono">#{row.index + 1}</td>
                    <td className="px-3 py-2 font-mono font-semibold" style={{ color: tierColour(row.cooksD, threshold4n) }}>
                      {row.cooksD.toFixed(5)}
                    </td>
                    <td className={`px-3 py-2 font-mono ${Math.abs(row.stdResidual) > 3 ? "text-red-400" : Math.abs(row.stdResidual) > 2 ? "text-amber-400" : "text-slate-300"}`}>
                      {row.stdResidual.toFixed(3)}
                    </td>
                    <td className="px-3 py-2 font-mono text-slate-300">
                      {row.leverage.toFixed(4)}
                    </td>
                    <td className={`px-3 py-2 font-semibold ${tierColors[row.tier]}`}>
                      {tierBadge[row.tier]}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Interpretation guide (collapsible) ──────────────────────── */}
      <div className="rounded-lg border border-[#1e2a3a] overflow-hidden">
        <button
          className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-slate-400 hover:bg-[rgba(0,255,238,0.03)] transition-colors"
          onClick={() => setShowGuide(g => !g)}
        >
          <span className="flex items-center gap-2 font-medium">
            <BookOpen className="w-3.5 h-3.5" />
            Cook's Distance — Interpretation Guide
          </span>
          {showGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
        {showGuide && (
          <div className="px-4 pb-4 pt-1 text-xs text-slate-400 space-y-2 border-t border-[#1e2a3a]">
            <p>
              <strong className="text-slate-300">What is Cook's Distance?</strong> Cook's D measures how much the
              regression coefficients would change if observation <em>i</em> were removed from the dataset.
              It combines both the residual (how poorly the model fits that point) and the leverage
              (how extreme the predictor values are) into a single influence score.
            </p>
            <p>
              <strong className="text-slate-300">Formula:</strong>{" "}
              <code className="bg-[#0d1829] px-1 rounded">
                D_i = (e_i² / k·MSE) × (h_ii / (1 − h_ii)²)
              </code>{" "}
              where <em>e_i</em> is the raw residual, <em>k</em> is the number of predictors,
              MSE is the mean squared error, and <em>h_ii</em> is the hat-matrix diagonal (leverage).
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              {[
                { colour: COLOUR_NORMAL,   title: "D ≤ 4/n — Normal",          body: "Observation has negligible influence on the model. No action required." },
                { colour: COLOUR_MODERATE, title: "4/n < D ≤ 1.0 — Moderate",  body: "Observation has noticeable influence. Review for data quality or unusual property characteristics." },
                { colour: COLOUR_STRONG,   title: "D > 1.0 — Strong",           body: "Observation substantially shifts the coefficients. IAAO recommends investigation before finalising the model." },
              ].map(g => (
                <div key={g.title} className="rounded border p-2" style={{ borderColor: g.colour + "40", backgroundColor: g.colour + "0d" }}>
                  <p className="font-semibold mb-1" style={{ color: g.colour }}>{g.title}</p>
                  <p>{g.body}</p>
                </div>
              ))}
            </div>
            <p className="text-slate-500 pt-1">
              Source: IAAO Standard on Ratio Studies (2023), §8.3 — Influential Observations and Outlier Treatment.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
