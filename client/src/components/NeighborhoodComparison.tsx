import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUp, ArrowDown, Minus, TrendingUp, Home, DollarSign, Ruler, MapPin, Loader2, Building2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { PropertyFeatures, EngineerEdFeatures } from '@/lib/featureEngineering';
import { trpc } from '@/lib/trpc';

interface NeighborhoodComparisonProps {
  property: PropertyFeatures;
  engineeredFeatures: EngineerEdFeatures;
  predictedValue: number;
}

export function NeighborhoodComparison({ property, engineeredFeatures, predictedValue }: NeighborhoodComparisonProps) {
  const clusterId = property.neighborhoodClusterId || 0;

  // Phase AD: neighbourhood selector state
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>('');

  // Fetch available neighbourhoods from DB
  const { data: filterOptions, isLoading: loadingOptions } = trpc.analytics.getPropertyFilterOptions.useQuery();
  const neighborhoods = filterOptions?.neighborhoods ?? [];

  // Phase AD: Fetch live stats for selected neighbourhood
  const { data: neighborhoodStats, isLoading: loadingStats } = trpc.analytics.getNeighborhoodStatsByName.useQuery(
    { neighborhood: selectedNeighborhood },
    { enabled: !!selectedNeighborhood }
  );

  // Fallback: cluster-based stats (original behaviour)
  const { data: clusterData, isLoading: loadingCluster } = trpc.clusterStats.getClusterById.useQuery(
    { clusterId },
    { enabled: !selectedNeighborhood && clusterId !== undefined }
  );

  // Resolve which stats to display
  const isLoading = loadingOptions || (selectedNeighborhood ? loadingStats : loadingCluster);

  const benchmarkStats = useMemo(() => {
    if (selectedNeighborhood && neighborhoodStats) {
      return {
        label: neighborhoodStats.neighborhood,
        propertyCount: neighborhoodStats.propertyCount,
        medianSqft: neighborhoodStats.avgSquareFeet,
        medianPrice: neighborhoodStats.medianValue,
        medianPriceSqft: neighborhoodStats.avgPricePerSqFt,
        medianQuality: 3.0, // not available per-neighbourhood
        medianAge: neighborhoodStats.avgAge,
        minValue: neighborhoodStats.minValue,
        maxValue: neighborhoodStats.maxValue,
        avgLandValue: neighborhoodStats.avgLandValue,
        avgBuildingValue: neighborhoodStats.avgBuildingValue,
        propertyTypeDistribution: neighborhoodStats.propertyTypeDistribution,
        source: 'neighbourhood' as const,
      };
    }
    if (clusterData) {
      return {
        label: `Cluster #${clusterId}`,
        propertyCount: (clusterData as any).propertyCount || 0,
        medianSqft: (clusterData as any).medianSqft || 2200,
        medianPrice: (clusterData as any).medianPrice || 385000,
        medianPriceSqft: (clusterData as any).medianPriceSqft || 175,
        medianQuality: (clusterData as any).medianQuality || 3.2,
        medianAge: (clusterData as any).medianAge || 28,
        minValue: null,
        maxValue: null,
        avgLandValue: null,
        avgBuildingValue: null,
        propertyTypeDistribution: [],
        source: 'cluster' as const,
      };
    }
    return null;
  }, [selectedNeighborhood, neighborhoodStats, clusterData, clusterId]);

  // Property metrics
  const propertySqft = property.squareFeet || 0;
  const propertyPrice = predictedValue;
  const propertyPriceSqft = engineeredFeatures.pricePerSqFt || 0;
  const propertyQuality = engineeredFeatures.qualityScore || 3;
  const propertyAge = engineeredFeatures.propertyAge || 0;

  // Diffs (only when benchmark is available)
  const sqftDiff = benchmarkStats ? ((propertySqft - benchmarkStats.medianSqft) / (benchmarkStats.medianSqft || 1)) * 100 : 0;
  const priceDiff = benchmarkStats ? ((propertyPrice - benchmarkStats.medianPrice) / (benchmarkStats.medianPrice || 1)) * 100 : 0;
  const priceSqftDiff = benchmarkStats ? ((propertyPriceSqft - benchmarkStats.medianPriceSqft) / (benchmarkStats.medianPriceSqft || 1)) * 100 : 0;
  const qualityDiff = benchmarkStats ? ((propertyQuality - benchmarkStats.medianQuality) / (benchmarkStats.medianQuality || 1)) * 100 : 0;
  const ageDiff = benchmarkStats ? ((propertyAge - benchmarkStats.medianAge) / (benchmarkStats.medianAge || 1)) * 100 : 0;

  // Helper: comparison badge
  const ComparisonIndicator = ({ diff, reverse = false }: { diff: number; reverse?: boolean }) => {
    const isNeutral = Math.abs(diff) < 5;
    const isPositive = reverse ? diff < 0 : diff > 0;
    if (isNeutral) return (
      <Badge variant="outline" className="bg-gray-500/10 text-gray-400 border-gray-500/30">
        <Minus className="w-3 h-3 mr-1" />At Average
      </Badge>
    );
    if (isPositive) return (
      <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
        <ArrowUp className="w-3 h-3 mr-1" />{Math.abs(diff).toFixed(1)}% {reverse ? 'Lower' : 'Higher'}
      </Badge>
    );
    return (
      <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30">
        <ArrowDown className="w-3 h-3 mr-1" />{Math.abs(diff).toFixed(1)}% {reverse ? 'Higher' : 'Lower'}
      </Badge>
    );
  };

  const comparisonData = benchmarkStats ? [
    { metric: 'Sq Ft', property: propertySqft, benchmark: benchmarkStats.medianSqft },
    { metric: 'Value ($K)', property: Math.round(propertyPrice / 1000), benchmark: Math.round(benchmarkStats.medianPrice / 1000) },
    { metric: '$/SqFt', property: Math.round(propertyPriceSqft), benchmark: benchmarkStats.medianPriceSqft },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Header + Neighbourhood Selector */}
      <Card className="bg-[var(--color-glass-2)] border-white/10">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[var(--color-signal-primary)]" />
                Neighbourhood Comparison
              </CardTitle>
              <CardDescription className="mt-1">
                Compare this property against a live neighbourhood benchmark from the database
              </CardDescription>
            </div>
            <div className="flex items-center gap-3 min-w-[260px]">
              {loadingOptions ? (
                <div className="flex items-center gap-2 text-sm text-[var(--color-text-tertiary)]">
                  <Loader2 className="w-4 h-4 animate-spin" />Loading neighbourhoods…
                </div>
              ) : (
                <Select
                  value={selectedNeighborhood}
                  onValueChange={setSelectedNeighborhood}
                >
                  <SelectTrigger className="bg-[var(--color-glass-3)] border-white/10 w-full">
                    <SelectValue placeholder={`Cluster #${clusterId} (default)`} />
                  </SelectTrigger>
                  <SelectContent>
                    {neighborhoods.map((n) => (
                      <SelectItem key={n} value={n}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {selectedNeighborhood && (
                <button
                  onClick={() => setSelectedNeighborhood('')}
                  className="text-xs text-[var(--color-text-tertiary)] hover:text-white whitespace-nowrap"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-[var(--color-text-tertiary)]">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Loading neighbourhood data…
        </div>
      ) : !benchmarkStats ? (
        <div className="text-center py-12 text-[var(--color-text-tertiary)]">
          <MapPin className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p>Select a neighbourhood above to load live comparison data.</p>
        </div>
      ) : (
        <>
          {/* Side-by-side comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* This Property */}
            <Card className="bg-[var(--color-glass-2)] border-[var(--color-signal-primary)]/30">
              <CardHeader>
                <CardTitle className="text-[var(--color-signal-primary)] flex items-center gap-2">
                  <Home className="w-5 h-5" />This Property
                </CardTitle>
                <CardDescription>Current property metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[var(--color-text-tertiary)]">Square Feet</span>
                  <span className="text-lg font-bold text-[var(--color-text-primary)]">{propertySqft.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[var(--color-text-tertiary)]">Predicted Value</span>
                  <span className="text-lg font-bold text-[var(--color-signal-primary)]">${propertyPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[var(--color-text-tertiary)]">Price / Sq Ft</span>
                  <span className="text-lg font-bold text-[var(--color-text-primary)]">${propertyPriceSqft.toFixed(0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[var(--color-text-tertiary)]">Quality Score</span>
                  <span className="text-lg font-bold text-[var(--color-text-primary)]">{propertyQuality.toFixed(1)} / 5.0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[var(--color-text-tertiary)]">Property Age</span>
                  <span className="text-lg font-bold text-[var(--color-text-primary)]">{propertyAge} yrs</span>
                </div>
              </CardContent>
            </Card>

            {/* Benchmark Card */}
            <Card className="bg-[var(--color-glass-2)] border-white/10">
              <CardHeader>
                <CardTitle className="text-[var(--color-text-primary)] flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  {benchmarkStats.source === 'neighbourhood' ? benchmarkStats.label : `Cluster #${clusterId}`}
                </CardTitle>
                <CardDescription>
                  {benchmarkStats.propertyCount.toLocaleString()} properties
                  {benchmarkStats.source === 'neighbourhood' && ' · Live DB data'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[var(--color-text-tertiary)]">Avg Square Feet</span>
                  <span className="text-lg font-bold text-[var(--color-text-primary)]">{benchmarkStats.medianSqft.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[var(--color-text-tertiary)]">Avg Value</span>
                  <span className="text-lg font-bold text-[var(--color-text-primary)]">${benchmarkStats.medianPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[var(--color-text-tertiary)]">Avg Price / Sq Ft</span>
                  <span className="text-lg font-bold text-[var(--color-text-primary)]">${benchmarkStats.medianPriceSqft}</span>
                </div>
                {benchmarkStats.minValue !== null && benchmarkStats.maxValue !== null && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[var(--color-text-tertiary)]">Value Range</span>
                    <span className="text-sm font-medium text-[var(--color-text-primary)]">
                      ${(benchmarkStats.minValue / 1000).toFixed(0)}K – ${(benchmarkStats.maxValue / 1000).toFixed(0)}K
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[var(--color-text-tertiary)]">Avg Age</span>
                  <span className="text-lg font-bold text-[var(--color-text-primary)]">{benchmarkStats.medianAge} yrs</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Property type distribution (neighbourhood only) */}
          {benchmarkStats.source === 'neighbourhood' && benchmarkStats.propertyTypeDistribution.length > 0 && (
            <Card className="bg-[var(--color-glass-2)] border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[var(--color-text-primary)]">
                  <Building2 className="w-4 h-4" />Property Type Mix — {benchmarkStats.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {benchmarkStats.propertyTypeDistribution.map((t) => (
                    <Badge key={t.type} variant="outline" className="text-xs text-[var(--color-text-secondary)] border-white/10">
                      {t.type}: {t.count.toLocaleString()}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Comparison indicators */}
          <Card className="bg-[var(--color-glass-2)] border-white/10">
            <CardHeader>
              <CardTitle className="text-[var(--color-text-primary)]">Performance vs {benchmarkStats.label}</CardTitle>
              <CardDescription>How this property compares to the benchmark</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-glass-1)]">
                  <div className="flex items-center gap-2">
                    <Ruler className="w-4 h-4 text-[var(--color-text-tertiary)]" />
                    <span className="text-sm text-[var(--color-text-secondary)]">Square Feet</span>
                  </div>
                  <ComparisonIndicator diff={sqftDiff} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-glass-1)]">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-[var(--color-text-tertiary)]" />
                    <span className="text-sm text-[var(--color-text-secondary)]">Value</span>
                  </div>
                  <ComparisonIndicator diff={priceDiff} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-glass-1)]">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-[var(--color-text-tertiary)]" />
                    <span className="text-sm text-[var(--color-text-secondary)]">Price/SqFt</span>
                  </div>
                  <ComparisonIndicator diff={priceSqftDiff} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-glass-1)]">
                  <div className="flex items-center gap-2">
                    <Home className="w-4 h-4 text-[var(--color-text-tertiary)]" />
                    <span className="text-sm text-[var(--color-text-secondary)]">Quality</span>
                  </div>
                  <ComparisonIndicator diff={qualityDiff} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-glass-1)]">
                  <div className="flex items-center gap-2">
                    <Home className="w-4 h-4 text-[var(--color-text-tertiary)]" />
                    <span className="text-sm text-[var(--color-text-secondary)]">Age</span>
                  </div>
                  <ComparisonIndicator diff={ageDiff} reverse={true} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Visual comparison bar chart */}
          <Card className="bg-[var(--color-glass-2)] border-white/10">
            <CardHeader>
              <CardTitle className="text-[var(--color-text-primary)]">Visual Comparison</CardTitle>
              <CardDescription>Side-by-side metric comparison</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="metric" stroke="var(--color-text-tertiary)" style={{ fontSize: '12px' }} />
                  <YAxis stroke="var(--color-text-tertiary)" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(10,14,26,0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="property" name="This Property" fill="var(--color-signal-primary)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="benchmark" name={benchmarkStats.label} fill="rgba(255,255,255,0.25)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
