import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, Legend,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import {
  TrendingUp, BarChart3, PieChart as PieChartIcon, Activity,
  Building2, DollarSign, Home, ShoppingCart, AlertTriangle, RefreshCw,
} from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmt(n: number, decimals = 0) {
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}
function fmtM(n: number) {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000)     return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)         return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}
function monthLabel(ym: string) {
  const [y, m] = ym.split('-');
  return new Date(Number(y), Number(m) - 1, 1).toLocaleString('en-US', { month: 'short', year: '2-digit' });
}
function ChartSkeleton({ height = 300 }: { height?: number }) {
  return <Skeleton className="w-full bg-white/10 rounded-lg" style={{ height }} />;
}

function KpiCard({ icon: Icon, label, value, sub, loading, iconColor = '#00FFEE' }: {
  icon: React.ElementType; label: string; value: string; sub?: string;
  loading: boolean; iconColor?: string;
}) {
  return (
    <Card className="terra-card">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-400 mb-1">{label}</p>
            {loading
              ? <Skeleton className="h-8 w-28 bg-white/10 mb-1" />
              : <p className="text-2xl font-bold text-white">{value}</p>
            }
            {sub && !loading && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
          </div>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center"
               style={{ background: `${iconColor}20` }}>
            <Icon className="w-5 h-5" style={{ color: iconColor }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RatioTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const ratio = payload[0]?.value as number;
  const count = payload[0]?.payload?.count as number;
  const inRange = ratio >= 0.90 && ratio <= 1.10;
  return (
    <div className="bg-[#0b1020] border border-white/10 rounded-lg p-3 text-sm shadow-xl">
      <p className="font-bold" style={{ color: inRange ? '#00FFEE' : '#FFAA00' }}>
        Median Ratio: {ratio.toFixed(4)}
      </p>
      <p className="text-slate-400 text-xs">{count} qualified sales</p>
      <p className="text-xs mt-1" style={{ color: inRange ? '#22C55E' : '#FFAA00' }}>
        {inRange ? '✓ Within IAAO range' : '⚠ Outside IAAO range'}
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function MarketAnalysis() {
  const [countyName, setCountyName] = useState<string>('all');
  const queryInput = useMemo(() => (countyName === 'all' ? {} : { countyName }), [countyName]);

  const kpisQuery   = trpc.analytics.getMarketKPIs.useQuery(queryInput, { staleTime: 60_000 });
  const ratioQuery  = trpc.analytics.getSalesRatioTrend.useQuery(
    { ...queryInput, months: 12 }, { staleTime: 60_000 }
  );
  const typeQuery   = trpc.analytics.getParcelTypeDistribution.useQuery(queryInput, { staleTime: 60_000 });
  const changeQuery = trpc.analytics.getValuationChangeDistribution.useQuery(queryInput, { staleTime: 60_000 });

  const kpis       = kpisQuery.data;
  const ratioData  = (ratioQuery.data ?? []).map(d => ({ ...d, month: monthLabel(d.month) }));
  const typeData   = typeQuery.data ?? [];
  const changeData = changeQuery.data ?? [];

  const anyLoading = kpisQuery.isLoading || ratioQuery.isLoading || typeQuery.isLoading || changeQuery.isLoading;
  const anyError   = kpisQuery.isError   || ratioQuery.isError   || typeQuery.isError   || changeQuery.isError;
  const outOfRange = ratioData.filter(d => d.ratio < 0.90 || d.ratio > 1.10).length;

  return (
    <DashboardLayout>
      <div className="space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-[#00ffee]" />
              Market Analysis
            </h1>
            <p className="text-slate-400 mt-1">
              Live market trends, sales ratio studies, and parcel distribution.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {anyLoading && <RefreshCw className="w-4 h-4 text-[#00ffee] animate-spin" />}
            <Select value={countyName} onValueChange={setCountyName}>
              <SelectTrigger className="w-44 bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="All Counties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Counties</SelectItem>
                <SelectItem value="King">King County</SelectItem>
                <SelectItem value="Pierce">Pierce County</SelectItem>
                <SelectItem value="Snohomish">Snohomish County</SelectItem>
                <SelectItem value="Spokane">Spokane County</SelectItem>
                <SelectItem value="Clark">Clark County</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Error banner */}
        {anyError && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            Some data failed to load. Showing available results.
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard icon={Home}         label="Total Parcels"        value={kpis ? fmt(kpis.totalParcels) : '—'}        sub="on assessment roll"   loading={kpisQuery.isLoading} iconColor="#00FFEE" />
          <KpiCard icon={DollarSign}   label="Total Assessed Value" value={kpis ? fmtM(kpis.totalAssessedValue) : '—'} sub="aggregate roll value" loading={kpisQuery.isLoading} iconColor="#A855F7" />
          <KpiCard icon={Building2}    label="Avg Assessed Value"   value={kpis ? fmtM(kpis.avgAssessedValue) : '—'}   sub="per parcel"           loading={kpisQuery.isLoading} iconColor="#22C55E" />
          <KpiCard icon={ShoppingCart} label="Qualified Sales"      value={kpis ? fmt(kpis.qualifiedSales) : '—'}
            sub={kpis ? `avg ${fmtM(kpis.avgSalePrice)}` : 'for ratio study'}
            loading={kpisQuery.isLoading} iconColor="#EAB308" />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* Sales Ratio Trend — 2 cols */}
          <Card className="terra-card lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <TrendingUp className="w-5 h-5 text-green-400" />
                Sales Ratio Trend (12 Months)
              </CardTitle>
              <CardDescription>
                Monthly median A/S ratio. IAAO target: 0.90–1.10.
                {!ratioQuery.isLoading && outOfRange > 0 && (
                  <span className="ml-2 text-amber-400">
                    ⚠ {outOfRange} month{outOfRange > 1 ? 's' : ''} outside target
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {ratioQuery.isLoading ? (
                <ChartSkeleton height={300} />
              ) : ratioData.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center text-slate-500 text-sm">
                  No sales data for the selected period
                </div>
              ) : (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={ratioData}>
                      <defs>
                        <linearGradient id="colorRatio" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#00ffee" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#00ffee" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false}
                             domain={[0.80, 1.20]} tickFormatter={(v: number) => v.toFixed(2)} />
                      <Tooltip content={<RatioTooltip />} />
                      <ReferenceLine y={0.90} stroke="#FFAA00" strokeDasharray="4 3" strokeWidth={1} />
                      <ReferenceLine y={1.10} stroke="#FFAA00" strokeDasharray="4 3" strokeWidth={1} />
                      <ReferenceLine y={1.00} stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
                      <Area type="monotone" dataKey="ratio" stroke="#00ffee" strokeWidth={2}
                            fillOpacity={1} fill="url(#colorRatio)"
                            dot={{ r: 3, fill: '#00ffee', strokeWidth: 0 }}
                            activeDot={{ r: 5, fill: '#00ffee' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Parcel Type Donut — 1 col */}
          <Card className="terra-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <PieChartIcon className="w-5 h-5 text-purple-400" />
                Parcel Distribution
              </CardTitle>
              <CardDescription>Breakdown by property class.</CardDescription>
            </CardHeader>
            <CardContent>
              {typeQuery.isLoading ? (
                <ChartSkeleton height={300} />
              ) : typeData.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center text-slate-500 text-sm">
                  No parcel data available
                </div>
              ) : (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={typeData} cx="50%" cy="45%" innerRadius={55} outerRadius={80}
                           paddingAngle={4} dataKey="value"
                           label={({ percent }: { percent: number }) =>
                             percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}
                           labelLine={false}>
                        {typeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(0,0,0,0.4)" />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0b1020', borderColor: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: 12 }}
                        formatter={(value: number, name: string) => [fmt(value) + ' parcels', name]}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8}
                              wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Valuation Change Histogram — full width */}
          <Card className="terra-card lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Activity className="w-5 h-5 text-blue-400" />
                Valuation Change Distribution
              </CardTitle>
              <CardDescription>
                Count of parcels by % change in assessed value vs. prior year.
                {!changeQuery.isLoading && changeData.length === 0 && (
                  <span className="ml-2 text-slate-500">(Requires prior-year history data)</span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {changeQuery.isLoading ? (
                <ChartSkeleton height={250} />
              ) : changeData.length === 0 ? (
                <div className="h-[250px] flex flex-col items-center justify-center gap-3 text-slate-500 text-sm">
                  <Activity className="w-8 h-8 opacity-30" />
                  <span>No year-over-year history data available.</span>
                  <span className="text-xs">Upload prior-year assessment records to enable this chart.</span>
                </div>
              ) : (
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={changeData} barSize={60}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                      <XAxis dataKey="range" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false}
                             tickFormatter={(v: number) => fmt(v)} />
                      <Tooltip
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        contentStyle={{ backgroundColor: '#0b1020', borderColor: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: 12 }}
                        formatter={(value: number) => [fmt(value) + ' parcels', 'Count']}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {changeData.map((entry, index) => {
                          const color = entry.range.startsWith('<') || entry.range.startsWith('-')
                            ? '#FF3366'
                            : entry.range === '0% to 5%' ? '#3B82F6' : '#22C55E';
                          return <Cell key={index} fill={color} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Summary stats footer */}
        {kpis && !kpisQuery.isLoading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {[
              { label: 'Total Land Value',     value: fmtM(kpis.totalLandValue) },
              { label: 'Total Building Value', value: fmtM(kpis.totalBuildingValue) },
              { label: 'Avg Sale Price',       value: fmtM(kpis.avgSalePrice) },
              { label: 'Qualified Sales',      value: fmt(kpis.qualifiedSales) },
            ].map(({ label, value }) => (
              <Card key={label} className="terra-card p-4">
                <p className="text-slate-400 text-xs mb-1">{label}</p>
                <p className="font-bold text-white">{value}</p>
              </Card>
            ))}
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
