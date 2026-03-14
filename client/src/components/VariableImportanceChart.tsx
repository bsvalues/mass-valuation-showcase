import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface VariableImportanceChartProps {
  /** Raw (unstandardized) coefficients from regression */
  coefficients: { [variable: string]: number };
  /** Standard errors per variable */
  standardErrors: { [variable: string]: number };
  /** t-statistics per variable */
  tStatistics: { [variable: string]: number };
  /** p-values per variable */
  pValues: { [variable: string]: number };
  /** VIF values per variable */
  vif: { [variable: string]: number };
  /** Raw data arrays used in regression, keyed by variable name */
  variableData: { [variable: string]: number[] };
  /** Outcome (Y) data array used in regression */
  outcomeData: number[];
  /** Human-readable labels for variable names */
  variableLabels?: { [variable: string]: string };
}

interface BarEntry {
  variable: string;
  label: string;
  standardizedBeta: number;
  absBeta: number;
  tStat: number;
  pValue: number;
  vif: number;
  significant: boolean;
  direction: "positive" | "negative";
  sigLabel: string;
}

/** Compute population standard deviation */
function stdDev(arr: number[]): number {
  if (arr.length < 2) return 1;
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const variance = arr.reduce((sum, x) => sum + (x - mean) ** 2, 0) / arr.length;
  return Math.sqrt(variance) || 1;
}

function getSigLabel(p: number): string {
  if (p < 0.001) return "***";
  if (p < 0.01) return "**";
  if (p < 0.05) return "*";
  return "ns";
}

function formatP(p: number): string {
  if (p < 0.001) return "< 0.001";
  if (p < 0.01) return "< 0.01";
  if (p < 0.05) return "< 0.05";
  return p.toFixed(3);
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload.length) return null;
  const d: BarEntry = payload[0].payload;
  return (
    <div className="bg-[#0a0e1a] border border-[#1e2a3a] rounded-lg p-3 text-xs shadow-xl min-w-[200px]">
      <p className="font-bold text-[#00FFEE] mb-2">{d.label}</p>
      <div className="space-y-1 text-slate-300">
        <div className="flex justify-between gap-4">
          <span>Standardized β</span>
          <span className={d.direction === "positive" ? "text-[#00FFEE]" : "text-red-400"}>
            {d.standardizedBeta > 0 ? "+" : ""}{d.standardizedBeta.toFixed(4)}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span>t-statistic</span>
          <span>{d.tStat.toFixed(3)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span>p-value</span>
          <span className={d.significant ? "text-green-400" : "text-amber-400"}>
            {formatP(d.pValue)}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span>VIF</span>
          <span className={d.vif > 10 ? "text-red-400" : d.vif > 5 ? "text-amber-400" : "text-green-400"}>
            {d.vif.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span>Significance</span>
          <span className={d.significant ? "text-green-400" : "text-slate-500"}>
            {d.sigLabel === "ns" ? "Not significant" : `Significant (${d.sigLabel})`}
          </span>
        </div>
      </div>
    </div>
  );
};

/** Custom label shown at the end of each bar */
const BarLabel = (props: any) => {
  const { x, y, width, height, value, payload } = props;
  if (!payload) return null;
  const d: BarEntry = payload;
  const isPositive = d.direction === "positive";
  const labelX = isPositive ? x + width + 6 : x + width - 6;
  const anchor = isPositive ? "start" : "end";
  return (
    <text
      x={labelX}
      y={y + height / 2}
      dy={4}
      textAnchor={anchor}
      fontSize={10}
      fill={d.significant ? (isPositive ? "#00FFEE" : "#f87171") : "#64748b"}
    >
      {d.sigLabel !== "ns" ? `${d.sigLabel} t=${d.tStat.toFixed(2)}` : `ns p=${formatP(d.pValue)}`}
    </text>
  );
};

export function VariableImportanceChart({
  coefficients,
  standardErrors,
  tStatistics,
  pValues,
  vif,
  variableData,
  outcomeData,
  variableLabels = {},
}: VariableImportanceChartProps) {
  const sigThreshold = 1.96; // |t| for p ≈ 0.05

  // Compute standardized betas: β* = β × σx / σy
  const sigmaY = stdDev(outcomeData);

  const entries: BarEntry[] = Object.keys(coefficients).map(varName => {
    const rawBeta = coefficients[varName];
    const sigmaX = variableData[varName] ? stdDev(variableData[varName]) : 1;
    const stdBeta = rawBeta * (sigmaX / sigmaY);
    const t = tStatistics[varName] ?? 0;
    const p = pValues[varName] ?? 1;
    return {
      variable: varName,
      label: variableLabels[varName] || varName,
      standardizedBeta: stdBeta,
      absBeta: Math.abs(stdBeta),
      tStat: t,
      pValue: p,
      vif: vif[varName] ?? 1,
      significant: p < 0.05,
      direction: stdBeta >= 0 ? "positive" : "negative",
      sigLabel: getSigLabel(p),
    };
  });

  // Sort by absolute standardized beta descending
  const sorted = [...entries].sort((a, b) => b.absBeta - a.absBeta);

  const hasInsignificant = sorted.some(e => !e.significant);
  const maxAbs = Math.max(...sorted.map(e => e.absBeta), 0.01);
  const domainPad = maxAbs * 1.35; // extra room for labels

  // Dynamic chart height: at least 200px, 52px per variable
  const chartHeight = Math.max(200, sorted.length * 52 + 60);

  return (
    <div className="space-y-4">
      {/* Legend row */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-[#00FFEE]" />
          <span>Positive effect</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-red-500" />
          <span>Negative effect</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-slate-600 opacity-40" />
          <span>Not significant (p ≥ 0.05)</span>
        </div>
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-amber-400 font-mono">|t| = {sigThreshold}</span>
          <span>significance threshold</span>
        </div>
      </div>

      {/* Bar chart */}
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart
          data={sorted}
          layout="vertical"
          margin={{ top: 4, right: 120, left: 0, bottom: 4 }}
          barSize={20}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#1e2a3a"
            horizontal={false}
          />
          <XAxis
            type="number"
            domain={[-domainPad, domainPad]}
            tickFormatter={v => v.toFixed(2)}
            tick={{ fill: "#64748b", fontSize: 10 }}
            axisLine={{ stroke: "#1e2a3a" }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={110}
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,255,238,0.04)" }} />

          {/* Zero baseline */}
          <ReferenceLine x={0} stroke="#334155" strokeWidth={1.5} />

          {/* Significance threshold lines */}
          <ReferenceLine
            x={sigThreshold * 0.05}
            stroke="#f59e0b"
            strokeDasharray="4 3"
            strokeWidth={1}
            label={{ value: "p=0.05", position: "top", fill: "#f59e0b", fontSize: 9 }}
          />
          <ReferenceLine
            x={-(sigThreshold * 0.05)}
            stroke="#f59e0b"
            strokeDasharray="4 3"
            strokeWidth={1}
          />

          <Bar dataKey="standardizedBeta" radius={[0, 3, 3, 0]}>
            {sorted.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={
                  !entry.significant
                    ? "#334155"
                    : entry.direction === "positive"
                    ? "#00FFEE"
                    : "#ef4444"
                }
                opacity={entry.significant ? 1 : 0.45}
              />
            ))}
            <LabelList
              dataKey="standardizedBeta"
              content={<BarLabel />}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Summary table */}
      <div className="overflow-x-auto rounded-lg border border-[#1e2a3a]">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#1e2a3a] bg-[#0a0e1a]">
              <th className="text-left px-3 py-2 text-slate-400 font-medium">Rank</th>
              <th className="text-left px-3 py-2 text-slate-400 font-medium">Variable</th>
              <th className="text-right px-3 py-2 text-slate-400 font-medium">Std. β</th>
              <th className="text-right px-3 py-2 text-slate-400 font-medium">|Std. β|</th>
              <th className="text-right px-3 py-2 text-slate-400 font-medium">t-stat</th>
              <th className="text-right px-3 py-2 text-slate-400 font-medium">p-value</th>
              <th className="text-right px-3 py-2 text-slate-400 font-medium">VIF</th>
              <th className="text-center px-3 py-2 text-slate-400 font-medium">Sig.</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((entry, i) => (
              <tr
                key={entry.variable}
                className={`border-b border-[#1e2a3a] ${i % 2 === 0 ? "bg-[#0d1220]" : "bg-[#0a0e1a]"} ${!entry.significant ? "opacity-60" : ""}`}
              >
                <td className="px-3 py-2 text-slate-500 font-mono">#{i + 1}</td>
                <td className="px-3 py-2 font-medium text-slate-200">
                  <div className="flex items-center gap-1.5">
                    {entry.direction === "positive" ? (
                      <TrendingUp className="w-3 h-3 text-[#00FFEE]" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-red-400" />
                    )}
                    {entry.label}
                  </div>
                </td>
                <td className={`px-3 py-2 text-right font-mono ${entry.direction === "positive" ? "text-[#00FFEE]" : "text-red-400"}`}>
                  {entry.standardizedBeta > 0 ? "+" : ""}{entry.standardizedBeta.toFixed(4)}
                </td>
                <td className="px-3 py-2 text-right font-mono text-slate-300">
                  {entry.absBeta.toFixed(4)}
                </td>
                <td className="px-3 py-2 text-right font-mono text-slate-300">
                  {entry.tStat.toFixed(3)}
                </td>
                <td className={`px-3 py-2 text-right font-mono ${entry.significant ? "text-green-400" : "text-amber-400"}`}>
                  {formatP(entry.pValue)}
                </td>
                <td className={`px-3 py-2 text-right font-mono ${entry.vif > 10 ? "text-red-400" : entry.vif > 5 ? "text-amber-400" : "text-green-400"}`}>
                  {entry.vif.toFixed(2)}
                </td>
                <td className="px-3 py-2 text-center">
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-1.5 py-0 ${
                      entry.sigLabel === "***"
                        ? "border-green-500 text-green-400"
                        : entry.sigLabel === "**"
                        ? "border-green-400 text-green-300"
                        : entry.sigLabel === "*"
                        ? "border-amber-400 text-amber-300"
                        : "border-slate-600 text-slate-500"
                    }`}
                  >
                    {entry.sigLabel}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footnote */}
      <div className="text-[10px] text-slate-500 space-y-0.5">
        <p>
          Standardized β = raw coefficient × (σx / σy). Bars sorted by |Std. β| descending.
          Dashed lines mark the p = 0.05 significance boundary.
        </p>
        {hasInsignificant && (
          <p className="flex items-center gap-1 text-amber-400/70">
            <AlertTriangle className="w-3 h-3" />
            Dimmed bars indicate variables that do not reach statistical significance (p ≥ 0.05).
            Consider removing them to improve model parsimony.
          </p>
        )}
      </div>
    </div>
  );
}
