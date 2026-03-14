import { useMemo } from "react";
import { AlertTriangle, Download, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

interface CorrelationMatrixHeatmapProps {
  /** Variable names in order */
  variables: string[];
  /** n×n correlation matrix */
  matrix: number[][];
  /** Human-readable labels for each variable */
  labels?: Record<string, string>;
  /** VIF values per variable from the last regression run (optional) */
  vif?: Record<string, number>;
  /** Called when the user clicks the Download CSV button */
  onExportCSV?: () => void;
}

/**
 * Generate an IAAO-format CSV string for the correlation matrix.
 * Columns: Variable A, Variable B, Pearson r, |r|, Strength, VIF (A), VIF (B)
 */
export function buildCorrelationMatrixCSV(
  variables: string[],
  matrix: number[][],
  labels: Record<string, string> = {},
  vif: Record<string, number> = {}
): string {
  const now = new Date().toISOString().slice(0, 10);
  const n = variables.length;

  const getLabel = (v: string) => labels[v] || v;

  function strengthLabel(r: number): string {
    const abs = Math.abs(r);
    if (abs >= 0.9) return "Very Strong";
    if (abs >= 0.7) return "Strong";
    if (abs >= 0.5) return "Moderate";
    if (abs >= 0.3) return "Weak";
    return "Negligible";
  }

  const lines: string[] = [
    `# TerraFusion Correlation Matrix Export`,
    `# Generated: ${now}`,
    `# Variables: ${n}`,
    `# Source: IAAO Standard on Ratio Studies (2023) § 8.2 — Multicollinearity Diagnostics`,
    ``,
    `Variable A,Variable B,Pearson r,|r|,Strength,VIF (A),VIF (B)`,
  ];

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const r = matrix[i][j];
      const vifA = vif[variables[i]] != null ? vif[variables[i]].toFixed(3) : "N/A";
      const vifB = vif[variables[j]] != null ? vif[variables[j]].toFixed(3) : "N/A";
      lines.push(
        [
          `"${getLabel(variables[i])}"`,
          `"${getLabel(variables[j])}"`,
          r.toFixed(6),
          Math.abs(r).toFixed(6),
          `"${strengthLabel(r)}"`,
          vifA,
          vifB,
        ].join(",")
      );
    }
  }

  // Diagonal (self-correlations) as a separate section
  lines.push(``);
  lines.push(`# Diagonal (self-correlations = 1.000)`);
  lines.push(`Variable,VIF`);
  for (let i = 0; i < n; i++) {
    const vifVal = vif[variables[i]] != null ? vif[variables[i]].toFixed(3) : "N/A";
    lines.push(`"${getLabel(variables[i])}",${vifVal}`);
  }

  return lines.join("\n");
}

/**
 * Trigger a browser download of a text string as a file.
 */
function downloadTextFile(content: string, filename: string, mimeType = "text/csv") {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Interpolate between two RGB colors at position t ∈ [0, 1].
 */
function lerpColor(
  r1: number, g1: number, b1: number,
  r2: number, g2: number, b2: number,
  t: number
): string {
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r},${g},${b})`;
}

/**
 * Map a Pearson r value ∈ [-1, 1] to a color:
 *   -1  →  deep red   (#FF3366)
 *    0  →  near-white (#1a2035)  (matches dark card background)
 *   +1  →  deep cyan  (#00FFEE)
 */
function corrToColor(r: number): string {
  if (r >= 0) {
    // white → cyan
    return lerpColor(26, 32, 53, 0, 255, 238, r);
  } else {
    // white → red
    return lerpColor(26, 32, 53, 255, 51, 102, -r);
  }
}

/** Text color that contrasts against the cell background */
function textColor(r: number): string {
  const absR = Math.abs(r);
  // For strong correlations the background is saturated — use dark text
  // For weak correlations the background is near-dark — use light text
  return absR > 0.55 ? "rgba(10,14,26,0.95)" : "rgba(255,255,255,0.85)";
}

/** VIF severity label */
function vifSeverity(v: number): { label: string; color: string } {
  if (v >= 10) return { label: "Severe", color: "#FF3366" };
  if (v >= 5)  return { label: "High",   color: "#FFAA00" };
  if (v >= 2.5) return { label: "Moderate", color: "#FFD700" };
  return { label: "OK", color: "#00FFEE" };
}

export function CorrelationMatrixHeatmap({
  variables,
  matrix,
  labels = {},
  vif,
  onExportCSV,
}: CorrelationMatrixHeatmapProps) {

  const handleDownload = () => {
    if (onExportCSV) {
      onExportCSV();
      return;
    }
    // Fallback: generate and download directly from component
    const csv = buildCorrelationMatrixCSV(variables, matrix, labels, vif ?? {});
    const now = new Date().toISOString().slice(0, 10);
    downloadTextFile(csv, `correlation-matrix-${now}.csv`);
  };
  const n = variables.length;

  /** Find all high-correlation pairs (|r| > 0.7, off-diagonal) */
  const highCorrPairs = useMemo(() => {
    const pairs: { i: number; j: number; r: number }[] = [];
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        if (Math.abs(matrix[i][j]) > 0.7) {
          pairs.push({ i, j, r: matrix[i][j] });
        }
      }
    }
    return pairs;
  }, [matrix, n]);

  const getLabel = (v: string) => labels[v] || v;

  // Cell size in px — shrink for many variables
  const cellSize = n <= 4 ? 80 : n <= 6 ? 68 : n <= 8 ? 56 : 48;
  const labelWidth = 110;
  const legendHeight = 28;
  const legendWidth = 220;

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Warning banner for high-correlation pairs */}
        {highCorrPairs.length > 0 && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
            <div className="text-sm">
              <span className="font-semibold text-amber-400">
                {highCorrPairs.length} high-correlation {highCorrPairs.length === 1 ? "pair" : "pairs"} detected
              </span>
              <span className="text-text-secondary ml-1">
                (|r| &gt; 0.70) — multicollinearity may inflate standard errors.
              </span>
              <ul className="mt-1 space-y-0.5 text-text-secondary">
                {highCorrPairs.map(({ i, j, r }) => (
                  <li key={`${i}-${j}`} className="font-mono text-xs">
                    {getLabel(variables[i])} ↔ {getLabel(variables[j])}{" "}
                    <span className={r > 0 ? "text-cyan-400" : "text-red-400"}>
                      r = {r.toFixed(3)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Heatmap grid */}
        <div className="overflow-x-auto">
          <div
            style={{ minWidth: labelWidth + n * cellSize + 16 }}
            className="relative"
          >
            {/* Column headers */}
            <div
              className="flex"
              style={{ marginLeft: labelWidth }}
            >
              {variables.map((v) => (
                <div
                  key={v}
                  style={{ width: cellSize, minWidth: cellSize }}
                  className="text-center text-[11px] font-medium text-text-secondary pb-1 truncate px-0.5"
                  title={getLabel(v)}
                >
                  {getLabel(v).length > 10 ? getLabel(v).slice(0, 9) + "…" : getLabel(v)}
                </div>
              ))}
            </div>

            {/* Rows */}
            {variables.map((rowVar, i) => (
              <div key={rowVar} className="flex items-center">
                {/* Row label */}
                <div
                  style={{ width: labelWidth, minWidth: labelWidth }}
                  className="text-right pr-3 text-[11px] font-medium text-text-secondary truncate"
                  title={getLabel(rowVar)}
                >
                  {getLabel(rowVar)}
                </div>

                {/* Cells */}
                {variables.map((colVar, j) => {
                  const r = matrix[i][j];
                  const isDiag = i === j;
                  const isHighCorr = !isDiag && Math.abs(r) > 0.7;

                  return (
                    <Tooltip key={colVar}>
                      <TooltipTrigger asChild>
                        <div
                          style={{
                            width: cellSize,
                            minWidth: cellSize,
                            height: cellSize,
                            backgroundColor: corrToColor(r),
                            color: textColor(r),
                            border: isHighCorr
                              ? "2px solid rgba(255,170,0,0.9)"
                              : isDiag
                              ? "2px solid rgba(0,255,238,0.3)"
                              : "1px solid rgba(255,255,255,0.06)",
                            boxShadow: isHighCorr
                              ? "inset 0 0 0 1px rgba(255,170,0,0.4)"
                              : undefined,
                          }}
                          className="flex items-center justify-center cursor-default select-none"
                        >
                          <span
                            style={{ fontSize: cellSize >= 68 ? 13 : 11 }}
                            className="font-mono font-semibold"
                          >
                            {isDiag ? "1.00" : r.toFixed(2)}
                          </span>
                          {isHighCorr && (
                            <span
                              className="absolute top-0.5 right-0.5 text-amber-400"
                              style={{ fontSize: 8 }}
                            >
                              ▲
                            </span>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent
                        side="top"
                        className="bg-[var(--color-government-night-base)] border-white/20 text-xs"
                      >
                        <p className="font-semibold">
                          {getLabel(rowVar)} ↔ {getLabel(colVar)}
                        </p>
                        <p className="font-mono text-cyan-400">
                          r = {r.toFixed(4)}
                        </p>
                        {!isDiag && (
                          <p className="text-text-secondary mt-0.5">
                            {Math.abs(r) >= 0.9
                              ? "Very strong correlation"
                              : Math.abs(r) >= 0.7
                              ? "Strong correlation — multicollinearity risk"
                              : Math.abs(r) >= 0.5
                              ? "Moderate correlation"
                              : Math.abs(r) >= 0.3
                              ? "Weak correlation"
                              : "Negligible correlation"}
                          </p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* VIF table */}
        {vif && Object.keys(vif).length > 0 && (
          <div className="mt-2">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
                Variance Inflation Factors
              </span>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-3.5 h-3.5 text-text-tertiary" />
                </TooltipTrigger>
                <TooltipContent className="bg-[var(--color-government-night-base)] border-white/20 text-xs max-w-[220px]">
                  VIF measures how much a variable's variance is inflated by collinearity.
                  VIF &gt; 5 is concerning; VIF &gt; 10 is severe.
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex flex-wrap gap-2">
              {variables.map((v) => {
                const vifVal = vif[v];
                if (vifVal === undefined) return null;
                const { label: sev, color } = vifSeverity(vifVal);
                return (
                  <div
                    key={v}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs"
                    style={{
                      backgroundColor: `${color}15`,
                      border: `1px solid ${color}40`,
                    }}
                  >
                    <span className="text-text-secondary">{getLabel(v)}</span>
                    <span className="font-mono font-bold" style={{ color }}>
                      {vifVal.toFixed(2)}
                    </span>
                    <span className="text-[10px]" style={{ color }}>
                      {sev}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Download button */}
        <div className="flex justify-end pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="gap-2 text-xs border-[#1e2a3a] text-slate-300 hover:text-white hover:border-[#00FFEE]/40 hover:bg-[rgba(0,255,238,0.06)]"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </Button>
        </div>

        {/* Color legend */}
        <div className="flex items-center gap-3 pt-1">
          <span className="text-[11px] text-text-tertiary">−1.0</span>
          <div
            className="rounded"
            style={{
              width: legendWidth,
              height: legendHeight,
              background:
                "linear-gradient(to right, #FF3366, #1a2035 50%, #00FFEE)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          />
          <span className="text-[11px] text-text-tertiary">+1.0</span>
          <div className="ml-4 flex items-center gap-1.5 text-[11px] text-text-tertiary">
            <span
              className="inline-block w-3 h-3 rounded-sm border-2 border-amber-400"
            />
            |r| &gt; 0.70 — high collinearity
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
