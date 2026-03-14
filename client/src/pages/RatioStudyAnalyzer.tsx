import { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Calculator,
  Download,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  BarChart3,
  RefreshCw,
  Info,
} from 'lucide-react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';
import { toast } from 'sonner';

// ─── IAAO compliance thresholds ──────────────────────────────────────────────
const THRESHOLDS = {
  medianRatio: { min: 0.90, max: 1.10 },
  cod: {
    residential: { excellent: 10, good: 15, fair: 20 },
    commercial:  { excellent: 15, good: 20, fair: 25 },
    industrial:  { excellent: 15, good: 20, fair: 25 },
    agricultural:{ excellent: 15, good: 20, fair: 25 },
  },
  prd: { min: 0.98, max: 1.03 },
  prb: { min: -0.05, max: 0.05 },
};

type ComplianceStatus = 'pass' | 'warning' | 'fail' | 'unknown';

function evaluateMedianRatio(v: number): ComplianceStatus {
  if (v === 0) return 'unknown';
  if (v >= THRESHOLDS.medianRatio.min && v <= THRESHOLDS.medianRatio.max) return 'pass';
  if (v >= 0.85 && v <= 1.15) return 'warning';
  return 'fail';
}

function evaluateCOD(v: number, propType: string): ComplianceStatus {
  if (v === 0) return 'unknown';
  const t = THRESHOLDS.cod[propType as keyof typeof THRESHOLDS.cod] ?? THRESHOLDS.cod.residential;
  if (v <= t.excellent) return 'pass';
  if (v <= t.good) return 'warning';
  return 'fail';
}

function evaluatePRD(v: number): ComplianceStatus {
  if (v === 0) return 'unknown';
  if (v >= THRESHOLDS.prd.min && v <= THRESHOLDS.prd.max) return 'pass';
  if (v >= 0.95 && v <= 1.06) return 'warning';
  return 'fail';
}

function evaluatePRB(v: number): ComplianceStatus {
  if (v === 0) return 'unknown';
  if (v >= THRESHOLDS.prb.min && v <= THRESHOLDS.prb.max) return 'pass';
  if (v >= -0.08 && v <= 0.08) return 'warning';
  return 'fail';
}

function StatusIcon({ status }: { status: ComplianceStatus }) {
  switch (status) {
    case 'pass':    return <CheckCircle2 className="w-5 h-5 text-[var(--color-signal-success)]" />;
    case 'warning': return <AlertTriangle className="w-5 h-5 text-[var(--color-signal-warning)]" />;
    case 'fail':    return <XCircle className="w-5 h-5 text-[var(--color-signal-alert)]" />;
    default:        return <Info className="w-5 h-5 text-[var(--color-text-tertiary)]" />;
  }
}

function statusColor(s: ComplianceStatus): string {
  switch (s) {
    case 'pass':    return 'var(--color-signal-success)';
    case 'warning': return 'var(--color-signal-warning)';
    case 'fail':    return 'var(--color-signal-alert)';
    default:        return 'var(--color-text-tertiary)';
  }
}

function overallStatus(statuses: ComplianceStatus[]): ComplianceStatus {
  if (statuses.some(s => s === 'fail'))    return 'fail';
  if (statuses.some(s => s === 'warning')) return 'warning';
  if (statuses.every(s => s === 'pass'))   return 'pass';
  return 'unknown';
}

function KpiSkeleton() {
  return (
    <Card className="p-6 bg-[var(--color-glass-2)] border-white/10 space-y-3">
      <Skeleton className="h-3 w-24 bg-white/10" />
      <Skeleton className="h-8 w-20 bg-white/10" />
      <Skeleton className="h-3 w-32 bg-white/10" />
    </Card>
  );
}

// ─── Ratio distribution dot color ────────────────────────────────────────────
function dotColor(ratio: number): string {
  if (ratio < 0.90 || ratio > 1.10) return '#FF3366';
  if (ratio < 0.95 || ratio > 1.05) return '#FFAA00';
  return '#00FFEE';
}

/**
 * RatioStudyAnalyzer — live-wired to ratioStudiesRouter
 */
export default function RatioStudyAnalyzer() {
  const [, setLocation] = useLocation();
  const [propertyType, setPropertyType] = useState('residential');
  const [studyYear, setStudyYear] = useState('2026');

  // Date range derived from study year
  const startDate = useMemo(() => new Date(`${studyYear}-01-01`), [studyYear]);
  const endDate   = useMemo(() => new Date(`${studyYear}-12-31`), [studyYear]);

  // ── Live queries ────────────────────────────────────────────────────────────
  const statsQuery = trpc.ratioStudies.calculate.useQuery(
    {
      propertyType: propertyType === 'all' ? undefined : propertyType,
      startDate,
      endDate,
    },
    { staleTime: 60_000 }
  );

  const salesQuery = trpc.ratioStudies.getSalesData.useQuery(
    {
      propertyType: propertyType === 'all' ? undefined : propertyType,
      startDate,
      endDate,
      limit: 500,
    },
    { staleTime: 60_000 }
  );

  // ── PDF export ──────────────────────────────────────────────────────────────
  const exportPDF = trpc.ratioStudies.exportPDF.useMutation({
    onSuccess(data) {
      const bytes = Uint8Array.from(atob(data.pdf), c => c.charCodeAt(0));
      const blob  = new Blob([bytes], { type: 'application/pdf' });
      const url   = URL.createObjectURL(blob);
      const a     = document.createElement('a');
      a.href     = url;
      a.download = data.filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF exported', { description: data.filename });
    },
    onError(err) {
      toast.error('Export failed', { description: err.message });
    },
  });

  const stats    = statsQuery.data;
  const salesRaw = salesQuery.data ?? [];
  const loading  = statsQuery.isLoading;

  // ── Derived compliance ──────────────────────────────────────────────────────
  const compliance = useMemo(() => {
    if (!stats) return null;
    const mr  = evaluateMedianRatio(stats.medianRatio);
    const cod = evaluateCOD(stats.cod, propertyType);
    const prd = evaluatePRD(stats.prd);
    const prb = evaluatePRB(stats.prb);
    return { mr, cod, prd, prb, overall: overallStatus([mr, cod, prd, prb]) };
  }, [stats, propertyType]);

  // ── Scatter data: ratio vs sale price ──────────────────────────────────────
  const scatterData = useMemo(
    () => salesRaw.map(s => ({ x: s.salePrice / 1000, y: s.ratio, ratio: s.ratio })),
    [salesRaw]
  );

  // ── COD thresholds for current property type ────────────────────────────────
  const codThreshold =
    THRESHOLDS.cod[propertyType as keyof typeof THRESHOLDS.cod]?.excellent ??
    THRESHOLDS.cod.residential.excellent;

  const hasData = (stats?.count ?? 0) > 0;

  return (
    <div className="min-h-screen bg-[var(--color-government-night-base)]">
      {/* ── Top Navigation Bar ─────────────────────────────────────────────── */}
      <div
        className="sticky top-14 z-30 h-16 flex items-center justify-between px-6
                   bg-[var(--color-glass-2)] backdrop-blur-xl border-b border-white/10"
      >
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/')}
            className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          <div className="h-6 w-px bg-white/10" />
          <h1 className="text-xl font-bold text-[var(--color-text-primary)]">
            Ratio Study Analyzer
          </h1>
          {statsQuery.isFetching && (
            <RefreshCw className="w-4 h-4 text-[var(--color-signal-primary)] animate-spin" />
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Property type filter */}
          <Select value={propertyType} onValueChange={setPropertyType}>
            <SelectTrigger className="w-40 bg-[var(--color-glass-3)] border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="residential">Residential</SelectItem>
              <SelectItem value="commercial">Commercial</SelectItem>
              <SelectItem value="industrial">Industrial</SelectItem>
              <SelectItem value="agricultural">Agricultural</SelectItem>
            </SelectContent>
          </Select>

          {/* Study year filter */}
          <Select value={studyYear} onValueChange={setStudyYear}>
            <SelectTrigger className="w-32 bg-[var(--color-glass-3)] border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2026">2026</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
            </SelectContent>
          </Select>

          {/* Export PDF */}
          <Button
            size="sm"
            disabled={!hasData || exportPDF.isPending}
            onClick={() =>
              exportPDF.mutate({
                propertyType: propertyType === 'all' ? undefined : propertyType,
                startDate,
                endDate,
              })
            }
            className="bg-[var(--color-signal-primary)] hover:bg-[var(--color-signal-primary)]/90 disabled:opacity-40"
          >
            {exportPDF.isPending ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Export Report
          </Button>
        </div>
      </div>

      {/* ── Main Content ───────────────────────────────────────────────────── */}
      <div className="p-6 pb-24 space-y-6">

        {/* ── Error banner ─────────────────────────────────────────────────── */}
        {statsQuery.isError && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            <XCircle className="w-5 h-5 shrink-0" />
            Failed to load ratio study data: {statsQuery.error.message}
          </div>
        )}

        {/* ── KPI Cards ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-4">
          {loading ? (
            <>
              <KpiSkeleton /><KpiSkeleton /><KpiSkeleton /><KpiSkeleton />
            </>
          ) : (
            <>
              {/* Sample size */}
              <Card className="p-6 bg-[var(--color-glass-2)] border-white/10">
                <div className="text-xs text-[var(--color-text-tertiary)] mb-2">Sample Size</div>
                <div className="text-3xl font-bold text-[var(--color-text-primary)]">
                  {hasData ? (stats?.count ?? 0).toLocaleString() : '—'}
                </div>
                <div className="text-xs text-[var(--color-text-secondary)] mt-1">
                  qualified sales
                </div>
              </Card>

              {/* Property type */}
              <Card className="p-6 bg-[var(--color-glass-2)] border-white/10">
                <div className="text-xs text-[var(--color-text-tertiary)] mb-2">Property Type</div>
                <div className="text-2xl font-bold text-[var(--color-text-primary)] capitalize">
                  {propertyType}
                </div>
                <div className="text-xs text-[var(--color-text-secondary)] mt-1">classification</div>
              </Card>

              {/* Study year */}
              <Card className="p-6 bg-[var(--color-glass-2)] border-white/10">
                <div className="text-xs text-[var(--color-text-tertiary)] mb-2">Study Year</div>
                <div className="text-3xl font-bold text-[var(--color-text-primary)]">{studyYear}</div>
                <div className="text-xs text-[var(--color-text-secondary)] mt-1">assessment year</div>
              </Card>

              {/* Overall compliance */}
              <Card className="p-6 bg-[var(--color-glass-2)] border-white/10">
                <div className="text-xs text-[var(--color-text-tertiary)] mb-2">Compliance</div>
                {!hasData ? (
                  <div className="text-xl font-bold text-[var(--color-text-tertiary)] mt-2">No Data</div>
                ) : compliance ? (
                  <div className="flex items-center gap-2 mt-2">
                    <StatusIcon status={compliance.overall} />
                    <span
                      className="text-xl font-bold uppercase"
                      style={{ color: statusColor(compliance.overall) }}
                    >
                      {compliance.overall}
                    </span>
                  </div>
                ) : null}
                <div className="text-xs text-[var(--color-text-secondary)] mt-1">IAAO standards</div>
              </Card>
            </>
          )}
        </div>

        {/* ── Empty state ───────────────────────────────────────────────────── */}
        {!loading && !hasData && !statsQuery.isError && (
          <Card className="p-12 bg-[var(--color-glass-2)] border-white/10 flex flex-col items-center justify-center text-center gap-4">
            <BarChart3 className="w-12 h-12 text-[var(--color-text-tertiary)]" />
            <div>
              <div className="text-lg font-semibold text-[var(--color-text-primary)] mb-1">
                No sales data for {propertyType} in {studyYear}
              </div>
              <p className="text-sm text-[var(--color-text-secondary)] max-w-md">
                Upload qualified sales records via the Washington Assessment Data Ingestion tool,
                then return here to run the ratio study.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation('/wa-data-ingestion')}
              className="border-white/20 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            >
              Go to Data Ingestion
            </Button>
          </Card>
        )}

        {/* ── Main grid (only when data exists) ────────────────────────────── */}
        {(hasData || loading) && (
          <div className="grid grid-cols-12 gap-6">

            {/* ── Left panel: COD & PRD calculators ──────────────────────── */}
            <div className="col-span-4 space-y-6">

              {/* COD Calculator */}
              <Card className="p-6 bg-[var(--color-glass-2)] border-white/10">
                <div className="flex items-center gap-2 mb-4">
                  <Calculator className="w-5 h-5 text-[var(--color-signal-primary)]" />
                  <h2 className="text-lg font-bold text-[var(--color-text-primary)]">COD Calculator</h2>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-[var(--color-text-tertiary)] mb-1 block">Median Ratio</label>
                    {loading ? (
                      <Skeleton className="h-9 w-full bg-white/10" />
                    ) : (
                      <Input
                        type="number"
                        value={stats?.medianRatio.toFixed(4) ?? ''}
                        readOnly
                        className="bg-[var(--color-glass-3)] border-white/10 font-mono"
                      />
                    )}
                  </div>
                  <div>
                    <label className="text-xs text-[var(--color-text-tertiary)] mb-1 block">
                      Mean Absolute Deviation
                    </label>
                    {loading ? (
                      <Skeleton className="h-9 w-full bg-white/10" />
                    ) : (
                      <Input
                        type="number"
                        value={
                          stats && stats.medianRatio > 0
                            ? ((stats.cod / 100) * stats.medianRatio).toFixed(4)
                            : ''
                        }
                        readOnly
                        className="bg-[var(--color-glass-3)] border-white/10 font-mono"
                      />
                    )}
                  </div>
                  <div className="pt-3 border-t border-white/10">
                    <div className="text-xs text-[var(--color-text-tertiary)] mb-1">
                      Coefficient of Dispersion
                    </div>
                    {loading ? (
                      <Skeleton className="h-10 w-28 bg-white/10" />
                    ) : (
                      <div
                        className="text-3xl font-bold"
                        style={{ color: compliance ? statusColor(compliance.cod) : 'inherit' }}
                      >
                        {stats?.cod.toFixed(1) ?? '—'}%
                      </div>
                    )}
                    {!loading && compliance && (
                      <div
                        className="flex items-center gap-1 mt-2 text-xs"
                        style={{ color: statusColor(compliance.cod) }}
                      >
                        <StatusIcon status={compliance.cod} />
                        {compliance.cod === 'pass'
                          ? `Excellent uniformity (<${codThreshold}%)`
                          : compliance.cod === 'warning'
                          ? `Moderate — review recommended`
                          : `Exceeds IAAO threshold (${codThreshold}%)`}
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              {/* PRD Calculator */}
              <Card className="p-6 bg-[var(--color-glass-2)] border-white/10">
                <div className="flex items-center gap-2 mb-4">
                  <Calculator className="w-5 h-5 text-[var(--color-signal-secondary)]" />
                  <h2 className="text-lg font-bold text-[var(--color-text-primary)]">PRD Calculator</h2>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-[var(--color-text-tertiary)] mb-1 block">Mean Ratio</label>
                    {loading ? (
                      <Skeleton className="h-9 w-full bg-white/10" />
                    ) : (
                      <Input
                        type="number"
                        value={stats?.meanRatio.toFixed(4) ?? ''}
                        readOnly
                        className="bg-[var(--color-glass-3)] border-white/10 font-mono"
                      />
                    )}
                  </div>
                  <div>
                    <label className="text-xs text-[var(--color-text-tertiary)] mb-1 block">
                      Weighted Mean Ratio
                    </label>
                    {loading ? (
                      <Skeleton className="h-9 w-full bg-white/10" />
                    ) : (
                      <Input
                        type="number"
                        value={
                          stats && stats.totalSalesValue > 0
                            ? (stats.totalAssessedValue / stats.totalSalesValue).toFixed(4)
                            : ''
                        }
                        readOnly
                        className="bg-[var(--color-glass-3)] border-white/10 font-mono"
                      />
                    )}
                  </div>
                  <div className="pt-3 border-t border-white/10">
                    <div className="text-xs text-[var(--color-text-tertiary)] mb-1">
                      Price-Related Differential
                    </div>
                    {loading ? (
                      <Skeleton className="h-10 w-20 bg-white/10" />
                    ) : (
                      <div
                        className="text-3xl font-bold"
                        style={{ color: compliance ? statusColor(compliance.prd) : 'inherit' }}
                      >
                        {stats?.prd.toFixed(4) ?? '—'}
                      </div>
                    )}
                    {!loading && compliance && (
                      <div
                        className="flex items-center gap-1 mt-2 text-xs"
                        style={{ color: statusColor(compliance.prd) }}
                      >
                        <StatusIcon status={compliance.prd} />
                        {compliance.prd === 'pass'
                          ? 'Within target (0.98–1.03)'
                          : compliance.prd === 'warning'
                          ? 'Marginal — monitor for bias'
                          : stats && stats.prd > 1.03
                          ? 'Regressive — favours low-value properties'
                          : 'Progressive — favours high-value properties'}
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              {/* PRB Card */}
              <Card className="p-6 bg-[var(--color-glass-2)] border-white/10">
                <div className="flex items-center gap-2 mb-4">
                  <Calculator className="w-5 h-5 text-[var(--color-signal-tertiary,#A78BFA)]" />
                  <h2 className="text-lg font-bold text-[var(--color-text-primary)]">PRB Calculator</h2>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-[var(--color-text-tertiary)] mb-1 block">
                      Price-Related Bias
                    </label>
                    {loading ? (
                      <Skeleton className="h-10 w-24 bg-white/10" />
                    ) : (
                      <div
                        className="text-3xl font-bold"
                        style={{ color: compliance ? statusColor(compliance.prb) : 'inherit' }}
                      >
                        {stats?.prb !== undefined ? stats.prb.toFixed(4) : '—'}
                      </div>
                    )}
                  </div>
                  {!loading && compliance && (
                    <div
                      className="flex items-center gap-1 text-xs pt-2 border-t border-white/10"
                      style={{ color: statusColor(compliance.prb) }}
                    >
                      <StatusIcon status={compliance.prb} />
                      {compliance.prb === 'pass'
                        ? 'Within IAAO range (−0.05 to +0.05)'
                        : compliance.prb === 'warning'
                        ? 'Marginal bias — further review recommended'
                        : stats && stats.prb > 0.05
                        ? 'Regressive bias detected'
                        : 'Progressive bias detected'}
                    </div>
                  )}
                  <div className="text-xs text-[var(--color-text-tertiary)] pt-1">
                    Regression slope of (ratio − mean) on sale price.
                    IAAO acceptable range: −0.05 to +0.05.
                  </div>
                </div>
              </Card>
            </div>

            {/* ── Right panel: Compliance report + scatter chart ──────────── */}
            <div className="col-span-8 space-y-6">

              {/* IAAO Compliance Report */}
              <Card className="p-6 bg-[var(--color-glass-2)] border-white/10">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
                    IAAO Compliance Report
                  </h2>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-white/10"
                    disabled={!hasData || exportPDF.isPending}
                    onClick={() =>
                      exportPDF.mutate({
                        propertyType: propertyType === 'all' ? undefined : propertyType,
                        startDate,
                        endDate,
                      })
                    }
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    {exportPDF.isPending ? 'Generating…' : 'Generate PDF'}
                  </Button>
                </div>

                <div className="space-y-4">
                  {/* Median Ratio row */}
                  {loading ? (
                    <Skeleton className="h-24 w-full bg-white/10 rounded-lg" />
                  ) : (
                    <div className="p-4 rounded-lg bg-[var(--color-glass-3)] border border-white/10">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="font-medium text-[var(--color-text-primary)]">
                            Median Ratio (Assessment Level)
                          </div>
                          <div className="text-xs text-[var(--color-text-tertiary)] mt-1">
                            IAAO Standard: 0.90 – 1.10
                          </div>
                        </div>
                        {compliance && <StatusIcon status={compliance.mr} />}
                      </div>
                      <div
                        className="text-2xl font-bold"
                        style={{ color: compliance ? statusColor(compliance.mr) : 'inherit' }}
                      >
                        {stats?.medianRatio.toFixed(4) ?? '—'}
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-[var(--color-government-night-base)] overflow-hidden">
                        <div
                          className="h-full transition-all duration-700"
                          style={{
                            width: `${Math.min(((stats?.medianRatio ?? 0) / 1.10) * 100, 100)}%`,
                            background: `linear-gradient(to right, var(--color-signal-primary), ${compliance ? statusColor(compliance.mr) : 'var(--color-signal-success)'})`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* COD row */}
                  {loading ? (
                    <Skeleton className="h-24 w-full bg-white/10 rounded-lg" />
                  ) : (
                    <div className="p-4 rounded-lg bg-[var(--color-glass-3)] border border-white/10">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="font-medium text-[var(--color-text-primary)]">
                            Coefficient of Dispersion (Uniformity)
                          </div>
                          <div className="text-xs text-[var(--color-text-tertiary)] mt-1">
                            IAAO Standard: &lt;{codThreshold}% ({propertyType})
                          </div>
                        </div>
                        {compliance && <StatusIcon status={compliance.cod} />}
                      </div>
                      <div
                        className="text-2xl font-bold"
                        style={{ color: compliance ? statusColor(compliance.cod) : 'inherit' }}
                      >
                        {stats?.cod.toFixed(2) ?? '—'}%
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-[var(--color-government-night-base)] overflow-hidden">
                        <div
                          className="h-full transition-all duration-700"
                          style={{
                            width: `${Math.min(((stats?.cod ?? 0) / (codThreshold * 2)) * 100, 100)}%`,
                            background: `linear-gradient(to right, var(--color-signal-success), ${compliance ? statusColor(compliance.cod) : 'var(--color-signal-primary)'})`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* PRD row */}
                  {loading ? (
                    <Skeleton className="h-24 w-full bg-white/10 rounded-lg" />
                  ) : (
                    <div className="p-4 rounded-lg bg-[var(--color-glass-3)] border border-white/10">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="font-medium text-[var(--color-text-primary)]">
                            Price-Related Differential (Progressivity)
                          </div>
                          <div className="text-xs text-[var(--color-text-tertiary)] mt-1">
                            IAAO Standard: 0.98 – 1.03
                          </div>
                        </div>
                        {compliance && <StatusIcon status={compliance.prd} />}
                      </div>
                      <div
                        className="text-2xl font-bold"
                        style={{ color: compliance ? statusColor(compliance.prd) : 'inherit' }}
                      >
                        {stats?.prd.toFixed(4) ?? '—'}
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-[var(--color-government-night-base)] overflow-hidden">
                        <div
                          className="h-full transition-all duration-700"
                          style={{
                            width: `${Math.min(Math.max(((stats?.prd ?? 0) - 0.95) / 0.10 * 100, 0), 100)}%`,
                            background: `linear-gradient(to right, var(--color-signal-primary), ${compliance ? statusColor(compliance.prd) : 'var(--color-signal-success)'})`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Summary banner */}
                  {!loading && compliance && (
                    <div
                      className="p-6 rounded-lg border"
                      style={{
                        background: `${statusColor(compliance.overall)}10`,
                        borderColor: `${statusColor(compliance.overall)}30`,
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <StatusIcon status={compliance.overall} />
                        <div>
                          <div className="font-bold text-[var(--color-text-primary)] mb-2 uppercase">
                            Compliance Status: {compliance.overall}
                          </div>
                          <p className="text-sm text-[var(--color-text-secondary)]">
                            {compliance.overall === 'pass'
                              ? `All assessment quality indicators meet or exceed IAAO standards for ${propertyType} properties. `
                              : compliance.overall === 'warning'
                              ? `Some indicators are marginal and require attention for ${propertyType} properties. `
                              : `One or more indicators fail IAAO standards for ${propertyType} properties. Corrective action is required. `}
                            The assessment roll shows
                            {stats ? ` COD: ${stats.cod.toFixed(1)}%, Median Ratio: ${stats.medianRatio.toFixed(3)}, PRD: ${stats.prd.toFixed(3)}, PRB: ${stats.prb.toFixed(4)}` : ''}.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* Ratio Distribution Scatter Chart */}
              {scatterData.length > 0 && (
                <Card className="p-6 bg-[var(--color-glass-2)] border-white/10">
                  <div className="flex items-center gap-2 mb-1">
                    <BarChart3 className="w-5 h-5 text-[var(--color-signal-primary)]" />
                    <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
                      Ratio Distribution
                    </h2>
                  </div>
                  <p className="text-xs text-[var(--color-text-tertiary)] mb-4">
                    Assessment ratio (A/S) vs. sale price (thousands). Cyan = within IAAO range,
                    amber = marginal, red = outside range.
                  </p>
                  <div style={{ height: 280 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                        <XAxis
                          dataKey="x"
                          type="number"
                          name="Sale Price"
                          unit="k"
                          tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                          tickLine={false}
                          axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                          label={{ value: 'Sale Price ($k)', position: 'insideBottom', offset: -4, fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
                        />
                        <YAxis
                          dataKey="y"
                          type="number"
                          name="Ratio"
                          domain={[0.5, 1.5]}
                          tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                          tickLine={false}
                          axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                          label={{ value: 'A/S Ratio', angle: -90, position: 'insideLeft', fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
                        />
                        <RechartsTooltip
                          cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.2)' }}
                          contentStyle={{
                            background: 'var(--color-government-night-base)',
                            border: '1px solid rgba(255,255,255,0.15)',
                            borderRadius: 8,
                            fontSize: 12,
                          }}
                          formatter={(value: number, name: string) => [
                            name === 'y' ? value.toFixed(4) : `$${value.toFixed(0)}k`,
                            name === 'y' ? 'Ratio' : 'Sale Price',
                          ]}
                        />
                        {/* IAAO acceptable band */}
                        <ReferenceLine y={THRESHOLDS.medianRatio.min} stroke="#FFAA00" strokeDasharray="4 3" strokeWidth={1} label={{ value: '0.90', fill: '#FFAA00', fontSize: 10, position: 'right' }} />
                        <ReferenceLine y={THRESHOLDS.medianRatio.max} stroke="#FFAA00" strokeDasharray="4 3" strokeWidth={1} label={{ value: '1.10', fill: '#FFAA00', fontSize: 10, position: 'right' }} />
                        <ReferenceLine y={1.0} stroke="rgba(255,255,255,0.3)" strokeWidth={1} label={{ value: '1.00', fill: 'rgba(255,255,255,0.4)', fontSize: 10, position: 'right' }} />
                        {/* Median ratio line */}
                        {stats && stats.medianRatio > 0 && (
                          <ReferenceLine
                            y={stats.medianRatio}
                            stroke="#00FFEE"
                            strokeDasharray="6 3"
                            strokeWidth={1.5}
                            label={{ value: `Median ${stats.medianRatio.toFixed(3)}`, fill: '#00FFEE', fontSize: 10, position: 'right' }}
                          />
                        )}
                        <Scatter data={scatterData} opacity={0.75}>
                          {scatterData.map((entry, index) => (
                            <Cell key={index} fill={dotColor(entry.ratio)} r={3} />
                          ))}
                        </Scatter>
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex items-center gap-6 mt-3 text-xs text-[var(--color-text-tertiary)]">
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#00FFEE] inline-block" />Within IAAO range (0.90–1.10)</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#FFAA00] inline-block" />Marginal (0.85–0.90 / 1.10–1.15)</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#FF3366] inline-block" />Outside range</span>
                  </div>
                </Card>
              )}

              {/* Summary stats table */}
              {!loading && hasData && stats && (
                <Card className="p-6 bg-[var(--color-glass-2)] border-white/10">
                  <h2 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-4">
                    Descriptive Statistics
                  </h2>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    {[
                      { label: 'Median Ratio', value: stats.medianRatio.toFixed(4) },
                      { label: 'Mean Ratio',   value: stats.meanRatio.toFixed(4) },
                      { label: 'Weighted Mean', value: stats.totalSalesValue > 0 ? (stats.totalAssessedValue / stats.totalSalesValue).toFixed(4) : '—' },
                      { label: 'Min Ratio',    value: stats.minRatio.toFixed(4) },
                      { label: 'Max Ratio',    value: stats.maxRatio.toFixed(4) },
                      { label: 'Range',        value: (stats.maxRatio - stats.minRatio).toFixed(4) },
                      { label: 'Total Sales Value',    value: `$${(stats.totalSalesValue / 1_000_000).toFixed(1)}M` },
                      { label: 'Total Assessed Value', value: `$${(stats.totalAssessedValue / 1_000_000).toFixed(1)}M` },
                      { label: 'Qualified Sales',      value: stats.count.toLocaleString() },
                    ].map(({ label, value }) => (
                      <div key={label} className="p-3 rounded-lg bg-[var(--color-glass-3)] border border-white/10">
                        <div className="text-xs text-[var(--color-text-tertiary)] mb-1">{label}</div>
                        <div className="font-mono font-bold text-[var(--color-text-primary)]">{value}</div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
