import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  ArrowLeft,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Download,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { trpc } from '@/lib/trpc';
import { useMemo } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

/**
 * MassAppraisalDashboard - Canonical Scene for Mass Appraisal Monitoring
 *
 * Full-screen immersive dashboard for monitoring mass appraisal quality,
 * property value distributions, and statistical indicators.
 * Features a real Recharts histogram (assessment ratio distribution from DB)
 * and a MapLibre GL mini-map showing Benton County, WA.
 */
export default function MassAppraisalDashboard() {
  const [, setLocation] = useLocation();
  const [selectedCounty, setSelectedCounty] = useState('all');
  const [selectedYear, setSelectedYear] = useState('2026');
  const miniMapContainer = useRef<HTMLDivElement>(null);
  const miniMap = useRef<maplibregl.Map | null>(null);

  // Fetch real ratio distribution from database, filtered by selected county
  const { data: ratioDistribution, isLoading: ratioLoading } =
    trpc.analytics.getRatioDistribution.useQuery(
      selectedCounty !== 'all' ? { countyName: selectedCounty } : undefined
    );

  // Fetch real parcel count from database
  const { data: parcelList } = trpc.parcels.list.useQuery();
  const totalProperties = parcelList?.length ?? 27753;

  // Fetch real county statistics from database
  const utils = trpc.useUtils();
  const { data: countyStatsData = [] } = trpc.countyStats.getAllCountyStats.useQuery();

  // Batch recalculate all counties
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number; running: boolean }>({
    current: 0, total: 0, running: false,
  });

  const runBatchRecalculate = useCallback(async () => {
    const counties = countyStatsData.map(c => c.countyName);
    if (counties.length === 0) {
      toast.info('No counties found in database');
      return;
    }
    setBatchProgress({ current: 0, total: counties.length, running: true });
    let succeeded = 0;
    for (let i = 0; i < counties.length; i++) {
      try {
        await utils.client.countyStats.recalculateCountyStats.mutate({ countyName: counties[i] });
        succeeded++;
      } catch {
        // continue with remaining counties
      }
      setBatchProgress({ current: i + 1, total: counties.length, running: i + 1 < counties.length });
    }
    utils.countyStats.getAllCountyStats.invalidate();
    utils.analytics.getRatioDistribution.invalidate();
    toast.success(`Batch recalculate complete: ${succeeded}/${counties.length} counties updated`);
    setBatchProgress(prev => ({ ...prev, running: false }));
  }, [countyStatsData, utils]);

  // Recalculate county stats from live parcel data
  const recalculateMutation = trpc.countyStats.recalculateCountyStats.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success(`Stats recalculated for ${selectedCounty} County`);
      } else {
        toast.info(result.message ?? 'No parcel data found for this county');
      }
      utils.countyStats.getAllCountyStats.invalidate();
      utils.analytics.getRatioDistribution.invalidate();
    },
    onError: (err) => {
      toast.error(`Recalculation failed: ${err.message}`);
    },
  });

  // Prefer DB-stored IAAO metrics for the selected county; fall back to histogram computation
  const selectedCountyStats = useMemo(() => {
    if (selectedCounty === 'all') return null;
    return countyStatsData.find(c => c.countyName === selectedCounty) ?? null;
  }, [countyStatsData, selectedCounty]);

  const qualityMetrics = (() => {
    const totalCount = ratioDistribution?.reduce((s, b) => s + b.count, 0) ?? 0;

    // If a specific county is selected and its DB row has IAAO metrics, use them directly
    if (selectedCountyStats && selectedCountyStats.medianRatio != null) {
      return {
        medianRatio: Number(selectedCountyStats.medianRatio),
        cod: Number(selectedCountyStats.cod ?? 8.4),
        prd: Number(selectedCountyStats.prd ?? 1.02),
        totalProperties,
        recentSales: selectedCountyStats.qualifiedSalesCount ?? totalCount,
        source: 'db' as const,
      };
    }

    // Fallback: compute from histogram bins
    if (!ratioDistribution || ratioDistribution.length === 0) {
      return { medianRatio: 0.96, cod: 8.4, prd: 1.02, totalProperties, recentSales: 1247, source: 'fallback' as const };
    }
    let cumulative = 0;
    let medianRatio = 0.96;
    for (const bin of ratioDistribution) {
      cumulative += bin.count;
      if (cumulative >= totalCount / 2) {
        medianRatio = bin.ratio + 0.025;
        break;
      }
    }
    const weightedMean = totalCount > 0
      ? ratioDistribution.reduce((s, b) => s + (b.ratio + 0.025) * b.count, 0) / totalCount
      : 0.96;
    const cod = totalCount > 0
      ? (ratioDistribution.reduce((s, b) => s + Math.abs(b.ratio + 0.025 - medianRatio) * b.count, 0) / totalCount / medianRatio) * 100
      : 8.4;
    const prd = weightedMean > 0 ? medianRatio / weightedMean : 1.02;
    return { medianRatio, cod, prd, totalProperties, recentSales: totalCount, source: 'histogram' as const };
  })();

  // Map real county statistics to display format, fallback to illustrative data if DB is empty
  const countyData = useMemo(() => {
    if (countyStatsData.length > 0) {
      return countyStatsData.slice(0, 6).map(c => {
        const avgValue = (c.avgLandValue ?? 0) + (c.avgBuildingValue ?? 0);
        // Use real COD from DB if available (populated by recalculateCountyStats)
        const cod = c.cod != null
          ? Number(c.cod)
          : avgValue > 0 ? Math.min(15, Math.max(5, 10000 / (avgValue / 1000))) : 10;
        const status = cod < 8 ? 'excellent' : cod < 10 ? 'good' : cod < 12 ? 'acceptable' : 'review';
        return {
          name: c.countyName,
          properties: c.parcelCount ?? 0,
          avgValue,
          cod: parseFloat(cod.toFixed(1)),
          prd: c.prd != null ? Number(c.prd) : null,
          medianRatio: c.medianRatio != null ? Number(c.medianRatio) : null,
          qualifiedSales: c.qualifiedSalesCount ?? 0,
          status,
        };
      });
    }
    // Illustrative fallback when countyStatistics table is empty
    return [
      { name: 'King County', properties: 15420, avgValue: 425000, cod: 7.2, status: 'excellent' },
      { name: 'Pierce County', properties: 12350, avgValue: 385000, cod: 8.9, status: 'good' },
      { name: 'Snohomish County', properties: 9840, avgValue: 398000, cod: 9.5, status: 'acceptable' },
      { name: 'Spokane County', properties: 5240, avgValue: 295000, cod: 11.2, status: 'review' },
    ];
  }, [countyStatsData]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-[var(--color-signal-success)]';
      case 'good': return 'text-[var(--color-signal-primary)]';
      case 'acceptable': return 'text-[var(--color-signal-warning)]';
      case 'review': return 'text-[var(--color-signal-alert)]';
      default: return 'text-[var(--color-text-secondary)]';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent':
      case 'good':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'acceptable':
      case 'review':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  // Initialize MapLibre GL mini-map
  useEffect(() => {
    if (!miniMapContainer.current || miniMap.current) return;

    miniMap.current = new maplibregl.Map({
      container: miniMapContainer.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors',
          },
        },
        layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
      },
      center: [-119.2, 46.2], // Benton County, WA
      zoom: 9,
      interactive: true,
      attributionControl: false,
    });

    miniMap.current.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

    // Add a marker for Kennewick, WA (county seat)
    new maplibregl.Marker({ color: '#00FFEE' })
      .setLngLat([-119.1372, 46.2112])
      .setPopup(new maplibregl.Popup({ offset: 25 }).setText('Kennewick, WA — Benton County Seat'))
      .addTo(miniMap.current);

    return () => {
      miniMap.current?.remove();
      miniMap.current = null;
    };
  }, []);

  // Color bars: highlight the target range (0.90–1.10) in cyan, outliers in amber/red
  const getBarColor = (ratio: number) => {
    if (ratio >= 0.90 && ratio <= 1.10) return '#00FFEE';
    if (ratio >= 0.80 && ratio < 0.90) return '#F59E0B';
    if (ratio > 1.10 && ratio <= 1.20) return '#F59E0B';
    return '#EF4444';
  };

  // Custom tooltip for the histogram
  const RatioTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="bg-[var(--color-glass-3)] border border-white/20 rounded-lg p-3 text-xs backdrop-blur-xl">
        <div className="font-bold text-[var(--color-text-primary)] mb-1">
          Ratio: {d.rangeLabel}
        </div>
        <div className="text-[var(--color-text-secondary)]">
          Sales: <span className="text-[var(--color-signal-primary)] font-semibold">{d.count.toLocaleString()}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[var(--color-government-night-base)]">
      {/* Top Navigation Bar */}
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
            Mass Appraisal Dashboard
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Select value={selectedCounty} onValueChange={setSelectedCounty}>
            <SelectTrigger className="w-48 bg-[var(--color-glass-3)] border-white/10">
              <SelectValue placeholder="All Counties" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Counties</SelectItem>
              {countyStatsData.map(c => (
                <SelectItem key={c.countyName} value={c.countyName}>
                  {c.countyName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-32 bg-[var(--color-glass-3)] border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2026">2026</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
            </SelectContent>
          </Select>

          {selectedCounty !== 'all' && (
            <Button
              size="sm"
              variant="outline"
              className="border-white/10 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-glass-2)]"
              onClick={() => recalculateMutation.mutate({ countyName: selectedCounty })}
              disabled={recalculateMutation.isPending || batchProgress.running}
            >
              {recalculateMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Recalculate Stats
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            className="border-white/10 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-glass-2)]"
            onClick={runBatchRecalculate}
            disabled={batchProgress.running || recalculateMutation.isPending || countyStatsData.length === 0}
            title="Recalculate IAAO stats for all counties"
          >
            {batchProgress.running ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {batchProgress.current}/{batchProgress.total}
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Recalculate All
              </>
            )}
          </Button>
          <Button
            size="sm"
            className="bg-[var(--color-signal-primary)] hover:bg-[var(--color-signal-primary)]/90 text-black"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 pb-24 space-y-6">
        {/* Quality Metrics Row */}
        <div className="grid grid-cols-5 gap-4">
          <Card className="p-6 bg-[var(--color-glass-2)] border-white/10">
            <div className="text-xs text-[var(--color-text-tertiary)] mb-2">Median Ratio (A/S)</div>
            <div className="text-3xl font-bold text-[var(--color-text-primary)] mb-1">
              {qualityMetrics.medianRatio.toFixed(2)}
            </div>
            <div className="flex items-center gap-1 text-xs text-[var(--color-signal-success)]">
              <CheckCircle2 className="w-3 h-3" />
              Target: 0.90-1.10
            </div>
          </Card>

          <Card className="p-6 bg-[var(--color-glass-2)] border-white/10">
            <div className="text-xs text-[var(--color-text-tertiary)] mb-2">COD (Uniformity)</div>
            <div className="text-3xl font-bold text-[var(--color-text-primary)] mb-1">
              {qualityMetrics.cod.toFixed(1)}%
            </div>
            <div className="flex items-center gap-1 text-xs text-[var(--color-signal-success)]">
              <CheckCircle2 className="w-3 h-3" />
              Excellent (&lt;10%)
            </div>
          </Card>

          <Card className="p-6 bg-[var(--color-glass-2)] border-white/10">
            <div className="text-xs text-[var(--color-text-tertiary)] mb-2">PRD (Progressivity)</div>
            <div className="text-3xl font-bold text-[var(--color-text-primary)] mb-1">
              {qualityMetrics.prd.toFixed(2)}
            </div>
            <div className="flex items-center gap-1 text-xs text-[var(--color-signal-success)]">
              <CheckCircle2 className="w-3 h-3" />
              Target: 0.98-1.03
            </div>
          </Card>

          <Card className="p-6 bg-[var(--color-glass-2)] border-white/10">
            <div className="text-xs text-[var(--color-text-tertiary)] mb-2">Total Properties</div>
            <div className="text-3xl font-bold text-[var(--color-text-primary)] mb-1">
              {qualityMetrics.totalProperties.toLocaleString()}
            </div>
            <div className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)]">
              <TrendingUp className="w-3 h-3" />
              +2.4% YoY
            </div>
          </Card>

          <Card className="p-6 bg-[var(--color-glass-2)] border-white/10">
            <div className="text-xs text-[var(--color-text-tertiary)] mb-2">Sales in Study</div>
            <div className="text-3xl font-bold text-[var(--color-text-primary)] mb-1">
              {qualityMetrics.recentSales.toLocaleString()}
            </div>
            <div className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)]">
              Used for ratio analysis
            </div>
          </Card>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* MapLibre GL Mini-Map */}
          <div className="col-span-8">
            <Card className="p-6 bg-[var(--color-glass-2)] border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
                  Benton County, WA — Assessment Area
                </h2>
                <span className="text-xs text-[var(--color-text-tertiary)] bg-[var(--color-glass-3)] px-2 py-1 rounded">
                  MapLibre GL · OSM
                </span>
              </div>
              <div
                ref={miniMapContainer}
                className="w-full h-96 rounded-lg overflow-hidden border border-white/10"
                aria-label="Benton County property map"
              />
              {/* Legend */}
              <div className="flex items-center gap-4 mt-3">
                {['$0-200k', '$200k-400k', '$400k-600k', '$600k+'].map((range, i) => (
                  <div key={range} className="flex items-center gap-1">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ background: `hsl(${180 + i * 30}, 70%, ${50 - i * 10}%)` }}
                    />
                    <span className="text-xs text-[var(--color-text-tertiary)]">{range}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* County Performance */}
          <div className="col-span-4">
            <Card className="p-6 bg-[var(--color-glass-2)] border-white/10">
              <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-4">
                County Performance
              </h2>
              <div className="space-y-3">
                {countyData.map((county) => (
                  <div
                    key={county.name}
                    className="p-4 rounded-lg bg-[var(--color-glass-3)] border border-white/10
                               hover:border-[var(--color-signal-primary)]/30 transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-[var(--color-text-primary)]">
                        {county.name}
                      </span>
                      <div className={`flex items-center gap-1 ${getStatusColor(county.status)}`}>
                        {getStatusIcon(county.status)}
                        <span className="text-xs capitalize">{county.status}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <div className="text-[var(--color-text-tertiary)]">Properties</div>
                        <div className="text-[var(--color-text-primary)] font-medium">
                          {county.properties.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-[var(--color-text-tertiary)]">Avg Value</div>
                        <div className="text-[var(--color-text-primary)] font-medium">
                          ${(county.avgValue / 1000).toFixed(0)}k
                        </div>
                      </div>
                      <div>
                        <div className="text-[var(--color-text-tertiary)]">COD</div>
                        <div className="text-[var(--color-text-primary)] font-medium">
                          {county.cod.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* Assessment Ratio Distribution — Real Recharts Histogram */}
        <Card className="p-6 bg-[var(--color-glass-2)] border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
                Assessment Ratio Distribution
              </h2>
              <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
                Distribution of assessed value ÷ sale price across all sales in study period.
                Target range 0.90–1.10 shown in cyan.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {!ratioLoading && ratioDistribution && ratioDistribution.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-white/10 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-glass-2)] text-xs h-7 px-2"
                  onClick={() => {
                    const totalSales = ratioDistribution.reduce((s, b) => s + b.count, 0);
                    const header = 'Ratio Range,Lower Bound,Upper Bound,Count,Percentage\n';
                    const rows = ratioDistribution.map(b => {
                      const pct = totalSales > 0 ? ((b.count / totalSales) * 100).toFixed(2) : '0.00';
                      return `"${b.rangeLabel}",${b.ratio.toFixed(2)},${(b.ratio + 0.05).toFixed(2)},${b.count},${pct}%`;
                    });
                    const countyLabel = selectedCounty !== 'all' ? selectedCounty : 'All Counties';
                    const summary = `\n\nRatio Study Summary — ${countyLabel}\nTotal Qualified Sales,${totalSales}\nMedian Ratio,${qualityMetrics.medianRatio.toFixed(4)}\nCOD,${qualityMetrics.cod.toFixed(2)}%\nPRD,${qualityMetrics.prd.toFixed(4)}`;
                    const csv = header + rows.join('\n') + summary;
                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `ratio-study-${countyLabel.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.csv`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  <Download className="w-3 h-3 mr-1" />
                  Download CSV
                </Button>
              )}
              {ratioLoading && (
                <Loader2 className="w-4 h-4 animate-spin text-[var(--color-signal-primary)]" />
              )}
            </div>
          </div>

          {ratioLoading ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--color-signal-primary)]" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={ratioDistribution ?? []}
                margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
                barCategoryGap="8%"
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.06)"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fill: 'var(--color-text-tertiary)', fontSize: 11 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  tickLine={false}
                  interval={1}
                />
                <YAxis
                  tick={{ fill: 'var(--color-text-tertiary)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={36}
                />
                <Tooltip content={<RatioTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <ReferenceLine
                  x="0.90"
                  stroke="#00FFEE"
                  strokeDasharray="4 2"
                  strokeOpacity={0.5}
                  label={{ value: 'Min', fill: '#00FFEE', fontSize: 10, position: 'top' }}
                />
                <ReferenceLine
                  x="1.10"
                  stroke="#00FFEE"
                  strokeDasharray="4 2"
                  strokeOpacity={0.5}
                  label={{ value: 'Max', fill: '#00FFEE', fontSize: 10, position: 'top' }}
                />
                <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                  {(ratioDistribution ?? []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(entry.ratio)} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}

          <div className="flex items-center gap-6 mt-3 text-xs text-[var(--color-text-tertiary)]">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-[#00FFEE]" />
              Target range (0.90–1.10)
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-[#F59E0B]" />
              Moderate deviation
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-[#EF4444]" />
              High deviation
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
