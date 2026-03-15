/**
 * VersionHistoryPanel — Phase AH
 *
 * Displays a full version history of calibration snapshots for a county.
 * Features:
 *   • Timeline list with version badges, IAAO metrics, and timestamps
 *   • Two-snapshot selector for side-by-side cost-rate diff
 *   • One-click rollback (clones target as new active snapshot)
 *   • Load-into-editor shortcut
 */
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  ArrowDown, ArrowUp, Clock, Database, Download, FileSpreadsheet,
  FileText, GitCompare, History, Loader2, Minus, RotateCcw, Star, Zap,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ─── Export helper ────────────────────────────────────────────────────────────
function triggerDownload(url: string) {
  const a = document.createElement("a");
  a.href = url;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => document.body.removeChild(a), 200);
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface Snapshot {
  id: number;
  name: string;
  description?: string | null;
  countyName?: string | null;
  costRates: Record<string, number>;
  snapshotMedianRatio?: number | null;
  snapshotCod?: number | null;
  snapshotPrd?: number | null;
  isActive: number;
  createdAt: Date;
  version: number;
}

interface VersionHistoryPanelProps {
  countyName: string;
  /** Called when user clicks "Load" on a snapshot */
  onLoad: (snapshot: Snapshot) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function relativeTime(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

function DeltaBadge({ delta, pct }: { delta: number | null; pct: number | null }) {
  if (delta === null) return <span className="text-slate-500 text-xs">N/A</span>;
  if (delta === 0) return (
    <span className="flex items-center gap-0.5 text-slate-400 text-xs">
      <Minus className="w-3 h-3" />0
    </span>
  );
  const isUp = delta > 0;
  return (
    <span className={`flex items-center gap-0.5 text-xs font-mono font-semibold ${isUp ? "text-emerald-400" : "text-red-400"}`}>
      {isUp ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
      {isUp ? "+" : ""}{delta.toFixed(1)}
      {pct !== null && (
        <span className="text-slate-500 font-normal ml-0.5">({pct > 0 ? "+" : ""}{pct.toFixed(1)}%)</span>
      )}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function VersionHistoryPanel({ countyName, onLoad }: VersionHistoryPanelProps) {
  const utils = trpc.useUtils();

  // Timeline data
  const { data: snapshots = [], isLoading } = trpc.calibration.list.useQuery(
    { countyName },
    { refetchOnWindowFocus: false }
  );

  // Compare selector state
  const [compareIdA, setCompareIdA] = useState<string>("");
  const [compareIdB, setCompareIdB] = useState<string>("");
  const [compareOpen, setCompareOpen] = useState(false);

  // Fetch comparison when both IDs are set
  const { data: compareData, isLoading: compareLoading } = trpc.calibration.compare.useQuery(
    { idA: Number(compareIdA), idB: Number(compareIdB) },
    { enabled: !!compareIdA && !!compareIdB && compareIdA !== compareIdB }
  );

  // Rollback mutation
  const rollbackMutation = trpc.calibration.rollback.useMutation({
    onSuccess: (data) => {
      toast.success(`Rolled back to "${data.originalName}"`, {
        description: `New active snapshot: "${data.name}"`,
      });
      utils.calibration.list.invalidate();
      utils.calibration.getActive.invalidate();
    },
    onError: (err) => toast.error(`Rollback failed: ${err.message}`),
  });

  const [rollbackingId, setRollbackingId] = useState<number | null>(null);

  const handleRollback = async (snapshot: Snapshot) => {
    setRollbackingId(snapshot.id);
    await rollbackMutation.mutateAsync({ id: snapshot.id });
    setRollbackingId(null);
  };

  // Sorted snapshots (newest first = highest version first)
  const sortedSnapshots = useMemo(
    () => [...snapshots].sort((a, b) => b.version - a.version),
    [snapshots]
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-purple-400" />
          <h3 className="text-base font-semibold text-white">Version History</h3>
          {snapshots.length > 0 && (
            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs">
              {snapshots.length} snapshot{snapshots.length !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>

        {/* Header action buttons */}
        <div className="flex items-center gap-2">
        {snapshots.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 text-xs"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Export History
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#0b1020] border-white/10 text-white">
              <DropdownMenuLabel className="text-slate-400 text-xs">Full History — {countyName} County</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem
                className="text-sm cursor-pointer hover:bg-white/10 focus:bg-white/10"
                onClick={() => triggerDownload(`/api/calibration/history/export.csv?county=${encodeURIComponent(countyName)}`)}
              >
                <FileSpreadsheet className="w-4 h-4 mr-2 text-emerald-400" />
                Download CSV
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-sm cursor-pointer hover:bg-white/10 focus:bg-white/10"
                onClick={() => triggerDownload(`/api/calibration/history/export.pdf?county=${encodeURIComponent(countyName)}`)}
              >
                <FileText className="w-4 h-4 mr-2 text-red-400" />
                Download PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {/* Compare trigger */}
        {snapshots.length >= 2 && (
          <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10 text-xs"
              >
                <GitCompare className="w-3.5 h-3.5 mr-1.5" />
                Compare Versions
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#0b1020] border-purple-500/30 max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-purple-300 flex items-center gap-2">
                  <GitCompare className="w-5 h-5" />
                  Side-by-Side Cost Rate Comparison
                </DialogTitle>
              </DialogHeader>
              <ComparePanel
                snapshots={sortedSnapshots}
                compareIdA={compareIdA}
                compareIdB={compareIdB}
                setCompareIdA={setCompareIdA}
                setCompareIdB={setCompareIdB}
                compareData={compareData}
                compareLoading={compareLoading}
              />
            </DialogContent>
          </Dialog>
        )}
        </div>
      </div>

      {/* Timeline */}
      {isLoading ? (
        <div className="flex items-center gap-2 text-slate-400 py-4">
          <Loader2 className="w-4 h-4 animate-spin" />Loading history…
        </div>
      ) : sortedSnapshots.length === 0 ? (
        <div className="text-center py-10 text-slate-500 text-sm space-y-2">
          <Database className="w-8 h-8 mx-auto text-slate-600" />
          <p>No snapshots yet for {countyName} County.</p>
          <p className="text-xs">Adjust rates and click "Save Snapshot" to start versioning.</p>
        </div>
      ) : (
        <div className="relative">
          {/* Vertical timeline line */}
          <div className="absolute left-[19px] top-6 bottom-6 w-px bg-white/10" />
          <div className="space-y-3">
            {sortedSnapshots.map((snap, idx) => (
              <TimelineEntry
                key={snap.id}
                snapshot={snap}
                isFirst={idx === 0}
                isRollingBack={rollbackingId === snap.id}
                onLoad={() => onLoad(snap)}
                onRollback={() => handleRollback(snap)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Timeline Entry ───────────────────────────────────────────────────────────
function TimelineEntry({
  snapshot,
  isFirst,
  isRollingBack,
  onLoad,
  onRollback,
}: {
  snapshot: Snapshot;
  isFirst: boolean;
  isRollingBack: boolean;
  onLoad: () => void;
  onRollback: () => void;
}) {
  const isActive = snapshot.isActive === 1;
  const isRollback = snapshot.name.startsWith("Rollback to:");

  return (
    <div className="flex gap-4 items-start">
      {/* Timeline dot */}
      <div className={`relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border ${
        isActive
          ? "bg-[#00ffee]/10 border-[#00ffee]/50"
          : isRollback
          ? "bg-amber-500/10 border-amber-500/30"
          : "bg-white/5 border-white/15"
      }`}>
        {isActive ? (
          <Star className="w-4 h-4 text-[#00ffee]" />
        ) : isRollback ? (
          <RotateCcw className="w-4 h-4 text-amber-400" />
        ) : (
          <span className="text-xs font-mono text-slate-400">v{snapshot.version}</span>
        )}
      </div>

      {/* Card */}
      <Card className={`flex-1 transition-all ${
        isActive
          ? "bg-[#00ffee]/5 border-[#00ffee]/25"
          : "bg-white/5 border-white/10 hover:bg-white/8"
      }`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`font-semibold text-sm truncate ${isActive ? "text-[#00ffee]" : "text-white"}`}>
                  {snapshot.name}
                </span>
                {isActive && (
                  <Badge className="bg-[#00ffee]/20 text-[#00ffee] border-[#00ffee]/30 text-xs px-1.5 py-0">
                    Active
                  </Badge>
                )}
                {isFirst && !isActive && (
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs px-1.5 py-0">
                    Latest
                  </Badge>
                )}
                {isRollback && (
                  <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs px-1.5 py-0">
                    Rollback
                  </Badge>
                )}
              </div>
              {snapshot.description && (
                <p className="text-xs text-slate-400 mt-0.5 truncate max-w-sm">{snapshot.description}</p>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-500 shrink-0">
              <Clock className="w-3 h-3" />
              {relativeTime(snapshot.createdAt)}
            </div>
          </div>

          {/* IAAO metrics row */}
          {(snapshot.snapshotMedianRatio || snapshot.snapshotCod || snapshot.snapshotPrd) && (
            <div className="flex gap-3 mb-3 flex-wrap">
              {snapshot.snapshotMedianRatio && (
                <span className="text-xs text-slate-400">
                  Ratio: <span className="text-slate-200 font-mono">{snapshot.snapshotMedianRatio.toFixed(3)}</span>
                </span>
              )}
              {snapshot.snapshotCod && (
                <span className="text-xs text-slate-400">
                  COD: <span className="text-slate-200 font-mono">{snapshot.snapshotCod.toFixed(1)}%</span>
                </span>
              )}
              {snapshot.snapshotPrd && (
                <span className="text-xs text-slate-400">
                  PRD: <span className="text-slate-200 font-mono">{snapshot.snapshotPrd.toFixed(3)}</span>
                </span>
              )}
            </div>
          )}

          {/* Cost rate mini-summary */}
          <div className="flex gap-2 flex-wrap mb-3">
            {Object.entries(snapshot.costRates).slice(0, 3).map(([k, v]) => (
              <span key={k} className="text-xs bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-slate-300 font-mono">
                {k.split(" ")[0]}: ${v}
              </span>
            ))}
            {Object.keys(snapshot.costRates).length > 3 && (
              <span className="text-xs text-slate-500">+{Object.keys(snapshot.costRates).length - 3} more</span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              className="text-xs border-white/15 text-slate-300 hover:text-[#00ffee] hover:border-[#00ffee]/30"
              onClick={onLoad}
            >
              <Zap className="w-3 h-3 mr-1" />
              Load into Editor
            </Button>
            {/* Per-snapshot export dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-[#0b1020] border-white/10 text-white">
                <DropdownMenuLabel className="text-slate-400 text-xs">Export Snapshot v{snapshot.version}</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem
                  className="text-sm cursor-pointer hover:bg-white/10 focus:bg-white/10"
                  onClick={() => triggerDownload(`/api/calibration/${snapshot.id}/export.csv`)}
                >
                  <FileSpreadsheet className="w-4 h-4 mr-2 text-emerald-400" />
                  Download CSV
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-sm cursor-pointer hover:bg-white/10 focus:bg-white/10"
                  onClick={() => triggerDownload(`/api/calibration/${snapshot.id}/export.pdf`)}
                >
                  <FileText className="w-4 h-4 mr-2 text-red-400" />
                  Download PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {!isActive && (
              <Button
                size="sm"
                variant="outline"
                className="text-xs border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
                onClick={onRollback}
                disabled={isRollingBack}
              >
                {isRollingBack ? (
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  <RotateCcw className="w-3 h-3 mr-1" />
                )}
                {isRollingBack ? "Rolling back…" : "Roll Back to This"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Compare Panel ────────────────────────────────────────────────────────────
function ComparePanel({
  snapshots,
  compareIdA,
  compareIdB,
  setCompareIdA,
  setCompareIdB,
  compareData,
  compareLoading,
}: {
  snapshots: Snapshot[];
  compareIdA: string;
  compareIdB: string;
  setCompareIdA: (v: string) => void;
  setCompareIdB: (v: string) => void;
  compareData: any;
  compareLoading: boolean;
}) {
  return (
    <div className="space-y-5 pt-2">
      {/* Selector row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs text-slate-400 uppercase tracking-wide">Version A (baseline)</label>
          <Select value={compareIdA} onValueChange={setCompareIdA}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white text-sm">
              <SelectValue placeholder="Select version A…" />
            </SelectTrigger>
            <SelectContent>
              {snapshots.map(s => (
                <SelectItem key={s.id} value={String(s.id)} disabled={String(s.id) === compareIdB}>
                  v{s.version} — {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-slate-400 uppercase tracking-wide">Version B (compare to)</label>
          <Select value={compareIdB} onValueChange={setCompareIdB}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white text-sm">
              <SelectValue placeholder="Select version B…" />
            </SelectTrigger>
            <SelectContent>
              {snapshots.map(s => (
                <SelectItem key={s.id} value={String(s.id)} disabled={String(s.id) === compareIdA}>
                  v{s.version} — {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Diff result */}
      {!compareIdA || !compareIdB ? (
        <div className="text-center py-8 text-slate-500 text-sm">
          <GitCompare className="w-8 h-8 mx-auto mb-2 opacity-40" />
          Select two versions above to see the diff.
        </div>
      ) : compareIdA === compareIdB ? (
        <div className="text-center py-6 text-slate-500 text-sm">Select two different versions.</div>
      ) : compareLoading ? (
        <div className="flex items-center justify-center py-8 gap-2 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />Loading comparison…
        </div>
      ) : compareData ? (
        <div className="space-y-4">
          {/* Summary bar */}
          <div className="flex items-center gap-4 px-4 py-3 rounded-lg bg-white/5 border border-white/10">
            <div className="text-sm text-slate-300">
              <span className="font-semibold text-white">{compareData.changedCount}</span> rate{compareData.changedCount !== 1 ? "s" : ""} changed
            </div>
            <div className="text-xs text-slate-500">
              {compareData.a.name} (v{snapshots.find(s => s.id === compareData.a.id)?.version ?? "?"})
              {" → "}
              {compareData.b.name} (v{snapshots.find(s => s.id === compareData.b.id)?.version ?? "?"})
            </div>
          </div>

          {/* IAAO metrics comparison */}
          {(compareData.a.snapshotMedianRatio || compareData.b.snapshotMedianRatio) && (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Median Ratio", keyA: compareData.a.snapshotMedianRatio, keyB: compareData.b.snapshotMedianRatio },
                { label: "COD", keyA: compareData.a.snapshotCod, keyB: compareData.b.snapshotCod },
                { label: "PRD", keyA: compareData.a.snapshotPrd, keyB: compareData.b.snapshotPrd },
              ].map(({ label, keyA, keyB }) => (
                <div key={label} className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
                  <p className="text-xs text-slate-400 mb-1">{label}</p>
                  <div className="flex items-center justify-center gap-2 text-sm font-mono">
                    <span className="text-slate-300">{keyA?.toFixed(3) ?? "—"}</span>
                    <span className="text-slate-600">→</span>
                    <span className={keyB !== null && keyA !== null
                      ? (keyB > keyA ? "text-emerald-400" : keyB < keyA ? "text-red-400" : "text-slate-300")
                      : "text-slate-300"
                    }>{keyB?.toFixed(3) ?? "—"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Cost rate diff table */}
          <div className="rounded-lg border border-white/10 overflow-hidden">
            <div className="grid grid-cols-4 gap-0 bg-white/5 px-4 py-2 text-xs text-slate-400 uppercase tracking-wide border-b border-white/10">
              <span className="col-span-2">Property Class</span>
              <span className="text-right">Version A</span>
              <span className="text-right">Version B / Δ</span>
            </div>
            {compareData.diff.map((row: any) => (
              <div
                key={row.key}
                className={`grid grid-cols-4 gap-0 px-4 py-2.5 border-b border-white/5 last:border-0 text-sm ${
                  row.changed ? "bg-white/3" : ""
                }`}
              >
                <span className="col-span-2 text-slate-300 truncate pr-2">{row.key}</span>
                <span className="text-right font-mono text-slate-400">
                  {row.valA !== null ? `$${row.valA}` : "—"}
                </span>
                <div className="text-right">
                  {row.changed ? (
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="font-mono text-white">{row.valB !== null ? `$${row.valB}` : "—"}</span>
                      <DeltaBadge delta={row.delta} pct={row.pctChange} />
                    </div>
                  ) : (
                    <span className="font-mono text-slate-500">{row.valB !== null ? `$${row.valB}` : "—"}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
