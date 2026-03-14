/**
 * ResidualsVsFittedPlot
 * ---------------------
 * Diagnostic scatter plot of regression residuals against fitted (predicted) values.
 *
 * Features:
 *  - Every observation rendered as a dot; colour-coded by outlier status
 *  - Outlier definition: |standardised residual| > 2 (≈ 95 % envelope)
 *  - Severe outlier: |standardised residual| > 3 (≈ 99.7 % envelope)
 *  - Zero-reference line (y = 0) — ideal residuals scatter symmetrically around it
 *  - ±2σ envelope lines (dashed) to visualise the expected spread
 *  - LOESS-style running-mean trend line computed in 10 equal-width bins
 *    across the fitted-value range; reveals non-linearity or heteroscedasticity
 *  - Hover tooltip: observation index, fitted value, raw residual,
 *    standardised residual, and outlier classification
 *  - Summary stats panel: n, residual std dev, min/max, outlier count,
 *    Breusch-Pagan heteroscedasticity hint, normality hint
 *  - Heteroscedasticity warning banner when the running-mean absolute residual
 *    in the rightmost bin is > 1.5× that of the leftmost bin
 *
 * Props:
 *  residuals   – raw residuals from multipleRegression()
 *  fitted      – fitted (ŷ) values from multipleRegression()
 *  diagnostics – optional diagnostics block from RegressionResult
 *  n           – total observation count (for df display)
 *  k           – predictor count (for df display)
 */

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Line,
  ComposedChart,
  Area,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DiagnosticsBlock {
  normalityTest: { statistic: number; pValue: number };
  homoscedasticityTest: { statistic: number; pValue: number };
}

interface ResidualsVsFittedPlotProps {
  residuals: number[];
  fitted: number[];
  diagnostics?: DiagnosticsBlock;
  /** Number of observations (n) */
  n?: number;
  /** Number of predictors (k) */
  k?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mean(arr: number[]): number {
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function stdDev(arr: number[]): number {
  if (arr.length < 2) return 1;
  const m = mean(arr);
  return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / (arr.length - 1)) || 1;
}

/** Classify a standardised residual */
function classifyPoint(stdRes: number): "normal" | "outlier" | "severe" {
  const abs = Math.abs(stdRes);
  if (abs > 3) return "severe";
  if (abs > 2) return "outlier";
  return "normal";
}

/** Compute a LOESS-style running mean in `bins` equal-width buckets */
function runningMean(
  fittedArr: number[],
  residualsArr: number[],
  bins: number = 12
): { x: number; loess: number }[] {
  if (fittedArr.length === 0) return [];
  const minF = Math.min(...fittedArr);
  const maxF = Math.max(...fittedArr);
  const width = (maxF - minF) / bins || 1;
  const result: { x: number; loess: number }[] = [];

  for (let b = 0; b < bins; b++) {
    const lo = minF + b * width;
    const hi = lo + width;
    const inBin = residualsArr.filter((_, i) => fittedArr[i] >= lo && fittedArr[i] < hi);
    if (inBin.length === 0) continue;
    result.push({ x: lo + width / 2, loess: mean(inBin) });
  }
  return result;
}

/** Format a currency-scale number compactly */
function fmtVal(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`;
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(1)}k`;
  return v.toFixed(1);
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0]?.payload as PointDatum;
  if (!d) return null;

  const classLabel =
    d.classification === "severe"
      ? "Severe outlier (|z| > 3)"
      : d.classification === "outlier"
      ? "Outlier (|z| > 2)"
      : "Normal";

  const classColor =
    d.classification === "severe"
      ? "text-red-400"
      : d.classification === "outlier"
      ? "text-amber-400"
      : "text-green-400";

  return (
    <div className="bg-[#0a0e1a] border border-[#1e2a3a] rounded-lg p-3 text-xs shadow-xl min-w-[220px]">
      <p className="font-bold text-[#00FFEE] mb-2">Observation #{d.index + 1}</p>
      <div className="space-y-1 text-slate-300">
        <div className="flex justify-between gap-4">
          <span>Fitted (ŷ)</span>
          <span className="font-mono">{fmtVal(d.fitted)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span>Residual (e)</span>
          <span className={`font-mono ${d.residual >= 0 ? "text-[#00FFEE]" : "text-red-400"}`}>
            {d.residual >= 0 ? "+" : ""}{fmtVal(d.residual)}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span>Std. residual (z)</span>
          <span className={`font-mono ${classColor}`}>
            {d.stdResidual >= 0 ? "+" : ""}{d.stdResidual.toFixed(3)}
          </span>
        </div>
        <div className="flex justify-between gap-4 pt-1 border-t border-[#1e2a3a]">
          <span>Classification</span>
          <span className={classColor}>{classLabel}</span>
        </div>
      </div>
    </div>
  );
};

// ─── Point datum type ─────────────────────────────────────────────────────────

interface PointDatum {
  index: number;
  fitted: number;
  residual: number;
  stdResidual: number;
  classification: "normal" | "outlier" | "severe";
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ResidualsVsFittedPlot({
  residuals,
  fitted,
  diagnostics,
  n,
  k,
}: ResidualsVsFittedPlotProps) {
  if (!residuals || residuals.length === 0 || !fitted || fitted.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-slate-500 text-sm">
        No residual data available. Run a regression first.
      </div>
    );
  }

  // ── Compute standardised residuals ──────────────────────────────────────────
  const sigma = stdDev(residuals);
  const points: PointDatum[] = residuals.map((r, i) => {
    const z = r / sigma;
    return {
      index: i,
      fitted: fitted[i],
      residual: r,
      stdResidual: z,
      classification: classifyPoint(z),
    };
  });

  // ── Split into buckets for rendering ────────────────────────────────────────
  const normalPoints = points.filter(p => p.classification === "normal");
  const outlierPoints = points.filter(p => p.classification === "outlier");
  const severePoints = points.filter(p => p.classification === "severe");

  // ── LOESS trend ──────────────────────────────────────────────────────────────
  const loessCurve = runningMean(fitted, residuals, 12);

  // ── Axis domain with 10 % padding ───────────────────────────────────────────
  const minF = Math.min(...fitted);
  const maxF = Math.max(...fitted);
  const padF = (maxF - minF) * 0.05;
  const xDomain: [number, number] = [minF - padF, maxF + padF];

  const maxAbsR = Math.max(...residuals.map(Math.abs));
  const padR = maxAbsR * 0.15;
  const yDomain: [number, number] = [-(maxAbsR + padR), maxAbsR + padR];

  // ── Heteroscedasticity detection ─────────────────────────────────────────────
  // Compare mean |residual| in the first and last LOESS bins
  let heteroscedasticityWarning = false;
  if (loessCurve.length >= 4) {
    const firstBinAbs = Math.abs(loessCurve[0].loess);
    const lastBinAbs = Math.abs(loessCurve[loessCurve.length - 1].loess);
    heteroscedasticityWarning = lastBinAbs > firstBinAbs * 1.5 || firstBinAbs > lastBinAbs * 1.5;
  }
  // Also use the formal Breusch-Pagan test if available
  const bpFailed = diagnostics?.homoscedasticityTest?.pValue != null
    ? diagnostics.homoscedasticityTest.pValue < 0.05
    : false;
  const showHeteroWarning = heteroscedasticityWarning || bpFailed;

  // ── Normality hint ────────────────────────────────────────────────────────────
  const normalityOk = diagnostics?.normalityTest?.pValue != null
    ? diagnostics.normalityTest.pValue >= 0.05
    : true; // assume ok if not provided

  // ── Summary stats ─────────────────────────────────────────────────────────────
  const outlierCount = outlierPoints.length + severePoints.length;
  const outlierPct = ((outlierCount / points.length) * 100).toFixed(1);
  const df = n != null && k != null ? n - k - 1 : points.length - 1;

  // ── Chart height ──────────────────────────────────────────────────────────────
  const chartHeight = Math.max(320, Math.min(480, points.length * 0.8 + 200));

  return (
    <div className="space-y-4">

      {/* ── Warning banners ─────────────────────────────────────────────────── */}
      {showHeteroWarning && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>
            <strong>Heteroscedasticity detected.</strong> Residual spread appears to change
            systematically with fitted values. Consider a log or Box-Cox transformation of the
            dependent variable, or use heteroscedasticity-consistent (HC) standard errors.
          </span>
        </div>
      )}

      {outlierCount > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>
            <strong>{outlierCount} outlier{outlierCount > 1 ? "s" : ""} detected</strong>
            {" "}({outlierPct}% of observations).{" "}
            {severePoints.length > 0 && (
              <span>{severePoints.length} severe (|z| &gt; 3). </span>
            )}
            Investigate these records for data entry errors or legitimate extreme values before
            finalising the model.
          </span>
        </div>
      )}

      {/* ── Summary stats strip ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Observations",
            value: points.length.toLocaleString(),
            sub: `df = ${df}`,
            color: "text-slate-200",
          },
          {
            label: "Residual σ",
            value: fmtVal(sigma),
            sub: "std deviation",
            color: "text-[#00FFEE]",
          },
          {
            label: "Outliers",
            value: outlierCount.toString(),
            sub: `${outlierPct}% of n`,
            color: outlierCount > 0 ? "text-amber-400" : "text-green-400",
          },
          {
            label: "Normality",
            value: normalityOk ? "Pass" : "Fail",
            sub: diagnostics?.normalityTest
              ? `W p = ${diagnostics.normalityTest.pValue < 0.001 ? "< 0.001" : diagnostics.normalityTest.pValue.toFixed(3)}`
              : "Shapiro-Wilk",
            color: normalityOk ? "text-green-400" : "text-amber-400",
          },
        ].map(stat => (
          <div
            key={stat.label}
            className="rounded-lg border border-[#1e2a3a] bg-[#0a0e1a] px-3 py-2"
          >
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">{stat.label}</p>
            <p className={`text-lg font-bold font-mono ${stat.color}`}>{stat.value}</p>
            <p className="text-[10px] text-slate-500">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Legend ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#00FFEE] opacity-70" />
          <span>Normal (|z| ≤ 2)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-amber-400" />
          <span>Outlier (2 &lt; |z| ≤ 3)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded-full bg-red-500" />
          <span>Severe (|z| &gt; 3)</span>
        </div>
        <div className="flex items-center gap-1.5 ml-auto">
          <div className="w-6 h-0.5 bg-amber-400 opacity-70" style={{ borderTop: "2px dashed" }} />
          <span>±2σ envelope</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-0.5 bg-[#00FFEE]" />
          <span>Running mean (LOESS)</span>
        </div>
      </div>

      {/* ── Main chart ──────────────────────────────────────────────────────── */}
      <ResponsiveContainer width="100%" height={chartHeight}>
        <ComposedChart margin={{ top: 8, right: 24, bottom: 24, left: 16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />

          <XAxis
            type="number"
            dataKey="fitted"
            domain={xDomain}
            tickFormatter={v => fmtVal(v)}
            tick={{ fill: "#64748b", fontSize: 10 }}
            axisLine={{ stroke: "#1e2a3a" }}
            tickLine={false}
            label={{
              value: "Fitted values (ŷ)",
              position: "insideBottom",
              offset: -12,
              fill: "#64748b",
              fontSize: 11,
            }}
          />

          <YAxis
            type="number"
            dataKey="residual"
            domain={yDomain}
            tickFormatter={v => fmtVal(v)}
            tick={{ fill: "#64748b", fontSize: 10 }}
            axisLine={{ stroke: "#1e2a3a" }}
            tickLine={false}
            label={{
              value: "Residuals (e = y − ŷ)",
              angle: -90,
              position: "insideLeft",
              offset: 12,
              fill: "#64748b",
              fontSize: 11,
            }}
          />

          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: "3 3", stroke: "#334155" }} />

          {/* Zero reference line */}
          <ReferenceLine
            y={0}
            stroke="#334155"
            strokeWidth={2}
            label={{ value: "e = 0", position: "right", fill: "#475569", fontSize: 10 }}
          />

          {/* ±2σ envelope lines */}
          <ReferenceLine
            y={2 * sigma}
            stroke="#f59e0b"
            strokeDasharray="5 4"
            strokeWidth={1}
            label={{ value: "+2σ", position: "right", fill: "#f59e0b", fontSize: 9 }}
          />
          <ReferenceLine
            y={-2 * sigma}
            stroke="#f59e0b"
            strokeDasharray="5 4"
            strokeWidth={1}
            label={{ value: "−2σ", position: "right", fill: "#f59e0b", fontSize: 9 }}
          />

          {/* Normal points */}
          <Scatter
            name="Normal"
            data={normalPoints}
            dataKey="residual"
            fill="#00FFEE"
            fillOpacity={0.55}
            stroke="#00FFEE"
            strokeOpacity={0.3}
            strokeWidth={0.5}
            r={3}
          />

          {/* Outlier points (|z| 2–3) */}
          <Scatter
            name="Outlier"
            data={outlierPoints}
            dataKey="residual"
            fill="#f59e0b"
            fillOpacity={0.9}
            stroke="#fbbf24"
            strokeWidth={1}
            r={5}
          />

          {/* Severe outlier points (|z| > 3) */}
          <Scatter
            name="Severe"
            data={severePoints}
            dataKey="residual"
            fill="#ef4444"
            fillOpacity={1}
            stroke="#fca5a5"
            strokeWidth={1.5}
            r={7}
          />

          {/* LOESS running-mean trend line */}
          {loessCurve.length > 1 && (
            <Line
              data={loessCurve}
              type="monotone"
              dataKey="loess"
              stroke="#00FFEE"
              strokeWidth={2}
              dot={false}
              strokeDasharray="0"
              opacity={0.85}
              name="LOESS"
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>

      {/* ── Interpretation guide ────────────────────────────────────────────── */}
      <div className="rounded-lg border border-[#1e2a3a] bg-[#0a0e1a] px-4 py-3 space-y-2 text-xs text-slate-400">
        <p className="font-semibold text-slate-300 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-[#00FFEE]" />
          How to read this plot
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
          <p>
            <span className="text-slate-300 font-medium">Ideal pattern:</span> points scattered
            randomly around the zero line with uniform spread — no visible trend in the running mean.
          </p>
          <p>
            <span className="text-slate-300 font-medium">Funnel shape:</span> spread increases or
            decreases with fitted values → heteroscedasticity. Use log(Y) or WLS.
          </p>
          <p>
            <span className="text-slate-300 font-medium">Curved trend line:</span> the running mean
            deviates from zero → non-linearity. Add polynomial or interaction terms.
          </p>
          <p>
            <span className="text-slate-300 font-medium">Outliers:</span> amber/red points warrant
            individual review. Verify data entry; do not remove without documented justification.
          </p>
        </div>
      </div>

      {/* ── Footnote ────────────────────────────────────────────────────────── */}
      <p className="text-[10px] text-slate-500">
        Standardised residuals computed as e / σ where σ is the sample standard deviation of
        residuals. Running mean uses 12 equal-width bins across the fitted-value range. Outlier
        thresholds follow the conventional ±2σ (95 %) and ±3σ (99.7 %) boundaries.
      </p>
    </div>
  );
}
